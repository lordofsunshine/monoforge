import { runGarbageCollector } from "../server/storage/gc";
import { getPrisma } from "../lib/prisma";

const dryRun = process.argv.includes("--dry-run");

runGarbageCollector({ dryRun })
  .then(async (result) => {
    console.log(JSON.stringify(result, null, 2));
    await getPrisma().$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await getPrisma().$disconnect();
    process.exit(1);
  });
