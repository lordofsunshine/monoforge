CREATE TABLE "RepoView" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "viewerHash" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "month" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RepoView_repositoryId_viewerHash_month_key" ON "RepoView"("repositoryId", "viewerHash", "month");
CREATE INDEX "RepoView_repositoryId_idx" ON "RepoView"("repositoryId");
CREATE INDEX "RepoView_repositoryId_month_idx" ON "RepoView"("repositoryId", "month");
CREATE INDEX "RepoView_viewerHash_idx" ON "RepoView"("viewerHash");
CREATE INDEX "RepoView_createdAt_idx" ON "RepoView"("createdAt");

ALTER TABLE "RepoView" ADD CONSTRAINT "RepoView_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
