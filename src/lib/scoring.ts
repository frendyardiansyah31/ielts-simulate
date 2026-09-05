/**
 * Server-side grading (api-spec.md "Submit" section). One comparison rule
 * per question type — adding type #2 means adding an entry to `gradersByType`,
 * not touching this file's dispatch logic.
 */
type Grader = (questionData: unknown, userAnswer: unknown) => boolean;

const gradersByType: Record<string, Grader> = {
  multiple_choice: (questionData, userAnswer) => {
    const q = questionData as { correct_index?: number };
    const a = userAnswer as { selected_index?: number } | null | undefined;
    return typeof a?.selected_index === "number" && a.selected_index === q.correct_index;
  },
};

export function gradeAnswer(
  type: string,
  questionData: unknown,
  userAnswer: unknown,
): boolean {
  const grade = gradersByType[type];
  if (!grade || userAnswer === undefined || userAnswer === null) return false;
  return grade(questionData, userAnswer);
}

/**
 * Approximate IELTS Academic Reading raw-score-to-band conversion table,
 * commonly published (e.g. by Cambridge/IDP prep materials). NOT the
 * official per-test-administration table, which can vary slightly test to
 * test — flagged as an open question in PRD §10 / TECH_DEBT.md. Swap this
 * table out once the official one is confirmed.
 */
const BAND_SCORE_TABLE: { min: number; band: number }[] = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
];

export function rawScoreToBand(rawScore: number): number {
  for (const { min, band } of BAND_SCORE_TABLE) {
    if (rawScore >= min) return band;
  }
  return rawScore > 0 ? 2.0 : 1.0;
}
