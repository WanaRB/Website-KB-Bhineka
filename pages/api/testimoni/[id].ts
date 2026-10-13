import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Belum login' });

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nama_ortu, isi, rating } = req.body || {};
    if (!nama_ortu || !isi) {
      return res.status(400).json({ error: 'Nama dan isi testimoni wajib diisi' });
    }
    const { data, error } = await supabase
      .from('testimoni')
      .update({ nama_ortu, isi, rating: rating || 5 })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('testimoni').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end();
}
