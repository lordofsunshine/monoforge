"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  status: string;
  lastStatus: number | null;
  lastError: string | null;
  lastSentAt: string | null;
  createdAt: string;
};

const eventOptions = [
  ["*", "settings.webhookEvents.all"],
  ["file.uploaded", "settings.webhookEvents.fileUploaded"],
  ["file.updated", "settings.webhookEvents.fileUpdated"],
  ["file.deleted", "settings.webhookEvents.fileDeleted"],
  ["issue.opened", "settings.webhookEvents.issueOpened"],
  ["issue.closed", "settings.webhookEvents.issueClosed"],
  ["issue.commented", "settings.webhookEvents.issueCommented"],
  ["repository.starred", "settings.webhookEvents.repositoryStarred"],
];

export function WebhookManager({ owner, repo, initialWebhooks }: { owner: string; repo: string; initialWebhooks: WebhookItem[] }) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  async function create(formData: FormData) {
    setError(null);
    const events = formData.getAll("events").map(String);
    const response = await fetch(`/api/repositories/${owner}/${repo}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: String(formData.get("url") || ""),
        events: events.length ? events : ["*"],
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || t("settings.webhookCreateFailed"));
      return;
    }

    setWebhooks((current) => [payload.webhook, ...current]);
  }

  function submit(formData: FormData) {
    startTransition(() => {
      void create(formData);
    });
  }

  async function remove(id: string) {
    setError(null);
    const response = await fetch(`/api/repositories/${owner}/${repo}/webhooks/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError(t("settings.webhookRemoveFailed"));
      return;
    }

    setWebhooks((current) => current.filter((webhook) => webhook.id !== id));
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("settings.webhooks")}</h2>
          <p className="mt-1 text-sm text-secondary">{t("settings.webhooksDescription")}</p>
        </div>
      </div>
      <form action={submit} className="mt-4 grid gap-3">
        <input name="url" type="url" required placeholder={t("settings.webhookUrlPlaceholder")} className="h-10 rounded-md border border-line bg-background px-3 text-sm" />
        <div className="grid gap-2 sm:grid-cols-2">
          {eventOptions.map(([value, label]) => (
            <label className="flex items-center gap-2 text-sm text-secondary" key={value}>
              <input name="events" type="checkbox" value={value} defaultChecked={value === "*"} />
              <span>{t(label)}</span>
            </label>
          ))}
        </div>
        <button disabled={isPending} type="submit" className="inline-flex h-10 w-fit items-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:bg-subtle disabled:opacity-50">
          {t("settings.addWebhook")}
        </button>
      </form>
      {error ? <p className="mt-3 rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{translateMessage(t, error)}</p> : null}
      <div className="mt-5 grid gap-3">
        {webhooks.length ? webhooks.map((webhook) => (
          <div className="grid gap-2 rounded-md border border-line bg-background p-3" key={webhook.id}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{webhook.url}</p>
                <p className="mt-1 text-xs text-faint">{webhook.events.join(", ")} · {webhook.status.toLowerCase()}</p>
                {webhook.lastStatus ? <p className="mt-1 text-xs text-faint">{t("settings.lastWebhookStatus")}: {webhook.lastStatus}</p> : null}
                {webhook.lastError ? <p className="mt-1 text-xs text-secondary">{webhook.lastError}</p> : null}
              </div>
              <button type="button" onClick={() => void remove(webhook.id)} className="text-sm text-secondary hover:text-foreground">
                {t("common.delete")}
              </button>
            </div>
          </div>
        )) : <p className="text-sm text-secondary">{t("settings.noWebhooks")}</p>}
      </div>
    </section>
  );
}
