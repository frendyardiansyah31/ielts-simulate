"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormInputField } from "@/components/common/form-input-field";
import { FormTextareaField } from "@/components/common/form-textarea-field";
import { apiRequest } from "@/lib/api-client";

const OPTION_COUNTS = [3, 4, 5] as const;

const questionFormSchema = z
  .object({
    question_number: z.number().int().positive(),
    question_text: z.string().min(1, "Question text is required"),
    options: z
      .array(z.object({ value: z.string().min(1, "Option cannot be empty") }))
      .min(3)
      .max(5),
    correct_index: z.number().int().min(0),
    explanation: z.string().optional(),
  })
  .refine((data) => data.correct_index < data.options.length, {
    message: "Select one correct answer",
    path: ["correct_index"],
  });

type QuestionFormValues = z.infer<typeof questionFormSchema>;

type MultipleChoiceQuestionFormProps =
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
        question_text: string;
        options: string[];
        correct_index: number;
        explanation: string | null;
      };
      onDone: () => void;
      onCancel: () => void;
    };

export function MultipleChoiceQuestionForm(props: MultipleChoiceQuestionFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues:
      props.mode === "edit"
        ? {
            question_number: props.initial.question_number,
            question_text: props.initial.question_text,
            options: props.initial.options.map((value) => ({ value })),
            correct_index: props.initial.correct_index,
            explanation: props.initial.explanation ?? "",
          }
        : {
            question_number: props.nextQuestionNumber,
            question_text: "",
            options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
            correct_index: 0,
            explanation: "",
          },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" });
  const correctIndex = form.watch("correct_index");

  function setOptionCount(count: number) {
    const current = fields.length;
    if (count > current) {
      for (let i = current; i < count; i++) append({ value: "" });
      return;
    }
    for (let i = current - 1; i >= count; i--) {
      remove(i);
      if (correctIndex === i) form.setValue("correct_index", 0);
      else if (correctIndex > i) form.setValue("correct_index", correctIndex - 1);
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const question_data = {
      question_text: values.question_text,
      options: values.options.map((o) => o.value),
      correct_index: values.correct_index,
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
            type: "multiple_choice",
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
              id="question-text"
              name="question_text"
              control={form.control}
              label="Question Text"
              rows={3}
            />

            <Field>
              <FieldLabel htmlFor="option-count">Number of Options</FieldLabel>
              <select
                id="option-count"
                className="h-8 w-24 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={fields.length}
                onChange={(e) => setOptionCount(Number(e.target.value))}
              >
                {OPTION_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel>Answer Options (select the radio for the correct answer)</FieldLabel>
              <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctIndex === index}
                      onChange={() => form.setValue("correct_index", index)}
                      aria-label={`Correct answer option ${index + 1}`}
                    />
                    <Controller
                      name={`options.${index}.value`}
                      control={form.control}
                      render={({ field: optionField, fieldState }) => (
                        <div className="flex-1">
                          <Input
                            {...optionField}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </div>
                      )}
                    />
                  </div>
                ))}
              </div>
              {form.formState.errors.correct_index && (
                <FieldError errors={[form.formState.errors.correct_index]} />
              )}
            </Field>

            <FormTextareaField
              id="question-explanation"
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
