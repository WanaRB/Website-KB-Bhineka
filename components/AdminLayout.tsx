import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/galeri', label: 'Galeri' },
  { href: '/admin/berita', label: 'Berita & Kegiatan' },
  { href: '/admin/testimoni', label: 'Testimoni' },
  { href: '/admin/guru', label: 'Guru & Staff' },
  { href: '/admin/pengaturan', label: 'Pengaturan Website' },
];

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Di layar kecil menu dimulai dalam keadaan tertutup
  useEffect(() => {
    if (window.matchMedia('(max-width: 720px)').matches) setCollapsed(true);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>{title} — Admin KB Bhineka Tunggal Ika</title>
      </Head>
      <a className="skip-link" href="#konten-admin">
        Lewati ke konten
      </a>
      <aside className={`admin-nav${collapsed ? ' collapsed' : ''}`}>
        <div className="admin-nav-header">
          <img src="/img/logo-sekolah.svg" alt="Logo KB Bhineka Tunggal Ika" className="admin-nav-logo" />
          <div className="admin-nav-title">KB Bhineka Tunggal Ika</div>
          <button
            type="button"
            className="admin-nav-toggle"
            aria-label={collapsed ? 'Buka menu' : 'Tutup menu'}
            aria-expanded={!collapsed}
            aria-controls="menu-admin"
            onClick={() => setCollapsed((c) => !c)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        {!collapsed && (
          <>
            <nav id="menu-admin" aria-label="Menu admin">
              {links.map((l) => {
                const aktif = router.pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={aktif ? 'active' : ''}
                    aria-current={aktif ? 'page' : undefined}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <button className="logout-btn" onClick={handleLogout} type="button">
              Keluar
            </button>
          </>
        )}
      </aside>
      <main className="admin-main" id="konten-admin">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}