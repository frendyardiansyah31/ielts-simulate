import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { createAttemptSchema } from "@/validations/attempt-validation";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const testId = request.nextUrl.searchParams.get("testId");

  let query = auth.supabase
    .from("user_attempts")
    .select("id, test_id, status, started_at, submitted_at, raw_score, band_score_estimate")
    .eq("user_id", auth.userId)
    .order("started_at", { ascending: false });

  if (testId) {
    query = query.eq("test_id", testId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const validatedFields = createAttemptSchema.safeParse(body);

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

  const { test_id } = validatedFields.data;

  const { data: test, error: testError } = await auth.supabase
    .from("reading_tests")
    .select("id")
    .eq("id", test_id)
    .eq("status", "published")
    .maybeSingle();

  if (testError) {
    return NextResponse.json(
      { error: { message: testError.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  if (!test) {
    return NextResponse.json(
      { error: { message: "Test tidak ditemukan", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  const { data, error } = await auth.supabase
    .from("user_attempts")
    .insert({ user_id: auth.userId, test_id })
    .select("id, started_at, status")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
