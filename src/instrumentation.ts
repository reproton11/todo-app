export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.REMINDER_SCHEDULER !== "true") return;

  // guard anti-dobel saat dev HMR: simpan timer di global
  const g = globalThis as unknown as { reminderTimer?: ReturnType<typeof setInterval> };
  if (g.reminderTimer) return;

  const { runReminderScan } = await import("@/lib/reminders");

  let running = false;
  g.reminderTimer = setInterval(() => {
    if (running) return;
    running = true;
    runReminderScan()
      .catch((err) => {
        console.error("[reminder-scheduler] gagal:", err);
      })
      .finally(() => {
        running = false;
      });
  }, 60_000);

  console.log("[reminder-scheduler] aktif: memeriksa pengingat setiap 60 detik");
}
