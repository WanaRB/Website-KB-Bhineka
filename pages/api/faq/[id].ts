import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);
  const { id } = req.query;

  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end();
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Belum login' });

  if (req.method === 'PUT') {
    const pertanyaan = String(req.body?.pertanyaan || '').trim();
    const jawaban = String(req.body?.jawaban || '').trim();
    if (!pertanyaan || !jawaban) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi' });
    }
    const { data, error } = await supabase
      .from('faq')
      .update({ pertanyaan, jawaban })
      .eq('id', id as string)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  const { error } = await supabase.from('faq').delete().eq('id', id as string);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}