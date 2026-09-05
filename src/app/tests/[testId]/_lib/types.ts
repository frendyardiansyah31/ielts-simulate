export type PublicQuestion = {
  id: string;
  question_number: number;
  type: string;
  question_data: { question_text: string; options: string[] };
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
  user_answer: { selected_index?: number } | null;
};

export type AttemptDetail = AttemptSummary & { questions: AttemptDetailQuestion[] };
