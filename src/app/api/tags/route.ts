import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstZodMessage } from "@/lib/task-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json({
    tags: tags.map((t) => ({ id: t.id, name: t.name, taskCount: t._count.tasks })),
  });
}

const createSchema = z.object({
  name: z.string().min(1, "Nama tag wajib diisi").max(30),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.tag.findFirst({
    where: { userId: user.id, name: { equals: parsed.data.name } },
  });
  if (existing) return NextResponse.json({ tag: existing });

  const tag = await prisma.tag.create({ data: { userId: user.id, name: parsed.data.name } });
  return NextResponse.json({ tag }, { status: 201 });
}
