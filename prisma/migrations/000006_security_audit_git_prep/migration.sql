ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'REPOSITORY_RENAMED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'REPOSITORY_VISIBILITY_CHANGED';

CREATE TYPE "AuditAction" AS ENUM (
  'DELETE_REPOSITORY',
  'CHANGE_REPOSITORY_VISIBILITY',
  'RENAME_REPOSITORY',
  'UPLOAD_LARGE_FILE',
  'FAILED_LOGIN',
  'DELETE_FILE',
  'QUOTA_EXCEEDED'
);

ALTER TABLE "Repository" ADD COLUMN "gitEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Repository" ADD COLUMN "gitPath" TEXT;

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "AuditAction" NOT NULL,
  "repositoryId" TEXT,
  "target" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Repository_gitEnabled_idx" ON "Repository"("gitEnabled");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_repositoryId_idx" ON "AuditLog"("repositoryId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
