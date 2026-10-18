import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '../../lib/supabase/client';

type Galeri = { id: string; judul: string; url_foto: string; berita_id: string | null };

async function uploadFoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('galeri').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('galeri').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function GaleriPage() {
  const [items, setItems] = useState<Galeri[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Galeri | null>(null);
  const [judul, setJudul] = useState('');
  const [urlFoto, setUrlFoto] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoadError('');
    try {
      const res = await fetch('/api/galeri');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        setLoadError(data?.error || 'Gagal memuat data galeri.');
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
    setUrlFoto('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Galeri) {
    setEditing(item);
    setJudul(item.judul);
    setUrlFoto(item.url_foto);
    setError('');
    setShowForm(true);
  }

  async function handleFile(file: File | undefined) {
  if (!file) return;
  setError('');
  setUploading(true);
  try {
    const url = await uploadFoto(file);
    setUrlFoto(url);
  } catch (err: any) {
    setError('Gagal mengunggah foto: ' + (err.message || 'coba lagi'));
  } finally {
    setUploading(false);
  }
}

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!judul || !urlFoto) {
      setError('Judul dan URL foto wajib diisi');
      return;
    }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/galeri/${editing.id}` : '/api/galeri';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, url_foto: urlFoto }),
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
    if (!confirm('Hapus foto ini?')) return;
    await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <AdminLayout title="Kelola galeri">
      <button className="btn-primary" onClick={openAdd} type="button">
        + Tambah foto
      </button>

      {loadError && <p className="form-error">{loadError}</p>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="judul">Judul foto</label>
          <input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} required />

          <label htmlFor="url_foto">URL foto</label>
          <label htmlFor="foto_file">Foto</label>
          <div
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            {uploading ? (
              <p>Mengunggah...</p>
            ) : urlFoto ? (
              <img src={urlFoto} alt="Pratinjau" className="dropzone-preview" />
            ) : (
              <p>Tarik &amp; lepas foto di sini, atau klik untuk pilih file</p>
            )}
          </div>
          <input
            id="foto_file"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
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

        {!showForm && (
          <div className="data-list">
            {items.map((item) => (
              <div className="data-row" key={item.id}>
                {item.url_foto && <img src={item.url_foto} alt={item.judul} className="thumb" />}
                <span className="data-title">{item.judul}</span>
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
            {items.length === 0 && <p className="empty-state">Belum ada foto. Klik &quot;Tambah foto&quot; untuk mulai.</p>}
          </div>
      )}
    </AdminLayout>
  );
}
