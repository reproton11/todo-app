"use client";

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
import type { TrendPoint } from "@/lib/api-client";

export function ActivityChart({ data }: { data: TrendPoint[] }) {
  if (data.every((p) => p.created === 0 && p.completed === 0)) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Belum ada aktivitas 14 hari terakhir. Selesaikan satu tugas dan grafik akan terisi.
      </p>
    );
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
  );
}
