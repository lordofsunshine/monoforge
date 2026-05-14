import Link from "next/link";
import { MarkdownRenderer } from "@/components/repository/markdown-renderer";
import { LocalizedText } from "@/components/system/localized-text";

type ReadmePreviewProps = {
  content: string | null;
  createHref?: string;
  owner?: string;
  repo?: string;
  sourcePath?: string | null;
};

export function ReadmePreview({ content, createHref, owner, repo, sourcePath }: ReadmePreviewProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line bg-subtle px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="readme.title" />
        </h2>
      </div>
      <div className="min-w-0 overflow-hidden px-4 py-6 text-sm leading-7 md:px-6">
        {content ? (
          <MarkdownRenderer content={content} owner={owner} repo={repo} sourcePath={sourcePath} allowHtmlImages />
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
