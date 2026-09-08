"use client";

import { useCallback, useEffect, useState } from "react";
import { SquareKanban, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { StatusManager } from "@/components/tasks/status-manager";
import { apiFetch, type StatusData, type TaskData } from "@/lib/api-client";

export default function BoardPage() {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        apiFetch<{ statuses: StatusData[] }>("/api/statuses"),
        apiFetch<{ tasks: TaskData[] }>("/api/tasks?limit=500"),
      ]);
      setStatuses(s.statuses);
      setTasks(t.tasks);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat papan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => void load();
    window.addEventListener("tugasku:refresh", onRefresh);
    return () => window.removeEventListener("tugasku:refresh", onRefresh);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <Skeleton className="h-9 w-44" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <EmptyState
          icon={SquareKanban}
          title="Tidak bisa memuat papan"
          description={error}
          action={
            <Button variant="outline" onClick={() => void load()}>
              Coba lagi
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Papan</h1>
          <p className="text-sm text-muted-foreground">
            Seret kartu antar kolom untuk mengubah status, atau naik-turun untuk mengurutkan.
          </p>
        </div>
        <Button variant="outline" onClick={() => setManageOpen(true)}>
          <SlidersHorizontal className="size-4" aria-hidden /> Kelola status
        </Button>
      </div>

      {statuses.length === 0 ? (
        <EmptyState
          icon={SquareKanban}
          title="Belum ada kolom status"
          description="Tambahkan status dulu untuk mulai memakai papan."
          action={
            <Button onClick={() => setManageOpen(true)}>Kelola status</Button>
          }
        />
      ) : (
        <KanbanBoard statuses={statuses} tasks={tasks} onBoardChanged={() => void load()} />
      )}

      <StatusManager
        open={manageOpen}
        onOpenChange={setManageOpen}
        onSaved={() => void load()}
      />
    </div>
  );
}
