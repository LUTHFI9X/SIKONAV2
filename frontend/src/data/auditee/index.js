// ═══════════════════════════════════════════════════════════════
// FOLDER ROLE AUDITEE — Data khusus role Auditee
// Berisi: profil auditee, aktivitas, stats, konsultasi
// ───────────────────────────────────────────────────────────────
// Link ke:
//   → shared (BIRO_LIST untuk identitas biro tujuan konsultasi)
//   → auditor/ (auditor menerima konsultasi dari auditee)
//   → manajemen/ (manajemen memonitor semua auditee)
// ═══════════════════════════════════════════════════════════════

import { BIRO_LIST } from '../shared';

// ─── Daftar Semua Auditee (master data) ───
// Digunakan oleh: AuditeeList (auditor view), ProsesAudit, Konsultasi
// Direferensi oleh: auditor/index.js & manajemen/index.js
export const ALL_AUDITEES = [
  { id: 1,  name: 'Ahmad Rizki',     unit: 'Keuangan',    biro: 'Biro Audit Keuangan & Fraud',                          tujuanKonsultasi: 'Biro Audit Keuangan & Fraud',                          status: 'Selesai',        konsultasiDikirim: 3, lastKonsultasi: '2025-01-28' },
  { id: 2,  name: 'Siti Nurhaliza',   unit: 'IT Support',  biro: 'Biro Audit Operasional & Teknologi Informasi',          tujuanKonsultasi: 'Biro Audit Operasional & Teknologi Informasi',          status: 'Tindak Lanjut',  konsultasiDikirim: 2, lastKonsultasi: '2025-01-25' },
  { id: 3,  name: 'Budi Santoso',     unit: 'HRD',         biro: 'Biro Perencanaan Audit',                                tujuanKonsultasi: 'Biro Perencanaan Audit',                                status: 'Baru',           konsultasiDikirim: 1, lastKonsultasi: '2025-01-30' },
  { id: 4,  name: 'Dewi Lestari',     unit: 'Marketing',   biro: 'Biro Audit Keuangan & Fraud',                          tujuanKonsultasi: 'Biro Audit Keuangan & Fraud',                          status: 'Proses',         konsultasiDikirim: 4, lastKonsultasi: '2025-01-22' },
  { id: 5,  name: 'Eko Prasetyo',     unit: 'Operasional', biro: 'Biro Audit Operasional & Teknologi Informasi',          tujuanKonsultasi: 'Biro Audit Operasional & Teknologi Informasi',          status: 'Selesai',        konsultasiDikirim: 2, lastKonsultasi: '2025-01-18' },
  { id: 6,  name: 'Luthfi Dean',      unit: 'PAMLEK',      biro: 'Biro Audit Keuangan & Fraud',                          tujuanKonsultasi: 'Biro Audit Keuangan & Fraud',                          status: 'Proses',         konsultasiDikirim: 5, lastKonsultasi: '2025-01-29' },
  { id: 7,  name: 'Rina Wati',        unit: 'HRD',         biro: 'Biro Audit Keuangan & Fraud',                          tujuanKonsultasi: 'Biro Audit Keuangan & Fraud',                          status: 'Tindak Lanjut',  konsultasiDikirim: 1, lastKonsultasi: '2025-01-20' },
  { id: 8,  name: 'Wahyu Hidayat',    unit: 'Logistik',    biro: 'Biro Perencanaan Audit',                                tujuanKonsultasi: 'Biro Perencanaan Audit',                                status: 'Selesai',        konsultasiDikirim: 3, lastKonsultasi: '2025-01-15' },
  { id: 9,  name: 'Barcek',           unit: 'P3K',         biro: 'Biro Audit Keuangan & Fraud',                          tujuanKonsultasi: 'Biro Audit Keuangan & Fraud',                          status: 'Baru',           konsultasiDikirim: 2, lastKonsultasi: '2025-01-27' },
  { id: 10, name: 'Dani Kurniawan',   unit: 'IT Support',  biro: 'Biro Audit Operasional & Teknologi Informasi',          tujuanKonsultasi: 'Biro Audit Operasional & Teknologi Informasi',          status: 'Proses',         konsultasiDikirim: 1, lastKonsultasi: '2025-01-26' },
];

