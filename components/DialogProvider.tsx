import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';

type Jenis = 'bahaya' | 'info' | 'sukses';

type OpsiKonfirmasi = {
  judul: string;
  pesan?: string;
  nama?: string;        // nama item yang dihapus, tampil dalam kotak
  tombolYa?: string;    // default: 'Ya, hapus' (bahaya) / 'Ya'
  tombolBatal?: string; // default: 'Batal'
  jenis?: Jenis;        // default: 'bahaya'
};

type OpsiInfo = { judul: string; pesan?: string; tombol?: string; jenis?: Jenis };

type JenisToast = 'sukses' | 'galat' | 'info';
type ItemToast = { id: number; teks: string; jenis: JenisToast };

type Dlg = {
  mode: 'konfirmasi' | 'info';
  judul: string;
  pesan?: string;
  nama?: string;
  tombolYa: string;
  tombolBatal: string;
  jenis: Jenis;
  resolve: (v: boolean) => void;
};

type Ctx = {
  konfirmasi: (o: OpsiKonfirmasi) => Promise<boolean>;
  beritahu: (o: OpsiInfo) => Promise<void>;
  toast: (teks: string, jenis?: JenisToast) => void;
};

// Cadangan jika dipakai di luar provider: tetap jalan dengan dialog bawaan
const DialogCtx = createContext<Ctx>({
  konfirmasi: async (o) => window.confirm(o.judul + (o.pesan ? '\n' + o.pesan : '')),
  beritahu: async (o) => window.alert(o.judul + (o.pesan ? '\n' + o.pesan : '')),
  toast: (t) => window.alert(t),
});

export const useDialog = () => useContext(DialogCtx);

function Ikon({ jenis }: { jenis: Jenis }) {
  const p = { width: 30, height: 30, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (jenis === 'bahaya') {
    return (
      <svg {...p}>
        <path d="M3 6h18" /><path d="M8 6V4h8v2" />
        <path d="M6 6l1 14h10l1-14" /><path d="M10 11v5M14 11v5" />
      </svg>
    );
  }
  if (jenis === 'sukses') {
    return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>);
  }
  return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [toasts, setToasts] = useState<ItemToast[]>([]);
  const dlgRef = useRef<Dlg | null>(null);
  const kartuRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLElement | null>(null);
  const idRef = useRef(0);
  dlgRef.current = dlg;

  const tutup = useCallback((hasil: boolean) => {
    dlgRef.current?.resolve(hasil);
    setDlg(null);
    pemicuRef.current?.focus?.();
  }, []);

  const buka = useCallback((d: Omit<Dlg, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      dlgRef.current?.resolve(false);
      pemicuRef.current = document.activeElement as HTMLElement | null;
      setDlg({ ...d, resolve });
    });
  }, []);

  const konfirmasi = useCallback((o: OpsiKonfirmasi) => {
    const jenis = o.jenis ?? 'bahaya';
    return buka({
      mode: 'konfirmasi',
      judul: o.judul,
      pesan: o.pesan,
      nama: o.nama,
      jenis,
      tombolYa: o.tombolYa ?? (jenis === 'bahaya' ? 'Ya, hapus' : 'Ya'),
      tombolBatal: o.tombolBatal ?? 'Batal',
    });
  }, [buka]);

  const beritahu = useCallback((o: OpsiInfo) => {
    return buka({
      mode: 'info',
      judul: o.judul,
      pesan: o.pesan,
      jenis: o.jenis ?? 'info',
      tombolYa: o.tombol ?? 'Mengerti',
      tombolBatal: '',
    }).then(() => undefined);
  }, [buka]);

  const toast = useCallback((teks: string, jenis: JenisToast = 'sukses') => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, teks, jenis }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Kunci scroll, Esc untuk batal, Tab tetap di dalam dialog, fokus awal aman
  useEffect(() => {
    if (!dlg) return;
    const lama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const awal = kartuRef.current?.querySelector<HTMLElement>('[data-awal]');
    awal?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        tutup(false);
        return;
      }
      if (e.key === 'Tab' && kartuRef.current) {
        const f = Array.from(kartuRef.current.querySelectorAll<HTMLElement>('button'));
        if (!f.length) return;
        const pertama = f[0];
        const terakhir = f[f.length - 1];
        if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir.focus(); }
        else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = lama;
    };
  }, [dlg, tutup]);

  return (
    <DialogCtx.Provider value={{ konfirmasi, beritahu, toast }}>
      {children}

      {dlg && (
        <div
          className="dlg-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget && dlg.mode === 'konfirmasi') tutup(false); }}
        >
          <div
            ref={kartuRef}
            className={`dlg dlg-${dlg.jenis}`}
            role={dlg.mode === 'konfirmasi' && dlg.jenis === 'bahaya' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="dlg-judul"
            aria-describedby={dlg.pesan ? 'dlg-pesan' : undefined}
          >
            <div className="dlg-ikon"><Ikon jenis={dlg.jenis} /></div>
            <h2 id="dlg-judul" className="dlg-judul">{dlg.judul}</h2>
            {dlg.pesan && <p id="dlg-pesan" className="dlg-pesan">{dlg.pesan}</p>}
            {dlg.nama && <div className="dlg-nama">{dlg.nama}</div>}

            <div className="dlg-aksi">
              {dlg.mode === 'konfirmasi' && (
                <button
                  type="button"
                  className="dlg-btn dlg-btn-batal"
                  data-awal={dlg.jenis === 'bahaya' ? '' : undefined}
                  onClick={() => tutup(false)}
                >
                  {dlg.tombolBatal}
                </button>
              )}
              <button
                type="button"
                className={`dlg-btn ${dlg.jenis === 'bahaya' ? 'dlg-btn-bahaya' : 'dlg-btn-utama'}`}
                data-awal={dlg.jenis !== 'bahaya' ? '' : undefined}
                onClick={() => tutup(true)}
              >
                {dlg.tombolYa}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-wadah" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.jenis}`} role="status">
            <span className="toast-titik" aria-hidden="true" />
            {t.teks}
          </div>
        ))}
      </div>
    </DialogCtx.Provider>
  );
}