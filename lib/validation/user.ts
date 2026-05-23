import { z } from "zod";

export const roleSchema = z.enum(["admin", "editor", "viewer"]);

export const inviteUserSchema = z.object({
  email: z.string().trim().email().max(180),
  full_name: z.string().trim().min(2).max(120),
  role: roleSchema.default("viewer"),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120).optional(),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "At least 8 characters"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
