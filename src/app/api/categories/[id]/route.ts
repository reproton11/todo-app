import { NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const category = await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  if (category.count === 0) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const { id } = await ctx.params;
  const deleted = await prisma.category.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

  await prisma.setting.updateMany({
    where: { userId: user.id, defaultCategoryId: id },
    data: { defaultCategoryId: null },
  });

  return NextResponse.json({ ok: true });
}
