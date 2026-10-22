import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient, tambahCookie, cookieHariHapus } from '../../../lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const supabase = createSupabaseServerClient(req, res);
  await supabase.auth.signOut();
  tambahCookie(res, cookieHariHapus());

  return res.status(200).json({ ok: true });
}