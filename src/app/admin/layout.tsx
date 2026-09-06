import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUserProfile(supabase);

  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between border-b pb-4">
        <Link href="/admin" className="text-lg font-semibold">
          Admin — IELTS Reading Simulator
        </Link>
        <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Back to Home
        </Link>
      </header>
      {children}
    </div>
  );
}
