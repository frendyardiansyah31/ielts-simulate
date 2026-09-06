import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { updateTestSchema } from "@/validations/test-validation";
import { validatePublishReady } from "@/lib/tests/validate-publish";

type RouteParams = { params: Promise<{ testId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { testId } = await params;
  const body = await request.json();
  const validatedFields = updateTestSchema.safeParse(body);

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

  if (validatedFields.data.status === "published") {
    const publishError = await validatePublishReady(auth.supabase, testId);
    if (publishError) {
      return NextResponse.json(
        { error: { message: publishError, code: "PUBLISH_BLOCKED" } },
        { status: 400 },
      );
    }
  }

  const { data, error } = await auth.supabase
    .from("reading_tests")
    .update(validatedFields.data)
    .eq("id", testId)
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
      { error: { message: "Test not found", code: "NOT_FOUND" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { testId } = await params;

  const { error } = await auth.supabase
    .from("reading_tests")
    .delete()
    .eq("id", testId);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
