import type { NextApiRequest, NextApiResponse } from 'next';

// Endpoint ini hanya membagikan URL + anon key (memang untuk publik/client-side).
// Keamanan data diatur lewat Row Level Security di Supabase, bukan lewat rahasia ini.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  });
}
