import { MirrorStatus } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";
import { getRepository, listPublicRepositoriesSince, RateLimitExhaustedError, type RateBudget } from "@/server/mirror/github";
import { createMirrorRepository, ensureMirrorUser, extractMirrorRepository, uploadMirrorRepository } from "@/server/mirror/import";
import { isCopyableLicense } from "@/server/mirror/licenses";
import { advanceCursor, getMirrorSettings, hasMirrored, markRun, recordResult } from "@/server/mirror/settings";

export type TickStatus = "disabled" | "empty" | "processed" | "rate_limited" | "error";

export type TickResult = {
  status: TickStatus;
  processed: number;
  imported: number;
  skipped: number;
  failed: number;
  cursor: number;
  sleepUntil: number | null;
};

function isRateLow(rate: RateBudget, threshold: number) {
  return rate.remaining !== null && rate.remaining < threshold;
}

export async function runMirrorTick(): Promise<TickResult> {
  const settings = await getMirrorSettings();
  let cursor = Number(settings.cursor);

  if (!settings.enabled) {
    return { status: "disabled", processed: 0, imported: 0, skipped: 0, failed: 0, cursor, sleepUntil: null };
  }

  const env = getEnv();
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let detailCalls = 0;
  let sleepUntil: number | null = null;

  try {
    const { items, rate } = await listPublicRepositoriesSince(cursor);
    let budget = rate;

    if (!items.length) {
      await markRun(null);
      return { status: "empty", processed: 0, imported, skipped, failed, cursor, sleepUntil: null };
    }

    for (const item of items) {
      if (isRateLow(budget, env.MIRROR_MIN_RATE_BUDGET)) {
        sleepUntil = budget.resetAt;
        break;
      }

      if (detailCalls >= env.MIRROR_BATCH_SIZE) {
        break;
      }

      if (item.isPrivate || item.fork || !item.ownerLogin) {
        cursor = Math.max(cursor, item.id);
        continue;
      }

      if (await hasMirrored(item.id)) {
        cursor = Math.max(cursor, item.id);
        continue;
      }

      detailCalls += 1;

      try {
        const detail = await getRepository(item.ownerLogin, item.name);
        budget = detail.rate;
        const repository = detail.repository;

        if (!repository || repository.isPrivate || repository.fork || repository.archived || repository.disabled) {
          await recordResult({
            githubId: item.id,
            fullName: item.fullName,
            ownerLogin: item.ownerLogin,
            repoName: item.name,
            license: repository?.licenseSpdxId ?? null,
            status: MirrorStatus.SKIPPED,
            reason: repository ? "not eligible" : "not found",
          });
          skipped += 1;
        } else if (!isCopyableLicense(repository.licenseSpdxId)) {
          await recordResult({
            githubId: item.id,
            fullName: item.fullName,
            ownerLogin: item.ownerLogin,
            repoName: item.name,
            license: repository.licenseSpdxId,
            status: MirrorStatus.SKIPPED,
            reason: `license not allowed: ${repository.licenseSpdxId || "none"}`,
          });
          skipped += 1;
        } else {
          const extraction = await extractMirrorRepository(repository);

          try {
            if (extraction.fileLimitExceeded) {
              await recordResult({
                githubId: item.id,
                fullName: item.fullName,
                ownerLogin: item.ownerLogin,
                repoName: item.name,
                license: repository.licenseSpdxId,
                status: MirrorStatus.SKIPPED,
                reason: `too many files: over ${env.MIRROR_MAX_FILES}`,
              });
              skipped += 1;
            } else {
              const user = await ensureMirrorUser(repository.ownerLogin);
              const created = await createMirrorRepository(user, repository);
              const result = await uploadMirrorRepository({
                repositoryId: created.id,
                authorId: user.id,
                repository,
                files: extraction.files,
                truncated: extraction.truncated,
              });
              await recordResult({
                githubId: item.id,
                fullName: item.fullName,
                ownerLogin: item.ownerLogin,
                repoName: item.name,
                license: repository.licenseSpdxId,
                status: MirrorStatus.IMPORTED,
                reason: result.truncated ? "imported with truncation" : null,
                monoforgeUserId: user.id,
                monoforgeRepositoryId: created.id,
                fileCount: result.uploaded,
              });
              imported += 1;
            }
          } finally {
            await extraction.cleanup();
          }
        }
      } catch (error) {
        if (error instanceof RateLimitExhaustedError) {
          throw error;
        }

        await recordResult({
          githubId: item.id,
          fullName: item.fullName,
          ownerLogin: item.ownerLogin,
          repoName: item.name,
          license: null,
          status: MirrorStatus.FAILED,
          reason: error instanceof Error ? error.message.slice(0, 300) : "import failed",
        }).catch(() => undefined);
        failed += 1;
      }

      cursor = Math.max(cursor, item.id);
    }

    await advanceCursor(cursor);
    await markRun(null);

    return {
      status: sleepUntil === null ? "processed" : "rate_limited",
      processed: detailCalls,
      imported,
      skipped,
      failed,
      cursor,
      sleepUntil,
    };
  } catch (error) {
    await advanceCursor(cursor).catch(() => undefined);

    if (error instanceof RateLimitExhaustedError) {
      await markRun("rate limit exhausted").catch(() => undefined);
      return { status: "rate_limited", processed: detailCalls, imported, skipped, failed, cursor, sleepUntil: error.resetAt };
    }

    await markRun(error instanceof Error ? error.message.slice(0, 300) : "tick failed").catch(() => undefined);
    return { status: "error", processed: detailCalls, imported, skipped, failed, cursor, sleepUntil: null };
  }
}
