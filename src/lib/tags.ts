import "server-only";
import { prisma } from "@/lib/prisma";

export async function resolveTagIds(userId: string, names: string[]) {
  const cleaned = [
    ...new Set(names.map((n) => n.trim().slice(0, 30)).filter(Boolean)),
  ];
  if (!cleaned.length) return [];

  const userTags = await prisma.tag.findMany({ where: { userId } });
  const byLower = new Map(userTags.map((t) => [t.name.toLowerCase(), t.id] as const));

  const ids: string[] = [];
  for (const name of cleaned) {
    const key = name.toLowerCase();
    let id = byLower.get(key);
    if (!id) {
      const created = await prisma.tag.create({ data: { userId, name } });
      id = created.id;
      byLower.set(key, id);
    }
    ids.push(id);
  }
  return ids;
}
