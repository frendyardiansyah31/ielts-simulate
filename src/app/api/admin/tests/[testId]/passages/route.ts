import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createPassageSchema } from "@/validations/passage-validation";
import { computeWordCount } from "@/lib/tests/word-count";

type RouteParams = { params: Promise<{ testId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { testId } = await params;

  const { data, error } = await auth.supabase
    .from("reading_passages")
    .select("*, reading_questions(count)")
    .eq("test_id", testId)
    .order("passage_number", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const passages = data.map(({ reading_questions, ...passage }) => ({
    ...passage,
    question_count: reading_questions?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ data: passages });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { testId } = await params;
  const body = await request.json();
  const validatedFields = createPassageSchema.safeParse(body);

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

  const { passage_number, title, content } = validatedFields.data;

  const { data, error } = await auth.supabase
    .from("reading_passages")
    .insert({
      test_id: testId,
      passage_number,
      title,
      content,
      word_count: computeWordCount(content),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: {
            message: `Passage nomor ${passage_number} sudah ada di test ini`,
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
