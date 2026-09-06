import { z } from "zod";

/**
 * One schema file per question type (CLAUDE.md SRP note). Row shape matches
 * api-spec.md's documented convention: one blank = one reading_questions row,
 * so `blanks` always has exactly one element here — the group-create route
 * (summary-completion-group-validation.ts) is what accepts the full set of
 * blanks from the admin form and fans them out into rows like this.
 */
export const summaryCompletionBlankSchema = z.object({
  number: z.number().int().positive(),
  answer: z.string().min(1, "Correct answer is required"),
  word_limit: z.string().optional(),
});

export const summaryCompletionDataSchema = z.object({
  instructions: z.string().optional(),
  template: z.string().min(1, "Template is required"),
  blanks: z.array(summaryCompletionBlankSchema).length(1),
});

export const createSummaryCompletionQuestionSchema = z.object({
  question_number: z.number().int().positive(),
  type: z.literal("summary_completion"),
  question_data: summaryCompletionDataSchema,
  explanation: z.string().optional(),
});

export const updateSummaryCompletionQuestionSchema = z.object({
  question_data: summaryCompletionDataSchema.optional(),
  explanation: z.string().optional(),
});

export const summaryCompletionAnswerSchema = z.object({
  text: z.string(),
});
