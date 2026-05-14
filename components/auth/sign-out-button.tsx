"use client";

import { logoutAction } from "@/lib/auth/actions";
import { useI18n } from "@/components/system/preferences-provider";

export function SignOutButton() {
  const { t } = useI18n();

  return (
    <form action={logoutAction}>
      <button className="rounded-md px-3 py-2 text-sm text-secondary hover:bg-subtle hover:text-foreground" type="submit">
        {t("nav.logout")}
      </button>
    </form>
  );
}
