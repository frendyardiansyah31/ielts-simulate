import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createTestSchema } from "@/validations/test-validation";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("reading_tests")
    .select("*, reading_passages(count), reading_questions(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const tests = data.map(
    ({ reading_passages, reading_questions, ...test }) => ({
      ...test,
      passage_count: reading_passages?.[0]?.count ?? 0,
      question_count: reading_questions?.[0]?.count ?? 0,
    }),
  );

  return NextResponse.json({ data: tests });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const validatedFields = createTestSchema.safeParse(body);

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

  const { data, error } = await auth.supabase
    .from("reading_tests")
    .insert({ ...validatedFields.data, created_by: auth.userId })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
