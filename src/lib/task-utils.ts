import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isPriority, type Priority } from "@/lib/priority";
import type { TaskData } from "@/lib/api-client";
import { nextOccurrence, type RecurrenceRule } from "@/lib/recurrence";
import { getFirstStatusId } from "@/lib/seed-user";

export type DbClient = PrismaClient | Prisma.TransactionClient;
export type Tx = Prisma.TransactionClient;

export const taskInclude = {
  status: true,
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function serializeTask(t: TaskWithRelations): TaskData {
  const priority: Priority = isPriority(t.priority) ? t.priority : "MEDIUM";
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority,
    status: {
      id: t.status.id,
      name: t.status.name,
      color: t.status.color,
      isDone: t.status.isDone,
      order: t.status.order,
    },
    category: t.category
      ? { id: t.category.id, name: t.category.name, color: t.category.color }
      : null,
    tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    recurrence: t.recurrence,
    recurrenceInterval: t.recurrenceInterval,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function firstZodMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Data tidak valid";
}

export async function nextOrderForStatus(userId: string, statusId: string, client: DbClient = prisma) {
  const last = await client.task.findFirst({
    where: { userId, statusId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

type SpawnSource = {
  userId: string;
  title: string;
  description: string | null;
  priority: string;
  categoryId: string | null;
  dueDate: Date | null;
  recurrence: string;
  recurrenceInterval: number | null;
};

export async function spawnNextOccurrence(tx: Tx, task: SpawnSource) {
  if (task.recurrence === "NONE") return null;
  const next = nextOccurrence(
    task.dueDate ?? new Date(),
    task.recurrence as RecurrenceRule,
    task.recurrenceInterval,
  );
  if (!next) return null;
  const firstStatusId = await getFirstStatusId(task.userId);
  if (!firstStatusId) return null;
  const order = await nextOrderForStatus(task.userId, firstStatusId, tx);
  return tx.task.create({
    data: {
      userId: task.userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      statusId: firstStatusId,
      categoryId: task.categoryId,
      dueDate: next,
      recurrence: task.recurrence,
      recurrenceInterval: task.recurrenceInterval,
      order,
    },
    include: taskInclude,
  });
}
