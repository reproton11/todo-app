import { NextResponse } from "next/server";
import { runReminderScan } from "@/lib/reminders";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return header === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json(await runReminderScan());
}

export async function POST(req: Request) {
  return GET(req);
}
