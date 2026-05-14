import { RawFileActions } from "@/components/repository/raw-file-actions";
import { LocalizedText } from "@/components/system/localized-text";

type BinaryFilePreviewProps = {
  path: string;
  rawHref: string;
  downloadHref: string;
  mimeType?: string | null;
};

export function BinaryFilePreview({ path, rawHref, downloadHref, mimeType }: BinaryFilePreviewProps) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">
        <LocalizedText path="repo.binaryFile" />
      </h2>
      <p className="mt-2 text-sm text-secondary">
        {mimeType || "application/octet-stream"} <LocalizedText path="repo.binaryText" />
      </p>
      <div className="mt-5 flex justify-center">
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} />
      </div>
    </div>
  );
}
