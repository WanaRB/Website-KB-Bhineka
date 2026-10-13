import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '../../lib/supabase/client';

type InfoItem = { judul: string; isi: string };

type Settings = {
  tagline: string;
  foto_hero_url: string;
  foto_profil_url: string;
  tentang_teks: string;
  info_pendaftaran: InfoItem[];
  alamat: string;
  no_telp: string;
  maps_koordinat: string;
  jam_operasional: string;
  cta_teks: string;
};

const EMPTY: Settings = {
  tagline: '',
  foto_hero_url: '',
  foto_profil_url: '',
  tentang_teks: '',
  info_pendaftaran: [],
  alamat: '',
  no_telp: '',
  maps_koordinat: '',
  jam_operasional: '',
  cta_teks: '',
};

async function uploadFoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('galeri').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('galeri').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function PengaturanPage() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProfil, setUploadingProfil] = useState(false);
  const fileInputHeroRef = useRef<HTMLInputElement>(null);
  const fileInputProfilRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/pengaturan');
      const rows: { key: string; value: string }[] = await res.json();
      const next: any = { ...EMPTY };
      rows.forEach((r) => {
        if (r.key === 'info_pendaftaran') {
          try {
            next.info_pendaftaran = JSON.parse(r.value || '[]');
          } catch {
            next.info_pendaftaran = [];
          }
        } else if (r.key in next) {
          next[r.key] = r.value || '';
        }
      });
      setForm(next);
      setLoading(false);
    }
    load();
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function addInfoItem() {
    setForm((f) => ({ ...f, info_pendaftaran: [...f.info_pendaftaran, { judul: '', isi: '' }] }));
    setSaved(false);
  }

  function updateInfoItem(index: number, field: 'judul' | 'isi', value: string) {
    setForm((f) => {
      const next = [...f.info_pendaftaran];
      next[index] = { ...next[index], [field]: value };
      return { ...f, info_pendaftaran: next };
    });
    setSaved(false);
  }

  function removeInfoItem(index: number) {
    setForm((f) => ({ ...f, info_pendaftaran: f.info_pendaftaran.filter((_, i) => i !== index) }));
    setSaved(false);
  }

  async function handleFileHero(file: File | undefined) {
    if (!file) return;
    setError('');
    setUploadingHero(true);
    try {
      const url = await uploadFoto(file);
      update('foto_hero_url', url);
    } catch (err: any) {
      setError('Gagal mengunggah foto: ' + (err.message || 'coba lagi'));
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleFileProfil(file: File | undefined) {
    if (!file) return;
    setError('');
    setUploadingProfil(true);
    try {
      const url = await uploadFoto(file);
      update('foto_profil_url', url);
    } catch (err: any) {
      setError('Gagal mengunggah foto: ' + (err.message || 'coba lagi'));
    } finally {
      setUploadingProfil(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { ...form, info_pendaftaran: JSON.stringify(form.info_pendaftaran) };
    const res = await fetch('/api/pengaturan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal menyimpan');
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <AdminLayout title="Pengaturan website">
        <p>Memuat...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pengaturan website">
      <p className="page-desc">
        Ubah konten yang tampil di halaman orang tua. Perubahan langsung tampil di website tanpa perlu ubah kode.
      </p>

      <form className="admin-form" style={{ maxWidth: 640 }} onSubmit={handleSubmit}>
        <label htmlFor="tagline">Tagline (di bawah nama sekolah)</label>
        <input id="tagline" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} />

        <label htmlFor="foto_hero_file">Foto utama (hero)</label>
        <div
          className="dropzone"
          onClick={() => fileInputHeroRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileHero(e.dataTransfer.files?.[0]); }}
        >
          {uploadingHero ? (
            <p>Mengunggah...</p>
          ) : form.foto_hero_url ? (
            <img src={form.foto_hero_url} alt="Pratinjau foto hero" className="dropzone-preview" />
          ) : (
            <p>Tarik &amp; lepas foto di sini, atau klik untuk pilih file</p>
          )}
        </div>
        <input
          id="foto_hero_file"
          ref={fileInputHeroRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileHero(e.target.files?.[0])}
        />

        <label htmlFor="foto_profil_file">Foto &quot;Tentang Kami&quot;</label>
        <div
          className="dropzone"
          onClick={() => fileInputProfilRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileProfil(e.dataTransfer.files?.[0]); }}
        >
          {uploadingProfil ? (
            <p>Mengunggah...</p>
          ) : form.foto_profil_url ? (
            <img src={form.foto_profil_url} alt="Pratinjau foto tentang kami" className="dropzone-preview" />
          ) : (
            <p>Tarik &amp; lepas foto di sini, atau klik untuk pilih file</p>
          )}
        </div>
        <input
          id="foto_profil_file"
          ref={fileInputProfilRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileProfil(e.target.files?.[0])}
        />

        <label htmlFor="tentang_teks">Teks &quot;Tentang Kami&quot;</label>
        <textarea
          id="tentang_teks"
          value={form.tentang_teks}
          onChange={(e) => update('tentang_teks', e.target.value)}
          rows={4}
        />

        <label>Informasi pendaftaran</label>
        {form.info_pendaftaran.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Judul (contoh: Usia murid)"
              value={item.judul}
              onChange={(e) => updateInfoItem(i, 'judul', e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              placeholder="Isi (contoh: 2 - 4 tahun)"
              value={item.isi}
              onChange={(e) => updateInfoItem(i, 'isi', e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn-danger" onClick={() => removeInfoItem(i)}>
              Hapus
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addInfoItem} style={{ marginBottom: 16 }}>
          + Tambah info
        </button>

        <label htmlFor="alamat">Alamat sekolah</label>
        <textarea id="alamat" value={form.alamat} onChange={(e) => update('alamat', e.target.value)} rows={2} />

        <label htmlFor="maps_koordinat">Titik lokasi di Google Maps</label>
        <input
          id="maps_koordinat"
          value={form.maps_koordinat}
          onChange={(e) => update('maps_koordinat', e.target.value)}
          placeholder="contoh: -6.927555, 107.636087"
        />
        <br /> <br />
        <p style={{ fontSize: 13, color: '#3c4d71', marginTop: -8}}>
          <span style={{ color: 'red' }}>Cara ambil titik lokasi maps :</span> Buka Google Maps, cari lokasi sekolah, tekan lama/klik kanan titik di peta sampai muncul koordinat, lalu salin dan tempel di sini.
        </p>

        <label htmlFor="no_telp">Nomor WhatsApp / telepon</label>
        <input
          id="no_telp"
          value={form.no_telp}
          onChange={(e) => update('no_telp', e.target.value)}
          placeholder="contoh: 6281234567890 (kode negara, tanpa + atau spasi)"
        />

                <label htmlFor="jam_operasional">Jam operasional sekolah</label>
        <input
          id="jam_operasional"
          value={form.jam_operasional}
          onChange={(e) => update('jam_operasional', e.target.value)}
          placeholder="contoh: Senin – Jumat, 07.30 – 11.00"
        />

        <label htmlFor="cta_teks">Teks ajakan daftar (CTA akhir)</label>
        <input
          id="cta_teks"
          value={form.cta_teks}
          onChange={(e) => update('cta_teks', e.target.value)}
          placeholder="contoh: Tertarik menyekolahkan anak Anda di sini?"
        />

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-saved">Tersimpan.</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}