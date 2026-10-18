import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import InfoPendaftaranEditor, {
  SaveBar,
  parseInfo,
  serializeInfo,
  type InfoRow,
} from '../../components/InfoPendaftaranEditor';
import { createClient } from '../../lib/supabase/client';

type Settings = {
  tagline: string;
  foto_hero_url: string;
  foto_profil_url: string;
  tentang_teks: string;
  info_pendaftaran: InfoRow[];
  alamat: string;
  maps_koordinat: string;
  no_telp: string;
  jam_operasional: string;
  cta_teks: string;
  wa_pesan: string;
};

const EMPTY: Settings = {
  tagline: '',
  foto_hero_url: '',
  foto_profil_url: '',
  tentang_teks: '',
  info_pendaftaran: [],
  alamat: '',
  maps_koordinat: '',
  no_telp: '',
  jam_operasional: '',
  cta_teks: '',
  wa_pesan: '',
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
  const [snapshot, setSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProfil, setUploadingProfil] = useState(false);
  const fileInputHeroRef = useRef<HTMLInputElement>(null);
  const fileInputProfilRef = useRef<HTMLInputElement>(null);

  const dirty = !loading && JSON.stringify(form) !== snapshot;

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/pengaturan');
      const rows: { key: string; value: string }[] = await res.json();
      const next: any = { ...EMPTY };
      rows.forEach((r) => {
        if (r.key === 'info_pendaftaran') {
          next.info_pendaftaran = parseInfo(r.value);
        } else if (r.key in next) {
          next[r.key] = r.value || '';
        }
      });
      setForm(next);
      setSnapshot(JSON.stringify(next));
      setLoading(false);
    }
    load();
  }, []);

  // Peringatan jika menutup halaman saat ada perubahan yang belum disimpan
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
    const payload = { ...form, info_pendaftaran: serializeInfo(form.info_pendaftaran) };
    const res = await fetch('/api/pengaturan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Gagal menyimpan. Coba lagi.');
      return;
    }
    setSnapshot(JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
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
        Ubah isi website di sini. Perubahan langsung tampil di halaman orang tua setelah disimpan.
      </p>

      <form className="admin-form" style={{ maxWidth: 760 }} onSubmit={handleSubmit}>
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

        <InfoPendaftaranEditor
          rows={form.info_pendaftaran}
          onChange={(rows) => update('info_pendaftaran', rows)}
        />

        <label htmlFor="cta_teks">Cara mendaftar (penjelasan singkat)</label>
        <textarea
          id="cta_teks"
          value={form.cta_teks}
          onChange={(e) => update('cta_teks', e.target.value)}
          rows={3}
          placeholder="contoh: Daftar langsung ke sekolah, atau tanya-tanya dulu lewat WhatsApp."
        />

        <label htmlFor="wa_pesan">Pesan awal WhatsApp</label>
        <textarea
          id="wa_pesan"
          value={form.wa_pesan}
          onChange={(e) => update('wa_pesan', e.target.value)}
          rows={3}
          placeholder="contoh: Halo, saya ingin bertanya tentang pendaftaran."
        />
        <p style={{ fontSize: 13, color: '#64748b', marginTop: -8 }}>
          Teks ini otomatis terisi di kolom chat saat orang tua menekan tombol WhatsApp. Kosongkan jika tidak ingin ada teks awal.
        </p>

        <label htmlFor="alamat">Alamat sekolah</label>
        <textarea id="alamat" value={form.alamat} onChange={(e) => update('alamat', e.target.value)} rows={2} />

        <label htmlFor="maps_koordinat">Titik lokasi di Google Maps</label>
        <input
          id="maps_koordinat"
          value={form.maps_koordinat}
          onChange={(e) => update('maps_koordinat', e.target.value)}
          placeholder="contoh: -6.927555, 107.636087"
        />
        <p style={{ fontSize: 13, color: '#64748b', marginTop: -8 }}>
          Cara ambil: buka Google Maps di HP/laptop, cari lokasi sekolah, tekan lama/klik kanan titik di peta sampai muncul koordinat, lalu salin (copy) dan tempel di sini.
        </p>

        <label htmlFor="no_telp">Nomor WhatsApp / telepon</label>
        <input
          id="no_telp"
          value={form.no_telp}
          onChange={(e) => update('no_telp', e.target.value)}
          placeholder="contoh: 081234567890 atau 6281234567890"
        />

        <label htmlFor="jam_operasional">Jam operasional sekolah</label>
        <input
          id="jam_operasional"
          value={form.jam_operasional}
          onChange={(e) => update('jam_operasional', e.target.value)}
          placeholder="contoh: Senin – Jumat, 07.30 – 11.00"
        />

        <SaveBar dirty={dirty} saving={saving} saved={saved} error={error} />
      </form>
    </AdminLayout>
  );
}