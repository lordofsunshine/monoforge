import path from "node:path";

export const forbiddenSecretFileNames = new Set([
  ".bash_history",
  ".dockerconfigjson",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".gcloud",
  ".netrc",
  ".npmrc",
  ".pypirc",
  ".psql_history",
  ".python_history",
  ".zsh_history",
  "authorized_keys",
  "credentials",
  "config.json",
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "known_hosts",
]);
export const forbiddenSecretExtensions = new Set([".pem", ".key", ".p12", ".pfx"]);
const forbiddenSecretPathSegments = new Set([".aws", ".azure", ".config/gcloud", ".docker", ".gnupg", ".kube", ".ssh"]);
const forbiddenSecretNameParts = new Set(["credential", "credentials", "secret", "secrets", "private", "token", "tokens"]);
const activeContentExtensions = new Set([".html", ".htm", ".svg", ".xhtml", ".xml"]);
const activeContentMimeTypes = new Set(["text/html", "image/svg+xml", "application/xhtml+xml"]);

export function assertSafeFileExtension(repoPath: string) {
  const extension = path.posix.extname(repoPath).toLowerCase();
  const fileName = path.posix.basename(repoPath).toLowerCase();
  const normalized = repoPath.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/").filter(Boolean);
  const nameParts = fileName.split(/[._\-\s]+/).filter(Boolean);

  if (
    forbiddenSecretFileNames.has(fileName) ||
    forbiddenSecretExtensions.has(extension) ||
    fileName === ".env" ||
    fileName.startsWith(".env.") ||
    segments.some((segment) => forbiddenSecretPathSegments.has(segment)) ||
    forbiddenSecretPathSegments.has(segments.slice(0, 2).join("/")) ||
    nameParts.some((part) => forbiddenSecretNameParts.has(part)) ||
    nameParts.includes("key")
  ) {
    throw new Error("This file looks like a secret or private key and was not uploaded");
  }
}

export function shouldBlockPreview(input: { size: bigint | number; isBinary: boolean }) {
  const size = typeof input.size === "bigint" ? input.size : BigInt(input.size);
  return input.isBinary || size > 1024n * 1024n;
}

export function isActiveContent(fileName: string, mimeType?: string | null) {
  const extension = path.posix.extname(fileName).toLowerCase();
  const normalizedMime = mimeType?.split(";")[0]?.trim().toLowerCase();
  return activeContentExtensions.has(extension) || Boolean(normalizedMime && activeContentMimeTypes.has(normalizedMime));
}

export function safeDownloadFileName(fileName: string) {
  return fileName.replaceAll("\\", "_").replaceAll("/", "_").replace(/["\r\n\x00-\x1F\x7F]/g, "").slice(0, 180) || "download";
}

export function getRawResponsePolicy(fileName: string, mimeType?: string | null) {
  if (isActiveContent(fileName, mimeType)) {
    return {
      contentType: "text/plain; charset=utf-8",
      disposition: "attachment",
    };
  }

  return {
    contentType: mimeType || "application/octet-stream",
    disposition: "inline",
  };
}
