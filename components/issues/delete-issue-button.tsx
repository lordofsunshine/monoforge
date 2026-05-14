"use client";

import { useTransition } from "react";
import { deleteIssueAction } from "@/lib/issues/actions";
import { useI18n } from "@/components/system/preferences-provider";

type DeleteIssueButtonProps = {
  owner: string;
  repo: string;
  number: number;
};

export function DeleteIssueButton({ owner, repo, number }: DeleteIssueButtonProps) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex h-9 items-center rounded-md border border-lineStrong bg-surface px-3 text-sm hover:bg-subtle disabled:opacity-40"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await deleteIssueAction(owner, repo, number);
        });
      }}
      type="button"
    >
      {pending ? t("issuesPage.deleting") : t("issuesPage.deleteIssue")}
    </button>
  );
}