// ─── Stats Dashboard Auditee ───
export const AUDITEE_DASHBOARD_STATS = {
  total: 5,
  selesai: 3,
  action: 1,
  ditolak: 1,
};

// ─── Aktivitas Terbaru Auditee ───
export const AUDITEE_RECENT_ACTIVITY = [
  { id: 1, action: 'Konsultasi audit keuangan di-review',        time: '2 jam lalu',  type: 'info' },
  { id: 2, action: 'Dokumen NDE berhasil diunggah',              time: '5 jam lalu',  type: 'success' },
  { id: 3, action: 'Tindak lanjut audit operasional diterima',   time: '1 hari lalu', type: 'success' },
  { id: 4, action: 'Menunggu review dari Biro Keuangan',         time: '2 hari lalu', type: 'warning' },
];

// ─── Konsultasi Conversations (auditee ↔ auditor) ───
// Link: auditorId merujuk ke BIRO_LIST.id (shared.js)
export const CONVERSATIONS = [
  { 
    id: 1, auditorId: 1, name: 'Ahmad Rizki', unit: 'Keuangan', isAnonim: false,
    subject: 'Audit Laporan Keuangan Q4 2025', status: 'BARU', isOnline: true, unread: 2,
    lastMessage: 'Baik, silakan sampaikan pertanyaan Anda',
    lastTime: '10:05',
    messages: [
      { id: 1, sender: 'auditee', senderName: 'Ahmad Rizki', text: 'Selamat pagi, saya ingin berkonsultasi terkait laporan keuangan Q4. Apakah ada persyaratan dokumen khusus yang perlu disiapkan?', time: '10:00', date: 'Hari ini' },
      { id: 2, sender: 'auditor', senderName: 'Auditor Keuangan', text: 'Baik, silakan sampaikan pertanyaan Anda. Untuk audit keuangan Q4, kami membutuhkan laporan neraca, laba rugi, dan arus kas.', time: '10:05', date: 'Hari ini' },
    ]
  },
  { 
    id: 2, auditorId: 2, name: 'Siti Nurhaliza', unit: 'IT Support', isAnonim: true,
    subject: 'Konsultasi Keamanan Sistem IT', status: 'MENUNGGU', isOnline: false, unread: 0,
    lastMessage: 'Mohon konfirmasi jadwal audit minggu depan',
    lastTime: 'Kemarin',
    messages: [
      { id: 1, sender: 'auditee', senderName: 'Siti Nurhaliza', text: 'Selamat siang, kami ingin mengkonsultasikan tentang kebijakan keamanan sistem IT yang baru.', time: '14:30', date: 'Kemarin' },
      { id: 2, sender: 'auditor', senderName: 'Auditor OTI', text: 'Mohon konfirmasi jadwal audit minggu depan. Kami akan mengirimkan checklist yang perlu disiapkan.', time: '15:00', date: 'Kemarin' },
      { id: 3, sender: 'auditee', senderName: 'Siti Nurhaliza', text: 'Baik, kami akan konfirmasi setelah koordinasi internal.', time: '15:30', date: 'Kemarin' },
    ]
  },
  { 
    id: 3, auditorId: 1, name: 'Budi Santoso', unit: 'HRD', isAnonim: false,
    subject: 'Audit Prosedur Rekrutmen', status: 'SELESAI', isOnline: true, unread: 0,
    lastMessage: 'Terima kasih atas konsultasinya. Selesai.',
    lastTime: '28 Jan',
    messages: [
      { id: 1, sender: 'auditee', senderName: 'Budi Santoso', text: 'Pak, kami butuh klarifikasi terkait prosedur rekrutmen apakah sudah sesuai SOP terbaru?', time: '09:00', date: '28 Jan 2025' },
      { id: 2, sender: 'auditor', senderName: 'Auditor Keuangan', text: 'Berdasarkan review kami, prosedur sudah sesuai. Berikut catatan rekomendasi kami untuk perbaikan minor.', time: '11:00', date: '28 Jan 2025' },
      { id: 3, sender: 'auditee', senderName: 'Budi Santoso', text: 'Terima kasih atas konsultasinya. Kami akan segera implementasikan rekomendasi tersebut.', time: '13:00', date: '28 Jan 2025' },
    ]
  },
  { 
    id: 4, auditorId: 3, name: 'LUTHFI', unit: 'PAMLEK', isAnonim: true,
    subject: 'Konsultasi Perencanaan Audit Internal', status: 'TINDAK LANJUT', isOnline: true, unread: 1,
    lastMessage: 'Dokumen sudah kami kirimkan via NDE',
    lastTime: '10:30',
    messages: [
      { id: 1, sender: 'auditee', senderName: 'LUTHFI', text: 'Assalamualaikum, saya ingin konsultasi mengenai perencanaan audit internal untuk unit kerja PAMLEK.', time: '09:00', date: 'Hari ini' },
      { id: 2, sender: 'auditor', senderName: 'Auditor Perencanaan', text: 'Waalaikumsalam. Silakan, apakah ada topik spesifik yang ingin dikonsultasikan?', time: '09:15', date: 'Hari ini' },
      { id: 3, sender: 'auditee', senderName: 'LUTHFI', text: 'Kami ingin memastikan dokumen yang diperlukan untuk audit tahap awal sudah lengkap.', time: '09:30', date: 'Hari ini' },
      { id: 4, sender: 'auditor', senderName: 'Auditor Perencanaan', text: 'Baik, mohon siapkan NDE permintaan, SOP terkait, dan dokumen pendukung. Akan kami review dalam 2x24 jam.', time: '10:00', date: 'Hari ini' },
      { id: 5, sender: 'auditee', senderName: 'LUTHFI', text: 'Dokumen sudah kami kirimkan via NDE. Mohon info selanjutnya.', time: '10:30', date: 'Hari ini' },
    ]
  },
  { 
    id: 5, auditorId: 2, name: 'BARCEK', unit: 'P3K', isAnonim: false,
    subject: 'Audit Prosedur Pengadaan', status: 'BARU', isOnline: false, unread: 1,
    lastMessage: 'Mohon arahan terkait prosedur pengadaan',
    lastTime: '08:45',
    messages: [
      { id: 1, sender: 'auditee', senderName: 'BARCEK', text: 'Mohon arahan terkait prosedur pengadaan yang sesuai regulasi terbaru.', time: '08:45', date: 'Hari ini' },
    ]
  },
];

