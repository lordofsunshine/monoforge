"use client";

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/system/preferences-provider";

type UploadFileFormProps = {
  owner: string;
  repo: string;
};

type UploadItem = {
  file: File;
  path: string;
};

type UploadStatus = {
  done: number;
  total: number;
  message: string;
  rejected?: Array<{
    path: string;
    reason: string;
  }>;
};

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (file: File) => void, error?: (error: unknown) => void) => void;
  createReader?: () => {
    readEntries: (success: (entries: FileSystemEntryLike[]) => void, error?: (error: unknown) => void) => void;
  };
};

function getInputPath(file: File) {
  return file.webkitRelativePath || file.name;
}

function readEntryFile(entry: FileSystemEntryLike) {
  return new Promise<File>((resolve, reject) => {
    entry.file?.(resolve, reject);
  });
}

function readDirectoryEntries(entry: FileSystemEntryLike) {
  return new Promise<FileSystemEntryLike[]>((resolve, reject) => {
    const reader = entry.createReader?.();

    if (!reader) {
      resolve([]);
      return;
    }

    const directoryReader = reader;

    const entries: FileSystemEntryLike[] = [];

    function readBatch() {
      directoryReader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries);
          return;
        }

        entries.push(...batch);
        readBatch();
      }, reject);
    }

    readBatch();
  });
}

async function flattenEntry(entry: FileSystemEntryLike, parentPath = ""): Promise<UploadItem[]> {
  const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await readEntryFile(entry);
    return [{ file, path: currentPath }];
  }

  if (!entry.isDirectory) {
    return [];
  }

  const children = await readDirectoryEntries(entry);
  const nested = await Promise.all(children.map((child) => flattenEntry(child, currentPath)));
  return nested.flat();
}

export function UploadFileForm({ owner, repo }: UploadFileFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const previewItems = useMemo(() => items.slice(0, 6), [items]);

  function setSelectedFiles(files: File[]) {
    setItems(files.map((file) => ({ file, path: getInputPath(file) })));
    setStatus(null);
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.target.files || []));
  }

  async function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);

    const rawEntries: Array<FileSystemEntryLike | null> = Array.from(event.dataTransfer.items).map((item) => {
        const maybeEntry = item as DataTransferItem & {
          webkitGetAsEntry?: () => FileSystemEntryLike | null;
        };
        return maybeEntry.webkitGetAsEntry?.() || null;
      });
    const entries = rawEntries.filter((entry): entry is FileSystemEntryLike => entry !== null);

    if (entries.length) {
      const flattened = (await Promise.all(entries.map((entry) => flattenEntry(entry)))).flat();
      setItems(flattened);
      setStatus(null);
      return;
    }

    setSelectedFiles(Array.from(event.dataTransfer.files));
  }

  async function uploadOne(item: UploadItem, message: string) {
    const formData = new FormData();
    formData.set("file", item.file);
    formData.set("path", item.path);
    formData.set("message", message);

    const response = await fetch(`/api/repositories/${owner}/${repo}/files`, {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || `Failed to upload ${item.path}`);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!items.length) {
      setStatus({ done: 0, total: 0, message: t("upload.chooseFirst") });
      return;
    }

    startTransition(async () => {
      const message = commitMessage.trim() || t("upload.defaultMessage");
      setStatus({ done: 0, total: items.length, message: t("upload.uploading") });
      const rejected: UploadStatus["rejected"] = [];
      let uploaded = 0;

      for (let index = 0; index < items.length; index += 1) {
        try {
          await uploadOne(items[index], message);
          uploaded += 1;
          setStatus({ done: index + 1, total: items.length, message: `${t("upload.uploaded")} ${uploaded} ${t("upload.of")} ${items.length}`, rejected });
        } catch (error) {
          rejected.push({
            path: items[index].path,
            reason: error instanceof Error ? error.message : t("upload.failed"),
          });
          setStatus({ done: index + 1, total: items.length, message: `${t("upload.uploaded")} ${uploaded} ${t("upload.of")} ${items.length}`, rejected });
        }
      }

      setItems([]);
      setCommitMessage("");
      setStatus({
        done: items.length,
        total: items.length,
        message: rejected.length ? `${t("upload.completeWithSkipped")} ${rejected.length}` : t("upload.complete"),
        rejected,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid min-w-0 gap-4 rounded-lg border border-line bg-surface p-4">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">{t("upload.title")}</h2>
        <p className="mt-2 break-words text-sm leading-6 text-secondary">{t("upload.description")}</p>
      </div>

      <label
        className={`grid min-h-32 min-w-0 cursor-pointer place-items-center rounded-md border border-dashed px-4 py-6 text-center transition ${dragging ? "border-foreground bg-muted" : "border-line bg-subtle hover:border-lineStrong hover:bg-muted"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => void onDrop(event)}
      >
        <span>
          <span className="block text-sm font-medium">{t("upload.choose")}</span>
          <span className="mt-1 block text-xs text-secondary">{t("upload.drop")}</span>
        </span>
        <input className="sr-only" multiple onChange={onFilesSelected} type="file" />
      </label>

      {items.length ? (
        <div className="min-w-0 rounded-md border border-line bg-subtle p-3">
          <p className="font-mono text-xs text-secondary">
            {items.length} {t("upload.selected")}
          </p>
          <div className="mt-2 grid gap-1">
            {previewItems.map((item) => (
              <p className="truncate font-mono text-xs text-faint" key={`${item.path}-${item.file.size}`}>
                {item.path}
              </p>
            ))}
            {items.length > previewItems.length ? (
              <p className="font-mono text-xs text-faint">
                +{items.length - previewItems.length} {t("upload.more")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        className="h-10 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
        onChange={(event) => setCommitMessage(event.target.value)}
        placeholder={t("upload.commitMessage")}
        value={commitMessage}
      />

      {status ? (
        <div className="rounded-md border border-line bg-subtle px-3 py-2 text-sm text-secondary">
          <p>{status.message}</p>
          {status.total ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
              <div className="h-full bg-foreground" style={{ width: `${Math.round((status.done / status.total) * 100)}%` }} />
            </div>
          ) : null}
          {status.rejected?.length ? (
            <div className="mt-3 grid gap-1 border-t border-line pt-3">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-secondary">{t("upload.skippedFiles")}</p>
              {status.rejected.slice(0, 8).map((item) => (
                <p className="break-words font-mono text-xs text-faint" key={`${item.path}-${item.reason}`}>
                  {item.path}: {item.reason}
                </p>
              ))}
              {status.rejected.length > 8 ? (
                <p className="font-mono text-xs text-faint">
                  +{status.rejected.length - 8} {t("upload.more")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <button className="mf-primary inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm disabled:opacity-40" disabled={pending || !items.length} type="submit">
        {pending ? t("upload.uploading") : t("upload.uploadSelected")}
      </button>
    </form>
  );
}
