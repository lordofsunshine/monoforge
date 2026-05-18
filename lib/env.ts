import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().default(""),
  STORAGE_PATH: z.string().default("./storage"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
  MAX_REPO_SIZE_MB: z.coerce.number().int().positive().default(200),
  MAX_USER_STORAGE_MB: z.coerce.number().int().positive().default(100),
  MAX_FILES_PER_REPO: z.coerce.number().int().positive().default(1000),
  MAX_CONCURRENT_UPLOADS: z.coerce.number().int().positive().default(2),
  MAX_ISSUE_BODY_LENGTH: z.coerce.number().int().positive().default(20_000),
  MAX_COMMENT_LENGTH: z.coerce.number().int().positive().default(10_000),
  MAX_SEARCH_RESULTS: z.coerce.number().int().positive().default(20),
  MAX_PREVIEW_FILE_SIZE_MB: z.coerce.number().int().positive().default(1),
  ZSTD_LEVEL: z.coerce.number().int().min(1).max(19).default(3),
  PROCESS_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  IMAGE_MAX_WIDTH: z.coerce.number().int().positive().default(1600),
  IMAGE_QUALITY: z.coerce.number().int().min(1).max(100).default(82),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
