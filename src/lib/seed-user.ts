import "server-only";
import { prisma } from "@/lib/prisma";

const DEFAULT_STATUSES = [
  { name: "Belum Dimulai", color: "#64748b", isDone: false },
  { name: "Dikerjakan", color: "#2563eb", isDone: false },
  { name: "Selesai", color: "#0d9488", isDone: true },
];

const DEFAULT_CATEGORIES = [
  { name: "Kerja", color: "#2563eb" },
  { name: "Pribadi", color: "#16a34a" },
  { name: "Belanja", color: "#d97706" },
  { name: "Kesehatan", color: "#dc2626" },
  { name: "Keuangan", color: "#059669" },
  { name: "Belajar", color: "#7c3aed" },
  { name: "Lainnya", color: "#64748b" },
];

export async function seedUserDefaults(userId: string, defaultPriority: string) {
  await prisma.status.createMany({
    data: DEFAULT_STATUSES.map((s, i) => ({ ...s, userId, order: i })),
  });
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
  await prisma.setting.create({ data: { userId, defaultPriority } });
}

export async function getFirstStatusId(userId: string) {
  const status = await prisma.status.findFirst({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return status?.id ?? null;
}
