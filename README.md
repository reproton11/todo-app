# TugasKu

Aplikasi web pengelola tugas pribadi: kategori, prioritas, tenggat, pengingat, tugas berulang, papan kanban, dan dasbor produktivitas. Dibangun sesuai PRD `Todo Web App` (full fitur Section 5).

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 + shadcn/ui
- Prisma 6 + SQLite (`prisma/dev.db`)
- Auth JWT (`jose`) di cookie httpOnly + bcryptjs
- Zustand, dnd-kit (kanban), recharts (grafik), web-push (VAPID), Resend (email, opsional)

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Database SQLite dibuat otomatis via `prisma migrate`. Untuk reset: hapus `prisma/dev.db` lalu `npx prisma migrate dev`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build & produksi |
| `npm run lint` | ESLint |
| `npm test` | unit test logika berulang & streak |

## Lingkungan (.env)

| Variabel | Wajib | Catatan |
|---|---|---|
| `DATABASE_URL` | ya | path absolut SQLite, contoh `file:C:/Users/USER/Projects/todo-app/prisma/dev.db` (runtime Next meresolusi path relatif ke CWD, sedangkan CLI Prisma ke folder `prisma/`, jadi gunakan absolut) |
| `JWT_SECRET` | ya | kunci sesi |
| `CRON_SECRET` | ya | auth endpoint cron pengingat |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | untuk push | `npx web-push generate-vapid-keys` |
| `RESEND_API_KEY` | untuk email | daftar gratis resend.com; tanpa ini isi email masuk ke log server |
| `REMINDER_SCHEDULER` | untuk pengingat otomatis | `true` hanya di service backend (lokal/Railway); kosongkan di Vercel |
| `NEXT_PUBLIC_APP_URL` | ya | dasar link reset kata sandi & tombol di email |

## Pengingat (reminders)

Tiga saluran pengingat saat tugas mendekati tenggat (jendela ±5 menit, dedupe 1/tugas/jam):

1. **Dalam aplikasi** — notifikasi muncul di ikon lonceng (otomatis saat scheduler jalan).
2. **Push browser** — aktifkan di Pengaturan > Notifikasi (Web Push VAPID).
3. **Email via Resend** — aktifkan toggle "Notifikasi email", atur penerima di kolom "Email penerima pengingat" (kosong = email akun).

### Menyalakan scheduler + email

- `REMINDER_SCHEDULER=true` di `.env` membuat server memeriksa pengingat sendiri setiap 60 detik (`src/instrumentation.ts`). Aktifkan **hanya di service backend** (lokal / Railway). Di Vercel biarkan kosong agar tidak dobel — Vercel cron paket gratis hanya presisi harian.
- Email: daftar gratis di [resend.com](https://resend.com), buat API Key, isi `RESEND_API_KEY`. Tanpa key, isi email ditulis ke log server (fallback yang jujur). Pengirim default `onboarding@resend.dev` hanya bisa mengirim ke email akun Resendmu sendiri; verifikasi domain di dashboard Resend untuk kirim bebas.
- Endpoint `GET/POST /api/cron/reminders` dengan header `x-cron-secret: <CRON_SECRET>` tetap tersedia untuk cron eksternal.

## Deploy

CI (GitHub Actions) menjalankan lint, test, dan build pada setiap push. Saat produksi, `NEXT_PUBLIC_APP_URL` harus berupa domain asli dan cookie sesi otomatis `secure`.
