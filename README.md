# Website KB Bhineka Tunggal Ika

Website satu halaman untuk orang tua + panel admin (Next.js + Supabase), siap deploy ke Vercel.

## Struktur

- `public/index.html`, `public/style.css`, `public/script.js` — halaman orang tua (statis, ringan, satu halaman scroll).
- `pages/admin/*` — panel admin (login, dashboard, kelola galeri/berita/testimoni/guru).
- `pages/api/*` — API routes (login/logout, CRUD, config publik).
- `middleware.ts` — memproteksi semua halaman `/admin/*` (redirect ke login jika belum masuk).
- `db/schema.sql` — skema tabel + relasi + Row Level Security, jalankan di Supabase.

## ⚠️ Penting: pakai akun sekolah, bukan akun pribadi

Daftarkan akun Vercel dan Supabase memakai **email sekolah**, supaya sekolah bisa mengelola sendiri nanti:

1. Buka [supabase.com](https://supabase.com) → daftar/masuk pakai email sekolah → buat project baru.
2. Buka [vercel.com](https://vercel.com) → daftar/masuk pakai email sekolah yang sama.

## Langkah setup

### 1. Setup Supabase

1. Di dashboard Supabase, buka **SQL Editor** → **New query**.
2. Salin seluruh isi `db/schema.sql`, tempel, lalu **Run**.
3. Buka **Authentication → Users → Add user**, buat akun admin pertama (email + password). Baris di tabel `users` akan otomatis terbuat.
4. Buka **Project Settings → API**, catat:
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Setup lokal (opsional, untuk coba dulu di komputer)

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan URL & anon key dari Supabase
npm run dev
```

Buka `http://localhost:3000` untuk halaman orang tua, `http://localhost:3000/admin/login` untuk admin.

### 3. Deploy ke Vercel

1. Push folder ini ke GitHub (pakai akun GitHub sekolah, atau import langsung dari Vercel CLI/upload).
2. Di Vercel: **Add New Project** → pilih repo ini.
3. Saat setup, isi **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**.

### 4. Ubah info sekolah

Sebagian besar konten sekarang bisa diubah **tanpa edit kode**, lewat menu **Pengaturan Website** di admin panel:
tagline, foto hero, visi & misi, usia murid, biaya, alamat, dan nomor WhatsApp/telepon.

Yang masih perlu diedit langsung di `public/index.html` (jarang berubah):
- Nama sekolah di header & judul hero.
- Link Google Maps (ganti query `KB%20Bhineka%20Tunggal%20Ika` dengan nama/alamat sekolah asli).
- Jam operasional.
- Foto contoh di galeri & program belajar (foto asli sebaiknya ditambah lewat menu Kelola Galeri / Kelola Berita di admin, bukan edit HTML).

## Cara kerja singkat

- Halaman orang tua **statis murni** (HTML/CSS/JS biasa) — cepat dibuka walau internet lambat.
- Halaman itu mengambil data galeri/kegiatan/testimoni terbaru dari Supabase lewat `/api/public-config` (aman, karena akses baca diatur oleh Row Level Security).
- Admin login lewat Supabase Auth; sesi disimpan di cookie, diproteksi oleh `middleware.ts`.
- Semua tambah/ubah/hapus data admin lewat API routes di `pages/api/*`, memakai sesi admin yang sedang login (bukan kunci rahasia terpisah).
