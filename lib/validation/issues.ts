import { z } from "zod";

export const issueLabelSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9_-]+$/);

export const issueTitleSchema = z.string().trim().min(3, "Title must be at least 3 characters").max(160, "Title is too long");

export const issueBodySchema = z.string().trim().max(20_000, "Body is too long").optional().or(z.literal(""));

export const issuePrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const issueBoardStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const issueStatusSchema = z.enum(["OPEN", "CLOSED"]);

export const createIssueSchema = z.object({
  title: issueTitleSchema,
  body: issueBodySchema,
  priority: issuePrioritySchema.default("NORMAL"),
  boardStatus: issueBoardStatusSchema.default("TODO"),
  labels: z.array(issueLabelSlugSchema).max(8).default([]),
  sourcePath: z.string().trim().max(512).optional().or(z.literal("")),
  sourceLine: z.coerce.number().int().positive().max(1_000_000).optional(),
});

export const updateIssueSchema = z.object({
  title: issueTitleSchema,
  body: issueBodySchema,
  priority: issuePrioritySchema,
  boardStatus: issueBoardStatusSchema,
  labels: z.array(issueLabelSlugSchema).max(8).default([]),
});

export const issueStateSchema = z.object({
  status: issueStatusSchema,
});

export const issueCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(10_000, "Comment is too long"),
});

export const maintainerNoteSchema = z.object({
  body: z.string().trim().max(10_000, "Maintainer note is too long").optional().or(z.literal("")),
});

export const issueFiltersSchema = z.object({
  status: z.enum(["open", "closed", "all"]).default("open"),
  author: z.string().trim().toLowerCase().max(32).optional().or(z.literal("")),
  label: issueLabelSlugSchema.optional().or(z.literal("")),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export function createIssueDigest(title: string, body?: string | null) {
  const source = `${title}. ${body || ""}`.replace(/\s+/g, " ").trim();
  return source.length > 140 ? `${source.slice(0, 137)}...` : source;
}
