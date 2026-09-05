import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data: tests, error } = await auth.supabase
    .from("reading_tests")
    .select("id, title, time_limit_minutes, reading_questions(count)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  const testIds = tests.map((t) => t.id);

  const lastAttemptByTest = new Map<
    string,
    { raw_score: number | null; band_score_estimate: number | null; submitted_at: string | null }
  >();

  if (testIds.length > 0) {
    const { data: attempts, error: attemptsError } = await auth.supabase
      .from("user_attempts")
      .select("test_id, raw_score, band_score_estimate, submitted_at")
      .eq("user_id", auth.userId)
      .eq("status", "submitted")
      .in("test_id", testIds)
      .order("submitted_at", { ascending: false });

    if (attemptsError) {
      return NextResponse.json(
        { error: { message: attemptsError.message, code: "INTERNAL_ERROR" } },
        { status: 500 },
      );
    }

    for (const attempt of attempts) {
      if (!lastAttemptByTest.has(attempt.test_id)) {
        lastAttemptByTest.set(attempt.test_id, attempt);
      }
    }
  }

  const data = tests.map(({ reading_questions, ...test }) => ({
    ...test,
    question_count: reading_questions?.[0]?.count ?? 0,
    last_attempt: lastAttemptByTest.get(test.id) ?? null,
  }));

  return NextResponse.json({ data });
}
