import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type RequireAdminResult =
  | { ok: true; supabase: SupabaseServerClient; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Shared by requireAdmin() (API routes) and the /admin page layout (redirect
 * instead of a JSON response) — both need "who is this and are they admin".
 */
export async function getCurrentUserProfile(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

/**
 * Shared guard for admin-only API routes (per api-spec.md: RLS is the
 * authorization boundary, this is the "double-check di handler" it asks for).
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUserProfile(supabase);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { message: "Belum login", code: "UNAUTHENTICATED" } },
        { status: 401 },
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { message: "Hanya admin yang boleh mengakses", code: "FORBIDDEN" } },
        { status: 403 },
      ),
    };
  }

  return { ok: true, supabase, userId: user.id };
}
