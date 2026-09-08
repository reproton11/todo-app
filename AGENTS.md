<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## TugasKu, konvensi project

- Stack: Next.js 16 (App Router, proxy.ts bukan middleware), TypeScript, Tailwind v4, shadcn/ui (radix), Prisma 6 + SQLite (`file:./dev.db`), Zustand, jose + bcryptjs.
- Perintah: `npm run dev`, `npm run build`, `npm run lint`, `npm test` (node --experimental-strip-types --test tests/).
- Arah visual: baca `DESIGN.md` sebelum mengubah UI.
- Bahasa UI: Indonesia. DB path relatif ke folder `prisma/`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

## Magic UI (lapisan gerak)

- Sumber komponen: registry `https://magicui.design/r/<nama>.json`, file di `src/components/magicui/`, basis `motion/react` (paket `motion`, bukan `framer-motion`).
- Arah gerak: dial **ENERGY 2 / RHYTHM 2 / MOTION 2**. Daftar komponen + purpose satu baris ada di `DESIGN.md` bagian "Lapisan Gerak"; ikuti dose cap di sana (border-beam maks 2 tempat, shimmer-button hanya CTA utama per layar).
- Warna: semua efek dikonfigurasi lewat props (`colorFrom="var(--primary)"`, `gradientColor="rgba(13,148,136,0.07)"`, dst). Dilarang memakai warna default vendor (ungu/pink/putih) atau menambah skema warna baru di luar `DESIGN.md`.
- File vendor `src/components/magicui/*` hanya boleh disunting untuk aksesibilitas (guard `useReducedMotion` di number-ticker, blur-fade, border-beam) dan format `id-ID` (number-ticker). Perubahan lain harus tercatat di `DESIGN.md`.
- Aksesibilitas: setiap animasi wajib punya jalur reduced-motion (guard JS atau media query `.animate-*` di `globals.css`); keyframes Magic UI (`shimmer-slide`, `spin-around`, `aurora`) hidup di `globals.css` bagian `@theme` + `@keyframes`.
- Tanpa animasi ambient di halaman kerja (tugas, pengaturan); spotlah interaksi hover dan entrance sekali-jalan saja.

## Pengingat email (reminder)

- Logika tunggal: `src/lib/reminders.ts` `runReminderScan()` dipakai oleh scheduler (`src/instrumentation.ts`, interval 60s, hanya aktif jika env `REMINDER_SCHEDULER=true`) dan endpoint `/api/cron/reminders` (header `x-cron-secret`). Jangan duplikasi logika dedupe/pengiriman di tempat lain.
- Provider email: Resend via `src/lib/email.ts`; tanpa `RESEND_API_KEY` isi email masuk ke log server (fallback jujur, jangan dihapus). Pengirim `onboarding@resend.dev` terbatas kirim ke akun sendiri.
- Penerima: `Setting.reminderEmail ?? user.email`; field penerima diatur di Settings > Notifikasi.
- Deployment: flag `REMINDER_SCHEDULER=true` hanya di backend long-running (lokal/Railway); Vercel dikosongkan.

