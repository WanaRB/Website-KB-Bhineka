import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav-title">KB Bhineka Tunggal Ika</div>
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
      </aside>
      <main className="admin-main">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
