import { z } from "zod";
import { multipleChoiceAnswerSchema } from "@/validations/multiple-choice-question-validation";

/**
 * Basic shape check only — `user_answer`'s actual per-type shape is validated
 * separately once the question's `type` is known (see
 * src/app/api/attempts/[attemptId]/answers/route.ts), the same dispatch
 * pattern as question-validation.ts.
 */
export const saveAnswerSchema = z.object({
  question_id: z.string().uuid(),
  user_answer: z.unknown(),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

export const answerSchemaByType = {
  multiple_choice: multipleChoiceAnswerSchema,
} as const;

export type SupportedAnswerType = keyof typeof answerSchemaByType;
