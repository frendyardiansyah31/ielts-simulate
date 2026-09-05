import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";
import { listPublishedTestsForUser } from "@/lib/tests/get-published-tests";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const data = await listPublishedTestsForUser(auth.supabase, auth.userId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
