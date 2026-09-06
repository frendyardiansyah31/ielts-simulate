import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { DarkModeToggle } from "@/components/common/darkmode-toggle";
import { LogoutForm } from "@/components/common/logout-form";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/require-admin";

export default async function Home() {
  const supabase = await createClient();
  const { profile } = await getCurrentUserProfile(supabase);
  const isAdmin = profile?.role === "admin";

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isAdmin && (
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Admin
          </Link>
        )}
        <DarkModeToggle />
        <LogoutForm />
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2 font-medium">
          <div className="flex items-center justify-center rounded-md bg-teal-500 p-2">
            <BookOpenCheck className="size-4" />
          </div>
          IELTS Simulate
        </div>

        <p className="max-w-sm text-sm text-muted-foreground">
          Practice IELTS Reading with real exam timing and format
        </p>

        <Link href="/tests" className={buttonVariants({ size: "lg" })}>
          Start Tests
        </Link>
      </div>
    </div>
  );
}
