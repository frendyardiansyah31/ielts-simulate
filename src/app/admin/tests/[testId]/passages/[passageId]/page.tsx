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

  // question_number is unique per TEST (schema.sql: unique (test_id, question_number)),
  // not per passage — so the "next number" for a new question must continue from the
  // whole test's max, otherwise adding questions to an empty passage restarts at 1 and
  // collides with earlier passages.
  const { data: testQuestions, error: testQuestionsError } = await supabase
    .from("reading_questions")
    .select("question_number")
    .eq("test_id", testId);

  if (testQuestionsError) throw new Error(testQuestionsError.message);

  const nextQuestionNumber =
    testQuestions && testQuestions.length > 0
      ? Math.max(...testQuestions.map((q) => q.question_number)) + 1
      : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/admin/tests/${testId}`}
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to Test
        </Link>
        <h1 className="text-xl font-semibold">
          Passage {passage.passage_number}: {passage.title}
        </h1>
        <p className="text-sm text-muted-foreground">{passage.word_count} words</p>
      </div>

      <QuestionManager
        passageId={passageId}
        questions={questions}
        nextQuestionNumber={nextQuestionNumber}
      />
    </div>
  );
}
