import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublishedTestsForUser } from "@/lib/tests/get-published-tests";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function TestListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tests = await listPublishedTestsForUser(supabase, user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tests</h1>
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to Home
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card className="items-center p-8 text-center text-sm text-muted-foreground">
          No published tests yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map((test) => (
            <Card key={test.id} className="flex-row items-center justify-between gap-4 px-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{test.title}</p>
                <p className="text-sm text-muted-foreground">
                  {test.question_count} questions · {test.time_limit_minutes} min
                  {test.last_attempt && (
                    <>
                      {" "}
                      · Last: {test.last_attempt.raw_score}/{test.question_count} (Band{" "}
                      {test.last_attempt.band_score_estimate})
                    </>
                  )}
                </p>
              </div>
              <Link href={`/tests/${test.id}`} className={buttonVariants({ size: "sm" })}>
                {test.last_attempt ? "Retake" : "Start"}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
