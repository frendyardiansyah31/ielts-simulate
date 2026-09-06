import { z } from "zod";

/**
 * Body shape for POST .../questions/summary-completion — one admin authoring
 * action ("save this blank group") that fans out into N reading_questions
 * rows server-side (one per blank), unlike every other question type's
 * create endpoint which is one call = one row.
 */
export const groupBlankInputSchema = z.object({
  answer: z.string().min(1, "Correct answer is required"),
  word_limit: z.string().optional(),
});

export const createSummaryCompletionGroupSchema = z.object({
  starting_question_number: z.number().int().positive(),
  instructions: z.string().optional(),
  template: z.string().min(1, "Template is required"),
  blanks: z.array(groupBlankInputSchema).min(1, "At least 1 blank is required"),
  explanation: z.string().optional(),
});

export type CreateSummaryCompletionGroupInput = z.infer<
  typeof createSummaryCompletionGroupSchema
>;
