import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask, taskInclude } from "@/lib/task-utils";
import { TaskDetail } from "@/components/tasks/task-detail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id }, include: taskInclude });
  if (!task) notFound();

  return <TaskDetail task={serializeTask(task)} />;
}
