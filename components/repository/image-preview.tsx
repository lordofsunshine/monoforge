import Image from "next/image";
import { RawFileActions } from "@/components/repository/raw-file-actions";
import { LocalizedText } from "@/components/system/localized-text";
import { formatBytes } from "@/lib/format";

type ImagePreviewProps = {
  path: string;
  rawHref: string;
  downloadHref: string;
  previewHref: string;
  width?: number | null;
  height?: number | null;
  originalSize: bigint | number;
  optimizedSize?: bigint | number | null;
};

export function ImagePreview({ path, rawHref, downloadHref, previewHref, width, height, originalSize, optimizedSize }: ImagePreviewProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="font-mono text-xs text-secondary">
          {width && height ? `${width}x${height} · ` : ""}
          {formatBytes(originalSize)}
          {optimizedSize ? (
            <>
              {" · "}
              <LocalizedText path="repo.preview" /> {formatBytes(optimizedSize)}
            </>
          ) : null}
        </div>
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} />
      </div>
      <div className="mt-4 grid place-items-center overflow-hidden bg-subtle p-4">
        <Image src={previewHref} alt={path} width={width || 900} height={height || 600} className="h-auto max-h-[70dvh] max-w-full object-contain grayscale" />
      </div>
    </div>
  );
}
