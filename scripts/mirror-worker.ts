import { runMirrorTick } from "../server/mirror/worker";

const intervalMs = Number(process.env.MIRROR_INTERVAL_MS || 60_000);
const rateBufferMs = 5_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function loop() {
  for (;;) {
    let waitMs = intervalMs;

    try {
      const result = await runMirrorTick();
      console.log(JSON.stringify({ at: new Date().toISOString(), ...result }));

      if (result.status === "rate_limited" && result.sleepUntil) {
        waitMs = Math.max(intervalMs, result.sleepUntil - Date.now() + rateBufferMs);
      }
    } catch (error) {
      console.error(error);
    }

    await sleep(waitMs);
  }
}

loop().catch((error) => {
  console.error(error);
  process.exit(1);
});
