import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { forgotSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  let devLink: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${APP_URL}/reset-password?token=${token}`;
    const { delivered } = await sendEmail(
      email,
      "Atur Ulang Kata Sandi TugasKu",
      `<p>Halo ${user.name},</p><p>Klik tautan berikut untuk mengatur ulang kata sandi (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p>`,
    );
    if (!delivered) devLink = link;
  }

  return NextResponse.json({
    ok: true,
    message:
      "Jika email terdaftar, tautan pengaturan ulang sudah dikirim. Cek juga log server saat mode dev.",
    devLink,
  });
}
