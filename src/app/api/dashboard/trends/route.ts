import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDashboardTrends } from "@/lib/dashboard";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  return NextResponse.json({ days: await getDashboardTrends(user.id, Number(sp.get("days")) || 14) });
}
