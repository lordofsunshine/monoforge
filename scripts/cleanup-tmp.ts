import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { getTmpDir } from "../server/storage/paths";

const maxAgeHours = Number(process.env.TMP_MAX_AGE_HOURS || 6);
const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

async function main() {
  const tmpDir = getTmpDir();
  const entries = await readdir(tmpDir, { withFileTypes: true }).catch(() => []);
  let deleted = 0;

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const fullPath = path.join(tmpDir, entry.name);
    const info = await stat(fullPath);

    if (info.mtimeMs < cutoff) {
      await rm(fullPath, { force: true });
      deleted += 1;
    }
  }

  console.log(`Deleted ${deleted} temporary files older than ${maxAgeHours}h`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
