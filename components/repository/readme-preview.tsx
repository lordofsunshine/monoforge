"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/repository/markdown-renderer";
import { useI18n } from "@/components/system/preferences-provider";
import { LocalizedText } from "@/components/system/localized-text";
import { detectReadableLocale, shouldOfferTranslation } from "@/lib/i18n/language";

type ReadmePreviewProps = {
  content: string | null;
  createHref?: string;
  owner?: string;
  repo?: string;
  sourcePath?: string | null;
};

export function ReadmePreview({ content, createHref, owner, repo, sourcePath }: ReadmePreviewProps) {
  const { locale, t } = useI18n();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const sourceLocale = useMemo(() => (content ? detectReadableLocale(content) : "unknown"), [content]);
  const canTranslate = content ? shouldOfferTranslation(content, locale) : false;
  const shownContent = translatedContent || content;

  async function translateReadme() {
    if (!content || status === "loading") {
      return;
    }

    try {
      setStatus("loading");
      const response = await fetch("/api/markdown/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown: content,
          sourceLocale: sourceLocale === "unknown" ? undefined : sourceLocale,
          targetLocale: locale,
        }),
      });

      const payload = (await response.json()) as { markdown?: string; error?: string };

      if (!response.ok || !payload.markdown) {
        throw new Error(payload.error || t("errors.translationFailed"));
      }

      setTranslatedContent(payload.markdown);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line bg-subtle px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="readme.title" />
        </h2>
        {canTranslate ? (
          <button className="text-right text-sm text-secondary hover:text-foreground hover:underline" type="button" onClick={translatedContent ? () => setTranslatedContent(null) : translateReadme}>
            {translatedContent ? t("readme.showOriginal") : status === "loading" ? t("readme.translating") : t(locale === "ru" ? "readme.translateToRu" : "readme.translateToEn")}
          </button>
        ) : null}
      </div>
      <div className="min-w-0 overflow-hidden px-4 py-6 text-sm leading-7 md:px-6">
        {status === "error" ? <p className="mb-4 rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">{t("readme.translateError")}</p> : null}
        {shownContent ? (
          <MarkdownRenderer content={shownContent} owner={owner} repo={repo} sourcePath={sourcePath} allowHtmlImages />
        ) : (
          <div className="grid gap-3 text-secondary">
            <p>
              <LocalizedText path="readme.empty" />
            </p>
            {createHref ? (
              <Link className="inline-flex h-9 w-fit items-center rounded-md border border-line bg-surface px-3 text-sm text-foreground hover:border-lineStrong hover:bg-subtle" href={createHref}>
                <LocalizedText path="readme.create" />
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
