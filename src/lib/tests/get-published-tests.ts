import type { SupabaseServerClient } from "@/lib/supabase/require-admin";

/**
 * Shared by GET /api/tests and the /tests list page — both need published
 * tests joined with the current user's last submitted attempt per test.
 */
export async function listPublishedTestsForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: tests, error } = await supabase
    .from("reading_tests")
    .select("id, title, time_limit_minutes, reading_questions(count)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const testIds = tests.map((t) => t.id);

  const lastAttemptByTest = new Map<
    string,
    { raw_score: number | null; band_score_estimate: number | null; submitted_at: string | null }
  >();

  if (testIds.length > 0) {
    const { data: attempts, error: attemptsError } = await supabase
      .from("user_attempts")
      .select("test_id, raw_score, band_score_estimate, submitted_at")
      .eq("user_id", userId)
      .eq("status", "submitted")
      .in("test_id", testIds)
      .order("submitted_at", { ascending: false });

    if (attemptsError) throw attemptsError;

    for (const attempt of attempts) {
      if (!lastAttemptByTest.has(attempt.test_id)) {
        lastAttemptByTest.set(attempt.test_id, attempt);
      }
    }
  }

  return tests.map(({ reading_questions, ...test }) => ({
    ...test,
    question_count: reading_questions?.[0]?.count ?? 0,
    last_attempt: lastAttemptByTest.get(test.id) ?? null,
  }));
}

export type PublishedTestListItem = Awaited<
  ReturnType<typeof listPublishedTestsForUser>
>[number];
