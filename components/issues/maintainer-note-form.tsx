"use client";

import { useActionState } from "react";
import type { IssueFormState } from "@/lib/issues/actions";
import { useI18n } from "@/components/system/preferences-provider";

type MaintainerNoteFormProps = {
  action: (state: IssueFormState, formData: FormData) => Promise<IssueFormState>;
  defaultValue: string;
};

const initialState: IssueFormState = {
  ok: false,
  message: "",
};

export function MaintainerNoteForm({ action, defaultValue }: MaintainerNoteFormProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-lineStrong bg-surface p-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">{t("issuesPage.maintainerNotes")}</h2>
      <textarea className="min-h-24 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" name="body" defaultValue={defaultValue} placeholder={t("issuesPage.privateNote")} />
      {state.message ? <p className="text-sm text-secondary">{state.message}</p> : null}
      <button className="h-9 rounded-md border border-line px-3 text-sm hover:border-lineStrong hover:bg-subtle disabled:opacity-40" disabled={pending} type="submit">
        {pending ? t("common.saving") : t("issuesPage.saveNote")}
      </button>
    </form>
  );
}
