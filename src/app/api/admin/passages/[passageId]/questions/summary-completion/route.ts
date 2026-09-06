import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createSummaryCompletionGroupSchema } from "@/validations/summary-completion-group-validation";
import { parseBlankTemplate } from "@/lib/questions/parse-blank-template";

type RouteParams = { params: Promise<{ passageId: string }> };

/**
 * One admin action ("save this blank group") fans out into N reading_questions
 * rows (one per blank) — the only question type where a single create call
 * produces more than one row, hence its own dedicated endpoint instead of
 * reusing POST .../questions (see plan: keeps that endpoint's one-call-one-row
 * contract, and multiple_choice's code path, untouched).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { passageId } = await params;
  const body = await request.json();
  const validatedFields = createSummaryCompletionGroupSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: flattenError(validatedFields.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { starting_question_number, instructions, template, blanks, explanation } =
    validatedFields.data;

  const blankNumbersInTemplate = parseBlankTemplate(template);
  if (blankNumbersInTemplate.length !== blanks.length) {
    return NextResponse.json(
      {
        error: {
          message: `The number of blanks in the template (${blankNumbersInTemplate.length}) does not match the number of answers submitted (${blanks.length})`,
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 },
    );
  }

  // Renumber the template's ___N___ tokens to 1..N in reading order, so the
  // stored template always lines up with blanks[].number regardless of what
  // the admin typed (e.g. a hand-written "___24___ ... ___30___" range).
  let tokenSeq = 0;
  const normalizedTemplate = template.replace(/___\d+___/g, () => `___${++tokenSeq}___`);

  const rows = blanks.map((blank, index) => ({
    passage_id: passageId,
    question_number: starting_question_number + index,
    type: "summary_completion" as const,
    question_data: {
      instructions,
      template: normalizedTemplate,
      blanks: [{ number: index + 1, answer: blank.answer, word_limit: blank.word_limit }],
    },
    explanation: explanation ?? null,
  }));

  const { data, error } = await auth.supabase
    .from("reading_questions")
    .insert(rows)
    .select();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: {
            message: `One of the question numbers in the range ${starting_question_number}-${
              starting_question_number + blanks.length - 1
            } is already used in this test`,
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 },
      );
    }

    if (error.code === "P0001") {
      return NextResponse.json(
        { error: { message: "Passage not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
