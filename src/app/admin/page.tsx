import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listTestsForAdmin } from "@/lib/tests/get-tests-list";
import { buttonVariants } from "@/components/ui/button";
import { TestList } from "./_components/test-list";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const tests = await listTestsForAdmin(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Daftar Test</h1>
        <Link href="/admin/tests/new" className={buttonVariants()}>
          Buat Test Baru
        </Link>
      </div>
      <TestList tests={tests} />
    </div>
  );
}
