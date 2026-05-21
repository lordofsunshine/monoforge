"use client";

import { useState } from "react";
import { generateToken, revokeToken } from "@/app/settings/actions";
import { useI18n } from "@/components/system/preferences-provider";
import { translateMessage } from "@/lib/i18n/messages";

type TokenItem = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function TokenManager({ tokens }: { tokens: TokenItem[] }) {
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { locale, t } = useI18n();

  async function handleCreate(formData: FormData) {
    setError("");
    try {
      const token = await generateToken(formData);
      setNewToken(token);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Token was not created.");
    }
  }

  async function handleRevoke(tokenId: string) {
    setError("");
    try {
      await revokeToken(tokenId);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Token was not revoked.");
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div className="min-w-0 rounded-lg border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">{t("settings.tokens")}</h2>
        <p className="mt-1 text-sm text-secondary">{t("settings.tokensDescription")}</p>
        <form action={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input name="name" type="text" required placeholder={t("settings.tokenNamePlaceholder")} className="h-10 rounded-md border border-line bg-background px-3 text-sm" />
          <button type="submit" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            {t("settings.createToken")}
          </button>
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input name="scopes" type="checkbox" value="repo:read" defaultChecked />
            <span>repo:read</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input name="scopes" type="checkbox" value="repo:write" defaultChecked />
            <span>repo:write</span>
          </label>
        </form>
        {newToken && (
          <div className="mt-4 min-w-0 rounded-md border border-lineStrong bg-subtle p-3 text-sm">
            <p className="mb-2 text-secondary">{t("settings.copyTokenNow")}</p>
            <p className="max-w-full overflow-x-auto whitespace-nowrap pb-1 font-mono text-xs sm:whitespace-normal sm:break-all sm:text-sm">{newToken}</p>
          </div>
        )}
        {error ? <p className="mt-4 rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{translateMessage(t, error)}</p> : null}
        <div className="mt-6 grid gap-3">
          {tokens.map((token) => (
            <div key={token.id} className="grid min-w-0 gap-3 border-b border-line pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="font-medium text-sm">{token.name}</p>
                <p className="truncate font-mono text-xs text-faint">{token.prefix} / {token.status.toLowerCase()} / {token.scopes.join(", ")}</p>
                <p className="text-xs text-faint">
                  {t("settings.createdAt")} {new Date(token.createdAt).toLocaleDateString(locale)}
                  {token.lastUsedAt ? ` / ${t("settings.usedAt")} ${new Date(token.lastUsedAt).toLocaleDateString(locale)}` : ""}
                </p>
              </div>
              <button disabled={token.status !== "ACTIVE"} onClick={() => void handleRevoke(token.id)} className="w-fit text-xs text-secondary hover:text-foreground disabled:opacity-40">
                {t("settings.revokeToken")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
