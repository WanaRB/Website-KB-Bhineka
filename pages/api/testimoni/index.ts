import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('testimoni')
      .select('id, nama_ortu, isi, rating, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Belum login' });

    const { nama_ortu, isi, rating } = req.body || {};
    if (!nama_ortu || !isi) {
      return res.status(400).json({ error: 'Nama dan isi testimoni wajib diisi' });
    }

    const { data, error } = await supabase
      .from('testimoni')
      .insert({ nama_ortu, isi, rating: rating || 5, created_by: session.user.id })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
