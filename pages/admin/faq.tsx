import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useDialog } from '../../components/DialogProvider';

type Faq = { id: string; pertanyaan: string; jawaban: string };

export default function FaqPage() {
  const { konfirmasi, toast } = useDialog();

  const [items, setItems] = useState<Faq[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [pertanyaan, setPertanyaan] = useState('');
  const [jawaban, setJawaban] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadError('');
    try {
      const res = await fetch('/api/faq');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        setLoadError(data?.error || 'Gagal memuat data pertanyaan.');
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
    setPertanyaan('');
    setJawaban('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Faq) {
    setEditing(item);
    setPertanyaan(item.pertanyaan);
    setJawaban(item.jawaban);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pertanyaan.trim() || !jawaban.trim()) {
      setError('Pertanyaan dan jawaban wajib diisi');
      return;
    }
    setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/faq/${editing.id}` : '/api/faq';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pertanyaan, jawaban }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal menyimpan');
      return;
    }
    toast(editing ? 'Pertanyaan sudah diperbarui' : 'Pertanyaan sudah ditambahkan');
    setShowForm(false);
    load();
  }

  async function handleDelete(item: Faq) {
    const ya = await konfirmasi({
      judul: 'Hapus pertanyaan ini?',
      nama: item.pertanyaan,
      tombolYa: 'Ya, hapus',
    });
    if (!ya) return;

    const res = await fetch(`/api/faq/${item.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Pertanyaan sudah dihapus');
      load();
    } else {
      toast('Gagal menghapus. Coba lagi.', 'galat');
    }
  }

  return (
    <AdminLayout title="Pertanyaan umum (FAQ)">
      <p className="page-desc">
        Tulis pertanyaan yang sering ditanyakan orang tua lewat WhatsApp, misalnya biaya, seragam, jam masuk, dan usia
        minimal. Jawaban tampil di website supaya orang tua tidak perlu bertanya berulang-ulang.
      </p>

      <button className="btn-primary" onClick={openAdd} type="button">
        + Tambah pertanyaan
      </button>

      {loadError && <p className="form-error">{loadError}</p>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="pertanyaan">Pertanyaan</label>
          <input
            id="pertanyaan"
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            placeholder="Contoh: Berapa usia minimal anak?"
            required
          />

          <label htmlFor="jawaban">Jawaban</label>
          <textarea
            id="jawaban"
            value={jawaban}
            onChange={(e) => setJawaban(e.target.value)}
            rows={5}
            placeholder="Tulis jawaban dengan bahasa sederhana"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Batal
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="data-list">
          {items.map((item) => (
            <div className="data-row" key={item.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="data-title">{item.pertanyaan}</div>
                <div className="data-sub">
                  {item.jawaban.length > 90 ? item.jawaban.slice(0, 90) + '…' : item.jawaban}
                </div>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => openEdit(item)}>
                  Ubah
                </button>
                <button type="button" onClick={() => handleDelete(item)} className="btn-danger">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="empty-state">Belum ada pertanyaan. Klik &quot;Tambah pertanyaan&quot; untuk mulai.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}