import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";
import { gradeAnswer, rawScoreToBand } from "@/lib/scoring";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;

  const { data: attempt, error: attemptError } = await auth.supabase
    .from("user_attempts")
    .select("id, status, test_id")
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
      { error: { message: "Attempt not found", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json(
      {
        error: {
          message: "Attempt was already submitted",
          code: "ATTEMPT_ALREADY_SUBMITTED",
        },
      },
      { status: 400 },
    );
  }

  const { data: questions, error: questionsError } = await auth.supabase
    .from("reading_questions")
    .select("id, type, question_data")
    .eq("test_id", attempt.test_id);

  if (questionsError) {
    return NextResponse.json(
      { error: { message: questionsError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const { data: answers, error: answersError } = await auth.supabase
    .from("user_answers")
    .select("question_id, user_answer")
    .eq("attempt_id", attemptId);

  if (answersError) {
    return NextResponse.json(
      { error: { message: answersError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const questionsById = new Map(questions.map((q) => [q.id, q]));

  const gradedAnswers = answers.map((answer) => {
    const question = questionsById.get(answer.question_id);
    const isCorrect = question
      ? gradeAnswer(question.type, question.question_data, answer.user_answer)
      : false;

    return {
      attempt_id: attemptId,
      question_id: answer.question_id,
      user_answer: answer.user_answer,
      is_correct: isCorrect,
    };
  });

  if (gradedAnswers.length > 0) {
    const { error: gradeError } = await auth.supabase
      .from("user_answers")
      .upsert(gradedAnswers, { onConflict: "attempt_id,question_id" });

    if (gradeError) {
      return NextResponse.json(
        { error: { message: gradeError.message, code: "INTERNAL_ERROR" } },
        { status: 500 },
      );
    }
  }

  const rawScore = gradedAnswers.filter((a) => a.is_correct).length;
  const totalQuestions = questions.length;
  const bandScoreEstimate = rawScoreToBand(rawScore);

  const { error: updateAttemptError } = await auth.supabase
    .from("user_attempts")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      raw_score: rawScore,
      band_score_estimate: bandScoreEstimate,
    })
    .eq("id", attemptId);

  if (updateAttemptError) {
    return NextResponse.json(
      { error: { message: updateAttemptError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      raw_score: rawScore,
      band_score_estimate: bandScoreEstimate,
      total_questions: totalQuestions,
    },
  });
}
