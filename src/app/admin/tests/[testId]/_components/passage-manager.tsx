"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import type { AdminPassageListItem } from "@/lib/tests/get-passages-list";
import { PassageForm } from "./passage-form";

const PASSAGE_NUMBERS = [1, 2, 3] as const;

export function PassageManager({
  testId,
  passages,
}: {
  testId: string;
  passages: AdminPassageListItem[];
}) {
  const router = useRouter();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passageByNumber = new Map(passages.map((p) => [p.passage_number, p]));

  async function deletePassage(passage: AdminPassageListItem) {
    if (!window.confirm(`Delete passage "${passage.title}"? All questions inside it will be deleted too.`)) {
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/admin/passages/${passage.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete passage");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Passages</h2>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {PASSAGE_NUMBERS.map((number) => {
        const passage = passageByNumber.get(number);

        if (editingId && passage?.id === editingId) {
          return (
            <PassageForm
              key={number}
              mode="edit"
              passageId={passage.id}
              initial={{ title: passage.title, content: passage.content }}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          );
        }

        if (!passage) {
          if (activeSlot === number) {
            return (
              <PassageForm
                key={number}
                mode="create"
                testId={testId}
                passageNumber={number}
                onDone={() => setActiveSlot(null)}
                onCancel={() => setActiveSlot(null)}
              />
            );
          }

          return (
            <Card key={number} className="flex-row items-center justify-between px-4 text-sm text-muted-foreground">
              <span>Passage {number} — not filled in</span>
              <Button size="sm" onClick={() => setActiveSlot(number)}>
                Add Passage {number}
              </Button>
            </Card>
          );
        }

        return (
          <Card key={number} className="flex-row items-center justify-between gap-4 px-4">
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {passage.passage_number}. {passage.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {passage.word_count} words · {passage.question_count} questions
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/admin/tests/${testId}/passages/${passage.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Manage Questions
              </Link>
              <Button variant="outline" size="sm" onClick={() => setEditingId(passage.id)}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deletePassage(passage)}>
                Delete
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
