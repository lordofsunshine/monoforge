import { codeToHtml } from "shiki";
import { RawFileActions } from "@/components/repository/raw-file-actions";
import { LocalizedText } from "@/components/system/localized-text";

type CodeViewerProps = {
  code: string | null;
  language: string | null;
  path: string;
  rawHref?: string;
  downloadHref?: string;
};

export async function CodeViewer({ code, language, path, rawHref = "#", downloadHref = "#" }: CodeViewerProps) {
  if (code === null) {
    return (
      <div className="rounded-lg border border-line bg-surface px-6 py-16 text-center text-sm text-secondary">
        <LocalizedText path="repo.largeFileTitle" />
      </div>
    );
  }

  const html = await codeToHtml(code, {
    lang: language || "text",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  }).catch(() =>
    codeToHtml(code, {
      lang: "text",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    }),
  );

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line bg-subtle px-3">
        <p className="min-w-0 truncate font-mono text-xs text-secondary">{path}</p>
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} code={code} />
      </div>
      <div className="max-h-[calc(100dvh-220px)] overflow-auto text-[13px] leading-6" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
