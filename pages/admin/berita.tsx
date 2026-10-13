import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '../../lib/supabase/client';

type Berita = { id: string; judul: string; isi: string; foto_url: string | null };

async function uploadFoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('galeri').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('galeri').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function BeritaPage() {
  const [items, setItems] = useState<Berita[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Berita | null>(null);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  async function load() {
    setLoadError('');
    try {
      const res = await fetch('/api/berita');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        setLoadError(data?.error || 'Gagal memuat data berita.');
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
    setJudul('');
    setIsi('');
    setFotoUrl('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Berita) {
    setEditing(item);
    setJudul(item.judul);
    setIsi(item.isi);
    setFotoUrl(item.foto_url || '');
    setError('');
    setShowForm(true);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadFoto(file);
      setFotoUrl(url);
    } catch (err: any) {
      setError('Gagal mengunggah foto: ' + (err.message || 'coba lagi'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!judul || !isi || !fotoUrl) {
      setError('Judul, isi, dan foto wajib diisi');
      return;
    }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/berita/${editing.id}` : '/api/berita';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, isi, foto_url: fotoUrl }),
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
    if (!confirm('Hapus berita ini?')) return;
    await fetch(`/api/berita/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <AdminLayout title="Kelola berita Acara">
      <button className="btn-primary" onClick={openAdd} type="button">
        + Tambah berita
      </button>

      {loadError && <p className="form-error">{loadError}</p>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="judul">Judul</label>
          <input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} required />

          <label htmlFor="isi">Isi</label>
          <textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} required />

          <label htmlFor="foto_file">Foto</label>
          <div
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          >
            {uploading ? <p>Mengunggah...</p> : fotoUrl ? <img src={fotoUrl} alt="Pratinjau" className="dropzone-preview" /> : <p>Tarik &amp; lepas foto di sini, atau klik untuk pilih file</p>}
          </div>
          <input id="foto_file" ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />

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

      {!showForm && (
        <div className="data-list">
          {items.map((item) => (
            <div className="data-row" key={item.id}>
              {item.foto_url && <img src={item.foto_url} alt={item.judul} className="thumb" />}
              <div style={{ flex: 1 }}>
                <div className="data-title">{item.judul}</div>
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
          {items.length === 0 && <p className="empty-state">Belum ada berita. Klik &quot;Tambah berita&quot; untuk mulai.</p>}
        </div>
      )}
    </AdminLayout>
  );
}