-- ============================================================
-- Skema database KB Bhineka Tunggal Ika
-- Untuk instalasi BARU. Jalankan di Supabase > SQL Editor > New query.
-- Jangan dijalankan ulang di database yang sudah berisi data.
-- Akun admin dibuat lewat Supabase > Authentication > Add user.
-- Kolom created_by / updated_by merujuk langsung ke auth.users.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- berita_kegiatan ----------
create table public.berita_kegiatan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  foto_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- galeri ----------
create table public.galeri (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  url_foto text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- guru_staff ----------
create table public.guru_staff (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan text not null,
  foto_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- faq (pertanyaan yang sering diajukan) ----------
create table public.faq (
  id uuid primary key default gen_random_uuid(),
  pertanyaan text not null,
  jawaban text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- pengaturan (isi halaman orang tua, pasangan key-value) ----------
-- Kunci yang dipakai: tagline, foto_hero_url, foto_profil_url, tentang_teks,
-- info_pendaftaran (JSON), alamat, no_telp, maps_koordinat, jam_operasional, wa_pesan
create table public.pengaturan (
  key text primary key,
  value text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.pengaturan (key, value) values
  ('tagline', 'Tempat anak belajar sambil bermain, dengan penuh kasih sayang'),
  ('alamat', 'Jl. Contoh Alamat No. 123, Desa Contoh, Kecamatan Contoh, Kabupaten Contoh'),
  ('no_telp', '6281234567890')
on conflict (key) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.berita_kegiatan enable row level security;
alter table public.galeri enable row level security;
alter table public.guru_staff enable row level security;
alter table public.faq enable row level security;
alter table public.pengaturan enable row level security;

-- Halaman orang tua (anon key): hanya boleh membaca
create policy "Publik baca berita" on public.berita_kegiatan for select using (true);
create policy "Publik baca galeri" on public.galeri for select using (true);
create policy "Publik baca guru staff" on public.guru_staff for select using (true);
create policy "Publik baca pengaturan" on public.pengaturan for select using (true);
create policy "faq_baca_publik" on public.faq for select to anon, authenticated using (true);

-- Admin yang login (authenticated) boleh kelola semua konten
create policy "Admin kelola berita" on public.berita_kegiatan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola galeri" on public.galeri
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola guru staff" on public.guru_staff
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola pengaturan" on public.pengaturan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "faq_kelola_admin" on public.faq
  for all to authenticated using (true) with check (true);

-- ============================================================
-- Hak akses tabel
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select on public.berita_kegiatan, public.galeri, public.guru_staff,
                public.faq, public.pengaturan to anon;
grant select, insert, update, delete on public.berita_kegiatan, public.galeri,
                public.guru_staff, public.faq, public.pengaturan to authenticated;

-- ============================================================
-- Storage: bucket foto "galeri"
-- Bucket publik: foto bisa dibuka lewat URL tanpa kebijakan SELECT.
-- Admin hanya perlu izin unggah (INSERT). Penghapusan berkas dilakukan
-- API server dengan SUPABASE_SERVICE_ROLE_KEY (lihat lib/storage.ts).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('galeri', 'galeri', true)
on conflict (id) do nothing;

create policy "galeri_unggah_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeri');