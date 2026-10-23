import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import styles from './InfoPendaftaranEditor.module.css';
import { useDialog } from './DialogProvider';

export type Kategori = 'jadwal' | 'dokumen' | 'kelompok' | 'lainnya';
export type InfoRow = { id: string; judul: string; isi: string; kategori: Kategori };

const ORDER: Kategori[] = ['jadwal', 'dokumen', 'kelompok', 'lainnya'];

let counter = 0;
function newId(): string {
  counter += 1;
  return 'r' + counter + '-' + Math.random().toString(36).slice(2, 7);
}

// Harus sama dengan inferKategori di public/script.js
function inferKategori(judul: string): Kategori {
  const j = String(judul || '').toLowerCase();
  if (/dokumen|pas\s*foto|berkas|persyaratan/.test(j)) return 'dokumen';
  if (/usia|kelas|kelompok/.test(j)) return 'kelompok';
  if (/jadwal|tanggal|pengumuman|wawancara|observasi|daftar ulang|registrasi/.test(j)) return 'jadwal';
  return 'lainnya';
}

const UMUM_DOKUMEN = /^(dokumen|pas\s*foto|berkas|persyaratan)$/i;
const UMUM_LAIN = /^(catatan|keterangan|informasi|info)$/i;

// Membaca data tersimpan (format lama maupun baru) menjadi baris yang siap diedit
export function parseInfo(raw: string): InfoRow[] {
  let list: any;
  try {
    list = JSON.parse(raw || '[]');
  } catch {
    list = [];
  }
  if (!Array.isArray(list)) return [];

  const rows: InfoRow[] = [];
  list.forEach((it: any) => {
    if (!it) return;
    let judul = String(it.judul || '').trim();
    let isi = String(it.isi || '').trim();
    // Kategori "catatan" sudah dihapus: baris lama dipindah ke "lainnya"
    const awal = it.kategori === 'catatan' ? 'lainnya' : it.kategori;
    const kategori: Kategori = ORDER.indexOf(awal) !== -1 ? awal : inferKategori(judul);

    if (kategori === 'dokumen') {
      if (!judul || UMUM_DOKUMEN.test(judul)) {
        if (/^pas\s*foto$/i.test(judul) && isi && !/pas\s*foto/i.test(isi)) isi = 'Pasfoto ' + isi;
        judul = '';
      } else if (isi) {
        isi = judul + ': ' + isi;
        judul = '';
      } else {
        isi = judul;
        judul = '';
      }
    }

    if (kategori === 'lainnya' && UMUM_LAIN.test(judul)) judul = '';

    if (kategori === 'kelompok') {
      const m = judul.match(/\b(?:kelas|kelompok|kel)\b\.?\s*([A-Za-z0-9]+)/i);
      if (m) judul = 'Kelompok ' + (m[1].length <= 2 ? m[1].toUpperCase() : m[1]);
    }

    if (!judul && !isi) return;
    rows.push({ id: newId(), judul, isi, kategori });
  });
  return rows;
}

// Mengubah baris menjadi teks JSON untuk disimpan (urut per bagian, baris kosong dibuang)
export function serializeInfo(rows: InfoRow[]): string {
  const out: { judul: string; isi: string; kategori: Kategori }[] = [];
  ORDER.forEach((k) => {
    rows
      .filter((r) => r.kategori === k)
      .forEach((r) => {
        const judul = r.judul.trim();
        const isi = r.isi.trim();
        if (!judul && !isi) return;
        out.push({ judul, isi, kategori: k });
      });
  });
  return JSON.stringify(out);
}

type FieldDef = { key: 'judul' | 'isi'; label: string; placeholder: string; multiline?: boolean };
type SectionDef = {
  kat: Kategori;
  title: string;
  hint: string;
  empty: string;
  addLabel: string;
  fields: FieldDef[];
};

