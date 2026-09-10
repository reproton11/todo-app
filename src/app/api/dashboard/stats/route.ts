import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json({ stats: await getDashboardStats(user.id) });
}
