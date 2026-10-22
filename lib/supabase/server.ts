import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { parse, serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_HARI, hariIni, detikSampaiGantiHari } from '../auth';

// Tambah Set-Cookie tanpa menimpa cookie lain di respons yang sama.
export function tambahCookie(res: NextApiResponse, nilai: string) {
  const lama = res.getHeader('Set-Cookie');
  const daftar = lama === undefined ? [] : Array.isArray(lama) ? lama : [String(lama)];
  res.setHeader('Set-Cookie', [...daftar, nilai]);
}

const opsiCookieHari = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function cookieHariBaru(): string {
  return serialize(COOKIE_HARI, hariIni(), { ...opsiCookieHari, maxAge: detikSampaiGantiHari() });
}

export function cookieHariHapus(): string {
  return serialize(COOKIE_HARI, '', { ...opsiCookieHari, maxAge: 0 });
}

// Client Supabase per-request untuk API routes (pages/api/**).
// Sesi admin disimpan di cookie, dikelola otomatis oleh @supabase/ssr.
export function createSupabaseServerClient(req: NextApiRequest, res: NextApiResponse) {
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = parse(req.headers.cookie || '');
          return cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          const opsi = name.startsWith('sb-') ? { ...options, maxAge: detikSampaiGantiHari() } : options;
          tambahCookie(res, serialize(name, value, opsi as any));
        },
        remove(name: string, options: CookieOptions) {
          tambahCookie(res, serialize(name, '', { ...(options as any), maxAge: 0 }));
        },
      },
    }
  );

  // Sesi dianggap tidak ada jika hari login berbeda dengan hari ini.
  // Karena supabase-js memakai getSession() juga untuk token tulis data,
  // data tidak bisa diubah dengan sesi hari lalu.
  const asli = client.auth.getSession.bind(client.auth);
  (client.auth as any).getSession = async () => {
    const hasil = await asli();
    const hariLogin = parse(req.headers.cookie || '')[COOKIE_HARI];
    if (hasil.data.session && hariLogin !== hariIni()) {
      return { data: { session: null }, error: null };
    }
    return hasil;
  };

  return client;
}