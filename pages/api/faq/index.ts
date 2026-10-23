import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('faq')
      .select('id, pertanyaan, jawaban, created_at')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Belum login' });

    const pertanyaan = String(req.body?.pertanyaan || '').trim();
    const jawaban = String(req.body?.jawaban || '').trim();
    if (!pertanyaan || !jawaban) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi' });
    }

    const { data, error } = await supabase
      .from('faq')
      .insert({ pertanyaan, jawaban })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}