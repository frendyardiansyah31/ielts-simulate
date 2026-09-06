import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import {
  answerSchemaByType,
  saveAnswerSchema,
  type SupportedAnswerType,
} from "@/validations/answer-validation";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;
  const body = await request.json();
  const validatedFields = saveAnswerSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: flattenError(validatedFields.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { question_id, user_answer } = validatedFields.data;

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
          message: "Attempt already submitted, answers can no longer be changed",
          code: "ATTEMPT_ALREADY_SUBMITTED",
        },
      },
      { status: 400 },
    );
  }

  const { data: question, error: questionError } = await auth.supabase
    .from("reading_questions")
    .select("id, type")
    .eq("id", question_id)
    .eq("test_id", attempt.test_id)
    .maybeSingle();

  if (questionError) {
    return NextResponse.json(
      { error: { message: questionError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  if (!question) {
    return NextResponse.json(
      { error: { message: "Question not found in this test", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  const answerSchema = answerSchemaByType[question.type as SupportedAnswerType];

  if (!answerSchema) {
    return NextResponse.json(
      {
        error: {
          message: `Question type '${question.type}' is not yet supported`,
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 },
    );
  }

  const validatedAnswer = answerSchema.safeParse(user_answer);

  if (!validatedAnswer.success) {
    return NextResponse.json(
      {
        error: {
          message: "Answer validation failed",
          code: "VALIDATION_ERROR",
          // Cast needed: answerSchema is a union across heterogeneous
          // per-type schemas (answer-validation.ts) — see same note in
          // src/app/api/admin/questions/[questionId]/route.ts.
          details: flattenError(validatedAnswer.error as never).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { error } = await auth.supabase.from("user_answers").upsert(
    {
      attempt_id: attemptId,
      question_id,
      user_answer: validatedAnswer.data,
    },
    { onConflict: "attempt_id,question_id" },
  );

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { saved: true } });
}
