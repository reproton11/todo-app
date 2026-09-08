"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Repeat } from "lucide-react";
import { PriorityChip, ColoredChip } from "@/components/tasks/priority-badge";
import { DueLabel } from "@/components/tasks/due-label";
import { MagicCard } from "@/components/magicui/magic-card";
import { PRIORITY_META } from "@/lib/priority";
import type { TaskData } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function TaskCard({ task }: { task: TaskData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { statusId: task.status.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-50")}
    >
      <MagicCard
        gradientFrom="var(--primary)"
        gradientTo="var(--accent)"
        gradientColor="rgba(13, 148, 136, 0.06)"
        gradientOpacity={0.6}
        className="rounded-lg border bg-card px-3 py-2.5"
      >
        <div className="flex items-start gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Seret tugas ${task.title}`}
            className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Link
              href={`/tasks/${task.id}`}
              className={cn(
                "line-clamp-3 text-sm font-medium underline-offset-4 hover:underline",
                task.status.isDone && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </Link>
            <div className="flex flex-wrap items-center gap-1">
              <PriorityChip priority={task.priority} />
              {task.category && <ColoredChip color={task.category.color} label={task.category.name} />}
              {task.recurrence !== "NONE" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Repeat className="size-3" aria-hidden /> berulang
                </span>
              )}
            </div>
            <DueLabel iso={task.dueDate} className="block text-xs" />
          </div>
          <span
            className="mt-1 h-8 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: PRIORITY_META[task.priority].bar }}
            aria-hidden
          />
        </div>
      </MagicCard>
    </div>
  );
}
