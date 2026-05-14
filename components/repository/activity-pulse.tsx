import type { ActivityPulseDay } from "@/server/repositories/metrics";
import { LocalizedText } from "@/components/system/localized-text";

type ActivityPulseProps = {
  days: ActivityPulseDay[];
};

function pulseChar(count: number) {
  if (count <= 0) return "_";
  if (count === 1) return "-";
  if (count <= 3) return "=";
  return "#";
}

export function ActivityPulse({ days }: ActivityPulseProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="storage.activityPulse" />
        </h2>
        <span className="font-mono text-xs text-faint">{days.reduce((sum, day) => sum + day.count, 0)} events</span>
      </div>
      <div className="mt-4 flex gap-1 font-mono text-sm text-secondary" aria-label="Repository activity pulse">
        {days.map((day) => (
          <span title={`${day.day}: ${day.count}`} key={day.day}>
            {pulseChar(day.count)}
          </span>
        ))}
      </div>
    </section>
  );
}
