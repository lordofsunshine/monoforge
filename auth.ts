import NextAuth from "next-auth";
import type { Provider } from "@auth/core/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/security/audit-log";

function normalizeOAuthUsername(input: string, fallback: string) {
  const base = input
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = fallback.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(-6) || "user";
  return `${base || "user"}-${suffix}`.slice(0, 32).replace(/-$/, `_${suffix.slice(-1) || "0"}`);
}

function providers() {
  const items: Provider[] = [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const forwarded = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
        const limited = checkRateLimit(`login:${ip}:${parsed.data.email}`, 5, 60_000);

        if (!limited.allowed) {
          await writeAuditLog({
            action: "FAILED_LOGIN",
            ip,
            metadata: { reason: "rate_limited", email: parsed.data.email },
          }).catch(() => undefined);
          return null;
        }

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          await writeAuditLog({
            action: "FAILED_LOGIN",
            ip,
            metadata: { reason: "unknown_user", email: parsed.data.email },
          }).catch(() => undefined);
          return null;
        }

        const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          await writeAuditLog({
            actorId: user.id,
            action: "FAILED_LOGIN",
            ip,
            metadata: { reason: "bad_password" },
          }).catch(() => undefined);
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    items.unshift(
      Google({
        checks: ["state"],
        allowDangerousEmailAccountLinking: true,
        profile(profile) {
          const email = typeof profile.email === "string" ? profile.email.toLowerCase() : null;
          const id = String(profile.sub);
          const username = normalizeOAuthUsername(email || String(profile.name || ""), id);

          return {
            id,
            name: profile.name,
            email,
            image: profile.picture,
            username,
            emailVerified: profile.email_verified ? new Date() : null,
          };
        },
      }),
    );
  }

  return items;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: PrismaAdapter(getPrisma()),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: providers(),
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      await getPrisma().storageQuota.upsert({
        where: { userId: user.id },
        update: { maxStorageBytes: 104857600n },
        create: { userId: user.id, maxStorageBytes: 104857600n },
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }

      return session;
    },
  },
}));
