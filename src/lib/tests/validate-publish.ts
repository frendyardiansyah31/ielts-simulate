import { SupabaseServerClient } from "@/lib/supabase/require-admin";

/**
 * App-layer publish validation (UX-friendly, specific messages).
 * The DB trigger `validate_test_publish` (see schema.sql / supabase/migrations)
 * is the real enforcement boundary — this just gives a clear PUBLISH_BLOCKED
 * message before hitting it.
 */
export async function validatePublishReady(
  supabase: SupabaseServerClient,
  testId: string,
): Promise<string | null> {
  const { data: passages, error } = await supabase
    .from("reading_passages")
    .select("id, passage_number")
    .eq("test_id", testId)
    .order("passage_number", { ascending: true });

  if (error) {
    return "Gagal memeriksa passage untuk test ini";
  }

  if (!passages || passages.length !== 3) {
    return `Test harus punya tepat 3 passage sebelum dipublish (sekarang: ${passages?.length ?? 0})`;
  }

  for (const passage of passages) {
    const { count, error: countError } = await supabase
      .from("reading_questions")
      .select("id", { count: "exact", head: true })
      .eq("passage_id", passage.id);

    if (countError) {
      return "Gagal memeriksa soal untuk passage ini";
    }

    if (!count) {
      return `Passage ${passage.passage_number} belum ada soal`;
    }
  }

  return null;
}
