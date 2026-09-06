import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";
import { toPublicQuestionData } from "@/lib/questions/public-question-data";

type RouteParams = { params: Promise<{ testId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { testId } = await params;

  const { data: test, error } = await auth.supabase
    .from("reading_tests")
    .select(
      "id, title, time_limit_minutes, reading_passages(id, passage_number, title, content, reading_questions(id, question_number, type, question_data))",
    )
    .eq("id", testId)
    .eq("status", "published")
    .single();

  if (error || !test) {
    return NextResponse.json(
      { error: { message: "Test not found", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  const passages = [...test.reading_passages]
    .sort((a, b) => a.passage_number - b.passage_number)
    .map(({ reading_questions, ...passage }) => ({
      ...passage,
      questions: [...reading_questions]
        .sort((a, b) => a.question_number - b.question_number)
        .map((question) => ({
          id: question.id,
          question_number: question.question_number,
          type: question.type,
          question_data: toPublicQuestionData(question.type, question.question_data),
        })),
    }));

  return NextResponse.json({
    data: {
      id: test.id,
      title: test.title,
      time_limit_minutes: test.time_limit_minutes,
      passages,
    },
  });
}
