"use server";

import { auth } from "@/auth";
import { createApiToken, revokeApiToken } from "@/server/storage/tokens";
import { revalidatePath } from "next/cache";

export async function generateToken(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name) throw new Error("Name required");
  const scopes = formData.getAll("scopes").map(String).filter((scope) => ["repo:read", "repo:write"].includes(scope));

  const result = await createApiToken(session.user.id, name, scopes.length ? scopes : ["repo:read"]);
  revalidatePath("/settings");
  return result.rawToken;
}

export async function revokeToken(tokenId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await revokeApiToken(tokenId, session.user.id);
  revalidatePath("/settings");
}
