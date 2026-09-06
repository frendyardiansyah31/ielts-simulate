export type McQuestionData = {
  question_text: string;
  options: string[];
};

export type GapBlankPublic = {
  number: number;
  word_limit?: string;
};

export type GapQuestionData = {
  instructions?: string;
  template: string;
  blanks: GapBlankPublic[];
};

export type TfngQuestionData = {
  statement: string;
};

export type PublicQuestion = {
  id: string;
  question_number: number;
  type: string;
  question_data: McQuestionData | GapQuestionData | TfngQuestionData;
};

export type PublicPassage = {
  id: string;
  passage_number: number;
  title: string;
  content: string;
  questions: PublicQuestion[];
};

export type TestDetail = {
  id: string;
  title: string;
  time_limit_minutes: number;
  passages: PublicPassage[];
};

// One saved answer, shape depends on the question type (mirrors what the
// autosave endpoint stores in user_answers.user_answer).
export type AnswerValue =
  | { selected_index: number }
  | { text: string }
  | { answer: string };

export type AttemptSummary = {
  id: string;
  test_id: string;
  status: "in_progress" | "submitted";
  started_at: string;
  submitted_at: string | null;
  raw_score: number | null;
  band_score_estimate: number | null;
};

export type AttemptDetailQuestion = {
  id: string;
  question_number: number;
  type: string;
  user_answer: { selected_index?: number; text?: string; answer?: string } | null;
};

export type AttemptDetail = AttemptSummary & { questions: AttemptDetailQuestion[] };
