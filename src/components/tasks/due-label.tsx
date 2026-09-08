export type DueTone = "normal" | "soon" | "overdue";

export function dueInfo(dueISO: string | null): { text: string; tone: DueTone } | null {
  if (!dueISO) return null;
  const due = new Date(dueISO);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  const time = due.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (due < now && dayDiff <= 0) {
    return { text: `Terlambat, ${time}`, tone: "overdue" };
  }
  if (dayDiff === 0) return { text: `Hari ini, ${time}`, tone: "soon" };
  if (dayDiff === 1) return { text: `Besok, ${time}`, tone: "soon" };
  if (dayDiff === -1) return { text: `Kemarin, ${time}`, tone: "overdue" };

  const date = due.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return { text: `${date}, ${time}`, tone: "normal" };
}

export function DueLabel({ iso, className }: { iso: string | null; className?: string }) {
  const info = dueInfo(iso);
  if (!info) return <span className={className}>-</span>;
  return (
    <span
      className={`${className ?? ""} ${
        info.tone === "overdue"
          ? "font-medium text-destructive"
          : info.tone === "soon"
            ? "font-medium text-accent-foreground"
            : "text-muted-foreground"
      }`}
    >
      {info.text}
    </span>
  );
}
