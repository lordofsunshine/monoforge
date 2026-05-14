CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "IssueBoardStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

ALTER TABLE "Issue" ADD COLUMN "digest" TEXT;
ALTER TABLE "Issue" ADD COLUMN "priority" "IssuePriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Issue" ADD COLUMN "boardStatus" "IssueBoardStatus" NOT NULL DEFAULT 'TODO';
ALTER TABLE "Issue" ADD COLUMN "sourcePath" TEXT;
ALTER TABLE "Issue" ADD COLUMN "sourceLine" INTEGER;

CREATE TABLE "IssueLabel" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "marker" TEXT NOT NULL,
    "pattern" TEXT NOT NULL DEFAULT 'solid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueLabel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IssueLabelLink" (
    "issueId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "IssueLabelLink_pkey" PRIMARY KEY ("issueId","labelId")
);

CREATE TABLE "IssueMaintainerNote" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueMaintainerNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Issue_repositoryId_boardStatus_idx" ON "Issue"("repositoryId", "boardStatus");
CREATE INDEX "Issue_title_idx" ON "Issue"("title");
CREATE INDEX "IssueLabel_repositoryId_idx" ON "IssueLabel"("repositoryId");
CREATE INDEX "IssueLabel_slug_idx" ON "IssueLabel"("slug");
CREATE UNIQUE INDEX "IssueLabel_repositoryId_slug_key" ON "IssueLabel"("repositoryId", "slug");
CREATE INDEX "IssueLabelLink_labelId_idx" ON "IssueLabelLink"("labelId");
CREATE UNIQUE INDEX "IssueMaintainerNote_issueId_key" ON "IssueMaintainerNote"("issueId");
CREATE INDEX "IssueMaintainerNote_authorId_idx" ON "IssueMaintainerNote"("authorId");

ALTER TABLE "IssueLabel" ADD CONSTRAINT "IssueLabel_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssueLabelLink" ADD CONSTRAINT "IssueLabelLink_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssueLabelLink" ADD CONSTRAINT "IssueLabelLink_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "IssueLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssueMaintainerNote" ADD CONSTRAINT "IssueMaintainerNote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssueMaintainerNote" ADD CONSTRAINT "IssueMaintainerNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
