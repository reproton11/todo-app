"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendPoint } from "@/lib/api-client";

const ActivityChartInner = dynamic(
  () => import("@/components/dashboard/activity-chart").then((m) => m.ActivityChart),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> },
);

export function ActivityChart({ data }: { data: TrendPoint[] }) {
  return <ActivityChartInner data={data} />;
}
