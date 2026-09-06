import { z } from "zod";
import {
  createMultipleChoiceQuestionSchema,
  updateMultipleChoiceQuestionSchema,
} from "@/validations/multiple-choice-question-validation";
import {
  createSummaryCompletionQuestionSchema,
  updateSummaryCompletionQuestionSchema,
} from "@/validations/summary-completion-question-validation";

/**
 * Composition point for per-type question schemas (OCP per CLAUDE.md):
 * adding question type #2 means adding its file under src/validations/ and
 * one entry here — not touching the logic of existing types.
 */
export const createQuestionSchema = z.discriminatedUnion("type", [
  createMultipleChoiceQuestionSchema,
  createSummaryCompletionQuestionSchema,
]);

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchemaByType = {
  multiple_choice: updateMultipleChoiceQuestionSchema,
  summary_completion: updateSummaryCompletionQuestionSchema,
} as const;

export type SupportedQuestionType = keyof typeof updateQuestionSchemaByType;
