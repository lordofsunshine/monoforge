type RepoActivityStatsProps = {
  monthlyUniqueViews: number;
  monthlyVisits: number;
  allTimeUniqueViews: number;
  filesChanged: number;
  issuesTouched: number;
  stars: number;
};

export function RepoActivityStats({ monthlyUniqueViews, monthlyVisits, allTimeUniqueViews, filesChanged, issuesTouched, stars }: RepoActivityStatsProps) {
  const stats = [
    ["activity.uniqueViews", monthlyUniqueViews.toString()],
    ["activity.visits", monthlyVisits.toString()],
    ["activity.allTime", allTimeUniqueViews.toString()],
    ["activity.fileEvents", filesChanged.toString()],
    ["activity.issueEvents", issuesTouched.toString()],
    ["activity.stars", stars.toString()],
  ];

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="activity.stats" />
        </h2>
        <span className="font-mono text-[11px] text-faint">30d</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div className="rounded-md border border-line bg-subtle px-3 py-2" key={label}>
            <p className="font-mono text-lg font-semibold">{value}</p>
            <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-faint">
              <LocalizedText path={label} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
import { LocalizedText } from "@/components/system/localized-text";
