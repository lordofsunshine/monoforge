import { formatBytes } from "@/lib/format";
import { LocalizedText } from "@/components/system/localized-text";

type QuotaBarProps = {
  usedBytes: bigint;
  maxBytes: bigint;
};

export function QuotaBar({ usedBytes, maxBytes }: QuotaBarProps) {
  const percent = maxBytes > 0n ? Math.min(100, Math.round((Number(usedBytes) / Number(maxBytes)) * 100)) : 0;

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="storage.quota" />
        </h2>
        <span className="font-mono text-xs text-faint">{percent}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-sm border border-line bg-subtle" aria-label="Storage quota usage">
        <div className="h-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 font-mono text-xs text-secondary">
        {formatBytes(usedBytes)} / {formatBytes(maxBytes)}
      </p>
    </section>
  );
}
