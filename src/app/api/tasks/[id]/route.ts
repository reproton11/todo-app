import { NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations";
import {
  firstZodMessage,
  serializeTask,
  spawnNextOccurrence,
  taskInclude,
} from "@/lib/task-utils";
import { resolveTagIds } from "@/lib/tags";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const { id } = await ctx.params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ task: serializeTask(task) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ?? null;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval ?? null;
  if (data.tags !== undefined) {
    const tagIds = await resolveTagIds(user.id, data.tags);
    updateData.tags = { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) };
  }
  if (data.categoryId !== undefined) {
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id },
      });
      if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
    }
    updateData.categoryId = data.categoryId ?? null;
  }

  let completing = false;
  if (data.statusId && data.statusId !== task.statusId) {
    const newStatus = await prisma.status.findFirst({
      where: { id: data.statusId, userId: user.id },
    });
    if (!newStatus) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 400 });
    completing = newStatus.isDone && !task.status.isDone;
    const reopening = !newStatus.isDone && task.completedAt !== null;
    updateData.statusId = data.statusId;
    if (completing) updateData.completedAt = new Date();
    else if (reopening) updateData.completedAt = null;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({ where: { id: task.id }, data: updateData, include: taskInclude });
    let spawned = null;
    if (completing) {
      spawned = await spawnNextOccurrence(tx, updated);
    }
    return { updated, spawned };
  });

  return NextResponse.json({
    task: serializeTask(result.updated),
    spawned: result.spawned ? serializeTask(result.spawned) : null,
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const deleted = await prisma.task.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
