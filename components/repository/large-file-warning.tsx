import { RawFileActions } from "@/components/repository/raw-file-actions";
import { LocalizedText } from "@/components/system/localized-text";

type LargeFileWarningProps = {
  path: string;
  rawHref: string;
  downloadHref: string;
};

export function LargeFileWarning({ path, rawHref, downloadHref }: LargeFileWarningProps) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">
        <LocalizedText path="repo.largeFileTitle" />
      </h2>
      <p className="mt-2 text-sm text-secondary">
        <LocalizedText path="repo.largeFileText" />
      </p>
      <div className="mt-5 flex justify-center">
        <RawFileActions path={path} rawHref={rawHref} downloadHref={downloadHref} />
      </div>
    </div>
  );
}
