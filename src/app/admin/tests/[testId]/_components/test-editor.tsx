"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/common/form-input-field";
import { FormTextareaField } from "@/components/common/form-textarea-field";
import { updateTestSchema } from "@/validations/test-validation";
import { apiRequest } from "@/lib/api-client";

const testFormSchema = updateTestSchema.extend({
  title: z.string().min(1, "Title is required"),
  time_limit_minutes: z.number().int().positive(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

type Test = {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  status: "draft" | "published";
};

export function TestEditor({ test }: { test: Test }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: test.title,
      description: test.description ?? "",
      time_limit_minutes: test.time_limit_minutes,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiRequest(`/api/admin/tests/${test.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan test");
    }
  });

  async function togglePublish() {
    setPublishError(null);
    setIsBusy(true);
    try {
      const nextStatus = test.status === "published" ? "draft" : "published";
      await apiRequest(`/api/admin/tests/${test.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteTest() {
    if (!window.confirm(`Hapus test "${test.title}"? Semua passage & soal ikut terhapus.`)) {
      return;
    }
    setIsBusy(true);
    try {
      await apiRequest(`/api/admin/tests/${test.id}`, { method: "DELETE" });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Gagal menghapus test");
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Detail Test
          <Badge variant={test.status === "published" ? "success" : "neutral"}>
            {test.status === "published" ? "Published" : "Draft"}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isBusy} onClick={togglePublish}>
            {test.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="destructive" size="sm" disabled={isBusy} onClick={deleteTest}>
            Hapus Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {publishError && <p className="mb-3 text-sm text-destructive">{publishError}</p>}
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <FormInputField id="test-title" name="title" control={form.control} label="Judul Test" />
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
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
              Simpan Perubahan
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
