import { NextResponse } from "next/server";
import { destroySession, getSessionUser, isSameOrigin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, avatarUrl: parsed.data.avatarUrl || null },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password) {
    return NextResponse.json({ error: "Konfirmasi kata sandi diperlukan" }, { status: 400 });
  }

  const full = await prisma.user.findUnique({ where: { id: user.id } });
  if (!full || !(await verifyPassword(body.password, full.passwordHash))) {
    return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();

  return NextResponse.json({ ok: true, message: "Akun dan seluruh data telah dihapus" });
}