// ─── Data Proses Audit per Auditee ───
// Link: kategori merujuk ke BIRO_LIST.name (shared.js)
export const KONSULTASI_PROSES = [
  // Biro Audit Operasional & Teknologi Informasi
  { id: 1,  namaAuditee: 'TATU',   unitKerja: 'PAMLEK',      kategori: 'Biro Audit Operasional & Teknologi Informasi' },
  { id: 2,  namaAuditee: 'MAMA',   unitKerja: 'PAMLEK',      kategori: 'Biro Audit Operasional & Teknologi Informasi' },
  { id: 3,  namaAuditee: 'BUDI',   unitKerja: 'PAMLEK',      kategori: 'Biro Audit Operasional & Teknologi Informasi' },
  { id: 4,  namaAuditee: 'DANI',   unitKerja: 'IT SUPPORT',  kategori: 'Biro Audit Operasional & Teknologi Informasi' },
  // Biro Audit Keuangan & Fraud
  { id: 5,  namaAuditee: 'LUTHFI', unitKerja: 'PAMLEK',      kategori: 'Biro Audit Keuangan & Fraud' },
  { id: 6,  namaAuditee: 'AHMAD',  unitKerja: 'KEUANGAN',    kategori: 'Biro Audit Keuangan & Fraud' },
  { id: 7,  namaAuditee: 'SARI',   unitKerja: 'MARKETING',   kategori: 'Biro Audit Keuangan & Fraud' },
  { id: 8,  namaAuditee: 'RINA',   unitKerja: 'HRD',         kategori: 'Biro Audit Keuangan & Fraud' },
  { id: 9,  namaAuditee: 'BARCEK', unitKerja: 'P3K',         kategori: 'Biro Audit Keuangan & Fraud' },
  // Biro Perencanaan Audit
  { id: 10, namaAuditee: 'WAHYU',  unitKerja: 'LOGISTIK',    kategori: 'Biro Perencanaan Audit' },
  { id: 11, namaAuditee: 'SITI',   unitKerja: 'LEGAL',       kategori: 'Biro Perencanaan Audit' },
];

