import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

const KEYS = ['tagline', 'foto_hero_url', 'foto_profil_url', 'tentang_teks', 'info_pendaftaran', 'alamat', 'no_telp', 'maps_koordinat', 'jam_operasional', 'cta_teks'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('pengaturan').select('key, value');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Belum login' });

    const body = req.body || {};
    const rows = KEYS.filter((k) => body[k] !== undefined).map((k) => ({
      key: k,
      value: body[k],
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk disimpan' });
    }

    const { error } = await supabase.from('pengaturan').upsert(rows, { onConflict: 'key' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).end();
}
