import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { hapusFoto } from '../../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Belum login' });

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { judul, url_foto, berita_id } = req.body || {};
    if (!judul || !url_foto) {
      return res.status(400).json({ error: 'Judul dan URL foto wajib diisi' });
    }
    const { data, error } = await supabase
      .from('galeri')
      .update({ judul, url_foto, berita_id: berita_id || null })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    // Ambil alamat foto dulu agar berkasnya bisa dihapus dari Storage
    const { data: lama } = await supabase.from('galeri').select('url_foto').eq('id', id).single();
    const { error } = await supabase.from('galeri').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    await hapusFoto(supabase, lama?.url_foto);
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end();
}
