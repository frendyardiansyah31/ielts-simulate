import { z } from "zod";

/**
 * One schema file per question type (CLAUDE.md SRP note). True/False/Not Given
 * is a single row per question (no fan-out), stored per api-spec.md as
 * `question_data: { statement, correct_answer }` with the answer being one of a
 * fixed set. UI shows "NOT GIVEN"; the stored value is "NOT_GIVEN".
 */
export const TFNG_ANSWERS = ["TRUE", "FALSE", "NOT_GIVEN"] as const;

// Single source of truth for the radio options: `value` is stored, `label` is shown.
export const TFNG_CHOICES = [
  { value: "TRUE", label: "TRUE" },
  { value: "FALSE", label: "FALSE" },
  { value: "NOT_GIVEN", label: "NOT GIVEN" },
] as const;

export const tfngLabel = (value: string): string =>
  value === "NOT_GIVEN" ? "NOT GIVEN" : value;

export const trueFalseNotGivenDataSchema = z.object({
  statement: z.string().min(1, "Statement is required"),
  correct_answer: z.enum(TFNG_ANSWERS),
});

export const createTrueFalseNotGivenQuestionSchema = z.object({
  question_number: z.number().int().positive(),
  type: z.literal("true_false_notgiven"),
  question_data: trueFalseNotGivenDataSchema,
  explanation: z.string().optional(),
});

export const updateTrueFalseNotGivenQuestionSchema = z.object({
  question_data: trueFalseNotGivenDataSchema.optional(),
  explanation: z.string().optional(),
});

export const trueFalseNotGivenAnswerSchema = z.object({
  answer: z.enum(TFNG_ANSWERS),
});
