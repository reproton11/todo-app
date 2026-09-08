export type RecurrenceRule = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

// ponytail: MONTHLY pakai setMonth murni (31 Jan -> 3 Mar); normalisasi akhir bulan kalau dibutuhkan
export function nextOccurrence(
  from: Date,
  rule: RecurrenceRule,
  intervalDays?: number | null,
): Date | null {
  if (rule === "NONE") return null;
  const d = new Date(from);
  switch (rule) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "CUSTOM": {
      const n = intervalDays && intervalDays > 0 ? intervalDays : 1;
      d.setDate(d.getDate() + n);
      break;
    }
  }
  return d;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function computeStreak(completedDates: Date[], now: Date = new Date()): number {
  const set = new Set(completedDates.map(dateKey));
  const cursor = new Date(now);
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
