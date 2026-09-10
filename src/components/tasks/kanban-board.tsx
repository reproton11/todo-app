"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DragOverlay } from "@dnd-kit/core";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/task-card";
import { apiFetch, type StatusData, type TaskData } from "@/lib/api-client";

export function KanbanBoard({
  statuses,
  tasks,
  onBoardChanged,
}: {
  statuses: StatusData[];
  tasks: TaskData[];
  onBoardChanged: () => void;
}) {
  const [local, setLocal] = useState<TaskData[]>(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLocal(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = useMemo(() => {
    const map = new Map<string, TaskData[]>();
    for (const s of statuses) map.set(s.id, []);
    for (const t of local) map.get(t.status.id)?.push(t);
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [statuses, local]);

  const activeTask = local.find((t) => t.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = local.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = String(over.id);
    const isColumn = statuses.some((s) => s.id === overId);
    const targetStatusId = isColumn ? overId : String((over.data.current as { statusId?: string })?.statusId ?? "");
    if (!targetStatusId) return;

    const targetColumn = (byStatus.get(targetStatusId) ?? []).filter((t) => t.id !== activeTask.id);

    let index: number;
    if (isColumn) {
      index = targetColumn.length;
    } else {
      const overIndex = targetColumn.findIndex((t) => t.id === overId);
      index = overIndex === -1 ? targetColumn.length : overIndex;
    }

    if (activeTask.status.id === targetStatusId) {
      const currentOrder = byStatus.get(targetStatusId) ?? [];
      const currentIndex = currentOrder.findIndex((t) => t.id === activeTask.id);
      if (currentIndex === index) return;
    }

    // optimistis di klien: pindahkan kartu lalu renumber kedua kolom terdampak
    const moved = { ...activeTask, status: { ...activeTask.status, id: targetStatusId } };
    const rest = local.filter((t) => t.id !== moved.id);
    const srcCol = rest
      .filter((t) => t.status.id === activeTask.status.id)
      .sort((a, b) => a.order - b.order)
      .map((t, i) => ({ ...t, order: i }));
    const tgtCol = rest
      .filter((t) => t.status.id === targetStatusId)
      .sort((a, b) => a.order - b.order);
    tgtCol.splice(Math.min(index, tgtCol.length), 0, moved);
    const renumberedTarget = tgtCol.map((t, i) => ({ ...t, order: i }));
    const others = rest.filter(
      (t) => t.status.id !== activeTask.status.id && t.status.id !== targetStatusId,
    );
    setLocal([...srcCol, ...renumberedTarget, ...others]);

    // Keadaan optimistis dipertahankan; muat ulang hanya saat gagal (mengembalikan posisi).
    try {
      await apiFetch("/api/tasks/reorder", {
        method: "POST",
        body: JSON.stringify({ id: activeTask.id, statusId: targetStatusId, index }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan tugas");
      onBoardChanged();
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <BoardColumn key={status.id} status={status} items={byStatus.get(status.id) ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rounded-lg border bg-card px-3 py-2.5 shadow-lg">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const BoardColumn = memo(function BoardColumn({ status, items }: { status: StatusData; items: TaskData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <section
      aria-label={`Kolom ${status.name}`}
      className="flex w-72 shrink-0 snap-start flex-col rounded-lg border bg-muted/40"
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden />
        <h2 className="text-sm font-semibold">{status.name}</h2>
        <span className="ml-auto rounded-full bg-secondary px-2 text-xs font-medium tabular-nums">
          {items.length}
        </span>
      </header>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-28 max-h-[62svh] flex-1 flex-col gap-2 overflow-y-auto px-2.5 py-2.5 ${
            isOver ? "bg-secondary/60" : ""
          }`}
        >
          {items.length === 0 && (
            <p className="flex min-h-24 items-center justify-center rounded-md border border-dashed px-3 text-center text-xs text-muted-foreground">
              {status.isDone ? "Tidak ada tugas selesai di sini" : "Lepas tugas di sini"}
            </p>
          )}
          {items.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
});
