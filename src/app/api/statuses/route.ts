import { NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "@/lib/validations";
import { firstZodMessage } from "@/lib/task-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const statuses = await prisma.status.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ statuses });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const last = await prisma.status.findFirst({
    where: { userId: user.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const status = await prisma.status.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      color: parsed.data.color,
      isDone: parsed.data.isDone ?? false,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json({ status }, { status: 201 });
}
