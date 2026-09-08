"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleCheckBig,
  Flame,
  ListTodo,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/blur-fade";
import { PriorityChip } from "@/components/tasks/priority-badge";
import { DueLabel } from "@/components/tasks/due-label";
import { apiFetch, type DashboardStats, type TrendPoint } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        apiFetch<{ stats: DashboardStats }>("/api/dashboard/stats"),
        apiFetch<{ days: TrendPoint[] }>("/api/dashboard/trends?days=14"),
      ]);
      setStats(s.stats);
      setTrends(t.days);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dasbor");
    }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => void load();
    window.addEventListener("tugasku:refresh", onRefresh);
    return () => window.removeEventListener("tugasku:refresh", onRefresh);
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <EmptyState
          icon={ListTodo}
          title="Tidak bisa memuat dasbor"
          description={error}
          action={
            <Button variant="outline" onClick={() => void load()}>
              Coba lagi
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
            value={stats?.total}
            hint="semua tugas tercatat"
          />
          <StatCard
            icon={CircleCheckBig}
            label="Selesai Hari Ini"
            value={stats?.completedToday}
            hint="tugas diselesaikan hari ini"
            accent
          />
          <StatCard
            icon={CalendarClock}
            label="Belum Selesai"
            value={stats?.pending}
            hint={
              stats && stats.overdue > 0 ? `${stats.overdue} terlambat` : "semua masih terkendali"
            }
            danger={!!stats && stats.overdue > 0}
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={stats?.streak}
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
            {trends.length === 0 ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d: string) =>
                        new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                      }
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      cursor={{ fill: "var(--secondary)" }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(d) =>
                        new Date(`${String(d)}T00:00:00`).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="created" name="Dibuat" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completed" name="Selesai" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenggat terdekat</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <div className="grid gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats.upcoming.length === 0 ? (
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
