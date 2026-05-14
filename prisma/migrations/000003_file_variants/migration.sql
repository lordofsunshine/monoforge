CREATE TYPE "FileVariantKind" AS ENUM ('IMAGE_PREVIEW', 'IMAGE_THUMBNAIL');

CREATE TABLE "FileVariant" (
    "id" TEXT NOT NULL,
    "blobId" TEXT NOT NULL,
    "kind" "FileVariantKind" NOT NULL,
    "storageBackend" "StorageBackend" NOT NULL DEFAULT 'LOCAL',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FileVariant_blobId_kind_key" ON "FileVariant"("blobId", "kind");
CREATE INDEX "FileVariant_blobId_idx" ON "FileVariant"("blobId");
CREATE INDEX "FileVariant_kind_idx" ON "FileVariant"("kind");

ALTER TABLE "FileVariant" ADD CONSTRAINT "FileVariant_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "FileBlob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
