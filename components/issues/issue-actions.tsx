"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIssueStatusAction } from "@/lib/issues/actions";
import { useI18n } from "@/components/system/preferences-provider";

type IssueActionsProps = {
  owner: string;
  repo: string;
  number: number;
  status: "OPEN" | "CLOSED";
  canChange: boolean;
};

export function IssueActions({ owner, repo, number, status, canChange }: IssueActionsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canChange) {
    return null;
  }

  const nextStatus = status === "OPEN" ? "CLOSED" : "OPEN";

  return (
    <button
      className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle disabled:opacity-40"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setIssueStatusAction(owner, repo, number, nextStatus);
          router.refresh();
        });
      }}
      type="button"
    >
      {status === "OPEN" ? t("issuesPage.closeIssue") : t("issuesPage.reopenIssue")}
    </button>
  );
}
