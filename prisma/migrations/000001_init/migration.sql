CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "RepositoryVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

CREATE TYPE "RepositoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

CREATE TYPE "FileKind" AS ENUM ('FILE', 'DIRECTORY');

CREATE TYPE "CompressionType" AS ENUM ('NONE', 'ZSTD', 'IMAGE_WEBP', 'IMAGE_AVIF', 'PASSTHROUGH');

CREATE TYPE "StorageBackend" AS ENUM ('LOCAL', 'S3');

CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE "ActivityType" AS ENUM ('REPOSITORY_CREATED', 'FILE_UPLOADED', 'FILE_UPDATED', 'FILE_DELETED', 'ISSUE_OPENED', 'ISSUE_CLOSED', 'ISSUE_COMMENTED', 'STAR_ADDED', 'STAR_REMOVED', 'COMMIT_LITE_CREATED');

CREATE TYPE "ApiTokenStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "bio" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "RepositoryVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "RepositoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "readmePath" TEXT,
    "repoSize" BIGINT NOT NULL DEFAULT 0,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "starCount" INTEGER NOT NULL DEFAULT 0,
    "lastPushedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepositoryFile" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "blobId" TEXT,
    "path" TEXT NOT NULL,
    "parentPath" TEXT,
    "name" TEXT NOT NULL,
    "extension" TEXT,
    "kind" "FileKind" NOT NULL DEFAULT 'FILE',
    "size" BIGINT NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "hash" TEXT,
    "language" TEXT,
    "isBinary" BOOLEAN NOT NULL DEFAULT false,
    "isReadme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileBlob" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "originalSize" BIGINT NOT NULL,
    "compressedSize" BIGINT,
    "compressionType" "CompressionType" NOT NULL DEFAULT 'NONE',
    "storageBackend" "StorageBackend" NOT NULL DEFAULT 'LOCAL',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "refCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileBlob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IssueComment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Star" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Star_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitLite" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "checksum" TEXT,
    "filesAdded" INTEGER NOT NULL DEFAULT 0,
    "filesChanged" INTEGER NOT NULL DEFAULT 0,
    "filesDeleted" INTEGER NOT NULL DEFAULT 0,
    "bytesAdded" BIGINT NOT NULL DEFAULT 0,
    "bytesDeleted" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitLite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepoActivity" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "targetPath" TEXT,
    "issueNumber" INTEGER,
    "commitLiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepoActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StorageQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxStorageBytes" BIGINT NOT NULL DEFAULT 104857600,
    "usedBytes" BIGINT NOT NULL DEFAULT 0,
    "maxRepoBytes" BIGINT NOT NULL DEFAULT 524288000,
    "maxFileBytes" BIGINT NOT NULL DEFAULT 26214400,
    "maxRepos" INTEGER NOT NULL DEFAULT 20,
    "maxFilesPerRepo" INTEGER NOT NULL DEFAULT 2000,
    "maxIssuesPerRepo" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageQuota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApiTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE INDEX "Session_expires_idx" ON "Session"("expires");

CREATE INDEX "VerificationToken_expires_idx" ON "VerificationToken"("expires");

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE INDEX "Repository_ownerId_idx" ON "Repository"("ownerId");

CREATE INDEX "Repository_visibility_status_updatedAt_idx" ON "Repository"("visibility", "status", "updatedAt");

CREATE INDEX "Repository_createdAt_idx" ON "Repository"("createdAt");

CREATE INDEX "Repository_updatedAt_idx" ON "Repository"("updatedAt");

CREATE INDEX "Repository_starCount_idx" ON "Repository"("starCount");

CREATE UNIQUE INDEX "Repository_ownerId_name_key" ON "Repository"("ownerId", "name");

CREATE UNIQUE INDEX "Repository_ownerId_slug_key" ON "Repository"("ownerId", "slug");

CREATE INDEX "RepositoryFile_repositoryId_idx" ON "RepositoryFile"("repositoryId");

CREATE INDEX "RepositoryFile_repositoryId_parentPath_idx" ON "RepositoryFile"("repositoryId", "parentPath");

