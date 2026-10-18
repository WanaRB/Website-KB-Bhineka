import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { parse, serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

// Client Supabase per-request untuk API routes (pages/api/**).
// Sesi admin disimpan di cookie httpOnly, dikelola otomatis oleh @supabase/ssr.
export function createSupabaseServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = parse(req.headers.cookie || '');
          return cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', serialize(name, value, options as any));
        },
        remove(name: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', serialize(name, '', { ...(options as any), maxAge: 0 }));
        },
      },
    }
  );
}
