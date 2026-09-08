import { NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstZodMessage, serializeTask, taskInclude } from "@/lib/task-utils";
import { isPriority } from "@/lib/priority";
import { z } from "zod";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu tugas").max(200),
  action: z.enum(["delete", "status", "priority"]),
  statusId: z.string().optional(),
  priority: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }
  const { ids, action, statusId, priority } = parsed.data;
  const owned = { id: { in: ids }, userId: user.id };

  if (action === "delete") {
    const result = await prisma.task.deleteMany({ where: owned });
    return NextResponse.json({ ok: true, affected: result.count });
  }

  if (action === "priority") {
    if (!priority || !isPriority(priority)) {
      return NextResponse.json({ error: "Prioritas tidak valid" }, { status: 400 });
    }
    const result = await prisma.task.updateMany({ where: owned, data: { priority } });
    return NextResponse.json({ ok: true, affected: result.count });
  }

  if (!statusId) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  const newStatus = await prisma.status.findFirst({ where: { id: statusId, userId: user.id } });
  if (!newStatus) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 400 });

  const tasks = await prisma.task.findMany({ where: owned, include: taskInclude });
  let affected = 0;
  for (const task of tasks) {
    const completing = newStatus.isDone && !task.status.isDone;
    const reopening = !newStatus.isDone && task.completedAt !== null;
    await prisma.task.update({
      where: { id: task.id },
      data: {
        statusId,
        ...(completing ? { completedAt: new Date() } : {}),
        ...(reopening ? { completedAt: null } : {}),
      },
    });
    affected++;
  }

  const updated = await prisma.task.findMany({
    where: { id: { in: tasks.map((t) => t.id) }, userId: user.id },
    include: taskInclude,
  });
  return NextResponse.json({ ok: true, affected, tasks: updated.map(serializeTask) });
}
