import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tasksToCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: { status: true, category: true },
      orderBy: { createdAt: "asc" },
    });
    const csv = tasksToCsv(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        statusName: t.status.name,
        priority: t.priority,
        categoryName: t.category?.name ?? null,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
      })),
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tugasku-${stamp}.csv"`,
      },
    });
  }

  const [tasks, categories, tags, statuses] = await Promise.all([
    prisma.task.findMany({ where: { userId: user.id }, include: { tags: { include: { tag: true } } } }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.tag.findMany({ where: { userId: user.id } }),
    prisma.status.findMany({ where: { userId: user.id } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { name: user.name, email: user.email },
    statuses,
    categories,
    tags,
    tasks: tasks.map((t) => ({
      ...t,
      tags: t.tags.map((tt) => tt.tag.name),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tugasku-${stamp}.json"`,
    },
  });
}
