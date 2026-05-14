"use client";

import { useActionState } from "react";
import { deleteRepositoryAction, updateRepositoryAction, type RepoFormState } from "@/lib/repository/actions";
import { useI18n } from "@/components/system/preferences-provider";

type RepoSettingsFormProps = {
  repositoryId: string;
  name: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
};

const initialState: RepoFormState = {
  ok: false,
  message: "",
};

export function RepoSettingsForm({ repositoryId, name, description, visibility }: RepoSettingsFormProps) {
  const { t } = useI18n();
  const updateAction = updateRepositoryAction.bind(null, repositoryId);
  const deleteAction = deleteRepositoryAction.bind(null, repositoryId);
  const [state, formAction, pending] = useActionState(updateAction, initialState);

  return (
    <div className="grid gap-8">
      <form action={formAction} className="grid gap-5 rounded-lg border border-line bg-surface p-5">
        <div className="grid gap-2">
          <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="name">
            {t("repoForm.name")}
          </label>
          <input className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="name" name="name" defaultValue={name} required />
        </div>
        <div className="grid gap-2">
          <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="description">
            {t("repoForm.description")}
          </label>
          <textarea className="min-h-24 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="description" name="description" defaultValue={description} />
        </div>
        <div className="grid gap-2">
          <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="visibility">
            {t("repoForm.visibility")}
          </label>
          <select className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="visibility" name="visibility" defaultValue={visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC"}>
            <option value="PUBLIC">{t("common.public")}</option>
            <option value="PRIVATE">{t("common.private")}</option>
          </select>
        </div>
        {state.message ? <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{state.message}</p> : null}
        <div>
          <button className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:opacity-40" disabled={pending} type="submit">
            {pending ? t("common.saving") : t("repoForm.saveSettings")}
          </button>
        </div>
      </form>
      <form action={deleteAction} className="rounded-lg border border-lineStrong bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("repoForm.deleteRepository")}</h2>
        <p className="mt-2 text-sm leading-6 text-secondary">{t("repoForm.deleteText")}</p>
        <button className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-lineStrong bg-surface px-4 text-sm font-medium hover:bg-subtle" type="submit">
          {t("repoForm.deleteRepository")}
        </button>
      </form>
    </div>
  );
}
