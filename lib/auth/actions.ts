"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { loginSchema, profileSettingsSchema, registerSchema } from "@/lib/validation/auth";

export type FormState = {
  ok: boolean;
  message: string;
};

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const ip = await getRequestIp();
  const limited = checkRateLimit(`register:${ip}`, 3, 60_000);

  if (!limited.allowed) {
    return { ok: false, message: "Too many registration attempts. Try again soon." };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { username: parsed.data.username }],
    },
    select: {
      email: true,
      username: true,
    },
  });

  if (existing?.email === parsed.data.email) {
    return { ok: false, message: "Email is already registered." };
  }

  if (existing?.username === parsed.data.username) {
    return { ok: false, message: "Username is already taken." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      username: parsed.data.username,
      name: parsed.data.username,
      passwordHash,
      storageQuota: {
        create: {},
      },
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });

  return { ok: true, message: "Account created." };
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password." };
    }

    throw error;
  }

  return { ok: true, message: "Signed in." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = profileSettingsSchema.safeParse({
    username: formData.get("username"),
    bio: formData.get("bio"),
    image: formData.get("image"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Check the form and try again." };
  }

  const prisma = getPrisma();
  const existingUsername = await prisma.user.findFirst({
    where: {
      username: parsed.data.username,
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });

  if (existingUsername) {
    return { ok: false, message: "Username is already taken." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username: parsed.data.username,
      bio: parsed.data.bio || null,
      image: parsed.data.image || null,
    },
  });

  revalidatePath(`/u/${parsed.data.username}`);
  revalidatePath("/settings/profile");

  return { ok: true, message: "Profile updated." };
}
