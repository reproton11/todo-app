import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const days = Math.min(Math.max(Number(sp.get("days")) || 14, 7), 90);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

  const [created, completed] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id, completedAt: { not: null, gte: start } },
      select: { completedAt: true },
    }),
  ]);

  const createdMap = new Map<string, number>();
  for (const t of created) {
    const key = dateKey(t.createdAt);
    createdMap.set(key, (createdMap.get(key) ?? 0) + 1);
  }
  const completedMap = new Map<string, number>();
  for (const t of completed) {
    const key = dateKey(t.completedAt as Date);
    completedMap.set(key, (completedMap.get(key) ?? 0) + 1);
  }

  const points = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKey(d);
    points.push({
      date: key,
      created: createdMap.get(key) ?? 0,
      completed: completedMap.get(key) ?? 0,
    });
  }

  return NextResponse.json({ days: points });
}
