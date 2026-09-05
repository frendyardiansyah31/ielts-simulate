import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAttemptDetailForUser } from "@/lib/attempts/get-attempt-detail";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { QuestionReview } from "./_components/question-review";

type PageProps = { params: Promise<{ attemptId: string }> };

function formatDuration(startedAt: string, submittedAt: string): string {
  const totalSeconds = Math.max(
    0,
    Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} menit ${seconds} detik`;
}

export default async function AttemptResultPage({ params }: PageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const attempt = await getAttemptDetailForUser(supabase, attemptId, user.id);

  if (!attempt) notFound();

  if (attempt.status !== "submitted") {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-medium">Test ini belum disubmit.</p>
        <Link href={`/tests/${attempt.test_id}`} className={buttonVariants()}>
          Lanjutkan Mengerjakan
        </Link>
      </div>
    );
  }

  const totalQuestions = attempt.questions.length;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{attempt.test_title}</h1>
          <p className="text-sm text-muted-foreground">
            Disubmit{" "}
            {new Date(attempt.submitted_at!).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · Waktu pengerjaan: {formatDuration(attempt.started_at, attempt.submitted_at!)}
          </p>
        </div>
        <Link href="/tests" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Kembali ke Daftar Test
        </Link>
      </div>

      <Card className="flex-row items-center gap-8 px-6 py-5">
        <div>
          <p className="text-sm text-muted-foreground">Skor</p>
          <p className="text-3xl font-semibold">
            {attempt.raw_score}/{totalQuestions}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estimasi Band Score</p>
          <p className="text-3xl font-semibold">{attempt.band_score_estimate}</p>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {attempt.questions.map((question) => (
          <QuestionReview
            key={question.id}
            questionNumber={question.question_number}
            questionData={question.question_data}
            userAnswer={question.user_answer}
            isCorrect={question.is_correct}
            explanation={question.explanation}
          />
        ))}
      </div>
    </div>
  );
}
