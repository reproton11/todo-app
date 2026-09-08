import { NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const status = await prisma.status.findFirst({ where: { id, userId: user.id } });
  if (!status) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 404 });

  if (status.isDone && parsed.data.isDone === false) {
    const doneCount = await prisma.status.count({ where: { userId: user.id, isDone: true } });
    if (doneCount <= 1) {
      return NextResponse.json({ error: "Minimal harus ada satu status selesai" }, { status: 409 });
    }
  }

  await prisma.status.update({
    where: { id },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      isDone: parsed.data.isDone ?? status.isDone,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const status = await prisma.status.findFirst({ where: { id, userId: user.id } });
  if (!status) return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 404 });

  const total = await prisma.status.count({ where: { userId: user.id } });
  if (total <= 1) {
    return NextResponse.json({ error: "Minimal harus ada satu status" }, { status: 409 });
  }

  const taskCount = await prisma.task.count({ where: { statusId: id } });
  if (taskCount > 0) {
    return NextResponse.json(
      { error: `Masih ada ${taskCount} tugas di status ini. Pindahkan dulu.` },
      { status: 409 },
    );
  }

  await prisma.status.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
