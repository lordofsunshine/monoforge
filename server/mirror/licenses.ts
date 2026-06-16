export const copyableLicenseIds = new Set([
  "mit",
  "apache-2.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "isc",
  "0bsd",
  "unlicense",
  "cc0-1.0",
  "zlib",
  "mpl-2.0",
]);

export function isCopyableLicense(spdxId: string | null | undefined) {
  if (!spdxId) {
    return false;
  }

  const normalized = spdxId.trim().toLowerCase();

  if (!normalized || normalized === "noassertion" || normalized === "other") {
    return false;
  }

  return copyableLicenseIds.has(normalized);
}
