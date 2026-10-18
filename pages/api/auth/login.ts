import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi' });
  }

  const supabase = createSupabaseServerClient(req, res);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Email atau kata sandi salah' });
  }

  return res.status(200).json({ ok: true });
}
