import { NextResponse } from "next/server";
import { createSession, hashPassword, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedUserDefaults } from "@/lib/seed-user";
import { registerSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, name: parsed.data.name.trim(), passwordHash },
  });
  await seedUserDefaults(user.id, "MEDIUM");
  await createSession(user.id);

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
