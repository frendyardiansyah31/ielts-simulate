import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Only multiple_choice is implemented backend-wide (see question-manager.tsx
// in the admin UI for the same precedent) — render that shape directly
// rather than adding a premature per-type dispatch layer.
type MultipleChoiceData = {
  question_text: string;
  options: string[];
  correct_index: number;
};

const LETTERS = ["A", "B", "C", "D", "E"];

type QuestionReviewProps = {
  questionNumber: number;
  questionData: MultipleChoiceData;
  userAnswer: { selected_index?: number } | null;
  isCorrect: boolean | null;
  explanation: string | null;
};

export function QuestionReview({
  questionNumber,
  questionData,
  userAnswer,
  isCorrect,
  explanation,
}: QuestionReviewProps) {
  const selectedIndex = userAnswer?.selected_index;
  const answered = selectedIndex !== undefined;

  return (
    <Card className="gap-3 px-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">
          {questionNumber}. {questionData.question_text}
        </p>
        <Badge variant={isCorrect ? "success" : answered ? "destructive" : "neutral"}>
          {isCorrect ? "Correct" : answered ? "Incorrect" : "Not answered"}
        </Badge>
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {questionData.options.map((option, index) => {
          const isCorrectOption = index === questionData.correct_index;
          const isUserPick = index === selectedIndex;
          return (
            <li
              key={index}
              className={
                isCorrectOption
                  ? "font-medium text-green-700 dark:text-green-400"
                  : isUserPick
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
              }
            >
              {LETTERS[index] ?? index + 1}. {option}
              {isCorrectOption && " ✓"}
              {isUserPick && !isCorrectOption && " (your answer)"}
            </li>
          );
        })}
      </ul>
      {explanation && (
        <p className="text-sm text-muted-foreground">Explanation: {explanation}</p>
      )}
    </Card>
  );
}
