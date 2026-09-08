"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColoredChip, PriorityChip } from "@/components/tasks/priority-badge";
import { DueLabel } from "@/components/tasks/due-label";
import type { StatusData, TaskData } from "@/lib/api-client";
import { PRIORITIES } from "@/lib/validations";
import { PRIORITY_META, type Priority } from "@/lib/priority";
import { useTaskFilters, type SortField } from "@/stores/filters";
import { cn } from "@/lib/utils";

export function TaskTable({
  tasks,
  statuses,
  selected,
  onSelectedChange,
  onEdit,
  onInlineStatus,
}: {
  tasks: TaskData[];
  statuses: StatusData[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  onEdit: (task: TaskData) => void;
  onInlineStatus: (task: TaskData, statusId: string) => void;
}) {
  const { filters, setFilter } = useTaskFilters();

  function toggleAll(checked: boolean) {
    onSelectedChange(checked ? new Set(tasks.map((t) => t.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  }

  function sortButton(field: SortField, label: string) {
    const active = filters.sort === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 gap-1 font-medium"
        onClick={() => {
          if (active) setFilter("dir", filters.dir === "asc" ? "desc" : "asc");
          else setFilter("sort", field);
        }}
        aria-label={`Urutkan berdasarkan ${label}`}
      >
        {label}
        {active &&
          (filters.dir === "asc" ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          ))}
      </Button>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-160">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                aria-label="Pilih semua tugas di halaman ini"
                checked={tasks.length > 0 && selected.size === tasks.length}
                onCheckedChange={(v) => toggleAll(v === true)}
              />
            </TableHead>
            <TableHead>{sortButton("title", "Judul")}</TableHead>
            <TableHead className="hidden md:table-cell">Kategori</TableHead>
            <TableHead className="hidden sm:table-cell">{sortButton("priority", "Prioritas")}</TableHead>
            <TableHead>{sortButton("dueDate", "Tenggat")}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const done = task.status.isDone;
            return (
              <TableRow key={task.id} data-selected={selected.has(task.id)} className="data-[selected=true]:bg-secondary/50">
                <TableCell>
                  <Checkbox
                    aria-label={`Pilih tugas ${task.title}`}
                    checked={selected.has(task.id)}
                    onCheckedChange={(v) => toggleOne(task.id, v === true)}
                  />
                </TableCell>
                <TableCell className="max-w-72">
                  <div className="space-y-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className={cn(
                        "line-clamp-2 font-medium underline-offset-4 hover:underline",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </Link>
                    {(task.tags.length > 0 || task.description) && (
                      <div className="flex flex-wrap items-center gap-1">
                        {task.tags.map((t) => (
                          <span key={t.id} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            #{t.name}
                          </span>
                        ))}
                        {task.description && (
                          <span className="hidden text-xs text-muted-foreground xl:inline">
                            {task.description.slice(0, 60)}
                            {task.description.length > 60 ? "..." : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.category ? (
                    <ColoredChip color={task.category.color} label={task.category.name} />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <PriorityChip priority={task.priority} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  <DueLabel iso={task.dueDate} />
                </TableCell>
                <TableCell>
                  <Select value={task.status.id} onValueChange={(v) => onInlineStatus(task, v)}>
                    <SelectTrigger
                      size="sm"
                      className="w-full min-w-32 sm:w-40"
                      aria-label={`Ubah status tugas ${task.title}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: task.status.color }}
                          aria-hidden
                        />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Ubah tugas ${task.title}`}
                    onClick={() => onEdit(task)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function BulkBar({
  count,
  statuses,
  onClear,
  onBulk,
  onDelete,
  busy,
}: {
  count: number;
  statuses: StatusData[];
  onClear: () => void;
  onBulk: (payload: { action: "status" | "priority"; statusId?: string; priority?: Priority }) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Aksi massal"
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2"
    >
      <span className="text-sm font-medium">{count} dipilih</span>

      <Select onValueChange={(v) => onBulk({ action: "status", statusId: v })} disabled={busy}>
        <SelectTrigger size="sm" className="w-44" aria-label="Ubah status tugas terpilih">
          <SelectValue placeholder="Ubah status..." />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onBulk({ action: "priority", priority: v as Priority })} disabled={busy}>
        <SelectTrigger size="sm" className="w-44" aria-label="Ubah prioritas tugas terpilih">
          <SelectValue placeholder="Ubah prioritas..." />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_META[p].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" variant="outline" onClick={onDelete} disabled={busy}>
        Hapus
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={busy}>
        Bersihkan pilihan
      </Button>
    </div>
  );
}
