import { RawFileActions } from "@/components/repository/raw-file-actions";

type ImagePreviewProps = {
  path: string;
  rawHref: string;
  downloadHref: string;
  previewHref: string;
  width?: number | null;
  height?: number | null;
};

export function ImagePreview({ path, rawHref, downloadHref, previewHref, width, height }: ImagePreviewProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="font-mono text-xs text-secondary">{width && height ? `${width}x${height}` : path.split("/").at(-1)}</div>
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} />
      </div>
      <div className="mt-4 grid place-items-center overflow-hidden bg-subtle p-2 sm:p-4">
        <img src={previewHref} alt={path} loading="lazy" className="h-auto max-h-[70dvh] max-w-full object-contain" />
      </div>
    </div>
  );
}
