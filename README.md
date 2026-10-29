# Website KB Bhineka Tunggal Ika

Website satu halaman untuk orang tua + panel admin (Next.js + Supabase), siap deploy ke Vercel.

## Struktur

- `public/index.html`, `style.css`, `script.js` — halaman orang tua (statis, satu halaman scroll).
- `pages/admin/*` — panel admin: login, dashboard, galeri, berita, guru dan staff, FAQ, pengaturan website.
- `pages/api/*` — API routes (login/logout, CRUD, config publik).
- `middleware.ts` — memproteksi `/admin/*` dan mewajibkan login ulang tiap ganti hari (WIB).
- `db/schema.sql` — tabel, relasi, Row Level Security, bucket foto. Jalankan di Supabase.

## Setup

### 1. Supabase
1. **SQL Editor → New query**, tempel isi `db/schema.sql`, lalu **Run**.
2. **Authentication → Users → Add user**: buat akun admin (email + kata sandi).
3. **Authentication → Sign In / Providers**: matikan **Allow new users to sign up**
   (agar orang luar tidak bisa membuat akun admin sendiri).
4. **Project Settings → API**: catat `Project URL` dan `anon public key`.

### 2. Lokal
```bash
npm install
cp .env.example .env.local   # isi URL dan anon key dari Supabase
npm run dev
```
Halaman orang tua: `http://localhost:3000` — admin: `http://localhost:3000/admin/login`

### 3. Deploy ke Vercel
1. Push ke GitHub, lalu **Add New Project** di Vercel.
2. Isi Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Deploy**.

## Mengubah isi website

Lewat panel admin ada menu:
- **Galeri, Berita, Guru ,Staff dan FAQ**: Mengubah tampilan di Halaman orang tua. Bisa ditambah, ubah atau hapus.
- **Pengaturan Website**: tagline, foto utama dan profil, teks Tentang Kami,
  informasi pendaftaran, alamat, nomor telepon/WhatsApp, koordinat peta, jam operasional dan pesan otomatis WhatsApp.

Untuk nama sekolah di header dan judul di hero ubah manual di `public/index.html`


## Cara kerja singkat

- Halaman orang tua statis; data diambil dari Supabase lewat `/api/public-config` (hanya baca, diatur RLS).
- Admin login lewat Supabase Auth; sesi di cookie, dijaga `middleware.ts`.
- Tambah/ubah/hapus lewat API routes memakai sesi admin yang sedang login.