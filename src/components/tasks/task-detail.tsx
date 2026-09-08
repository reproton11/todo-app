"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheckBig, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ColoredChip, PriorityChip } from "@/components/tasks/priority-badge";
import { DueLabel } from "@/components/tasks/due-label";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { TaskModal } from "@/components/tasks/task-modal";
import { apiFetch, type TaskData } from "@/lib/api-client";
import type { RecurrenceRule } from "@/lib/recurrence";

const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  NONE: "Tidak berulang",
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  CUSTOM: "Khusus (interval hari)",
};

export function TaskDetail({ task: initial }: { task: TaskData }) {
  const router = useRouter();
  const [task, setTask] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleDone() {
    setBusy(true);
    try {
      const doneStatuses = await apiFetch<{ statuses: { id: string; isDone: boolean }[] }>("/api/statuses");
      const done = doneStatuses.statuses.find((s) => s.isDone);
      const first = doneStatuses.statuses[0];
      const res = await apiFetch<{ task: TaskData; spawned: TaskData | null }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statusId: task.status.isDone ? first?.id : done?.id }),
      });
      setTask(res.task);
      if (res.spawned) toast.info(`Tugas berulang berikutnya dibuat: ${res.spawned.title}`);
      toast.success(res.task.status.isDone ? "Tugas ditandai selesai" : "Tugas dibuka kembali");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      toast("Tugas dihapus", {
        description: task.title,
        duration: 8000,
        action: {
          label: "Urungkan",
          onClick: () => {
            void apiFetch("/api/tasks", {
              method: "POST",
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                statusId: task.status.id,
                priority: task.priority,
                categoryId: task.category?.id ?? null,
                dueDate: task.dueDate,
                recurrence: task.recurrence,
                recurrenceInterval: task.recurrenceInterval,
                tags: task.tags.map((t) => t.name),
              }),
            });
          },
        },
      });
      router.push("/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tugas");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <div>
        <Link
          href="/tasks"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Semua tugas
        </Link>

        <BlurFade direction="up" delay={0.02}>
        <Card>
          <CardContent className="grid gap-4 px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1
                className={`text-xl font-bold ${task.status.isDone ? "text-muted-foreground line-through" : ""}`}
              >
                {task.title}
              </h1>
              <div className="flex gap-2">
                {task.status.isDone ? (
                  <Button size="sm" variant="outline" onClick={toggleDone} disabled={busy}>
                    <RotateCcw className="size-4" aria-hidden /> Buka Kembali
                  </Button>
                ) : (
                  <ShimmerButton
                    type="button"
                    onClick={toggleDone}
                    disabled={busy}
                    background="var(--primary)"
                    shimmerColor="var(--primary-foreground)"
                    borderRadius="0.625rem"
                    className="h-8 px-3 py-1.5 text-sm text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <CircleCheckBig className="size-4" aria-hidden /> Tandai Selesai
                  </ShimmerButton>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" aria-hidden /> Ubah
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Hapus tugas"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: task.status.color }} aria-hidden />
                {task.status.name}
              </span>
              <PriorityChip priority={task.priority} />
              {task.category && <ColoredChip color={task.category.color} label={task.category.name} />}
              {task.tags.map((t) => (
                <span key={t.id} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  #{t.name}
                </span>
              ))}
            </div>

            {task.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
            )}

            <Separator />

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Tenggat</dt>
                <dd><DueLabel iso={task.dueDate} /></dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Berulang</dt>
                <dd>
                  {RECURRENCE_LABELS[task.recurrence as RecurrenceRule]}
                  {task.recurrence === "CUSTOM" && task.recurrenceInterval
                    ? ` (${task.recurrenceInterval} hari)`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Dibuat</dt>
                <dd>{new Date(task.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Selesai pada</dt>
                <dd>
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                    : "-"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        </BlurFade>
      </div>

      <TaskModal
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        onSaved={async () => {
          const fresh = await apiFetch<{ task: TaskData }>(`/api/tasks/${task.id}`);
          setTask(fresh.task);
          router.refresh();
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tugas ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {task.title} akan dihapus. Kamu bisa mengurungkan lewat notifikasi selama beberapa detik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
