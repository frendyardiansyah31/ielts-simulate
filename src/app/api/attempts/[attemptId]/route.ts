import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";
import { getAttemptDetailForUser } from "@/lib/attempts/get-attempt-detail";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;

  try {
    const attempt = await getAttemptDetailForUser(auth.supabase, attemptId, auth.userId);

    if (!attempt) {
      return NextResponse.json(
        { error: { message: "Attempt not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: attempt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
