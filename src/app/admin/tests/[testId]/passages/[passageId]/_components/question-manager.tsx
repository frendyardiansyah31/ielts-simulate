"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { MultipleChoiceQuestionForm } from "./multiple-choice-question-form";

type MultipleChoiceQuestionData = {
  question_text: string;
  options: string[];
  correct_index: number;
};

type QuestionRow = {
  id: string;
  question_number: number;
  type: string;
  question_data: MultipleChoiceQuestionData;
  explanation: string | null;
};

export function QuestionManager({
  passageId,
  questions,
}: {
  passageId: string;
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextQuestionNumber =
    questions.length > 0 ? Math.max(...questions.map((q) => q.question_number)) + 1 : 1;

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            Add Question
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isCreating && (
        <MultipleChoiceQuestionForm
          mode="create"
          passageId={passageId}
          nextQuestionNumber={nextQuestionNumber}
          onDone={() => setIsCreating(false)}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {questions.length === 0 && !isCreating && (
        <Card className="items-center p-6 text-center text-sm text-muted-foreground">
          No questions in this passage yet.
        </Card>
      )}

      {questions.map((question) => {
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
      })}
    </div>
  );
}
