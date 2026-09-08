import type { Priority } from "@/lib/priority";

export type TaskData = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: { id: string; name: string; color: string; isDone: boolean; order: number };
  category: { id: string; name: string; color: string } | null;
  tags: { id: string; name: string }[];
  dueDate: string | null;
  completedAt: string | null;
  recurrence: string;
  recurrenceInterval: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryData = { id: string; name: string; color: string };
export type StatusData = {
  id: string;
  name: string;
  color: string;
  order: number;
  isDone: boolean;
};
export type TagData = { id: string; name: string };

export type DashboardStats = {
  total: number;
  completedToday: number;
  pending: number;
  overdue: number;
  streak: number;
  upcoming: TaskData[];
};

export type TrendPoint = { date: string; created: number; completed: number };

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(body?.error ?? `Permintaan gagal (${res.status})`);
  }
  return body as T;
}
