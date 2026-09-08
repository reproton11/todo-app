import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStreak } from "@/lib/recurrence";
import { serializeTask, taskInclude } from "@/lib/task-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [total, completedToday, pending, overdue, recentCompletions, upcomingRaw] =
    await Promise.all([
      prisma.task.count({ where: { userId: user.id } }),
      prisma.task.count({
        where: { userId: user.id, completedAt: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.task.count({ where: { userId: user.id, status: { isDone: false } } }),
      prisma.task.count({
        where: { userId: user.id, status: { isDone: false }, dueDate: { lt: now } },
      }),
      prisma.task.findMany({
        where: { userId: user.id, completedAt: { not: null, gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
        select: { completedAt: true },
      }),
      prisma.task.findMany({
        where: { userId: user.id, status: { isDone: false }, dueDate: { not: null } },
        include: taskInclude,
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

  const streak = computeStreak(
    recentCompletions.map((t) => t.completedAt as Date),
    now,
  );

  return NextResponse.json({
    stats: {
      total,
      completedToday,
      pending,
      overdue,
      streak,
      upcoming: upcomingRaw.map(serializeTask),
    },
  });
}
