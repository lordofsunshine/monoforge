import path from "node:path";

export const blockedSecretFileNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
]);

export const blockedSecretExtensions = new Set([".pem", ".key", ".p12", ".pfx"]);

export function normalizeRepoPath(input: string) {
  const decoded = decodeURIComponent(input);
  const clean = decoded.replaceAll("\\", "/").split("/").filter(Boolean).join("/");

  if (!clean || path.isAbsolute(decoded) || decoded.startsWith("/") || clean.startsWith(".") || clean.includes("../") || clean.includes("..")) {
    throw new Error("Invalid file path");
  }

  if (clean.length > 512) {
    throw new Error("Path is too long");
  }

  if (clean.split("/").length > 20) {
    throw new Error("Path is too deep");
  }

  if (/[\x00-\x1F\x7F]/.test(clean)) {
    throw new Error("Path contains invalid characters");
  }

  const name = path.posix.basename(clean);
  const firstSegment = clean.split("/")[0]?.toLowerCase();

  if (firstSegment && ["storage", "etc", "proc", "root"].includes(firstSegment)) {
    throw new Error("Invalid file path");
  }

  if (name.length > 128) {
    throw new Error("File name is too long");
  }

  return clean;
}

export function getParentPath(repoPath: string) {
  const parent = path.posix.dirname(repoPath);
  return parent === "." ? "" : parent;
}

export function getRepoFileName(repoPath: string) {
  return path.posix.basename(repoPath);
}

export function getRepoExtension(repoPath: string) {
  const extension = path.posix.extname(repoPath).toLowerCase();
  return extension ? extension.slice(1) : null;
}

export function assertAllowedExtension(repoPath: string) {
  const extension = path.posix.extname(repoPath).toLowerCase();
  const fileName = path.posix.basename(repoPath).toLowerCase();

  if (blockedSecretFileNames.has(fileName) || blockedSecretExtensions.has(extension)) {
    throw new Error("This file looks like a secret or private key and was not uploaded");
  }
}

export function getDirectoryPaths(repoPath: string) {
  const parts = repoPath.split("/").slice(0, -1);
  const directories: string[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    directories.push(parts.slice(0, index + 1).join("/"));
  }

  return directories;
}
