"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { MultipleChoiceQuestionForm } from "./multiple-choice-question-form";
import { SummaryCompletionQuestionForm } from "./summary-completion-question-form";

type MultipleChoiceQuestionData = {
  question_text: string;
  options: string[];
  correct_index: number;
};

type SummaryCompletionQuestionData = {
  instructions?: string;
  template: string;
  blanks: { number: number; answer: string; word_limit?: string }[];
};

type QuestionRow =
  | {
      id: string;
      question_number: number;
      type: "multiple_choice";
      question_data: MultipleChoiceQuestionData;
      explanation: string | null;
    }
  | {
      id: string;
      question_number: number;
      type: "summary_completion";
      question_data: SummaryCompletionQuestionData;
      explanation: string | null;
    };

type DisplayItem =
  | { kind: "single"; question: Extract<QuestionRow, { type: "multiple_choice" }> }
  | { kind: "summary_group"; questions: Extract<QuestionRow, { type: "summary_completion" }>[] };

// summary_completion is stored as one row per blank sharing an identical
// template (api-spec.md convention, see plan-fill-blank.md work) — group
// consecutive rows with the same template back into one display block
// instead of showing the same text duplicated N times.
function groupQuestionsForDisplay(questions: QuestionRow[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  let i = 0;
  while (i < questions.length) {
    const current = questions[i];
    if (current.type === "summary_completion") {
      const group = [current];
      let j = i + 1;
      while (j < questions.length) {
        const next = questions[j];
        if (next.type !== "summary_completion" || next.question_data.template !== current.question_data.template) {
          break;
        }
        group.push(next);
        j++;
      }
      items.push({ kind: "summary_group", questions: group });
      i = j;
    } else {
      items.push({ kind: "single", question: current });
      i++;
    }
  }
  return items;
}

export function QuestionManager({
  passageId,
  questions,
  nextQuestionNumber,
}: {
  passageId: string;
  questions: QuestionRow[];
  // Continues from the whole test's max question_number (computed in the page),
  // not just this passage's — question_number is unique per test.
  nextQuestionNumber: number;
}) {
  const router = useRouter();
  const [creatingType, setCreatingType] = useState<"multiple_choice" | "summary_completion" | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteQuestion(question: QuestionRow) {
    if (!window.confirm(`Delete question number ${question.question_number}?`)) return;
    setError(null);
    try {
      await apiRequest(`/api/admin/questions/${question.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    }
  }

  async function deleteGroup(group: Extract<QuestionRow, { type: "summary_completion" }>[]) {
    const numbers = group.map((q) => q.question_number).join(", ");
    if (!window.confirm(`Delete all blanks numbered ${numbers}?`)) return;
    setError(null);
    try {
      await Promise.all(
        group.map((q) => apiRequest(`/api/admin/questions/${q.id}`, { method: "DELETE" })),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    }
  }

  const displayItems = groupQuestionsForDisplay(questions);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
        {!creatingType && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setCreatingType("multiple_choice")}>
              + Multiple Choice
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreatingType("summary_completion")}>
              + Fill in the Blank
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {creatingType === "multiple_choice" && (
        <MultipleChoiceQuestionForm
          mode="create"
          passageId={passageId}
          nextQuestionNumber={nextQuestionNumber}
          onDone={() => setCreatingType(null)}
          onCancel={() => setCreatingType(null)}
        />
      )}

      {creatingType === "summary_completion" && (
        <SummaryCompletionQuestionForm
          passageId={passageId}
          nextQuestionNumber={nextQuestionNumber}
          onDone={() => setCreatingType(null)}
          onCancel={() => setCreatingType(null)}
        />
      )}

      {questions.length === 0 && !creatingType && (
        <Card className="items-center p-6 text-center text-sm text-muted-foreground">
          No questions in this passage yet.
        </Card>
      )}

      {displayItems.map((item) => {
        if (item.kind === "single") {
          const question = item.question;

          if (editingId === question.id) {
            return (
              <MultipleChoiceQuestionForm
                key={question.id}
                mode="edit"
                questionId={question.id}
                initial={{
                  question_number: question.question_number,
                  question_text: question.question_data.question_text,
                  options: question.question_data.options,
                  correct_index: question.question_data.correct_index,
                  explanation: question.explanation,
                }}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <Card key={question.id} className="gap-2 px-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium">
                  {question.question_number}. {question.question_data.question_text}
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(question.id)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteQuestion(question)}>
                    Delete
                  </Button>
                </div>
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {question.question_data.options.map((option, index) => (
                  <li
                    key={index}
                    className={
                      index === question.question_data.correct_index
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {String.fromCharCode(65 + index)}. {option}
                    {index === question.question_data.correct_index && " ✓"}
                  </li>
                ))}
              </ul>
              {question.explanation && (
                <p className="text-sm text-muted-foreground">Explanation: {question.explanation}</p>
              )}
            </Card>
          );
        }

        const group = item.questions;
        const first = group[0];
        const numberRange =
          group.length === 1
            ? String(first.question_number)
            : `${first.question_number}-${group[group.length - 1].question_number}`;

        let previewText = first.question_data.template;
        group.forEach((q) => {
          const blank = q.question_data.blanks[0];
          previewText = previewText.replace(`___${blank.number}___`, `[${blank.number}: ${blank.answer}]`);
        });

        return (
          <Card key={first.id} className="gap-2 px-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium">
                {numberRange}. Fill in the Blank ({group.length} blank{group.length > 1 ? "s" : ""})
              </p>
              <Button variant="destructive" size="sm" onClick={() => deleteGroup(group)}>
                Delete All
              </Button>
            </div>
            {first.question_data.instructions && (
              <p className="text-sm italic text-muted-foreground">{first.question_data.instructions}</p>
            )}
            <p className="text-sm whitespace-pre-wrap">{previewText}</p>
            {first.explanation && (
              <p className="text-sm text-muted-foreground">Explanation: {first.explanation}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
