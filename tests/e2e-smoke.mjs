const BASE = "http://localhost:3000";
let cookie = "";

async function req(method, path, body, extraHeaders = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...(cookie ? { Cookie: cookie } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) cookie = c.split(";")[0];
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json, location: res.headers.get("location") };
}

function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) process.exitCode = 1;
}

const email = `smoke_${Date.now()}@test.local`;
const CRON_SECRET = "c2c78e686b279fe6f6702feca0eede57234f060d885b02d8";

let r = await req("POST", "/api/auth/register", { name: "Smoke Tester", email, password: "rahasia123" });
assert(r.status === 200 && r.json?.user?.id, "register 200 + user dibuat");

r = await req("POST", "/api/auth/register", { name: "Smoke Tester", email, password: "rahasia123" });
assert(r.status === 409, "register email duplikat 409");

r = await req("GET", "/api/statuses");
assert(r.status === 200 && r.json.statuses.length === 3, "3 status bawaan");
const done = r.json.statuses.find((s) => s.isDone);
const first = r.json.statuses[0];

r = await req("GET", "/api/categories");
assert(r.status === 200 && r.json.categories.length === 7, "7 kategori bawaan");

r = await req("POST", "/api/tasks", {
  title: "Tugas berulang smoke",
  statusId: first.id,
  priority: "HIGH",
  dueDate: new Date().toISOString(),
  recurrence: "DAILY",
  tags: ["smoke", "uji"],
});
assert(r.status === 201 && r.json.task, "buat tugas 201");
const task = r.json.task;
assert(task.tags.length === 2, "2 tag tersimpan");

r = await req("GET", "/api/tasks?q=berulang");
assert(r.json.tasks.length === 1, "pencarian q=berulang menemukan 1");

r = await req("PATCH", `/api/tasks/${task.id}`, { statusId: done.id });
assert(r.status === 200 && r.json.task.completedAt, "menyelesaikan tugas set completedAt");
assert(
  r.json.spawned && r.json.spawned.title === task.title && r.json.spawned.recurrence === "DAILY",
  "tugas berulang menghasilkan kembaran berikutnya",
);
assert(r.json.task.recurrence === "DAILY", "PATCH tidak menimpa recurrence");
assert(r.json.task.tags.length === 2, "PATCH tidak menghapus tags");

r = await req("GET", "/api/dashboard/stats");
assert(
  r.status === 200 && r.json.stats.completedToday >= 1 && r.json.stats.total >= 2 && r.json.stats.streak >= 1,
  "stats: total, completedToday, streak",
);

r = await req("GET", "/api/dashboard/trends?days=7");
assert(r.status === 200 && r.json.days.length === 7, "tren 7 hari");

r = await req("PATCH", "/api/settings", {
  defaultPriority: "HIGH",
  pushNotification: false,
  emailNotification: false,
  theme: "DARK",
});
assert(r.status === 200, "pengaturan PATCH 200");

const csvRes = await fetch(BASE + "/api/settings/export?format=csv", { headers: { Cookie: cookie } });
const csv = await csvRes.text();
assert(csvRes.status === 200 && csv.includes("judul") && csv.includes("Tugas berulang smoke"), "ekspor CSV berisi tugas");

r = await req("POST", "/api/tasks/bulk", { ids: [task.id], action: "priority", priority: "LOW" });
assert(r.status === 200 && r.json.affected >= 1, "aksi massal prioritas");

r = await req("GET", "/api/cron/reminders", null, { "x-cron-secret": CRON_SECRET });
assert(r.status === 200, "cron reminders 200");
r = await req("GET", "/api/cron/reminders", null, { "x-cron-secret": "salah" });
assert(r.status === 401, "cron secret salah 401");

r = await req("POST", "/api/auth/forgot-password", { email });
const devLink = r.json?.devLink;
assert(!!devLink, "lupa sandi menghasilkan devLink (fallback email)");

cookie = "";
r = await req("GET", "/api/tasks");
assert(r.status === 401, "API tanpa sesi 401");

const token = new URL(devLink).searchParams.get("token");
r = await req("PATCH", "/api/auth/reset-password", { token, password: "sandiBaru99" });
assert(r.status === 200, "reset kata sandi 200");

r = await req("POST", "/api/auth/login", { email, password: "sandiBaru99", remember: true });
assert(r.status === 200, "login dengan sandi baru 200");

const guard = await fetch(BASE + "/dashboard", { redirect: "manual" });
assert(guard.status === 307 && (guard.headers.get("location") ?? "").includes("/"), "guard /dashboard redirect tanpa sesi");

r = await req("DELETE", "/api/account", { password: "sandiBaru99" });
assert(r.status === 200, "hapus akun 200");

r = await req("POST", "/api/auth/login", { email, password: "sandiBaru99" });
assert(r.status === 401, "login setelah akun dihapus 401");

console.log(process.exitCode ? "== SMOKE TEST GAGAL ==" : "== SMOKE TEST LULUS SEMUA ==");
