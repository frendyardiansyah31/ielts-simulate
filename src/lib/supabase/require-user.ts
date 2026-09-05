import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseServerClient } from "@/lib/supabase/require-admin";

type RequireUserResult =
  | { ok: true; supabase: SupabaseServerClient; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Shared guard for logged-in-only API routes (user-facing endpoints —
 * no role check, unlike requireAdmin).
 */
export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { message: "Belum login", code: "UNAUTHENTICATED" } },
        { status: 401 },
      ),
    };
  }

  return { ok: true, supabase, userId: user.id };
}
