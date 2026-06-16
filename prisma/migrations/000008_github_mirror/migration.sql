CREATE TYPE "MirrorStatus" AS ENUM ('IMPORTED', 'SKIPPED', 'FAILED');

ALTER TABLE "User" ADD COLUMN "mirroredFrom" TEXT;
ALTER TABLE "Repository" ADD COLUMN "mirrorSourceUrl" TEXT;

CREATE TABLE "MirrorSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "cursor" BIGINT NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MirrorSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MirroredRepository" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT NOT NULL,
    "fullName" TEXT NOT NULL,
    "ownerLogin" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "license" TEXT,
    "status" "MirrorStatus" NOT NULL,
    "reason" TEXT,
    "monoforgeUserId" TEXT,
    "monoforgeRepositoryId" TEXT,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "byteSize" BIGINT NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MirroredRepository_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MirroredRepository_githubId_key" ON "MirroredRepository"("githubId");
CREATE INDEX "MirroredRepository_status_idx" ON "MirroredRepository"("status");
CREATE INDEX "MirroredRepository_ownerLogin_idx" ON "MirroredRepository"("ownerLogin");
CREATE INDEX "MirroredRepository_createdAt_idx" ON "MirroredRepository"("createdAt");
