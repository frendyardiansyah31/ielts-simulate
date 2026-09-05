"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/common/form-input-field";
import { FormTextareaField } from "@/components/common/form-textarea-field";
import { apiRequest } from "@/lib/api-client";

// Same title/content shape for create and edit — passage_number (create-only,
// immutable after creation per api-spec.md) is passed in separately below
// rather than managed as a form field.
const passageFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type PassageFormValues = z.infer<typeof passageFormSchema>;

type PassageFormProps =
  | {
      mode: "create";
      testId: string;
      passageNumber: number;
      onDone: () => void;
      onCancel: () => void;
    }
  | {
      mode: "edit";
      passageId: string;
      initial: { title: string; content: string };
      onDone: () => void;
      onCancel: () => void;
    };

export function PassageForm(props: PassageFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<PassageFormValues>({
    resolver: zodResolver(passageFormSchema),
    defaultValues:
      props.mode === "edit"
        ? { title: props.initial.title, content: props.initial.content }
        : { title: "", content: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (props.mode === "edit") {
        await apiRequest(`/api/admin/passages/${props.passageId}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
      } else {
        await apiRequest(`/api/admin/tests/${props.testId}/passages`, {
          method: "POST",
          body: JSON.stringify({ ...values, passage_number: props.passageNumber }),
        });
      }
      router.refresh();
      props.onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan passage");
    }
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <FormInputField
              id="passage-title"
              name="title"
              control={form.control}
              label="Judul Passage"
              placeholder="The History of Tea"
            />
            <FormTextareaField
              id="passage-content"
              name="content"
              control={form.control}
              label="Isi Passage"
              rows={12}
              placeholder="Full passage text..."
            />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Simpan
              </Button>
              <Button type="button" variant="outline" onClick={props.onCancel}>
                Batal
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
