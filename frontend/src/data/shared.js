// ═══════════════════════════════════════════════════════════════
// SHARED DATA — Digunakan oleh semua role
// Data yang bersifat umum dan menjadi referensi bersama
// ═══════════════════════════════════════════════════════════════

// ─── Daftar Biro Auditor (referensi utama) ───
export const BIRO_LIST = [
  {
    id: 1,
    name: 'Biro Audit Keuangan & Fraud',
    shortName: 'Keuangan & Fraud',
    initials: 'K',
    color: 'bg-[#2E3AA8]',
    gradient: 'from-blue-600 to-indigo-700',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-700',
  },
  {
    id: 2,
    name: 'Biro Audit Operasional & Teknologi Informasi',
    shortName: 'Operasional & TI',
    initials: 'O',
    color: 'bg-[#C56BFF]',
    gradient: 'from-purple-500 to-violet-600',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
  },
  {
    id: 3,
    name: 'Biro Perencanaan Audit',
    shortName: 'Perencanaan Audit',
    initials: 'P',
    color: 'bg-[#242C8F]',
    gradient: 'from-indigo-600 to-blue-700',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-blue-700',
  },
];

// Helper: cari biro berdasarkan id atau nama
export const getBiroById = (id) => BIRO_LIST.find(b => b.id === id);
export const getBiroByName = (name) => BIRO_LIST.find(b => b.name === name);

// ─── 13 Tahapan Proses Konsultasi Audit ───
export const TAHAPAN_AUDIT = [
  { no: 1, tahapan: 'Permintaan Konsultasi dari Klien', detail: 'Auditee mengajukan konsultasi melalui NDE Klien.', dokumen: 'NDE Klien' },
  { no: 2, tahapan: 'Identifikasi Permintaan Konsultasi dari Biro Candit', detail: 'Biro Candit melakukan identifikasi melalui NDE. Jika ditolak, terbit Nota Dinas dan proses berhenti di tahap ini.', dokumen: 'NDE / Nota Dinas (Ditolak)' },
  { no: 3, tahapan: 'Pembuatan Surat Tugas (Diterima)', detail: 'Jika permintaan diterima, diterbitkan Surat Tugas (ST).', dokumen: 'Surat Tugas (ST)' },
  { no: 4, tahapan: 'Entry Meeting', detail: 'Pelaksanaan entry meeting dan penyusunan notulen.', dokumen: 'Notulen Entry Meeting' },
  { no: 5, tahapan: 'Permintaan Dokumen Konsultasi', detail: 'SPI mengirim permintaan dokumen konsultasi.', dokumen: 'NDE SPI' },
  { no: 6, tahapan: 'Pemenuhan Dokumen Konsultasi', detail: 'Auditee memenuhi permintaan dokumen konsultasi.', dokumen: 'NDE Klien' },
  { no: 7, tahapan: 'Analisa Data', detail: 'Tim melakukan analisa data konsultasi dan penyusunan KKA.', dokumen: 'KKA' },
  { no: 8, tahapan: 'Review KKA', detail: 'Supervisi atas KKA dilakukan sebelum lanjut.', dokumen: 'Dokumen Supervisi KKA' },
  { no: 9, tahapan: 'Exit Meeting', detail: 'Pelaksanaan exit meeting dan penyusunan notulen.', dokumen: 'Notulen Exit Meeting' },
  { no: 10, tahapan: 'Penyusunan Draft LHK', detail: 'Draft LHK disusun untuk dibahas pada tahap review.', dokumen: 'Draft LHK' },
  { no: 11, tahapan: 'Review Draft LHK', detail: 'Draft LHK direview dan disupervisi.', dokumen: 'Dokumen Supervisi LHK' },
  { no: 12, tahapan: 'Finalisasi LHK', detail: 'LHK difinalisasi sesuai hasil review.', dokumen: 'Dokumen LHK' },
  { no: 13, tahapan: 'Distribusi LHK', detail: 'LHK didistribusikan melalui NDE dan e-mail.', dokumen: 'NDE dan E-mail' },
];

// ─── Data Profil SPI ───
export const SPI_PROFILE = {
  visi: 'Keterangan Visi',
  misi: 'Keterangan Misi',
  struktur: [
    { jabatan: 'Kepala SPI', nama: 'CONTOH', foto: null },
    { jabatan: 'Kepala Biro Perencanaan Audit', nama: 'CONTOH', foto: null },
    { jabatan: 'Kepala Biro Audit Operasional & TI', nama: 'CONTOH', foto: null },
    { jabatan: 'Kepala Biro Audit Keuangan & Fraud', nama: 'CONTOH', foto: null },
  ],
  kontak: {
    alamat: 'Gedung SPI Lt. 5',
    telepon: 'ext. 5001',
    email: 'spi@company.co.id',
  },
};

// ─── Status Labels & Colors ───
export const STATUS_CONFIG = {
  selesai:   { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-600 border-emerald-200', dot: 'bg-emerald-400' },
  proses:    { label: 'Proses',     color: 'bg-blue-100 text-blue-600 border-blue-200',         dot: 'bg-blue-400' },
  menunggu:  { label: 'Menunggu',   color: 'bg-amber-100 text-amber-600 border-amber-200',      dot: 'bg-amber-400' },
  ditolak:   { label: 'Ditolak',    color: 'bg-red-100 text-red-600 border-red-200',            dot: 'bg-red-400' },
  baru:      { label: 'Baru',       color: 'bg-sky-100 text-sky-600 border-sky-200',            dot: 'bg-sky-400' },
  tindaklanjut: { label: 'Tindak Lanjut', color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
};
