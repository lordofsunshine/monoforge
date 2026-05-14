import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function formatBytes(value: bigint | number) {
  const bytes = typeof value === "bigint" ? Number(value) : value;
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

async function main() {
  const [repositories, blobs, variants] = await Promise.all([
    prisma.repository.aggregate({
      _count: { id: true },
      _sum: { repoSize: true },
    }),
    prisma.fileBlob.aggregate({
      _count: { id: true },
      _sum: { originalSize: true, compressedSize: true },
    }),
    prisma.fileVariant.aggregate({
      _count: { id: true },
      _sum: { byteSize: true },
    }),
  ]);

  const original = blobs._sum.originalSize || 0n;
  const stored = blobs._sum.compressedSize || 0n;
  const saved = original > stored ? original - stored : 0n;

  console.log({
    repositories: repositories._count.id,
    repoSize: formatBytes(repositories._sum.repoSize || 0n),
    blobs: blobs._count.id,
    original: formatBytes(original),
    stored: formatBytes(stored),
    saved: formatBytes(saved),
    variants: variants._count.id,
    variantsSize: formatBytes(variants._sum.byteSize || 0n),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