const SECTIONS: SectionDef[] = [
  {
    kat: 'jadwal',
    title: 'Jadwal Pendaftaran',
    hint: 'Isi tanggal sesuai jadwal sekolah. Urutkan dari yang paling awal.',
    empty: 'Belum ada jadwal.',
    addLabel: '+ Tambah jadwal',
    fields: [
      { key: 'judul', label: 'Nama kegiatan', placeholder: 'Contoh: Pendaftaran dibuka' },
      { key: 'isi', label: 'Tanggal', placeholder: 'Contoh: 1 - 15 Juni' },
    ],
  },
  {
    kat: 'dokumen',
    title: 'Dokumen yang Dibawa',
    hint: 'Tulis satu dokumen di tiap baris. Pasfoto juga ditulis di sini.',
    empty: 'Belum ada dokumen.',
    addLabel: '+ Tambah dokumen',
        fields: [{ key: 'isi', label: 'Nama dokumen', placeholder: 'Contoh: Fotokopi Kartu Keluarga', multiline: true }],
  },
  {
    kat: 'kelompok',
    title: 'Usia dan Kelompok',
    hint: 'Tulis nama kelompok dan rentang usia anak.',
    empty: 'Belum ada kelompok.',
    addLabel: '+ Tambah kelompok',
    fields: [
      { key: 'judul', label: 'Nama kelompok', placeholder: 'Contoh: Kelompok A' },
      { key: 'isi', label: 'Usia', placeholder: 'Contoh: 3 - 4 tahun' },
    ],
  },
  
  {
    kat: 'lainnya',
    title: 'Informasi Lainnya',
    hint: 'Untuk keterangan tambahan, misalnya biaya.',
    empty: 'Belum ada informasi lain.',
    addLabel: '+ Tambah informasi',
    fields: [
      { key: 'judul', label: 'Judul (boleh kosong)', placeholder: 'Contoh: Biaya' },
            { key: 'isi', label: 'Isi', placeholder: 'Contoh: Hubungi sekolah', multiline: true },
    ],
  },
];

function IconGrip() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="currentColor">
      <circle cx="6" cy="4" r="1.6" />
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="6" cy="9" r="1.6" />
      <circle cx="12" cy="9" r="1.6" />
      <circle cx="6" cy="14" r="1.6" />
      <circle cx="12" cy="14" r="1.6" />
    </svg>
  );
}

function IconUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11l5-5 5 5" />
    </svg>
  );
}

function IconDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7l5 5 5-5" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h12M7 5V3h4v2M5 5l1 10h6l1-10M8 8v4M10 8v4" />
    </svg>
  );
}

type Props = {
  rows: InfoRow[];
  onChange: (rows: InfoRow[]) => void;
};

