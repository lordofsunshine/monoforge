CREATE INDEX "Repository_name_idx" ON "Repository"("name");
CREATE INDEX "Repository_slug_idx" ON "Repository"("slug");
CREATE INDEX "RepositoryFile_repositoryId_name_idx" ON "RepositoryFile"("repositoryId", "name");
CREATE INDEX "Issue_repositoryId_title_idx" ON "Issue"("repositoryId", "title");
