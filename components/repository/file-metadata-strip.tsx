import { formatBytes } from "@/lib/format";
import { LocalizedDate } from "@/components/system/localized-format";
import { LocalizedText } from "@/components/system/localized-text";

type FileMetadataStripProps = {
  size: bigint | number;
  compressedSize?: bigint | number | null;
  language?: string | null;
  updatedAt: Date;
  hash?: string | null;
};

export function FileMetadataStrip({ size, compressedSize, language, updatedAt, hash }: FileMetadataStripProps) {
  const items = [
    ["repo.size", formatBytes(size)],
    ["storage.stored", compressedSize ? formatBytes(compressedSize) : "repo.rawValue"],
    ["repo.language", language || "repo.text"],
    ["repo.changed", <LocalizedDate value={updatedAt} />],
    ["repo.hash", hash ? hash.slice(0, 12) : "repo.none"],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-5">
      {items.map(([label, value]) => (
        <div className="bg-subtle px-3 py-2" key={label}>
          <p className="font-mono text-[10px] uppercase text-faint">
            <LocalizedText path={label} />
          </p>
          <p className="mt-1 truncate font-mono text-xs text-secondary">{typeof value === "string" && value.includes(".") ? <LocalizedText path={value} /> : value}</p>
        </div>
      ))}
    </div>
  );
}
