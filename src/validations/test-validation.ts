import { z } from "zod";

export const createTestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  time_limit_minutes: z.number().int().positive().optional(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;

export const updateTestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  time_limit_minutes: z.number().int().positive().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export type UpdateTestInput = z.infer<typeof updateTestSchema>;
