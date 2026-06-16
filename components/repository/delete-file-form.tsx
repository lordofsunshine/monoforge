"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/system/preferences-provider";
import { deleteFileAction, type RepoFormState } from "@/lib/repository/actions";
import { translateMessage } from "@/lib/i18n/messages";

type DeleteFileFormProps = {
  repositoryId: string;
  path: string;
  redirectTo: string;
  compact?: boolean;
};

const initialState: RepoFormState = {
  ok: false,
  message: "",
};

export function DeleteFileForm({ repositoryId, path, redirectTo, compact = false }: DeleteFileFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const action = deleteFileAction.bind(null, repositoryId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      router.push(redirectTo);
      router.refresh();
    }
  }, [redirectTo, router, state.ok]);

  return (
    <form action={formAction} className={compact ? "grid gap-1" : "flex items-center gap-2"}>
      <input name="path" type="hidden" value={path} />
      <input name="message" type="hidden" value={`Delete ${path}`} />
      {state.message && !state.ok ? <p className="text-sm text-secondary">{translateMessage(t, state.message)}</p> : null}
      <button
        className={
          compact
            ? "mf-menu-item"
            : "inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle disabled:opacity-40"
        }
        disabled={pending}
        type="submit"
      >
        {pending ? t("issuesPage.deleting") : t("common.delete")}
      </button>
    </form>
  );
}
