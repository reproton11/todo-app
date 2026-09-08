import { PRIORITY_META, type Priority } from "@/lib/priority";
import { cn } from "@/lib/utils";

export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.chip,
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.bar }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function ColoredChip({
  color,
  label,
  className,
}: {
  color: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-32 items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
