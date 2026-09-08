import { NextResponse } from "next/server";
import { createSession, isSameOrigin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
  }

  await createSession(user.id, parsed.data.remember ?? false);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
