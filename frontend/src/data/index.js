// ═══════════════════════════════════════════════════════════════
// DATA INDEX — Central export untuk semua data
// 
// Arsitektur Folder Data (per Role):
//
// src/data/
// ├── shared.js              ← Data bersama semua role
// │   (BIRO_LIST, TAHAPAN_AUDIT, SPI_PROFILE, STATUS_CONFIG)
// │
// ├── auditee/index.js       ← Folder Role Auditee
// │   (ALL_AUDITEES, CONVERSATIONS, KONSULTASI_PROSES, dll)
// │   └── import dari: shared.js
// │
// ├── auditor/index.js       ← Folder Role Auditor
// │   (AUDITOR_DASHBOARD_STATS, ANTRIAN_AUDITEE, dll)
// │   └── import dari: shared.js, auditee/
// │
// ├── manajemen/index.js     ← Folder Role Manajemen
// │   (MANAJEMEN_DASHBOARD_STATS, ALL_USERS, dll)
// │   └── import dari: shared.js, auditee/
// │
// └── index.js               ← File ini (barrel re-export)
//
// Koneksi antar role:
//   shared ──────► auditee ──────► auditor
//     │                │
//     └────────────────┴──────────► manajemen
//
// Setiap role memiliki FOLDER sendiri namun saling terhubung melalui:
// - BIRO_LIST.id / BIRO_LIST.name (identitas biro — shared)
// - ALL_AUDITEES (data auditee direferensi auditor & manajemen)
// - CONVERSATIONS (data konsultasi auditee ↔ auditor)
// - AUDIT_RECORDS (data audit dilihat semua role)
// ═══════════════════════════════════════════════════════════════

// ─── Shared (data bersama semua role) ───
export { 
  BIRO_LIST, 
  getBiroById, 
  getBiroByName, 
  TAHAPAN_AUDIT,
  SPI_PROFILE,
  STATUS_CONFIG,
} from './shared';

// ─── Folder Role Auditee ───
export {
  ALL_AUDITEES,
  AUDITEE_DASHBOARD_STATS,
  AUDITEE_RECENT_ACTIVITY,
  CONVERSATIONS,
  KONSULTASI_PROSES,
  INITIAL_FILES,
  AUDIT_RECORDS,
  getAuditeesByBiro,
  getKonsultasiByBiro,
  getBiroOptions,
} from './auditee';

// ─── Folder Role Auditor ───
export {
  AUDITOR_DASHBOARD_STATS,
  ANTRIAN_AUDITEE,
  AUDITOR_PERFORMANCE,
  getAuditeeForBiro,
  getConversationsForBiro,
  getKonsultasiForBiro,
  getTotalKonsultasiPerBiro,
} from './auditor';

// ─── Folder Role Manajemen ───
export {
  MANAJEMEN_DASHBOARD_STATS,
  MANAJEMEN_BIRO_STATS,
  BIRO_FILTER_OPTIONS,
  BIRO_PERFORMANCE,
  SYSTEM_SUMMARY,
  ALL_USERS,
  getAllAuditRecords,
  getAllAuditees,
  getUsersByRole,
  getBiroStats,
} from './manajemen';
