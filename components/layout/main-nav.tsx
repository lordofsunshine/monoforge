"use client";

import Link from "next/link";
import { useI18n } from "@/components/system/preferences-provider";

type MainNavProps = {
  username?: string | null;
};

export function MainNav({ username }: MainNavProps) {
  const { t } = useI18n();

  if (username) {
    return (
      <>
        <Link className="hidden rounded-md px-3 py-2 text-secondary hover:bg-subtle hover:text-foreground sm:inline-flex" href="/dashboard">
          {t("nav.dashboard")}
        </Link>
        <Link className="hidden rounded-md px-3 py-2 text-secondary hover:bg-subtle hover:text-foreground sm:inline-flex" href={`/u/${username}`}>
          {t("nav.profile")}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className="rounded-md px-3 py-2 text-secondary hover:bg-subtle hover:text-foreground" href="/login">
        {t("nav.login")}
      </Link>
      <Link className="mf-primary rounded-md border px-3 py-2" href="/register">
        {t("nav.register")}
      </Link>
    </>
  );
}
