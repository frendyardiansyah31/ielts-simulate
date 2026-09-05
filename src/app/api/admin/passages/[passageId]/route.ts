import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { updatePassageSchema } from "@/validations/passage-validation";
import { computeWordCount } from "@/lib/tests/word-count";

type RouteParams = { params: Promise<{ passageId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { passageId } = await params;
  const body = await request.json();
  const validatedFields = updatePassageSchema.safeParse(body);

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

  const { content, ...rest } = validatedFields.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (typeof content === "string") {
    updateData.content = content;
    updateData.word_count = computeWordCount(content);
  }

  const { data, error } = await auth.supabase
    .from("reading_passages")
    .update(updateData)
    .eq("id", passageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: { message: "Passage tidak ditemukan", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { passageId } = await params;

  const { error } = await auth.supabase
    .from("reading_passages")
    .delete()
    .eq("id", passageId);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
