import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getStoragePath } from "../server/storage/paths";
import { rm } from "node:fs/promises";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const blobs = await prisma.fileBlob.findMany({
    where: {
      refCount: { lte: 0 },
      files: { none: {} },
    },
    include: {
      variants: true,
    },
    take: 500,
  });

  let deleted = 0;

  for (const blob of blobs) {
    await Promise.all([
      rm(getStoragePath(blob.storageKey), { force: true }),
      ...blob.variants.map((variant) => rm(getStoragePath(variant.storageKey), { force: true })),
    ]);
    await prisma.fileBlob.delete({ where: { id: blob.id } });
    deleted += 1;
  }

  console.log(`Deleted ${deleted} orphan blobs`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
