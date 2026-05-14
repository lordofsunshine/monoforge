import { formatBytes } from "@/lib/format";
import { LocalizedText } from "@/components/system/localized-text";
import type { RepoMetrics } from "@/server/repositories/metrics";

type StorageSavingsCardProps = {
  metrics: RepoMetrics;
};

export function StorageSavingsCard({ metrics }: StorageSavingsCardProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
            <LocalizedText path="storage.storageSavings" />
          </h2>
          <p className="mt-2 text-2xl font-semibold">{metrics.compressionSavedPercent}%</p>
        </div>
        <div className="rounded-sm border border-line px-2 py-1 font-mono text-xs text-secondary">{formatBytes(metrics.compressionSavedBytes)}</div>
      </div>
      <div className="mt-4 grid gap-2 font-mono text-xs text-secondary">
        <div className="flex justify-between gap-4">
          <span><LocalizedText path="storage.original" /></span>
          <span>{formatBytes(metrics.logicalOriginalSize)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span><LocalizedText path="storage.stored" /></span>
          <span>{formatBytes(metrics.compressedSize)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span><LocalizedText path="storage.largeFiles" /></span>
          <span>{metrics.largeFileCount}</span>
        </div>
      </div>
    </section>
  );
}
