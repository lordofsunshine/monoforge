import { runGarbageCollector } from "../server/storage/gc";

const intervalMs = Number(process.env.GC_INTERVAL_MS || 24 * 60 * 60 * 1000);

async function tick() {
  const result = await runGarbageCollector();
  console.log(JSON.stringify({ at: new Date().toISOString(), ...result }));
}

tick().catch((error) => {
  console.error(error);
});

setInterval(() => {
  tick().catch((error) => {
    console.error(error);
  });
}, intervalMs);
