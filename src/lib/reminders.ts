import "server-only";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { sendReminderEmail } from "@/lib/email";
import { APP_URL } from "@/lib/app-url";

export async function runReminderScan() {
  const now = Date.now();
  const from = new Date(now - 5 * 60 * 1000);
  const until = new Date(now + 5 * 60 * 1000);

  const dueTasks = await prisma.task.findMany({
    where: { dueDate: { gte: from, lte: until }, status: { isDone: false } },
    include: { user: { include: { setting: true } } },
  });

  let notified = 0;
  for (const task of dueTasks) {
    const already = await prisma.notification.findFirst({
      where: {
        userId: task.userId,
        taskId: task.id,
        type: "REMINDER",
        createdAt: { gte: new Date(now - 60 * 60 * 1000) },
      },
    });
    if (already) continue;

    const dueLabel = task.dueDate
      ? task.dueDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })
      : null;

    await prisma.notification.create({
      data: {
        userId: task.userId,
        title: `Tenggat: ${task.title}`,
        body: dueLabel ? `Jatuh tempo ${dueLabel}` : null,
        type: "REMINDER",
        taskId: task.id,
      },
    });

    if (task.user.setting?.pushNotification) {
      await sendPushToUser(task.userId, {
        title: "TugasKu: Pengingat",
        body: task.title,
        url: `/tasks/${task.id}`,
      });
    }
    if (task.user.setting?.emailNotification) {
      const to = task.user.setting.reminderEmail || task.user.email;
      await sendReminderEmail(
        to,
        {
          name: task.user.name,
          title: task.title,
          dueLabel,
          description: task.description,
        },
      );
    }
    notified++;
  }

  return { ok: true, checked: dueTasks.length, notified };
}

export function taskLink(taskId: string) {
  return `${APP_URL}/tasks/${taskId}`;
}
