import type { SupabaseServerClient } from "@/lib/supabase/require-admin";

/**
 * Shared by GET /api/attempts/:attemptId and the /attempts/:attemptId result
 * page — ownership is enforced here via the user_id filter, same as the API.
 */
export async function getAttemptDetailForUser(
  supabase: SupabaseServerClient,
  attemptId: string,
  userId: string,
) {
  const { data: attempt, error: attemptError } = await supabase
    .from("user_attempts")
    .select("id, test_id, status, started_at, submitted_at, raw_score, band_score_estimate")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!attempt) return null;

  const { data: test, error: testError } = await supabase
    .from("reading_tests")
    .select("title")
    .eq("id", attempt.test_id)
    .single();

  if (testError) throw testError;

  const { data: questions, error: questionsError } = await supabase
    .from("reading_questions")
    .select("id, question_number, type, question_data, explanation")
    .eq("test_id", attempt.test_id)
    .order("question_number", { ascending: true });

  if (questionsError) throw questionsError;

  const { data: answers, error: answersError } = await supabase
    .from("user_answers")
    .select("question_id, user_answer, is_correct")
    .eq("attempt_id", attemptId);

  if (answersError) throw answersError;

  const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a]));

  const questionsWithAnswers = questions.map((question) => {
    const answer = answerByQuestionId.get(question.id);
    return {
      ...question,
      user_answer: answer?.user_answer ?? null,
      is_correct: answer?.is_correct ?? null,
    };
  });

  return {
    ...attempt,
    test_title: test.title,
    questions: questionsWithAnswers,
  };
}

export type AttemptDetailForUser = Awaited<ReturnType<typeof getAttemptDetailForUser>>;
