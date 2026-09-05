"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api-client";
import type { AdminTestListItem } from "@/lib/tests/get-tests-list";

export function TestList({ tests }: { tests: AdminTestListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublish(test: AdminTestListItem) {
    setError(null);
    setPendingId(test.id);
    try {
      const nextStatus = test.status === "published" ? "draft" : "published";
      await apiRequest(`/api/admin/tests/${test.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTest(test: AdminTestListItem) {
    if (!window.confirm(`Hapus test "${test.title}"? Semua passage & soal ikut terhapus.`)) {
      return;
    }
    setError(null);
    setPendingId(test.id);
    try {
      await apiRequest(`/api/admin/tests/${test.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus test");
    } finally {
      setPendingId(null);
    }
  }

  if (tests.length === 0) {
    return (
      <Card className="items-center p-8 text-center text-sm text-muted-foreground">
        Belum ada test. Klik &quot;Buat Test Baru&quot; untuk mulai.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {tests.map((test) => (
        <Card key={test.id} className="flex-row items-center justify-between gap-4 px-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link href={`/admin/tests/${test.id}`} className="font-medium underline-offset-4 hover:underline">
                {test.title}
              </Link>
              <Badge variant={test.status === "published" ? "success" : "neutral"}>
                {test.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {test.passage_count} passage · {test.question_count} soal · {test.time_limit_minutes} menit
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pendingId === test.id}
              onClick={() => togglePublish(test)}
            >
              {test.status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pendingId === test.id}
              onClick={() => deleteTest(test)}
            >
              Hapus
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
