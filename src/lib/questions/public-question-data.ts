/**
 * Strips answer-revealing fields from question_data before it reaches the
 * client during an exam (api-spec.md: GET /api/tests/:testId must not leak
 * correct_index/explanation etc). One case per question type — adding type
 * #2 means adding an entry here, not touching this function's logic.
 */
const stripByType: Record<string, (data: Record<string, unknown>) => unknown> = {
  multiple_choice: ({ correct_index: _correct_index, ...rest }) => rest,
};

export function toPublicQuestionData(
  type: string,
  questionData: unknown,
): unknown {
  const strip = stripByType[type];
  if (!strip || typeof questionData !== "object" || questionData === null) {
    return questionData;
  }
  return strip(questionData as Record<string, unknown>);
}
