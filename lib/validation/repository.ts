import { z } from "zod";

export const repositoryNameSchema = z
  .string()
  .trim()
  .min(1, "Repository name is required")
  .max(80, "Repository name must be at most 80 characters")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dot, dash or underscore")
  .refine((value) => ![".", "..", ".git", "admin", "api", "settings", "new"].includes(value.toLowerCase()), "Repository name is reserved");

export const repositorySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9._-]+$/)
  .refine((value) => ![".", "..", ".git", "admin", "api", "settings", "new"].includes(value), "Repository slug is reserved");

export const createRepositorySchema = z.object({
  name: repositoryNameSchema,
  description: z.string().trim().max(240, "Description must be at most 240 characters").optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  initializeWithReadme: z.coerce.boolean().default(false),
});

export const updateRepositorySchema = z.object({
  name: repositoryNameSchema,
  description: z.string().trim().max(240, "Description must be at most 240 characters").optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export const uploadFileSchema = z.object({
  path: z.string().trim().min(1, "Path is required").max(512, "Path is too long"),
  message: z.string().trim().max(160, "Message is too long").optional().or(z.literal("")),
});

export const deleteFileSchema = z.object({
  path: z.string().trim().min(1, "Path is required").max(512, "Path is too long"),
  message: z.string().trim().max(160, "Message is too long").optional().or(z.literal("")),
});

export function slugifyRepositoryName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
