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
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      dueDate: true,
      user: {
        select: {
          email: true,
          name: true,
          setting: {
            select: { pushNotification: true, emailNotification: true, reminderEmail: true },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    // Sisa yang terpotong ikut scan berikutnya; jendela 10 menit jauh lebih lebar dari interval 60 detik.
    take: 100,
  });
  if (!dueTasks.length) return { ok: true, checked: 0, notified: 0 };

  // Satu query dedupe untuk semua tugas pengganti findFirst per tugas.
  const recent = await prisma.notification.findMany({
    where: {
      type: "REMINDER",
      createdAt: { gte: new Date(now - 60 * 60 * 1000) },
      taskId: { in: dueTasks.map((t) => t.id) },
    },
    select: { taskId: true },
  });
  const seen = new Set(recent.map((n) => n.taskId));
  const fresh = dueTasks.filter((t) => !seen.has(t.id));

  const sends: Promise<unknown>[] = [];
  for (const task of fresh) {
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

    // Pengiriman jalan paralel; satu provider lambat tidak memblokir sisanya.
    if (task.user.setting?.pushNotification) {
      sends.push(
        sendPushToUser(task.userId, {
          title: "TugasKu: Pengingat",
          body: task.title,
          url: `/tasks/${task.id}`,
        }),
      );
    }
    if (task.user.setting?.emailNotification) {
      sends.push(
        sendReminderEmail(task.user.setting.reminderEmail || task.user.email, {
          name: task.user.name,
          title: task.title,
          dueLabel,
          description: task.description,
        }),
      );
    }
  }
  await Promise.allSettled(sends);

  return { ok: true, checked: dueTasks.length, notified: fresh.length };
}

export function taskLink(taskId: string) {
  return `${APP_URL}/tasks/${taskId}`;
}
