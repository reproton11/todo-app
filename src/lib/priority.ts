export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

type PriorityMeta = {
  label: string;
  rank: number;
  chip: string;
  bar: string;
};

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  LOW: {
    label: "Rendah",
    rank: 0,
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    bar: "#94a3b8",
  },
  MEDIUM: {
    label: "Sedang",
    rank: 1,
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    bar: "#3b82f6",
  },
  HIGH: {
    label: "Tinggi",
    rank: 2,
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    bar: "#f97316",
  },
  URGENT: {
    label: "Mendesak",
    rank: 3,
    chip: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    bar: "#ef4444",
  },
};

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}
