import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { hashPassword, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Tautan tidak valid atau sudah kedaluwarsa" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ ok: true, message: "Kata sandi berhasil diubah, silakan masuk" });
}
