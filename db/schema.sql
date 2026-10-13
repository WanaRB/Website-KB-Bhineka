-- ============================================================
-- Skema database KB Bhineka Tunggal Ika
-- Jalankan di Supabase Dashboard > SQL Editor > New query
--
-- Catatan: jika sebelumnya sudah pernah menjalankan versi skema yang
-- memiliki kolom "jadwal" pada berita_kegiatan, jalankan dulu:
--   alter table public.berita_kegiatan drop column if exists jadwal;
-- Jika tabel berita_kegiatan sudah ada tapi belum punya kolom foto_url:
--   alter table public.berita_kegiatan add column if not exists foto_url text;
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabel users (profil admin, terhubung ke Supabase Auth) ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Tabel berita_kegiatan ----------
create table public.berita_kegiatan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  tanggal date,
  foto_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabel galeri (opsional terhubung ke berita_kegiatan) ----------
create table public.galeri (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  url_foto text not null,
  berita_id uuid references public.berita_kegiatan(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Tabel testimoni ----------
create table public.testimoni (
  id uuid primary key default gen_random_uuid(),
  nama_ortu text not null,
  isi text not null,
  rating int check (rating between 1 and 5) default 5,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Tabel guru_staff ----------
create table public.guru_staff (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan text not null,
  foto_url text,
  bio text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Tabel pengaturan (konten statis halaman orang tua) ----------
-- Menyimpan konten yang sebelumnya hardcode di kode: tagline, foto hero,
-- alamat, nomor telepon/WA, usia murid, biaya, visi & misi.
create table public.pengaturan (
  key text primary key,
  value text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.pengaturan (key, value) values
  ('tagline', 'Tempat anak belajar sambil bermain, dengan penuh kasih sayang'),
  ('foto_hero_url', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'),
  ('alamat', 'Jl. Contoh Alamat No. 123, Desa Contoh, Kecamatan Contoh, Kabupaten Contoh'),
  ('no_telp', '6281234567890'),
  ('usia', '2 - 4 tahun'),
  ('biaya', 'Hubungi kami'),
  ('visi_misi', 'Anak tumbuh percaya diri dan mandiri
Belajar berbagi dan bekerja sama dengan teman
Suasana belajar yang hangat, aman, dan menyenangkan')
on conflict (key) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.berita_kegiatan enable row level security;
alter table public.galeri enable row level security;
alter table public.testimoni enable row level security;
alter table public.guru_staff enable row level security;
alter table public.pengaturan enable row level security;

-- Halaman orang tua (anon key) hanya boleh membaca
create policy "Publik baca berita" on public.berita_kegiatan for select using (true);
create policy "Publik baca galeri" on public.galeri for select using (true);
create policy "Publik baca testimoni" on public.testimoni for select using (true);
create policy "Publik baca guru staff" on public.guru_staff for select using (true);
create policy "Publik baca pengaturan" on public.pengaturan for select using (true);

-- Admin yang login boleh membaca profil sendiri
create policy "Admin baca profil sendiri" on public.users for select using (auth.uid() = id);

-- Admin yang sudah login (authenticated) boleh kelola semua konten
create policy "Admin kelola berita" on public.berita_kegiatan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola galeri" on public.galeri
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola testimoni" on public.testimoni
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola guru staff" on public.guru_staff
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin kelola pengaturan" on public.pengaturan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: otomatis buat baris public.users saat akun admin baru dibuat
-- (buat akun admin lewat Supabase Dashboard > Authentication > Add user)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nama, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
