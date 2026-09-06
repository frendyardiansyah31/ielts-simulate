import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createPassageSchema } from "@/validations/passage-validation";
import { computeWordCount } from "@/lib/tests/word-count";
import { listPassagesForTest } from "@/lib/tests/get-passages-list";

type RouteParams = { params: Promise<{ testId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { testId } = await params;

  try {
    const passages = await listPassagesForTest(auth.supabase, testId);
    return NextResponse.json({ data: passages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
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
          message: "Validation failed",
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
            message: `Passage number ${passage_number} already exists in this test`,
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
