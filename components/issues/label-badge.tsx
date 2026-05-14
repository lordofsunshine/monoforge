import type { IssueLabel } from "@/generated/prisma/client";

type LabelBadgeProps = {
  label: Pick<IssueLabel, "name" | "marker" | "pattern">;
};

export function LabelBadge({ label }: LabelBadgeProps) {
  const patternClass =
    label.pattern === "dashed"
      ? "border-dashed"
      : label.pattern === "dotted"
        ? "border-dotted"
        : label.pattern === "double"
          ? "border-double border-4 py-0"
          : label.pattern === "heavy"
            ? "border-2 border-foreground"
            : "border";

  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-sm border px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-secondary ${patternClass}`}>
      <span>{label.marker}</span>
      <span>{label.name}</span>
    </span>
  );
}
