import type { SupabaseServerClient } from "@/lib/supabase/require-admin";

/**
 * Shared by GET /api/admin/tests/:testId/passages and the test-detail page.
 */
export async function listPassagesForTest(
  supabase: SupabaseServerClient,
  testId: string,
) {
  const { data, error } = await supabase
    .from("reading_passages")
    .select("*, reading_questions(count)")
    .eq("test_id", testId)
    .order("passage_number", { ascending: true });

  if (error) throw error;

  return data.map(({ reading_questions, ...passage }) => ({
    ...passage,
    question_count: reading_questions?.[0]?.count ?? 0,
  }));
}

export type AdminPassageListItem = Awaited<ReturnType<typeof listPassagesForTest>>[number];