CREATE INDEX "RepositoryFile_repositoryId_kind_path_idx" ON "RepositoryFile"("repositoryId", "kind", "path");

CREATE INDEX "RepositoryFile_path_idx" ON "RepositoryFile"("path");

CREATE INDEX "RepositoryFile_hash_idx" ON "RepositoryFile"("hash");

CREATE INDEX "RepositoryFile_blobId_idx" ON "RepositoryFile"("blobId");

CREATE INDEX "RepositoryFile_createdAt_idx" ON "RepositoryFile"("createdAt");

CREATE UNIQUE INDEX "RepositoryFile_repositoryId_path_key" ON "RepositoryFile"("repositoryId", "path");

CREATE UNIQUE INDEX "FileBlob_checksum_key" ON "FileBlob"("checksum");

CREATE INDEX "FileBlob_checksum_idx" ON "FileBlob"("checksum");

CREATE INDEX "FileBlob_storageKey_idx" ON "FileBlob"("storageKey");

CREATE INDEX "FileBlob_createdAt_idx" ON "FileBlob"("createdAt");

CREATE INDEX "FileBlob_compressionType_idx" ON "FileBlob"("compressionType");

CREATE INDEX "Issue_repositoryId_idx" ON "Issue"("repositoryId");

CREATE INDEX "Issue_repositoryId_status_updatedAt_idx" ON "Issue"("repositoryId", "status", "updatedAt");

CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");

CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

CREATE UNIQUE INDEX "Issue_repositoryId_number_key" ON "Issue"("repositoryId", "number");

CREATE INDEX "IssueComment_issueId_idx" ON "IssueComment"("issueId");

CREATE INDEX "IssueComment_authorId_idx" ON "IssueComment"("authorId");

CREATE INDEX "IssueComment_createdAt_idx" ON "IssueComment"("createdAt");

CREATE INDEX "Star_userId_idx" ON "Star"("userId");

CREATE INDEX "Star_repositoryId_idx" ON "Star"("repositoryId");

CREATE INDEX "Star_createdAt_idx" ON "Star"("createdAt");

CREATE UNIQUE INDEX "Star_userId_repositoryId_key" ON "Star"("userId", "repositoryId");

CREATE INDEX "CommitLite_repositoryId_idx" ON "CommitLite"("repositoryId");

CREATE INDEX "CommitLite_authorId_idx" ON "CommitLite"("authorId");

CREATE INDEX "CommitLite_checksum_idx" ON "CommitLite"("checksum");

CREATE INDEX "CommitLite_createdAt_idx" ON "CommitLite"("createdAt");

CREATE INDEX "RepoActivity_repositoryId_idx" ON "RepoActivity"("repositoryId");

CREATE INDEX "RepoActivity_repositoryId_createdAt_idx" ON "RepoActivity"("repositoryId", "createdAt");

CREATE INDEX "RepoActivity_actorId_idx" ON "RepoActivity"("actorId");

CREATE INDEX "RepoActivity_type_idx" ON "RepoActivity"("type");

CREATE INDEX "RepoActivity_createdAt_idx" ON "RepoActivity"("createdAt");

CREATE UNIQUE INDEX "StorageQuota_userId_key" ON "StorageQuota"("userId");

CREATE INDEX "StorageQuota_userId_idx" ON "StorageQuota"("userId");

CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");

CREATE INDEX "ApiToken_prefix_idx" ON "ApiToken"("prefix");

CREATE INDEX "ApiToken_status_idx" ON "ApiToken"("status");

CREATE INDEX "ApiToken_createdAt_idx" ON "ApiToken"("createdAt");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Repository" ADD CONSTRAINT "Repository_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepositoryFile" ADD CONSTRAINT "RepositoryFile_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepositoryFile" ADD CONSTRAINT "RepositoryFile_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "FileBlob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Issue" ADD CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Star" ADD CONSTRAINT "Star_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Star" ADD CONSTRAINT "Star_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitLite" ADD CONSTRAINT "CommitLite_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitLite" ADD CONSTRAINT "CommitLite_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepoActivity" ADD CONSTRAINT "RepoActivity_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepoActivity" ADD CONSTRAINT "RepoActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StorageQuota" ADD CONSTRAINT "StorageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
