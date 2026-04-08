import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = join(__dirname, 'db.json');

// Timeout: biro is "offline" if no heartbeat received within this period
const HEARTBEAT_TIMEOUT_MS = 15000; // 15 seconds

// ═══════════════════════════════════════════
// DATABASE HELPERS
// ═══════════════════════════════════════════

const BIRO_NAMES = [
  'Biro Perencanaan Audit',
  'Biro Audit Operasional & Teknologi Informasi',
  'Biro Audit Keuangan & Fraud',
];

function getDefaultDB() {
  const auditorStatus = {};
  for (const biro of BIRO_NAMES) {
    auditorStatus[biro] = { online: false, lastSeen: 0 };
  }
  return { auditorStatus };
}

function loadDB() {
  if (!existsSync(DB_PATH)) {
    const db = getDefaultDB();
    saveDB(db);
    return db;
  }
  try {
    const data = JSON.parse(readFileSync(DB_PATH, 'utf8'));
    // Migrate old format (boolean values) to new format (object with timestamp)
    for (const biro of BIRO_NAMES) {
      if (typeof data.auditorStatus[biro] === 'boolean') {
        data.auditorStatus[biro] = { online: data.auditorStatus[biro], lastSeen: 0 };
      }
      if (!data.auditorStatus[biro]) {
        data.auditorStatus[biro] = { online: false, lastSeen: 0 };
      }
    }
    return data;
  } catch {
    return getDefaultDB();
  }
}

function saveDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/**
 * Get simplified status: biro is online only if online=true AND
 * last heartbeat was within HEARTBEAT_TIMEOUT_MS
 */
function getResolvedStatus(db) {
  const result = {};
  const now = Date.now();
  for (const [biro, data] of Object.entries(db.auditorStatus)) {
    if (data.online && (now - data.lastSeen) < HEARTBEAT_TIMEOUT_MS) {
      result[biro] = true;
    } else {
      result[biro] = false;
      // Auto-set offline if heartbeat expired
      if (data.online && data.lastSeen > 0 && (now - data.lastSeen) >= HEARTBEAT_TIMEOUT_MS) {
        db.auditorStatus[biro].online = false;
      }
    }
  }
  return result;
}

let db = loadDB();

// ═══════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════

// Get all auditor online statuses (resolved with heartbeat timeout)
app.get('/api/status', (req, res) => {
  const status = getResolvedStatus(db);
  res.json(status);
});

// Set auditor online/offline status (with timestamp)
app.post('/api/status', (req, res) => {
  const { biro, online } = req.body;
  if (biro && db.auditorStatus[biro] !== undefined) {
    db.auditorStatus[biro] = {
      online: !!online,
      lastSeen: !!online ? Date.now() : 0,
    };
    saveDB(db);
    console.log(`  [STATUS] ${biro} → ${online ? 'ONLINE' : 'OFFLINE'}`);
  }
  res.json(getResolvedStatus(db));
});

// Heartbeat: auditor sends this periodically to stay "online"
app.post('/api/heartbeat', (req, res) => {
  const { biro } = req.body;
  if (biro && db.auditorStatus[biro] !== undefined) {
    db.auditorStatus[biro].online = true;
    db.auditorStatus[biro].lastSeen = Date.now();
    saveDB(db);
  }
  res.json(getResolvedStatus(db));
});

// Reset all statuses to offline
app.post('/api/reset', (req, res) => {
  db = getDefaultDB();
  saveDB(db);
  res.json({ message: 'All statuses reset', data: getResolvedStatus(db) });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   SiKONA API Server                         ║');
  console.log(`  ║   Local:   http://localhost:${PORT}              ║`);
  console.log(`  ║   Network: http://0.0.0.0:${PORT}               ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET  /api/status     — Ambil status auditor');
  console.log('    POST /api/status     — Set status auditor { biro, online }');
  console.log('    POST /api/heartbeat  — Heartbeat auditor { biro }');
  console.log('    POST /api/reset      — Reset semua status');
  console.log('    GET  /api/health     — Health check');
  console.log(`  Heartbeat timeout: ${HEARTBEAT_TIMEOUT_MS / 1000}s`);
  console.log('');
});
