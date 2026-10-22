// Aturan: sesi admin hanya berlaku sampai ganti hari (zona WIB).
export const COOKIE_HARI = 'admin_hari';

// Jam ganti hari (WIB). 0 = tengah malam. Isi 3 jika ingin batas pukul 03.00 pagi.
export const JAM_GANTI_HARI = 0;

const WIB_MS = 7 * 60 * 60 * 1000;

function geser(): Date {
  return new Date(Date.now() + WIB_MS - JAM_GANTI_HARI * 60 * 60 * 1000);
}

// Tanggal "hari kerja" sekarang, contoh: 2026-10-21
export function hariIni(): string {
  return geser().toISOString().slice(0, 10);
}

// Detik tersisa sampai ganti hari berikutnya
export function detikSampaiGantiHari(): number {
  const d = geser();
  const lewat = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  return Math.max(60, 86400 - lewat);
}