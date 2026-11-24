import { createClient } from '@supabase/supabase-js';

const BUCKET = 'galeri';

// Ambil nama berkas dari alamat publik. Null jika bukan foto di bucket kita.
function namaBerkasDariUrl(url?: string | null): string | null {
  if (!url) return null;
  const penanda = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(penanda);
  if (i === -1) return null;
  const nama = decodeURIComponent(url.slice(i + penanda.length).split('?')[0]);
  return nama || null;
}

// Hapus berkas foto dengan kunci server. Hanya dipanggil dari API yang sudah cek login.
export async function hapusFoto(url?: string | null) {
  const nama = namaBerkasDariUrl(url);
  if (!nama) return;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!kunci || !urlSupabase) {
    console.error('hapusFoto: SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL belum diatur');
    return;
  }
  const admin = createClient(urlSupabase, kunci, { auth: { persistSession: false } });
  const { error } = await admin.storage.from(BUCKET).remove([nama]);
  if (error) console.error('hapusFoto gagal:', error.message);
}