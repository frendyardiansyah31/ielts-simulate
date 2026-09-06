import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createQuestionSchema } from "@/validations/question-validation";

type RouteParams = { params: Promise<{ passageId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { passageId } = await params;

  const { data, error } = await auth.supabase
    .from("reading_questions")
    .select("*")
    .eq("passage_id", passageId)
    .order("question_number", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { passageId } = await params;
  const body = await request.json();
  const validatedFields = createQuestionSchema.safeParse(body);

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

  const { question_number, type, question_data, explanation } =
    validatedFields.data;

  const { data, error } = await auth.supabase
    .from("reading_questions")
    .insert({
      passage_id: passageId,
      question_number,
      type,
      question_data,
      explanation,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: {
            message: `Question number ${question_number} is already used in this test`,
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 },
      );
    }

    if (error.code === "P0001") {
      return NextResponse.json(
        { error: { message: "Passage not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
