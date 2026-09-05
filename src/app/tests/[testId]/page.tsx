import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./exam.css";
import { ExamRunner } from "./_components/exam-runner";

// Design handoff (design_handoff_ielts_reading/) specifies Public Sans / Source
// Serif 4 for this screen — different from the app's global Inter — scoped only
// to this route via the wrapper below, not touching the root layout's fonts.
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

type PageProps = { params: Promise<{ testId: string }> };

export default async function TestExamPage({ params }: PageProps) {
  const { testId } = await params;

  return (
    <div className={`${publicSans.variable} ${sourceSerif.variable}`}>
      <ExamRunner testId={testId} />
    </div>
  );
}
