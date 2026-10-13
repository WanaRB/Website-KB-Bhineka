import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';

type Testimoni = { id: string; nama_ortu: string; isi: string; rating: number };

export default function TestimoniPage() {
  const [items, setItems] = useState<Testimoni[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimoni | null>(null);
  const [namaOrtu, setNamaOrtu] = useState('');
  const [isi, setIsi] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  async function load() {
    setLoadError('');
    try {
      const res = await fetch('/api/testimoni');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        setLoadError(data?.error || 'Gagal memuat data testimoni.');
      }
    } catch (e) {
      setItems([]);
      setLoadError('Tidak bisa terhubung ke server.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setNamaOrtu('');
    setIsi('');
    setRating(5);
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Testimoni) {
    setEditing(item);
    setNamaOrtu(item.nama_ortu);
    setIsi(item.isi);
    setRating(item.rating);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!namaOrtu || !isi) {
      setError('Nama dan isi testimoni wajib diisi');
      return;
    }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/testimoni/${editing.id}` : '/api/testimoni';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_ortu: namaOrtu, isi, rating }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal menyimpan');
      return;
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus testimoni ini?')) return;
    await fetch(`/api/testimoni/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <AdminLayout title="Kelola testimoni">
      <button className="btn-primary" onClick={openAdd} type="button">
        + Tambah testimoni
      </button>

      {loadError && <p className="form-error">{loadError}</p>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="nama_ortu">Nama orang tua</label>
          <input id="nama_ortu" value={namaOrtu} onChange={(e) => setNamaOrtu(e.target.value)} required />

          <label htmlFor="isi">Isi testimoni</label>
          <textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} required />

          <label htmlFor="rating">Rating (1-5)</label>
          <input
            id="rating"
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Simpan
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="data-list">
        {items.map((item) => (
          <div className="data-row" key={item.id}>
            <div style={{ flex: 1 }}>
              <div className="data-title">{item.nama_ortu}</div>
              <div className="data-sub">{'★'.repeat(item.rating)}</div>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => openEdit(item)}>
                Ubah
              </button>
              <button type="button" onClick={() => handleDelete(item.id)} className="btn-danger">
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="empty-state">Belum ada testimoni. Klik &quot;Tambah testimoni&quot; untuk mulai.</p>
        )}
      </div>
    </AdminLayout>
  );
}
