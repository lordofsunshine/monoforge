import { LocalizedText } from "@/components/system/localized-text";
import type { RepositoryLanguageStat } from "@/server/repositories/languages";

type LanguageStripProps = {
  languages: RepositoryLanguageStat[];
  compact?: boolean;
};

const shades = ["bg-foreground", "bg-secondary", "bg-faint", "bg-lineStrong", "bg-line", "bg-muted"];

export function LanguageStrip({ languages, compact = false }: LanguageStripProps) {
  if (!languages.length) {
    return null;
  }

  return (
    <section className={compact ? "rounded-lg border border-line bg-surface p-4" : "grid gap-2"}>
      {compact ? (
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="repo.languages" />
        </h2>
      ) : null}
      <div className="flex h-2 overflow-hidden rounded-full border border-line bg-subtle">
        {languages.map((item, index) => (
          <span className={shades[index % shades.length]} key={item.language} style={{ width: `${item.percent}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-faint">
        {languages.map((item) => (
          <span key={item.language}>
            {item.language} {item.percent}%
          </span>
        ))}
      </div>
    </section>
  );
}