export default function InfoPendaftaranEditor({ rows, onChange }: Props) {
  const { konfirmasi } = useDialog();
  const [drag, setDrag] = useState<{ kat: Kategori; from: number } | null>(null);
  const [over, setOver] = useState<{ kat: Kategori; index: number } | null>(null);
  const fokusId = useRef<string | null>(null);

  useEffect(() => {
    if (fokusId.current) {
      const el = document.getElementById(fokusId.current);
      if (el) el.focus();
      fokusId.current = null;
    }
  }, [rows]);

  function daftar(kat: Kategori): InfoRow[] {
    return rows.filter((r) => r.kategori === kat);
  }

  function simpanDaftar(kat: Kategori, baru: InfoRow[]) {
    const hasil: InfoRow[] = [];
    ORDER.forEach((k) => {
      (k === kat ? baru : daftar(k)).forEach((r) => hasil.push(r));
    });
    onChange(hasil);
  }

  function tambah(sec: SectionDef) {
    const row: InfoRow = { id: newId(), judul: '', isi: '', kategori: sec.kat };
    fokusId.current = row.id + '-' + sec.fields[0].key;
    simpanDaftar(sec.kat, [...daftar(sec.kat), row]);
  }

  function ubah(id: string, key: 'judul' | 'isi', value: string) {
    onChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function pindah(kat: Kategori, dari: number, ke: number) {
    const list = [...daftar(kat)];
    if (dari === ke || ke < 0 || ke >= list.length) return;
    const [x] = list.splice(dari, 1);
    list.splice(ke, 0, x);
    simpanDaftar(kat, list);
  }

  function hapus(sec: SectionDef, index: number) {
    const list = [...daftar(sec.kat)];
    const row = list[index];
    if (!row) return;

    konfirmasi({
      judul: 'Hapus dari "' + sec.title + '"?',
      nama: row.judul || row.isi || 'Baris ' + (index + 1),
      tombolYa: 'Ya, hapus',
    }).then((ya) => {
      if (!ya) return;
      const terbaru = daftar(sec.kat).filter((r) => r.id !== row.id);
      simpanDaftar(sec.kat, terbaru);
    });
  }

  return (
    <div className={styles.wrap}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.top}>
        <div>
          <h2 className={styles.topTitle}>Informasi Pendaftaran</h2>
          <p className={styles.topDesc}>Isi tiap bagian di bawah. Perubahan tampil di website setelah disimpan.</p>
        </div>
      </div>

      {SECTIONS.map((sec) => {
        const list = daftar(sec.kat);
        return (
          <section key={sec.kat} className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>{sec.title}</h3>
              <span className={styles.badge}>{list.length} item</span>
            </div>
            <p className={styles.hint}>{sec.hint}</p>

            {list.length === 0 ? (
              <p className={styles.empty}>{sec.empty}</p>
            ) : (
                            <ol className={styles.list}>
                {list.map((row, i) => {
                  const sedangOver = drag && over && over.kat === sec.kat && over.index === i;
                  const sedangDrag = drag && drag.kat === sec.kat && drag.from === i;
                  const cls = [styles.row, sedangOver ? styles.rowOver : '', sedangDrag ? styles.rowDragging : '']
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <li
                      key={row.id}
                      className={cls}
                      onDragOver={(e) => {
                        if (drag && drag.kat === sec.kat) {
                          e.preventDefault();
                          if (!over || over.kat !== sec.kat || over.index !== i) setOver({ kat: sec.kat, index: i });
                        }
                      }}
                      onDrop={(e) => {
                        if (drag && drag.kat === sec.kat) {
                          e.preventDefault();
                          pindah(sec.kat, drag.from, i);
                        }
                        setDrag(null);
                        setOver(null);
                      }}
                    >
                      <span className={styles.num}>{i + 1}</span>

                      <div className={styles.rowBody}>
                        <div className={sec.fields.length === 2 ? styles.fieldsTwo : styles.fields}>
                          {sec.fields.map((f) => {
                            const fid = row.id + '-' + f.key;
                            return (
                              <div key={f.key} className={styles.field}>
                                <label htmlFor={fid} className={styles.label}>
                                  {f.label}
                                </label>
                                {f.multiline ? (
                                  <textarea
                                    id={fid}
                                    className={styles.textarea}
                                    rows={2}
                                    value={row[f.key]}
                                    placeholder={f.placeholder}
                                    onChange={(e) => ubah(row.id, f.key, e.target.value)}
                                  />
                                ) : (
                                  <input
                                    id={fid}
                                    className={styles.input}
                                    value={row[f.key]}
                                    placeholder={f.placeholder}
                                    onChange={(e) => ubah(row.id, f.key, e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.btnDelete}
                            onClick={() => hapus(sec, i)}
                            aria-label={'Hapus baris ' + (i + 1) + ' dari ' + sec.title}
                          >
                            <IconTrash /> Hapus
                          </button>
                        </div>
                      </div>

                      <span
                        className={styles.grip}
                        draggable
                        title="Tahan dan seret untuk mengubah urutan"
                        onDragStart={(e) => {
                          setDrag({ kat: sec.kat, from: i });
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', row.id);
                          const li = e.currentTarget.closest('li');
                          if (li) e.dataTransfer.setDragImage(li, 20, 20);
                        }}
                        onDragEnd={() => {
                          setDrag(null);
                          setOver(null);
                        }}
                      >
                        <IconGrip />
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <button type="button" className={styles.addBtn} onClick={() => tambah(sec)}>
              {sec.addLabel}
            </button>
          </section>
        );
      })}

    </div>
  );
}

type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
};

export function SaveBar({ dirty, saving, saved, error }: SaveBarProps) {
  return (
    <>
      <div className={styles.saveBar}>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.saveStatus}>
          {dirty ? (
            <span className={styles.dirty}>● Ada perubahan yang belum disimpan</span>
          ) : (
            <span className={styles.clean}>Semua perubahan sudah tersimpan</span>
          )}
        </div>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      {saved && (
        <div className={styles.toast} role="status">
          Berhasil disimpan ✓
        </div>
      )}
    </>
  );
}