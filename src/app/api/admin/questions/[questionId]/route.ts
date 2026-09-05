import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import {
  updateQuestionSchemaByType,
  type SupportedQuestionType,
} from "@/validations/question-validation";

type RouteParams = { params: Promise<{ questionId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { questionId } = await params;

  const { data: existing, error: fetchError } = await auth.supabase
    .from("reading_questions")
    .select("type")
    .eq("id", questionId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: { message: "Soal tidak ditemukan", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  // Type is immutable after creation (api-spec.md) — the type stored on the
  // row picks which per-type schema validates this request, and the request
  // body itself has no say in it.
  const updateSchema =
    updateQuestionSchemaByType[existing.type as SupportedQuestionType];

  if (!updateSchema) {
    return NextResponse.json(
      {
        error: {
          message: `Tipe soal '${existing.type}' belum didukung untuk diedit`,
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 },
    );
  }

  const body = await request.json();
  const validatedFields = updateSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        error: {
          message: "Validasi gagal",
          code: "VALIDATION_ERROR",
          details: flattenError(validatedFields.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("reading_questions")
    .update(validatedFields.data)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { questionId } = await params;

  const { error } = await auth.supabase
    .from("reading_questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
