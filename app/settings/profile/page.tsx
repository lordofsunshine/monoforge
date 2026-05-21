import { ProfileForm } from "@/components/settings/profile-form";
import { LocalizedText } from "@/components/system/localized-text";
import { requireUser } from "@/lib/auth/access";
import { getPrisma } from "@/lib/prisma";
import { TokenManager } from "@/app/settings/token-manager";

export default async function ProfileSettingsPage() {
  const sessionUser = await requireUser();
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      username: true,
      bio: true,
      image: true,
      email: true,
    },
  });
  const tokens = await prisma.apiToken.findMany({
    where: { userId: sessionUser.id },
    select: { id: true, name: true, prefix: true, scopes: true, status: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="grid w-full max-w-3xl gap-6">
      <div className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="settings.eyebrow" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          <LocalizedText path="settings.profile" />
        </h1>
        <p className="mt-2 text-sm text-secondary">{user.email}</p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <ProfileForm username={user.username} bio={user.bio || ""} image={user.image || ""} />
      </div>
      <TokenManager tokens={tokens.map((token) => ({
        ...token,
        lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
        createdAt: token.createdAt.toISOString(),
      }))} />
    </section>
  );
}
