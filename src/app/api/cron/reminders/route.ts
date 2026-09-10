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

export const maxDuration = 60;

// Guard per instans; dedupe 60 menit di DB tetap jadi pengaman utama antar instans.
let running = false;

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  if (running) return NextResponse.json({ error: "Pemindaian masih berjalan" }, { status: 429 });
  running = true;
  try {
    return NextResponse.json(await runReminderScan());
  } finally {
    running = false;
  }
}

export async function POST(req: Request) {
  return GET(req);
}
