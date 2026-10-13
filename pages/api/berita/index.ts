import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('berita_kegiatan')
      .select('id, judul, isi, foto_url, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Belum login' });

    const { judul, isi, foto_url } = req.body || {};
    if (!judul || !isi || !foto_url) {
      return res.status(400).json({ error: 'Judul, isi, dan foto wajib diisi' });
    }

    const { data, error } = await supabase
      .from('berita_kegiatan')
      .insert({ judul, isi, foto_url, created_by: session.user.id })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}