// ─── File-file yang sudah diupload per konsultasi ───
const createEmptyFiles = () => ({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null });
export const INITIAL_FILES = {
  1: { ...createEmptyFiles(), 1: { name: 'Tangkapan Layar 2026-02-03 pukul 08.51.51.png', size: '332.3 KB' } },
  2: createEmptyFiles(),
  3: createEmptyFiles(),
  4: createEmptyFiles(),
  5: { ...createEmptyFiles(), 1: { name: 'NDE_Permintaan_Konsultasi_Luthfi.pdf', size: '215.8 KB' } },
  6: { ...createEmptyFiles(), 1: { name: 'NDE_Ahmad_Keuangan.pdf', size: '180.2 KB' }, 2: { name: 'Telaah_Ahmad.pdf', size: '95.1 KB' } },
  7: createEmptyFiles(),
  8: createEmptyFiles(),
  9: { ...createEmptyFiles(), 1: { name: 'NDE_Barcek_P3K.pdf', size: '120.5 KB' } },
  10: createEmptyFiles(),
  11: createEmptyFiles(),
};

// ─── Status Audit (dilihat oleh semua role, diedit oleh auditor/manajemen) ───
// Link: auditor merujuk ke biro names
export const AUDIT_RECORDS = [
  { id: 1, unitKerja: 'Bagian Keuangan',    subject: 'Audit Laporan Keuangan Q4',    status: 'selesai',   date: '2025-01-15', auditor: 'Biro Audit Keuangan & Fraud' },
  { id: 2, unitKerja: 'Bagian IT',           subject: 'Audit Sistem Keamanan',        status: 'proses',    date: '2025-01-20', auditor: 'Biro Audit Operasional & TI' },
  { id: 3, unitKerja: 'Bagian SDM',          subject: 'Audit Proses Rekrutmen',       status: 'menunggu',  date: '2025-01-25', auditor: 'Biro Perencanaan Audit' },
  { id: 4, unitKerja: 'Bagian Operasional',  subject: 'Audit Prosedur Operasional',   status: 'ditolak',   date: '2025-01-10', auditor: 'Biro Audit Operasional & TI' },
];

// ─── Helper: dapatkan auditee berdasarkan biro ───
export const getAuditeesByBiro = (biroName) => ALL_AUDITEES.filter(a => a.biro === biroName);

// ─── Helper: dapatkan konsultasi berdasarkan biro ───
export const getKonsultasiByBiro = (biroName) => KONSULTASI_PROSES.filter(k => k.kategori === biroName);

// ─── Helper: biro options untuk dropdown ───
export const getBiroOptions = () => BIRO_LIST.map(b => ({ value: b.name, label: b.shortName || b.name }));
