import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CircleCheckBig,
  Flame,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/blur-fade";
import { PriorityChip } from "@/components/tasks/priority-badge";
import { DueLabel } from "@/components/tasks/due-label";
import { getSessionUser } from "@/lib/auth";
import { getDashboardStats, getDashboardTrends } from "@/lib/dashboard";
import type { DashboardStats } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// recharts dimuat setelah HTML tampil agar tidak menahan First Paint.
import { ActivityChart } from "@/components/dashboard/activity-chart-lazy";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  let stats: DashboardStats;
  let trends: { date: string; created: number; completed: number }[];
  try {
    [stats, trends] = await Promise.all([getDashboardStats(user.id), getDashboardTrends(user.id, 14)]);
  } catch {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <EmptyState
          icon={ListTodo}
          title="Tidak bisa memuat dasbor"
          description="Terjadi gangguan saat mengambil data."
          action={
            <Button variant="outline" asChild>
              <a href="/dashboard">Coba lagi</a>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan produktivitasmu. Tekan <kbd className="rounded border bg-muted px-1 text-xs">N</kbd> untuk menambah tugas.
        </p>
      </div>

      <BlurFade direction="up" delay={0.02}>
        <section aria-label="Ringkasan statistik" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={ListTodo}
            label="Total Tugas"
            value={stats.total}
            hint="semua tugas tercatat"
          />
          <StatCard
            icon={CircleCheckBig}
            label="Selesai Hari Ini"
            value={stats.completedToday}
            hint="tugas diselesaikan hari ini"
            accent
          />
          <StatCard
            icon={CalendarClock}
            label="Belum Selesai"
            value={stats.pending}
            hint={
              stats.overdue > 0 ? `${stats.overdue} terlambat` : "semua masih terkendali"
            }
            danger={stats.overdue > 0}
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={stats.streak}
            hint="hari berturut-turut selesai ada tugas"
            beam
          />
        </section>
      </BlurFade>

      <BlurFade direction="up" delay={0.08}>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktivitas 14 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={trends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenggat terdekat</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Tidak ada tenggat mendekat. Nikmati harimu.
              </p>
            ) : (
              <ul className="grid gap-1">
                {stats.upcoming.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-secondary/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <DueLabel iso={task.dueDate} className="text-xs" />
                      </div>
                      <PriorityChip priority={task.priority} className="shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      </BlurFade>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  danger,
  beam,
}: {
  icon: typeof ListTodo;
  label: string;
  value?: number;
  hint: string;
  accent?: boolean;
  danger?: boolean;
  beam?: boolean;
}) {
  return (
    <MagicCard
      gradientFrom="var(--primary)"
      gradientTo="var(--accent)"
      gradientColor="rgba(13, 148, 136, 0.07)"
      gradientOpacity={0.7}
      className="rounded-lg border bg-card"
    >
      <CardContent className="flex items-start gap-3 px-4 py-4">
        <span
          className={cn(
            "rounded-md p-2",
            accent ? "bg-primary/15 text-primary" : danger ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">
            <NumberTicker value={value ?? 0} className="text-2xl font-bold" />
          </p>
          <p className={cn("truncate text-xs", danger ? "text-destructive" : "text-muted-foreground")}>{hint}</p>
        </div>
      </CardContent>
      {beam && <BorderBeam size={60} duration={7} colorFrom="var(--primary)" colorTo="var(--accent)" />}
    </MagicCard>
  );
}
