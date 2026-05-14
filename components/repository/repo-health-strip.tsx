import { formatBytes, formatDate } from "@/lib/format";
import { LocalizedText } from "@/components/system/localized-text";
import type { RepoMetrics } from "@/server/repositories/metrics";

type RepoHealthStripProps = {
  metrics: RepoMetrics;
};

export function RepoHealthStrip({ metrics }: RepoHealthStripProps) {
  const items = [
    ["files", metrics.fileCount.toString()],
    ["weight", formatBytes(metrics.repoSize)],
    ["saved", `${metrics.compressionSavedPercent}%`],
    ["open", metrics.openIssues.toString()],
    ["stars", metrics.stars.toString()],
    ["score", `${metrics.disciplineScore}/100`],
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-6" aria-label="Repository health strip">
      {items.map(([label, value]) => (
        <div className="bg-subtle px-3 py-2" key={label}>
          <p className="font-mono text-[10px] uppercase text-faint">{label}</p>
          <p className="mt-1 truncate font-mono text-xs text-secondary">{value}</p>
        </div>
      ))}
      <div className="col-span-2 bg-subtle px-3 py-2 md:col-span-6">
        <p className="font-mono text-[10px] uppercase text-faint">
          <LocalizedText path="storage.lastUpdate" />
        </p>
        <p className="mt-1 font-mono text-xs text-secondary">{formatDate(metrics.lastUpdate)}</p>
      </div>
    </div>
  );
}
