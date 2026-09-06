import { z } from "zod";

/**
 * One schema file per question type (CLAUDE.md SRP note) — adding type #2
 * means adding a new file like this one, not editing this file's logic.
 */
export const multipleChoiceDataSchema = z
  .object({
    question_text: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1)).min(3).max(5),
    correct_index: z.number().int().min(0),
  })
  .refine((data) => data.correct_index < data.options.length, {
    message: "correct_index must match one of the option indexes",
    path: ["correct_index"],
  });

export const createMultipleChoiceQuestionSchema = z.object({
  question_number: z.number().int().positive(),
  type: z.literal("multiple_choice"),
  question_data: multipleChoiceDataSchema,
  explanation: z.string().optional(),
});

export const updateMultipleChoiceQuestionSchema = z.object({
  question_data: multipleChoiceDataSchema.optional(),
  explanation: z.string().optional(),
});

export const multipleChoiceAnswerSchema = z.object({
  selected_index: z.number().int().min(0),
});

