import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { hapusFoto } from '../../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Belum login' });

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { judul, isi, foto_url } = req.body || {};
    if (!judul || !isi || !foto_url) {
      return res.status(400).json({ error: 'Judul, isi, dan foto wajib diisi' });
    }
    const { data, error } = await supabase
      .from('berita_kegiatan')
      .update({ judul, isi, foto_url: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { data: lama } = await supabase.from('berita_kegiatan').select('foto_url').eq('id', id).single();
    const { error } = await supabase.from('berita_kegiatan').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    await hapusFoto(supabase, lama?.foto_url);
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end();
}