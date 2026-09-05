import { z } from "zod";

export const createPassageSchema = z.object({
  passage_number: z.number().int().min(1).max(3),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export type CreatePassageInput = z.infer<typeof createPassageSchema>;

export const updatePassageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export type UpdatePassageInput = z.infer<typeof updatePassageSchema>;
