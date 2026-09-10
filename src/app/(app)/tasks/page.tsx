"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ListChecks, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { BlurFade } from "@/components/magicui/blur-fade";
import { FilterBar } from "@/components/tasks/filter-bar";
import { TaskTable, BulkBar } from "@/components/tasks/task-table";

const TaskModal = dynamic(() => import("@/components/tasks/task-modal").then((m) => m.TaskModal));
import {
  apiFetch,
  type CategoryData,
  type StatusData,
  type TagData,
  type TaskData,
} from "@/lib/api-client";
import type { Priority } from "@/lib/priority";
import { filtersToQuery, useTaskFilters } from "@/stores/filters";

export default function TasksPage() {
  const { filters } = useTaskFilters();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskData | null>(null);
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    try {
      const res = await apiFetch<{ tasks: TaskData[] }>(`/api/tasks?${filtersToQuery(filters)}`, {
        signal: controller.signal,
      });
      setTasks(res.tasks);
      setSelected((prev) => new Set([...prev].filter((id) => res.tasks.some((t) => t.id === id))));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Gagal memuat tugas");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [filters]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const loadLookups = useCallback(async () => {
    try {
      const [s, c, t] = await Promise.all([
        apiFetch<{ statuses: StatusData[] }>("/api/statuses"),
        apiFetch<{ categories: CategoryData[] }>("/api/categories"),
        apiFetch<{ tags: TagData[] }>("/api/tags"),
      ]);
      setStatuses(s.statuses);
      setCategories(c.categories);
      setTags(t.tags);
    } catch {
      // lookup gagal: filter tetap bisa dipakai untuk pencarian
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filters.q]);

  useEffect(() => {
    loadLookups();
    const onRefresh = () => {
      load();
      loadLookups();
    };
    const onFocusSearch = () => searchRef.current?.focus();
    window.addEventListener("tugasku:refresh", onRefresh);
    window.addEventListener("tugasku:focus-search", onFocusSearch);
    return () => {
      window.removeEventListener("tugasku:refresh", onRefresh);
      window.removeEventListener("tugasku:focus-search", onFocusSearch);
    };
  }, [load, loadLookups]);

  // Tanpa dispatch tugasku:refresh: halaman ini mendengarkannya sendiri sehingga satu PATCH memicu dua kali muat.
  const inlineStatus = useCallback(
    async (task: TaskData, statusId: string) => {
      try {
        const res = await apiFetch<{ task: TaskData; spawned: TaskData | null }>(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ statusId }),
        });
        if (res.spawned) toast.info(`Tugas berulang berikutnya dibuat: ${res.spawned.title}`);
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
      }
    },
    [load],
  );

  const handleEdit = useCallback((task: TaskData) => {
    setEditing(task);
    setModalOpen(true);
  }, []);

  async function bulk(payload: { action: "status" | "priority"; statusId?: string; priority?: Priority }) {
    setBusy(true);
    try {
      const res = await apiFetch<{ affected: number; tasks: TaskData[] }>("/api/tasks/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected], ...payload }),
      });
      toast.success(`${res.affected} tugas diperbarui`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aksi massal gagal");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const copy = deleteTarget;
    setBusy(true);
    try {
      await apiFetch(`/api/tasks/${copy.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setSelected(new Set());
      load();
      toast("Tugas dihapus", {
        description: copy.title,
        duration: 8000,
        action: {
          label: "Urungkan",
          onClick: () => void undoDelete(copy),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tugas");
    } finally {
      setBusy(false);
    }
  }

  async function undoDelete(copy: TaskData) {
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: copy.title,
          description: copy.description,
          statusId: copy.status.id,
          priority: copy.priority,
          categoryId: copy.category?.id ?? null,
          dueDate: copy.dueDate,
          recurrence: copy.recurrence,
          recurrenceInterval: copy.recurrenceInterval,
          tags: copy.tags.map((t) => t.name),
        }),
      });
      toast.success("Tugas dikembalikan");
      load();
      loadLookups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengembalikan tugas");
    }
  }

  const hasFilters =
    filters.q || filters.statusId || filters.priority || filters.categoryId || filters.tagId || filters.dueFrom || filters.dueTo;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Tugas</h1>
      </div>

      <BlurFade direction="up" delay={0.02}>
        <FilterBar statuses={statuses} categories={categories} tags={tags} searchRef={searchRef} />
      </BlurFade>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          statuses={statuses}
          busy={busy}
          onClear={() => setSelected(new Set())}
          onBulk={bulk}
          onDelete={() => {
            const first = tasks.find((t) => t.id === [...selected][0]);
            setDeleteTarget(first ?? null);
          }}
        />
      )}

      <BlurFade direction="up" delay={0.08}>
      {loading ? (
        <div className="grid gap-2 rounded-lg border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={SearchX}
          title="Tidak bisa memuat tugas"
          description={error}
          action={
            <Button onClick={() => void load()} variant="outline">
              Coba lagi
            </Button>
          }
        />
      ) : tasks.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada tugas yang cocok"
            description="Coba ubah kata kunci atau reset filter pencarianmu."
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="Belum ada tugas"
            description="Tugas pertamamu menunggu untuk dicatat. Tekan N atau tombol tambah."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                Tambah Tugas
              </Button>
            }
          />
        )
      ) : (
        <TaskTable
          tasks={tasks}
          statuses={statuses}
          selected={selected}
          onSelectedChange={setSelected}
          onEdit={handleEdit}
          onInlineStatus={inlineStatus}
        />
      )}
      </BlurFade>

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editing}
        onSaved={() => {
          load();
          loadLookups();
        }}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tugas ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} akan dihapus. Kamu punya waktu beberapa detik untuk mengurungkan lewat notifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
