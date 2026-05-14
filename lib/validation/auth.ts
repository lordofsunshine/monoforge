import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, dash or underscore")
  .regex(/^[a-z0-9_]/, "Username cannot start with a dash")
  .regex(/[a-z0-9_]$/, "Username cannot end with a dash");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128, "Password is too long"),
});

export const profileSettingsSchema = z.object({
  username: usernameSchema,
  bio: z.string().trim().max(240, "Bio must be at most 240 characters").optional().or(z.literal("")),
  image: z.string().trim().url("Avatar must be a valid URL").max(500, "Avatar URL is too long").optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
