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
          message: "Validasi gagal",
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
      { error: { message: "Attempt tidak ditemukan", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json(
      {
        error: {
          message: "Attempt sudah disubmit, tidak bisa mengubah jawaban",
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
      { error: { message: "Soal tidak ditemukan di test ini", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  const answerSchema = answerSchemaByType[question.type as SupportedAnswerType];

  if (!answerSchema) {
    return NextResponse.json(
      {
        error: {
          message: `Tipe soal '${question.type}' belum didukung`,
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
          message: "Validasi jawaban gagal",
          code: "VALIDATION_ERROR",
          details: flattenError(validatedAnswer.error).fieldErrors,
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
