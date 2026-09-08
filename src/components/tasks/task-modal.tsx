"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, type CategoryData, type StatusData, type TagData, type TaskData } from "@/lib/api-client";
import { PRIORITIES, RECURRENCES } from "@/lib/validations";
import { PRIORITY_META, type Priority } from "@/lib/priority";
import type { RecurrenceRule } from "@/lib/recurrence";

const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  NONE: "Tidak berulang",
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  CUSTOM: "Khusus (interval hari)",
};

type FormValues = {
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  categoryId: string;
  dueDate: string;
  recurrence: RecurrenceRule;
  recurrenceInterval: string;
  tags: string[];
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  onSaved,
  defaultStatusId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskData | null;
  onSaved?: () => void;
  defaultStatusId?: string;
}) {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [knownTags, setKnownTags] = useState<TagData[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      statusId: defaultStatusId ?? "",
      priority: "MEDIUM",
      categoryId: "",
      dueDate: "",
      recurrence: "NONE",
      recurrenceInterval: "",
      tags: [],
    },
  });
  const { register, handleSubmit, reset, setValue, watch, formState } = form;
  const tags = watch("tags");
  const recurrence = watch("recurrence");
  const statusId = watch("statusId");

  const loadLookups = useCallback(async () => {
    const [sRes, cRes, tRes] = await Promise.all([
      apiFetch<{ statuses: StatusData[] }>("/api/statuses"),
      apiFetch<{ categories: CategoryData[] }>("/api/categories"),
      apiFetch<{ tags: TagData[] }>("/api/tags"),
    ]);
    setStatuses(sRes.statuses);
    setCategories(cRes.categories);
    setKnownTags(tRes.tags);
    return sRes.statuses;
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const list = await loadLookups();
      if (task) {
        reset({
          title: task.title,
          description: task.description ?? "",
          statusId: task.status.id,
          priority: task.priority,
          categoryId: task.category?.id ?? "",
          dueDate: toLocalInput(task.dueDate),
          recurrence: task.recurrence as RecurrenceRule,
          recurrenceInterval: task.recurrenceInterval ? String(task.recurrenceInterval) : "",
          tags: task.tags.map((t) => t.name),
        });
      } else {
        const firstDone = list.find((s) => s.isDone);
        reset({
          title: "",
          description: "",
          statusId: defaultStatusId ?? list.find((s) => !s.isDone)?.id ?? firstDone?.id ?? "",
          priority: "MEDIUM",
          categoryId: "",
          dueDate: "",
          recurrence: "NONE",
          recurrenceInterval: "",
          tags: [],
        });
      }
      setTagDraft("");
    })().catch(() => toast.error("Gagal memuat data form"));
  }, [open, task, defaultStatusId, reset, loadLookups]);

  function addTag(name: string) {
    const clean = name.trim().slice(0, 30);
    if (!clean) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTagDraft("");
      return;
    }
    if (tags.length >= 10) {
      toast.error("Maksimal 10 tag");
      return;
    }
    setValue("tags", [...tags, clean], { shouldDirty: true });
    setTagDraft("");
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!values.statusId) {
      toast.error("Pilih status dulu");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        statusId: values.statusId,
        priority: values.priority,
        categoryId: values.categoryId || null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        recurrence: values.recurrence,
        recurrenceInterval:
          values.recurrence === "CUSTOM" && values.recurrenceInterval
            ? Number(values.recurrenceInterval)
            : null,
        tags: values.tags,
      };

      if (task) {
        const res = await apiFetch<{ task: TaskData; spawned: TaskData | null }>(
          `/api/tasks/${task.id}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        toast.success("Tugas diperbarui");
        if (res.spawned) toast.info(`Tugas berulang berikutnya dibuat: ${res.spawned.title}`);
      } else {
        await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Tugas dibuat");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan tugas");
    } finally {
      setBusy(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Ubah Tugas" : "Tambah Tugas"}</DialogTitle>
          <DialogDescription>
            {task ? "Perbarui detail tugas ini." : "Catat apa yang perlu dikerjakan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="task-title">Judul</Label>
            <Input id="task-title" placeholder="Contoh: Siapkan laporan mingguan" {...register("title", { required: "Judul wajib diisi" })} />
            {formState.errors.title && (
              <p role="alert" className="text-sm text-destructive">{formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-desc">Deskripsi</Label>
            <Textarea id="task-desc" rows={3} placeholder="Detail opsional..." {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select value={statusId || undefined} onValueChange={(v) => setValue("statusId", v, { shouldDirty: true })}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-priority">Prioritas</Label>
              <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as Priority, { shouldDirty: true })}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-category">Kategori</Label>
              <Select value={watch("categoryId") || "none"} onValueChange={(v) => setValue("categoryId", v === "none" ? "" : v, { shouldDirty: true })}>
                <SelectTrigger id="task-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-due">Tenggat</Label>
              <Input id="task-due" type="datetime-local" {...register("dueDate")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-recurrence">Ulangi</Label>
              <Select value={recurrence} onValueChange={(v) => setValue("recurrence", v as RecurrenceRule, { shouldDirty: true })}>
                <SelectTrigger id="task-recurrence" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RECURRENCE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {recurrence === "CUSTOM" && (
              <div className="grid gap-2">
                <Label htmlFor="task-interval">Setiap (hari)</Label>
                <Input id="task-interval" type="number" min={1} max={365} {...register("recurrenceInterval")} />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-tags">Tag</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                >
                  {t}
                  <button
                    type="button"
                    aria-label={`Hapus tag ${t}`}
                    className="rounded-full p-0.5 hover:bg-background"
                    onClick={() => setValue("tags", tags.filter((x) => x !== t), { shouldDirty: true })}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="task-tags"
              placeholder="Tulis tag lalu tekan Enter"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagDraft);
                }
              }}
            />
            {knownTags.length > 0 && (
              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                Tag tersimpan:
                {knownTags
                  .filter((t) => !tags.some((x) => x.toLowerCase() === t.name.toLowerCase()))
                  .slice(0, 8)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="rounded bg-muted px-1.5 py-0.5 hover:bg-secondary"
                      onClick={() => addTag(t.name)}
                    >
                      {t.name}
                    </button>
                  ))}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy || formState.isSubmitting}>
              {busy ? "Menyimpan..." : task ? "Simpan Perubahan" : "Buat Tugas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
