import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskCreateSchema } from "@/lib/validations";
import { firstZodMessage, nextOrderForStatus, serializeTask, taskInclude } from "@/lib/task-utils";
import { PRIORITY_META, isPriority } from "@/lib/priority";
import type { TaskWithRelations } from "@/lib/task-utils";
import { resolveTagIds } from "@/lib/tags";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const where: Prisma.TaskWhereInput = { userId: user.id };

  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];

  const statusId = sp.get("statusId");
  if (statusId === "pending") where.status = { isDone: false };
  else if (statusId === "done") where.status = { isDone: true };
  else if (statusId) where.statusId = statusId;

  const priority = sp.get("priority");
  if (priority && isPriority(priority)) where.priority = priority;

  const categoryId = sp.get("categoryId");
  if (categoryId === "none") where.categoryId = null;
  else if (categoryId) where.categoryId = categoryId;

  const tagId = sp.get("tagId");
  if (tagId) where.tags = { some: { tagId } };

  const dueFrom = parseDate(sp.get("dueFrom"), false);
  const dueTo = parseDate(sp.get("dueTo"), true);
  if (dueFrom || dueTo) {
    where.dueDate = {
      ...(dueFrom ? { gte: dueFrom } : {}),
      ...(dueTo ? { lte: dueTo } : {}),
    };
  }

  let tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    take: Number(sp.get("limit")) || 500,
  });

  // ponytail: sort di JS agar nulls-last konsisten & rank prioritas; query per-user kecil
  const sort = sp.get("sort") ?? "createdAt";
  const dir = sp.get("dir") === "asc" ? 1 : -1;
  tasks = [...tasks].sort((a, b) => {
    switch (sort) {
      case "title":
        return dir * a.title.localeCompare(b.title, "id");
      case "dueDate": {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dir * (a.dueDate.getTime() - b.dueDate.getTime());
      }
      case "priority":
        return dir * (PRIORITY_META[b.priority as keyof typeof PRIORITY_META].rank - PRIORITY_META[a.priority as keyof typeof PRIORITY_META].rank);
      default:
        return dir * (a.createdAt.getTime() - b.createdAt.getTime());
    }
  });

  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  const status = await prisma.status.findFirst({ where: { id: data.statusId, userId: user.id } });
  if (!status) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 400 });

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });
    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
  }

  const order = await nextOrderForStatus(user.id, data.statusId);
  const tagIds = await resolveTagIds(user.id, data.tags ?? []);

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: data.title,
      description: data.description ?? null,
      statusId: data.statusId,
      priority: data.priority,
      categoryId: data.categoryId ?? null,
      dueDate: data.dueDate ?? null,
      recurrence: data.recurrence,
      recurrenceInterval: data.recurrenceInterval ?? null,
      order,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: taskInclude,
  });

  return NextResponse.json({ task: serializeTask(task as TaskWithRelations) }, { status: 201 });
}

function parseDate(value: string | null, endOfDay: boolean) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay && value.length <= 10) d.setHours(23, 59, 59, 999);
  return d;
}
