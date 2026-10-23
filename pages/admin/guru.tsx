import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '../../lib/supabase/client';
import { useDialog } from '../../components/DialogProvider';

type Guru = { id: string; nama: string; jabatan: string; foto_url: string | null };

async function uploadFoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('galeri').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('galeri').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function GuruPage() {
  const { konfirmasi, toast } = useDialog();

  const [items, setItems] = useState<Guru[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Guru | null>(null);
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoadError('');
    try {
      const res = await fetch('/api/guru');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
        setLoadError(data?.error || 'Gagal memuat data guru/staff.');
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
    setNama('');
    setJabatan('');
    setFotoUrl('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Guru) {
    setEditing(item);
    setNama(item.nama);
    setJabatan(item.jabatan);
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
    if (!nama || !jabatan) {
      setError('Nama dan jabatan wajib diisi');
      return;
    }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/guru/${editing.id}` : '/api/guru';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, jabatan, foto_url: fotoUrl }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal menyimpan');
      return;
    }
    toast(editing ? 'Data sudah diperbarui' : 'Data sudah ditambahkan');
    setShowForm(false);
    load();
  }

  async function handleDelete(item: Guru) {
    const ya = await konfirmasi({
      judul: 'Hapus data guru ini?',
      nama: `${item.nama} · ${item.jabatan}`,
      tombolYa: 'Ya, hapus',
    });
    if (!ya) return;

    const res = await fetch(`/api/guru/${item.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Data sudah dihapus');
      load();
    } else {
      toast('Gagal menghapus. Coba lagi.', 'galat');
    }
  }

  return (
    <AdminLayout title="Kelola guru & staff">
      <button className="btn-primary" onClick={openAdd} type="button">
        + Tambah guru/staff
      </button>

      {loadError && <p className="form-error">{loadError}</p>}

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="nama">Nama</label>
          <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required />

          <label htmlFor="jabatan">Jabatan</label>
          <input id="jabatan" value={jabatan} onChange={(e) => setJabatan(e.target.value)} required />

          <label htmlFor="foto_file">Foto</label>
          <div
            className="dropzone"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            {uploading ? (
              <p>Mengunggah...</p>
            ) : fotoUrl ? (
              <img src={fotoUrl} alt="Pratinjau" className="dropzone-preview" />
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
            <button type="submit" className="btn-primary" disabled={uploading}>
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
              {item.foto_url && <img src={item.foto_url} alt={item.nama} className="thumb" />}
              <div style={{ flex: 1 }}>
                <div className="data-title">{item.nama}</div>
                <div className="data-sub">{item.jabatan}</div>
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
            <p className="empty-state">Belum ada data. Klik &quot;Tambah guru/staff&quot; untuk mulai.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}