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
import { createTestSchema } from "@/validations/test-validation";
import { apiRequest } from "@/lib/api-client";

const testFormSchema = createTestSchema.extend({
  time_limit_minutes: z.number().int().positive(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export function CreateTestForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: { title: "", description: "", time_limit_minutes: 60 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const data = await apiRequest<{ id: string }>("/api/admin/tests", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push(`/admin/tests/${data.id}`);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat test");
    }
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <FormInputField
              id="test-title"
              name="title"
              control={form.control}
              label="Judul Test"
              placeholder="Cambridge 18 Test 1"
            />
            <FormTextareaField
              id="test-description"
              name="description"
              control={form.control}
              label="Deskripsi (opsional)"
            />
            <FormInputField
              id="test-time-limit"
              name="time_limit_minutes"
              control={form.control}
              label="Time limit (menit)"
              type="number"
            />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Simpan
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
