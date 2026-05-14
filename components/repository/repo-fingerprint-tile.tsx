type RepoFingerprintTileProps = {
  value: string;
};

function hashValue(input: string) {
  let hash = 2166136261;

  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function RepoFingerprintTile({ value }: RepoFingerprintTileProps) {
  const hash = hashValue(value);
  const cells = Array.from({ length: 25 }, (_, index) => {
    const bit = (hash >> (index % 24)) & 1;
    const weight = ((hash >> ((index + 7) % 24)) & 3) + 1;
    return { bit, weight };
  });

  return (
    <div className="hidden size-14 shrink-0 rounded-lg border border-line bg-surface p-1.5 shadow-sm sm:block" aria-hidden="true">
      <div className="grid size-full grid-cols-5 gap-px rounded-md bg-subtle p-px">
        {cells.map((cell, index) => (
          <span className={`rounded-[1px] ${cell.bit ? "bg-secondary" : "bg-surface"} ${cell.weight > 2 ? "opacity-55" : "opacity-20"}`} key={`${value}-${index}`} />
        ))}
      </div>
    </div>
  );
}
