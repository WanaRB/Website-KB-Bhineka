import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';

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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-nav${collapsed ? ' collapsed' : ''}`}>
        <div className="admin-nav-header">
          <img src="/img/logo-sekolah.svg" alt="Logo" className="admin-nav-logo" />
          {!collapsed && <div className="admin-nav-title">KB Bhineka Tunggal Ika</div>}
          <button
            type="button"
            className="admin-nav-toggle"
            aria-label="Buka/tutup navigasi"
            onClick={() => setCollapsed((c) => !c)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        {!collapsed && (
          <>
            <nav>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={router.pathname === l.href ? 'active' : ''}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <button className="logout-btn" onClick={handleLogout} type="button">
              Keluar
            </button>
          </>
        )}
      </aside>
      <main className="admin-main">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}