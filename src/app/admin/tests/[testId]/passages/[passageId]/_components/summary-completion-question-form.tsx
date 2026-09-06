"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { parseBlankTemplate } from "@/lib/questions/parse-blank-template";

type BlankAnswer = { answer: string; word_limit: string };

type SummaryCompletionQuestionFormProps = {
  passageId: string;
  nextQuestionNumber: number;
  onDone: () => void;
  onCancel: () => void;
};

// Plain useState rather than react-hook-form here (unlike
// multiple-choice-question-form.tsx) — this form needs raw textarea DOM
// access (selectionStart/setSelectionRange) for cursor-position blank
// insertion, which doesn't fit RHF's controlled-field model cleanly.
export function SummaryCompletionQuestionForm({
  passageId,
  nextQuestionNumber,
  onDone,
  onCancel,
}: SummaryCompletionQuestionFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [instructions, setInstructions] = useState("");
  const [template, setTemplate] = useState("");
  const [explanation, setExplanation] = useState("");
  const [answers, setAnswers] = useState<Record<number, BlankAnswer>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blankNumbers = parseBlankTemplate(template);

  function insertBlank() {
    const textarea = textareaRef.current;
    const nextNumber = blankNumbers.length > 0 ? Math.max(...blankNumbers) + 1 : 1;
    const token = `___${nextNumber}___`;

    const start = textarea?.selectionStart ?? template.length;
    const end = textarea?.selectionEnd ?? template.length;
    const nextTemplate = template.slice(0, start) + token + template.slice(end);

    setTemplate(nextTemplate);
    setAnswers((prev) => ({ ...prev, [nextNumber]: { answer: "", word_limit: "" } }));

    requestAnimationFrame(() => {
      if (!textarea) return;
      const cursor = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function removeBlank(numberToRemove: number) {
    // Remove that exact token, then renumber remaining tokens sequentially in
    // text order — deleting blank 2 of [1,2,3] must yield [1,2], not [1,3].
    const withoutToken = template.replace(`___${numberToRemove}___`, "");
    const remainingNumbersInOrder = parseBlankTemplate(withoutToken);

    let renumbered = withoutToken;
    const nextAnswers: Record<number, BlankAnswer> = {};
    remainingNumbersInOrder.forEach((oldNumber, index) => {
      const newNumber = index + 1;
      if (oldNumber !== newNumber) {
        renumbered = renumbered.replace(`___${oldNumber}___`, `___${newNumber}___`);
      }
      nextAnswers[newNumber] = answers[oldNumber] ?? { answer: "", word_limit: "" };
    });

    setTemplate(renumbered);
    setAnswers(nextAnswers);
  }

  function updateAnswer(number: number, field: keyof BlankAnswer, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [number]: { ...(prev[number] ?? { answer: "", word_limit: "" }), [field]: value },
    }));
  }

  async function handleSave() {
    setFormError(null);

    if (blankNumbers.length === 0) {
      setFormError("Please insert at least one blank.");
      return;
    }

    for (const number of blankNumbers) {
      if (!answers[number]?.answer?.trim()) {
        setFormError(`Blank ${number} requires a correct answer.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/admin/passages/${passageId}/questions/summary-completion`, {
        method: "POST",
        body: JSON.stringify({
          starting_question_number: nextQuestionNumber,
          instructions: instructions || undefined,
          template,
          blanks: blankNumbers.map((number) => ({
            answer: answers[number].answer,
            word_limit: answers[number].word_limit || undefined,
          })),
          explanation: explanation || undefined,
        }),
      });
      router.refresh();
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewText = blankNumbers.reduce(
    (text, number) => text.replace(`___${number}___`, `[${number}] __________`),
    template,
  );

  return (
    <Card>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sc-instructions">Instructions</FieldLabel>
            <Textarea
              id="sc-instructions"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer."
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="sc-template">Question Content</FieldLabel>
            <Textarea
              id="sc-template"
              ref={textareaRef}
              rows={6}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Type the summary text here, place the cursor where you want a blank, then click + Insert Blank"
            />
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={insertBlank}>
              + Insert Blank
            </Button>
          </Field>

          {blankNumbers.length > 0 && (
            <Field>
              <FieldLabel>Answers</FieldLabel>
              <div className="flex flex-col gap-3">
                {blankNumbers.map((number) => (
                  <div key={number} className="flex items-end gap-2">
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-medium">Blank {number}</p>
                      <Input
                        placeholder="Correct answer"
                        value={answers[number]?.answer ?? ""}
                        onChange={(e) => updateAnswer(number, "answer", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-medium">Word limit (optional)</p>
                      <Input
                        placeholder="NO MORE THAN TWO WORDS"
                        value={answers[number]?.word_limit ?? ""}
                        onChange={(e) => updateAnswer(number, "word_limit", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBlank(number)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="sc-explanation">Explanation (optional)</FieldLabel>
            <Textarea
              id="sc-explanation"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </Field>

          {template && (
            <Field>
              <FieldLabel>Preview</FieldLabel>
              <p className="rounded-lg border border-input bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {previewText}
              </p>
            </Field>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex gap-2">
            <Button type="button" disabled={isSubmitting} onClick={handleSave}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
