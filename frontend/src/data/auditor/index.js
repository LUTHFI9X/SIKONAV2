// ═══════════════════════════════════════════════════════════════
// FOLDER ROLE AUDITOR — Data khusus role Auditor
// Berisi: stats dashboard auditor, antrian auditee, performa
// ───────────────────────────────────────────────────────────────
// Link ke:
//   → shared (BIRO_LIST untuk identitas biro)
//   → auditee/ (data auditee yang masuk ke antrian auditor)
//     - ALL_AUDITEES: daftar auditee yang terdaftar
//     - CONVERSATIONS: percakapan konsultasi auditee ↔ auditor
//     - KONSULTASI_PROSES: proses konsultasi yang ditangani
//   → manajemen/ (manajemen memonitor performa auditor)
// ═══════════════════════════════════════════════════════════════

import { ALL_AUDITEES, CONVERSATIONS, KONSULTASI_PROSES } from '../auditee';
import { BIRO_LIST } from '../shared';

// ─── Stats Dashboard Auditor ───
export const AUDITOR_DASHBOARD_STATS = {
  total: 12,
  baru: 4,
  proses: 5,
  selesai: 3,
};

// ─── Antrian Konsultasi Auditee (tampil di Dashboard Auditor) ───
// Link: name & unit merujuk ke auditee dari auditee/index.js
export const ANTRIAN_AUDITEE = [
  { id: 1, name: 'BARCEK',  unit: 'P3K',       status: 'MENUNGGU',  time: '09:15', priority: 'high' },
  { id: 2, name: 'AHMAD',   unit: 'KEUANGAN',  status: 'MENUNGGU',  time: '10:30', priority: 'medium' },
  { id: 3, name: 'SITI',    unit: 'LEGAL',      status: 'DIPROSES',  time: '11:00', priority: 'low' },
  { id: 4, name: 'LUTHFI',  unit: 'PAMLEK',     status: 'MENUNGGU',  time: '13:45', priority: 'high' },
  { id: 5, name: 'RINA',    unit: 'HRD',        status: 'DIPROSES',  time: '14:20', priority: 'medium' },
];

// ─── Performa Auditor ───
export const AUDITOR_PERFORMANCE = {
  tiketDiselesaikan: 75,
  waktuRespon: 85,
  kepuasanAuditee: 92,
};

// ─── Helper: dapat auditee yang terdaftar ke biro tertentu ───
// Link: mengambil data dari auditee/
export const getAuditeeForBiro = (biroName) => ALL_AUDITEES.filter(a => a.biro === biroName);

// ─── Helper: dapat conversations yang terkait biro tertentu ───
// Link: mencocokkan CONVERSATIONS.auditorId dengan BIRO_LIST.id
export const getConversationsForBiro = (biroName) => {
  const biro = BIRO_LIST.find(b => b.name === biroName);
  if (!biro) return [];
  return CONVERSATIONS.filter(c => c.auditorId === biro.id);
};

// ─── Helper: dapat proses konsultasi yang masuk ke biro tertentu ───
// Link: mengambil data dari auditee/
export const getKonsultasiForBiro = (biroName) => KONSULTASI_PROSES.filter(k => k.kategori === biroName);

// ─── Helper: hitung total konsultasi per biro (untuk dashboard) ───
// Link: menggabungkan BIRO_LIST (shared) + KONSULTASI_PROSES (auditee)
export const getTotalKonsultasiPerBiro = () => {
  return BIRO_LIST.map(biro => ({
    ...biro,
    totalKonsultasi: KONSULTASI_PROSES.filter(k => k.kategori === biro.name).length,
  }));
};
