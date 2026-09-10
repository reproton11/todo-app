import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstZodMessage, serializeTask, spawnNextOccurrence, taskInclude } from "@/lib/task-utils";

const reorderSchema = z.object({
  id: z.string().min(1),
  statusId: z.string().min(1),
  index: z.number().int().min(0).max(999),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }
  const { id, statusId, index } = parsed.data;

  const task = await prisma.task.findFirst({ where: { id, userId: user.id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  const targetStatus = await prisma.status.findFirst({ where: { id: statusId, userId: user.id } });
  if (!targetStatus) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 400 });

  const completing = targetStatus.isDone && !task.status.isDone;
  const reopening = !targetStatus.isDone && task.completedAt !== null;

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.task.findMany({
      where: { userId: user.id, statusId, id: { not: id } },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });
    const at = Math.min(Math.max(index, 0), target.length);
    target.splice(at, 0, { id, order: -1 });

    // Hanya baris yang posisinya berubah yang ditulis ulang.
    const renumber = target.flatMap((row, i) =>
      row.id !== id && row.order !== i ? [tx.task.update({ where: { id: row.id }, data: { order: i } })] : [],
    );

    let vacate: Promise<unknown>[] = [];
    if (task.statusId !== statusId) {
      const source = await tx.task.findMany({
        where: { userId: user.id, statusId: task.statusId, id: { not: id } },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });
      vacate = source.flatMap((row, i) =>
        row.order !== i ? [tx.task.update({ where: { id: row.id }, data: { order: i } })] : [],
      );
    }

    const [updated] = await Promise.all([
      tx.task.update({
        where: { id },
        data: {
          statusId,
          order: at,
          ...(completing ? { completedAt: new Date() } : {}),
          ...(reopening ? { completedAt: null } : {}),
        },
        include: taskInclude,
      }),
      ...renumber,
      ...vacate,
    ]);

    if (completing) await spawnNextOccurrence(tx, updated);

    return updated;
  });

  return NextResponse.json({ task: serializeTask(result) });
}
