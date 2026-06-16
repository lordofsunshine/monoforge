"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { setMirrorEnabled } from "@/server/mirror/settings";

export async function setMirrorEnabledAction(enabled: boolean) {
  const session = await auth();

  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("Unauthorized");
  }

  await setMirrorEnabled(enabled);
  revalidatePath("/admin");
}
