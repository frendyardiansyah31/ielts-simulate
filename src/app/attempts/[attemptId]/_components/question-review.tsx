import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { tfngLabel } from "@/validations/true-false-notgiven-question-validation";

type MultipleChoiceData = {
  question_text: string;
  options: string[];
  correct_index: number;
};

type SummaryCompletionData = {
  instructions?: string;
  template: string;
  blanks: { number: number; answer: string; word_limit?: string }[];
};

type TrueFalseNotGivenData = {
  statement: string;
  correct_answer: string;
};

const LETTERS = ["A", "B", "C", "D", "E"];

type QuestionReviewProps = {
  type: string;
  questionNumber: number;
  questionData: MultipleChoiceData | SummaryCompletionData | TrueFalseNotGivenData;
  userAnswer: { selected_index?: number; text?: string; answer?: string } | null;
  isCorrect: boolean | null;
  explanation: string | null;
};

function StatusBadge({ isCorrect, answered }: { isCorrect: boolean | null; answered: boolean }) {
  return (
    <Badge variant={isCorrect ? "success" : answered ? "destructive" : "neutral"}>
      {isCorrect ? "Correct" : answered ? "Incorrect" : "Not answered"}
    </Badge>
  );
}

export function QuestionReview({
  type,
  questionNumber,
  questionData,
  userAnswer,
  isCorrect,
  explanation,
}: QuestionReviewProps) {
  if (type === "summary_completion") {
    const data = questionData as SummaryCompletionData;
    const blank = data.blanks[0];
    const userText = userAnswer?.text?.trim() ?? "";
    const answered = userText !== "";

    return (
      <Card className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {questionNumber}. Gap fill
            {blank?.word_limit ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({blank.word_limit})
              </span>
            ) : null}
          </p>
          <StatusBadge isCorrect={isCorrect} answered={answered} />
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Your answer: </span>
          {answered ? (
            <span className={isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive"}>
              {userText}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Correct answer: </span>
          <span className="font-medium text-green-700 dark:text-green-400">{blank?.answer}</span>
        </p>
        {explanation && (
          <p className="text-sm text-muted-foreground">Explanation: {explanation}</p>
        )}
      </Card>
    );
  }

  if (type === "true_false_notgiven") {
    const data = questionData as TrueFalseNotGivenData;
    const picked = userAnswer?.answer;
    const answered = typeof picked === "string" && picked !== "";

    return (
      <Card className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {questionNumber}. {data.statement}
          </p>
          <StatusBadge isCorrect={isCorrect} answered={answered} />
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Your answer: </span>
          {answered ? (
            <span className={isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive"}>
              {tfngLabel(picked)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Correct answer: </span>
          <span className="font-medium text-green-700 dark:text-green-400">
            {tfngLabel(data.correct_answer)}
          </span>
        </p>
        {explanation && (
          <p className="text-sm text-muted-foreground">Explanation: {explanation}</p>
        )}
      </Card>
    );
  }

  const data = questionData as MultipleChoiceData;
  const selectedIndex = userAnswer?.selected_index;
  const answered = selectedIndex !== undefined;

  return (
    <Card className="gap-3 px-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">
          {questionNumber}. {data.question_text}
        </p>
        <StatusBadge isCorrect={isCorrect} answered={answered} />
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {data.options.map((option, index) => {
          const isCorrectOption = index === data.correct_index;
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
