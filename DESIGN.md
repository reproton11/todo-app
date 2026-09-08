# DESIGN.md, TugasKu

Sumber kebenaran arah visual. Semua keputusan visual harus konsisten dengan file ini.
Filter kualitas: baca aturan antislop sebelum menambahkan teknik visual apa pun.

## Identitas

- Nama produk: **TugasKu** (personal task manager, bahasa Indonesia)
- Logo: wordmark teks "TugasKu" dengan titik aksen teal. Ini placeholder yang jujur; ikon/logo final menunggu konfirmasi pemilik.
- Karakter: tenang, efisien, ramah. Alat produktivitas harian, bukan panggung dekorasi.

## Dial

**ENERGY 2 / RHYTHM 2 / MOTION 2**

- ENERGY 2: halaman datar dan tenang dengan aksen gerak yang disengaja di titik kunci (CTA utama, angka statistik, wordmark).
- RHYTHM 2: grid konsisten dengan variasi wajar antar halaman (dasbor = kartu ringkas, tugas = tabel, papan = kolom).
- MOTION 2: micro-interaction halus dan entrance reveal sekali jalan; tanpa animasi ambient yang terus berputar kecuali border beam pada maksimal 2 kartu. Semua animasi menghormati `prefers-reduced-motion`.

## Palet inti (flat, 2 warna inti + 1 aksen)

| Token | Light | Dark | Alasan |
|---|---|---|---|
| primary | #0D9488 (teal) | #2DD4BF | teal = identitas fokus/ketenangan; dipakai untuk aksi utama & status aktif |
| primary-foreground | #042F2E | #05201D | kontras teks di atas teal pas AA (6.6:1+) |
| accent (CTA sekunder/perhatian) | #EA580C (oranye) | #FB923C | oranye menandai momen butuh perhatian (overdue, CTA sekunder) |
| background | #F0FDFA | #071A18 | tinted teal sangat tipis; dark teal-950 agar mata nyaman malam |
| foreground | #134E4A | #D7F0EC | teks teal-gelap; kontras 9:1+ |
| card | #FFFFFF | #0C2422 | permukaan datar tanpa bayangan |
| muted-foreground | #4B6A65 | #93BBB5 | teks sekunder pas AA (5:1+) |
| border | #BEE8E3 | #1C3B37 | garis tipis teal, bukan abu generik |
| destructive | #DC2626 (fg putih, 4.7:1) | sama | merah fungsional |

Larangan: gradient dekoratif, glow, glassmorphism, bayangan lembut di semua kartu, skema biru-ungu, grid/dot background. Shadow hanya untuk elevation overlay (dialog, popover).

## Warna semantik fungsional (di luar palet inti, sesuai PRD)

- Prioritas (ditetapkan PRD, fungsi data): Rendah abu #64748B, Sedang biru #2563EB, Tinggi oranye #EA580C, Mendesak merah #DC2626. Ditampilkan sebagai chip tint-bg + teks gelap yang lolos AA di kedua tema.
- Kategori & status custom: titik warna kecil (dot), dipilih pengguna. Warna ini adalah data, bukan dekorasi.
- Motif identitas: chip ber-titik-warna konsisten dipakai untuk semua data berwarna (prioritas, kategori, status, tag).

## Tipografi

- **Plus Jakarta Sans** untuk semuanya. Alasan: mood friendly-profesional yang cocok untuk aplikasi produktivitas, tersedia variable font, bukan pilihan default AI (Inter/Geist).
- Skala: body 14,16px; judul halaman 24px semibold; judul kartu 16px medium; label kecil 12px. Line-height 1.5.

## Bentuk & komponen

- Radius: `--radius: 0.625rem` konsisten shadcn; tombol & input md, kartu lg. Tanpa pill kecuali chip status kecil.
- Ikon: Lucide, ukuran 16,20px, hanya yang relevan konten (kalender=tenggat, bendera=prioritas). Tanpa sparkle/magic.
- Tabel tugas: baris dengan checkbox, judul, chip kategori, chip prioritas, tenggat, chip status. Tanpa stripe warna per baris.
- Kanban: kolom dengan header chip status + counter; kartu datar dengan garis kiri warna prioritas (fungsional, bukan dekorasi).
- Empty state: ilustrasi nol; satu ikon relevan + kalimat jelas + aksi utama.
- Dark & light wajib sama-sama utuh (kontras AA di semua teks, semua komponen).

## Salinan (copy)

- Bahasa Indonesia, sapaan langsung, tanpa buzzword ("seamless", "AI-powered").
- Tombol spesifik aksi: "Tambah Tugas", "Buat Akun", "Masuk". Bukan "Get Started".
- Angka di dasbor berasal dari data nyata pengguna; tanpa angka dekoratif.

## Lapisan Gerak (Magic UI)

Aksen animasi dari Magic UI, semuanya diwarnai token tema (teal/oranye). Purpose satu baris per komponen:

- `number-ticker`: angka statistik dasbor menghitung naik; menarik mata ke perubahan data.
- `blur-fade`: entrance sekali-jalan untuk section dasbor, daftar tugas, detail tugas; memandu urutan baca saat halaman termuat.
- `shimmer-button`: hanya tombol CTA utama per layar (Masuk/Buat Akun, FAB tambah tugas, Tandai Selesai); menyorot satu aksi terpenting.
- `magic-card` (spotlight hover): kartu statistik dan kartu kanban; respons terhadap pointer tanpa gerak ambient. Permukaan kartu memakai token `--color-card` agar tetap putih/gelap sesuai tema.
- `border-beam`: MAKSIMAL 2 tempat, kartu auth + kartu streak; aksen identitas. Tidak ditambah di tempat lain tanpa mengubah aturan ini.
- `aurora-text`: hanya kata "Ku" pada wordmark TugasKu; identitas kecil yang berulang di semua halaman. Palet gradasi teal yang lolos kontras 3:1+ untuk teks besar di kedua tema (light: #115e59/#0f766e/#0d9488, dark: #5eead4/#2dd4bf/#14b8a6).
- `dot-pattern`: hanya latar halaman login, warna teal sangat redup; memberi tekstur identitas pada satu-satunya halaman publik tanpa data.

Larangan tetap berlaku: tanpa glow tambahan, tanpa bounce, tanpa gradient ungu-biru, tanpa animasi ambient di halaman kerja (tugas, pengaturan). Semua efek vendor dikonfigurasi lewat props; file komponen vendor hanya boleh disunting untuk aksesibilitas (reduced-motion) dan format angka id-ID.
