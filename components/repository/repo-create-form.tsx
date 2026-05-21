"use client";

import { useActionState } from "react";
import { createRepositoryAction, type RepoFormState } from "@/lib/repository/actions";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

const initialState: RepoFormState = {
  ok: false,
  message: "",
};

export function RepoCreateForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createRepositoryAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="name">
          {t("repoForm.name")}
        </label>
        <input className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="description">
          {t("repoForm.description")}
        </label>
        <textarea className="min-h-24 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="description" name="description" />
      </div>
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="visibility">
          {t("repoForm.visibility")}
        </label>
        <select className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="visibility" name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">{t("common.public")}</option>
          <option value="PRIVATE">{t("common.private")}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input className="size-4 accent-foreground" name="initializeWithReadme" type="checkbox" />
        {t("repoForm.initializeReadme")}
      </label>
      {state.message ? <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{translateMessage(t, state.message)}</p> : null}
      <button className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:opacity-40" disabled={pending} type="submit">
        {pending ? t("common.creating") : t("repoForm.createRepository")}
      </button>
    </form>
  );
}
