import type { createSupabaseServerClient } from './supabase/server';

const BUCKET = 'galeri';

// Ambil nama berkas dari alamat publik. Null jika bukan foto di bucket kita.
export function namaBerkasDariUrl(url?: string | null): string | null {
  if (!url) return null;
  const penanda = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(penanda);
  if (i === -1) return null;
  const nama = decodeURIComponent(url.slice(i + penanda.length).split('?')[0]);
  return nama || null;
}

// Hapus berkas foto dari Storage. Alamat luar (misalnya Unsplash) diabaikan.
export async function hapusFoto(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  url?: string | null
) {
  const nama = namaBerkasDariUrl(url);
  if (!nama) return;
  await supabase.storage.from(BUCKET).remove([nama]);
}