import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionManager } from "./_components/question-manager";

type PageProps = { params: Promise<{ testId: string; passageId: string }> };

export default async function PassageDetailPage({ params }: PageProps) {
  const { testId, passageId } = await params;
  const supabase = await createClient();

  const { data: passage } = await supabase
    .from("reading_passages")
    .select("id, passage_number, title, content, word_count")
    .eq("id", passageId)
    .single();

  if (!passage) notFound();

  const { data: questions, error } = await supabase
    .from("reading_questions")
    .select("id, question_number, type, question_data, explanation")
    .eq("passage_id", passageId)
    .order("question_number", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/admin/tests/${testId}`}
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Kembali ke Test
        </Link>
        <h1 className="text-xl font-semibold">
          Passage {passage.passage_number}: {passage.title}
        </h1>
        <p className="text-sm text-muted-foreground">{passage.word_count} kata</p>
      </div>

      <QuestionManager passageId={passageId} questions={questions} />
    </div>
  );
}
