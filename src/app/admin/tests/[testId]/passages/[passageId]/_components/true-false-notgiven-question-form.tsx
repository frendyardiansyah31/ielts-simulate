"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/common/form-input-field";
import { FormTextareaField } from "@/components/common/form-textarea-field";
import { apiRequest } from "@/lib/api-client";
import {
  TFNG_ANSWERS,
  TFNG_CHOICES,
} from "@/validations/true-false-notgiven-question-validation";

const questionFormSchema = z.object({
  question_number: z.number().int().positive(),
  statement: z.string().min(1, "Statement is required"),
  correct_answer: z.enum(TFNG_ANSWERS, "Select the correct answer"),
  explanation: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

type TrueFalseNotGivenQuestionFormProps =
  | {
      mode: "create";
      passageId: string;
      nextQuestionNumber: number;
      onDone: () => void;
      onCancel: () => void;
    }
  | {
      mode: "edit";
      questionId: string;
      initial: {
        question_number: number;
        statement: string;
        correct_answer: string;
        explanation: string | null;
      };
      onDone: () => void;
      onCancel: () => void;
    };

export function TrueFalseNotGivenQuestionForm(props: TrueFalseNotGivenQuestionFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues:
      props.mode === "edit"
        ? {
            question_number: props.initial.question_number,
            statement: props.initial.statement,
            correct_answer: props.initial.correct_answer as QuestionFormValues["correct_answer"],
            explanation: props.initial.explanation ?? "",
          }
        : {
            question_number: props.nextQuestionNumber,
            statement: "",
            correct_answer: undefined as unknown as QuestionFormValues["correct_answer"],
            explanation: "",
          },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const question_data = {
      statement: values.statement,
      correct_answer: values.correct_answer,
    };

    try {
      if (props.mode === "edit") {
        await apiRequest(`/api/admin/questions/${props.questionId}`, {
          method: "PATCH",
          body: JSON.stringify({ question_data, explanation: values.explanation }),
        });
      } else {
        await apiRequest(`/api/admin/passages/${props.passageId}/questions`, {
          method: "POST",
          body: JSON.stringify({
            question_number: values.question_number,
            type: "true_false_notgiven",
            question_data,
            explanation: values.explanation,
          }),
        });
      }
      router.refresh();
      props.onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save question");
    }
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <FormInputField
              id="question-number"
              name="question_number"
              control={form.control}
              label="Question Number"
              type="number"
              disabled={props.mode === "edit"}
            />
            <FormTextareaField
              id="tfng-statement"
              name="statement"
              control={form.control}
              label="Statement"
              rows={3}
            />

            <Field>
              <FieldLabel>Correct Answer</FieldLabel>
              <Controller
                name="correct_answer"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    {TFNG_CHOICES.map((choice) => (
                      <label key={choice.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="tfng-correct-answer"
                          value={choice.value}
                          checked={field.value === choice.value}
                          onChange={() => field.onChange(choice.value)}
                        />
                        {choice.label}
                      </label>
                    ))}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </div>
                )}
              />
            </Field>

            <FormTextareaField
              id="tfng-explanation"
              name="explanation"
              control={form.control}
              label="Explanation (optional)"
              rows={2}
            />

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save
              </Button>
              <Button type="button" variant="outline" onClick={props.onCancel}>
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
