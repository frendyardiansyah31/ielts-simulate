import type { SupabaseServerClient } from "@/lib/supabase/require-admin";

/**
 * Shared by GET /api/admin/tests and the /admin test-list page — both need
 * the same test rows reshaped with passage/question counts.
 */
export async function listTestsForAdmin(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("reading_tests")
    .select("*, reading_passages(count), reading_questions(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(({ reading_passages, reading_questions, ...test }) => ({
    ...test,
    passage_count: reading_passages?.[0]?.count ?? 0,
    question_count: reading_questions?.[0]?.count ?? 0,
  }));
}

export type AdminTestListItem = Awaited<ReturnType<typeof listTestsForAdmin>>[number];
