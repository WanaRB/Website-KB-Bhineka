import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'galeri';
const UMUR_MINIMAL_JAM = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.authorization !== `Bearer ${rahasia}`) {
    return res.status(401).json({ error: 'Tidak diizinkan' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!kunci || !urlSupabase) {
    return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap' });
  }
  const admin = createClient(urlSupabase, kunci, { auth: { persistSession: false } });

  // 1. Kumpulkan semua teks yang merujuk foto. Jika satu tabel gagal dibaca, batalkan semuanya.
  const [galeri, berita, guru, pengaturan] = await Promise.all([
    admin.from('galeri').select('url_foto'),
    admin.from('berita_kegiatan').select('foto_url'),
    admin.from('guru_staff').select('foto_url'),
    admin.from('pengaturan').select('value'),
  ]);
  const galat = galeri.error || berita.error || guru.error || pengaturan.error;
  if (galat) {
    return res.status(500).json({ error: 'Gagal membaca tabel, tidak ada yang dihapus: ' + galat.message });
  }
  const rujukan = [
    ...(galeri.data || []).map((r) => r.url_foto),
    ...(berita.data || []).map((r) => r.foto_url),
    ...(guru.data || []).map((r) => r.foto_url),
    ...(pengaturan.data || []).map((r) => r.value),
  ]
    .filter(Boolean)
    .join('\n');

  // 2. Daftar semua berkas di bucket
  const berkas: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list('', { limit: 1000, offset });
    if (error) return res.status(500).json({ error: 'Gagal membaca bucket: ' + error.message });
    if (!data || data.length === 0) break;
    berkas.push(...data);
    if (data.length < 1000) break;
  }

  // 3. Yatim = tidak dirujuk database dan sudah lebih tua dari batas umur
  const batas = Date.now() - UMUR_MINIMAL_JAM * 3600 * 1000;
  const yatim: string[] = berkas
    .filter((f) => f.id && !f.name.startsWith('.') && f.created_at)
    .filter((f) => new Date(f.created_at).getTime() < batas)
    .filter((f) => !rujukan.includes(f.name))
    .map((f) => f.name);

  // 4. Hapus per 100 berkas
  for (let i = 0; i < yatim.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET).remove(yatim.slice(i, i + 100));
    if (error) return res.status(500).json({ error: 'Gagal menghapus: ' + error.message });
  }

  return res.status(200).json({ diperiksa: berkas.length, dihapus: yatim.length, nama: yatim });
}