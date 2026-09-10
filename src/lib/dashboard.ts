import "server-only";
import { prisma } from "@/lib/prisma";
import { computeStreak } from "@/lib/recurrence";
import { serializeTask, taskInclude } from "@/lib/task-utils";
import type { DashboardStats, TrendPoint } from "@/lib/api-client";

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [total, completedToday, pending, overdue, recentCompletions, upcomingRaw] =
    await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({
        where: { userId, completedAt: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.task.count({ where: { userId, status: { isDone: false } } }),
      prisma.task.count({
        where: { userId, status: { isDone: false }, dueDate: { lt: now } },
      }),
      prisma.task.findMany({
        where: { userId, completedAt: { not: null, gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
        select: { completedAt: true },
      }),
      prisma.task.findMany({
        where: { userId, status: { isDone: false }, dueDate: { not: null } },
        include: taskInclude,
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

  return {
    total,
    completedToday,
    pending,
    overdue,
    streak: computeStreak(
      recentCompletions.map((t) => t.completedAt as Date),
      now,
    ),
    upcoming: upcomingRaw.map(serializeTask),
  };
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export async function getDashboardTrends(userId: string, days = 14): Promise<TrendPoint[]> {
  const clamped = Math.min(Math.max(days, 7), 90);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (clamped - 1));

  const [created, completed] = await Promise.all([
    prisma.task.findMany({
      where: { userId, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.task.findMany({
      where: { userId, completedAt: { not: null, gte: start } },
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

  const points: TrendPoint[] = [];
  for (let i = 0; i < clamped; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKey(d);
    points.push({
      date: key,
      created: createdMap.get(key) ?? 0,
      completed: completedMap.get(key) ?? 0,
    });
  }
  return points;
}
