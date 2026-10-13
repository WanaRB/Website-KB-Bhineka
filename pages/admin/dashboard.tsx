import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  const [counts, setCounts] = useState({ galeri: 0, berita: 0, testimoni: 0, guru: 0 });

  useEffect(() => {
    async function load() {
      const [g, b, t, s] = await Promise.all([
        fetch('/api/galeri').then((r) => r.json()),
        fetch('/api/berita').then((r) => r.json()),
        fetch('/api/testimoni').then((r) => r.json()),
        fetch('/api/guru').then((r) => r.json()),
      ]);
      setCounts({
        galeri: Array.isArray(g) ? g.length : 0,
        berita: Array.isArray(b) ? b.length : 0,
        testimoni: Array.isArray(t) ? t.length : 0,
        guru: Array.isArray(s) ? s.length : 0,
      });
    }
    load();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-num">{counts.galeri}</span>
          <span>Foto galeri</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{counts.berita}</span>
          <span>Berita &amp; kegiatan</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{counts.testimoni}</span>
          <span>Testimoni</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{counts.guru}</span>
          <span>Guru &amp; staff</span>
        </div>
      </div>
    </AdminLayout>
  );
}
