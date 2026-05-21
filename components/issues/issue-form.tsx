"use client";

import { useActionState } from "react";
import type { IssueBoardStatus, IssueLabel, IssuePriority } from "@/generated/prisma/client";
import type { IssueFormState } from "@/lib/issues/actions";
import { LabelBadge } from "@/components/issues/label-badge";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

type IssueFormProps = {
  action: (state: IssueFormState, formData: FormData) => Promise<IssueFormState>;
  labels: Array<Pick<IssueLabel, "slug" | "name" | "marker" | "pattern">>;
  defaults?: {
    title?: string;
    body?: string | null;
    priority?: IssuePriority;
    boardStatus?: IssueBoardStatus;
    labelSlugs?: string[];
    sourcePath?: string | null;
    sourceLine?: number | null;
  };
  submitLabel: string;
};

const initialState: IssueFormState = {
  ok: false,
  message: "",
};

export function IssueForm({ action, labels, defaults, submitLabel }: IssueFormProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="title">
          {t("issuesPage.titleField")}
        </label>
        <input className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="title" name="title" defaultValue={defaults?.title || ""} required />
      </div>
      <div className="grid gap-2">
        <label className="font-mono text-xs uppercase tracking-[0.12em] text-secondary" htmlFor="body">
          {t("issuesPage.body")}
        </label>
        <textarea className="min-h-48 resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6 outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20" id="body" name="body" defaultValue={defaults?.body || ""} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-secondary">{t("issuesPage.priority")}</span>
          <select className="h-10 rounded-md border border-line bg-surface px-3 text-sm" name="priority" defaultValue={defaults?.priority || "NORMAL"}>
            <option value="LOW">{t("issuesPage.low")}</option>
            <option value="NORMAL">{t("issuesPage.normal")}</option>
            <option value="HIGH">{t("issuesPage.high")}</option>
            <option value="URGENT">{t("issuesPage.urgent")}</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-secondary">{t("issuesPage.boardField")}</span>
          <select className="h-10 rounded-md border border-line bg-surface px-3 text-sm" name="boardStatus" defaultValue={defaults?.boardStatus || "TODO"}>
            <option value="TODO">{t("issuesPage.todo")}</option>
            <option value="IN_PROGRESS">{t("issuesPage.inProgress")}</option>
            <option value="DONE">{t("issuesPage.done")}</option>
          </select>
        </label>
      </div>
      <div className="grid gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-secondary">{t("issuesPage.labels")}</p>
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <label key={label.slug} className="cursor-pointer">
              <input className="peer sr-only" type="checkbox" name="labels" value={label.slug} defaultChecked={defaults?.labelSlugs?.includes(label.slug)} />
              <span className="peer-checked:[&>span]:border-foreground peer-checked:[&>span]:bg-subtle">
                <LabelBadge label={label} />
              </span>
            </label>
          ))}
        </div>
      </div>
      {defaults?.sourcePath ? (
        <>
          <input type="hidden" name="sourcePath" value={defaults.sourcePath} />
          <input type="hidden" name="sourceLine" value={defaults.sourceLine || ""} />
          <p className="rounded-md border border-line bg-subtle px-3 py-2 font-mono text-xs text-secondary">
            {t("issuesPage.from")} {defaults.sourcePath}
            {defaults.sourceLine ? `:${defaults.sourceLine}` : ""}
          </p>
        </>
      ) : null}
      {state.message ? <p className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{translateMessage(t, state.message)}</p> : null}
      <button className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:opacity-40" disabled={pending} type="submit">
        {pending ? t("common.working") : submitLabel.includes(".") ? t(submitLabel) : submitLabel}
      </button>
    </form>
  );
}
