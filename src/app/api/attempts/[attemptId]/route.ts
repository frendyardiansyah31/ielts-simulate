import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;

  const { data: attempt, error: attemptError } = await auth.supabase
    .from("user_attempts")
    .select("id, test_id, status, started_at, submitted_at, raw_score, band_score_estimate")
    .eq("id", attemptId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (attemptError) {
    return NextResponse.json(
      { error: { message: attemptError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  if (!attempt) {
    return NextResponse.json(
      { error: { message: "Attempt tidak ditemukan", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  const { data: questions, error: questionsError } = await auth.supabase
    .from("reading_questions")
    .select("id, question_number, type, question_data, explanation")
    .eq("test_id", attempt.test_id)
    .order("question_number", { ascending: true });

  if (questionsError) {
    return NextResponse.json(
      { error: { message: questionsError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const { data: answers, error: answersError } = await auth.supabase
    .from("user_answers")
    .select("question_id, user_answer, is_correct")
    .eq("attempt_id", attemptId);

  if (answersError) {
    return NextResponse.json(
      { error: { message: answersError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a]));

  const questionsWithAnswers = questions.map((question) => {
    const answer = answerByQuestionId.get(question.id);
    return {
      ...question,
      user_answer: answer?.user_answer ?? null,
      is_correct: answer?.is_correct ?? null,
    };
  });

  return NextResponse.json({
    data: { ...attempt, questions: questionsWithAnswers },
  });
}
