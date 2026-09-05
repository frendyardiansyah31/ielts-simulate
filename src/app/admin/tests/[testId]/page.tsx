import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPassagesForTest } from "@/lib/tests/get-passages-list";
import { TestEditor } from "./_components/test-editor";
import { PassageManager } from "./_components/passage-manager";

type PageProps = { params: Promise<{ testId: string }> };

export default async function TestDetailPage({ params }: PageProps) {
  const { testId } = await params;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("reading_tests")
    .select("id, title, description, time_limit_minutes, status")
    .eq("id", testId)
    .single();

  if (!test) notFound();

  const passages = await listPassagesForTest(supabase, testId);

  return (
    <div className="flex flex-col gap-6">
      <TestEditor test={test} />
      <PassageManager testId={testId} passages={passages} />
    </div>
  );
}
