import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_HARI, hariIni, detikSampaiGantiHari } from './lib/auth';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const opsi = name.startsWith('sb-') ? { ...options, maxAge: detikSampaiGantiHari() } : options;
          response.cookies.set({ name, value, ...opsi });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Sesi hanya sah jika login dilakukan hari ini
  const hariCocok = request.cookies.get(COOKIE_HARI)?.value === hariIni();
  const sesiAktif = !!session && hariCocok;

  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!sesiAktif && request.nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    const alihkan = NextResponse.redirect(url);
    // Bersihkan sisa cookie sesi lama
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith('sb-') || c.name === COOKIE_HARI) {
        alihkan.cookies.set({ name: c.name, value: '', maxAge: 0, path: '/' });
      }
    });
    return alihkan;
  }

  if (sesiAktif && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};