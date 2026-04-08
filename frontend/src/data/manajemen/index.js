// ═══════════════════════════════════════════════════════════════
// FOLDER ROLE MANAJEMEN — Data khusus role Manajemen (KSPI, Admin, Komite)
// Berisi: stats global, performa biro, daftar user, ringkasan sistem
// ───────────────────────────────────────────────────────────────
// Link ke:
//   → shared (BIRO_LIST untuk identitas biro)
//   → auditee/ (ALL_AUDITEES & AUDIT_RECORDS untuk monitoring global)
//   → auditor/ (performa per biro — via BIRO_LIST)
// ═══════════════════════════════════════════════════════════════

import { ALL_AUDITEES, AUDIT_RECORDS } from '../auditee';
import { BIRO_LIST } from '../shared';

// ─── Stats Dashboard Manajemen ───
export const MANAJEMEN_DASHBOARD_STATS = {
  total: 45,
  aktif: 12,
  selesai: 28,
  pengguna: 32,
};

// ─── Stats per Biro (untuk filter KSPI Dashboard) ───
export const MANAJEMEN_BIRO_STATS = {
  perencanaan: { total: 12, aktif: 3, selesai: 7, pengguna: 8 },
  operasional: { total: 15, aktif: 4, selesai: 9, pengguna: 11 },
  keuangan:    { total: 18, aktif: 5, selesai: 12, pengguna: 13 },
};

// ─── Filter Biro Options (untuk dropdown Manajemen) ───
export const BIRO_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Biro' },
  { value: 'perencanaan', label: 'Perencanaan' },
  { value: 'operasional', label: 'Operasional & TI' },
  { value: 'keuangan', label: 'Keuangan & Fraud' },
];

// ─── Performa Biro (tampil di Dashboard Manajemen) ───
// Link: name merujuk ke BIRO_LIST (shared)
export const BIRO_PERFORMANCE = [
  { name: 'Keuangan & Fraud',    konsultasi: 18, selesai: 14, rate: 78 },
  { name: 'Operasional & TI',    konsultasi: 15, selesai: 10, rate: 67 },
  { name: 'Perencanaan Audit',   konsultasi: 12, selesai: 9,  rate: 75 },
];

// ─── Ringkasan Sistem ───
export const SYSTEM_SUMMARY = {
  uptime: '99.9%',
  userAktif: 24,
  tiketHariIni: 7,
};

// ─── Daftar User (Kelola User) ───
// Link: role merujuk ke role names, biro merujuk ke BIRO_LIST
export const ALL_USERS = [
  { id: 1,  name: 'Ahmad Sutanto',    role: 'manajemen', subRole: 'kspi',         unit: 'SPI',                           status: 'active',   email: 'ahmad.sutanto@sikona.id',    createdAt: '2025-06-15', lastLogin: '2026-03-04 08:12' },
  { id: 2,  name: 'Budi Santoso',     role: 'auditor',                            biro: 'Biro Perencanaan Audit',        status: 'active',   email: 'budi.santoso@sikona.id',     createdAt: '2025-07-01', lastLogin: '2026-03-04 09:30' },
  { id: 3,  name: 'Citra Dewi',       role: 'auditor',                            biro: 'Biro Audit Operasional & TI',   status: 'active',   email: 'citra.dewi@sikona.id',       createdAt: '2025-07-10', lastLogin: '2026-03-03 14:22' },
  { id: 4,  name: 'Dedi Kurniawan',   role: 'auditor',                            biro: 'Biro Audit Keuangan & Fraud',   status: 'active',   email: 'dedi.kurniawan@sikona.id',   createdAt: '2025-08-05', lastLogin: '2026-03-04 07:45' },
  { id: 5,  name: 'Eva Mariana',      role: 'auditee',                            unit: 'Bagian Keuangan',               status: 'active',   email: 'eva.mariana@sikona.id',      createdAt: '2025-08-20', lastLogin: '2026-03-02 16:10' },
  { id: 6,  name: 'Fajar Hidayat',    role: 'auditee',                            unit: 'Bagian IT',                     status: 'inactive', email: 'fajar.hidayat@sikona.id',    createdAt: '2025-09-01', lastLogin: '2026-01-15 11:00' },
  { id: 7,  name: 'Gita Purnama',     role: 'manajemen', subRole: 'komiteaudit',  unit: 'Komite Audit',                  status: 'active',   email: 'gita.purnama@sikona.id',     createdAt: '2025-06-15', lastLogin: '2026-03-04 10:05' },
  { id: 8,  name: 'Hendra Wijaya',    role: 'auditor',                            biro: 'Biro Perencanaan Audit',        status: 'active',   email: 'hendra.wijaya@sikona.id',    createdAt: '2025-09-15', lastLogin: '2026-03-03 08:50' },
  { id: 9,  name: 'Indah Sari',       role: 'auditee',                            unit: 'Bagian SDM',                    status: 'active',   email: 'indah.sari@sikona.id',       createdAt: '2025-10-01', lastLogin: '2026-03-04 11:30' },
  { id: 10, name: 'Joko Prasetyo',    role: 'auditee',                            unit: 'Bagian Operasional',            status: 'active',   email: 'joko.prasetyo@sikona.id',    createdAt: '2025-10-20', lastLogin: '2026-03-01 09:15' },
  { id: 11, name: 'Kartika Sari',     role: 'admin',                              unit: 'SPI',                           status: 'active',   email: 'kartika.sari@sikona.id',     createdAt: '2025-06-10', lastLogin: '2026-03-04 07:00' },
  { id: 12, name: 'Lukman Hakim',     role: 'auditor',                            biro: 'Biro Audit Operasional & TI',   status: 'inactive', email: 'lukman.hakim@sikona.id',     createdAt: '2025-11-05', lastLogin: '2026-02-10 13:40' },
];

// ─── Helper: semua audit records (monitoring global) ───
// Link: mengambil AUDIT_RECORDS dari auditee/
export const getAllAuditRecords = () => AUDIT_RECORDS;

// ─── Helper: semua auditee (monitoring global) ───
// Link: mengambil ALL_AUDITEES dari auditee/
export const getAllAuditees = () => ALL_AUDITEES;

// ─── Helper: users berdasarkan role ───
export const getUsersByRole = (role) => ALL_USERS.filter(u => u.role === role);

// ─── Helper: statistik per biro ───
// Link: menggabungkan BIRO_LIST (shared) + ALL_AUDITEES (auditee) + AUDIT_RECORDS (auditee)
export const getBiroStats = () => {
  return BIRO_LIST.map(biro => {
    const auditees = ALL_AUDITEES.filter(a => a.biro === biro.name);
    const audits = AUDIT_RECORDS.filter(a => a.auditor.includes(biro.shortName));
    return {
      biro: biro.name,
      shortName: biro.shortName,
      totalAuditees: auditees.length,
      totalAudits: audits.length,
    };
  });
};
