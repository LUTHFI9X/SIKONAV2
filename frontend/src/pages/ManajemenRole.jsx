import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rolePermissionsAPI } from '../services/api';
import {
  IconKey, IconShieldCheck, IconUsers, IconCheckCircle, IconX, IconEye,
  IconSearch, IconInfoCircle, IconUser, IconUserTie, IconCrown, IconGear,
  IconSave, IconLock, IconToggle
} from '../components/Icons';

// Daftar permission per modul
const MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Lihat dashboard & statistik' },
  { id: 'konsultasi', name: 'Konsultasi', description: 'Kirim & baca pesan konsultasi' },
  { id: 'status_audit', name: 'Status Konsultasi', description: 'Lihat & ubah status konsultasi' },
  { id: 'proses_audit', name: 'Proses Konsultasi', description: 'Upload & kelola dokumen tahapan' },
  { id: 'profil_spi', name: 'Profil SPI', description: 'Lihat profil SPI' },
  { id: 'kelola_user', name: 'Kelola User', description: 'CRUD akun pengguna' },
  { id: 'pengaturan', name: 'Pengaturan Sistem', description: 'Konfigurasi aplikasi' },
  { id: 'log_aktivitas', name: 'Log Aktivitas', description: 'Lihat audit trail' },
  { id: 'backup', name: 'Backup & Restore', description: 'Backup & restore database' },
];

const PERMISSIONS = ['view', 'create', 'edit', 'delete'];

// Default permissions per role
const DEFAULT_ROLE_PERMISSIONS = {
  auditee: {
    dashboard: ['view'],
    konsultasi: ['view', 'create'],
    status_audit: ['view'],
    proses_audit: ['view', 'create'],
    profil_spi: ['view'],
    kelola_user: [],
    pengaturan: [],
    log_aktivitas: [],
    backup: [],
  },
  auditor: {
    dashboard: ['view'],
    konsultasi: ['view', 'create'],
    status_audit: ['view', 'edit'],
    proses_audit: ['view', 'create', 'edit', 'delete'],
    profil_spi: ['view'],
    kelola_user: [],
    pengaturan: [],
    log_aktivitas: [],
    backup: [],
  },
  kspi: {
    dashboard: ['view'],
    konsultasi: ['view'],
    status_audit: ['view'],
    proses_audit: ['view'],
    profil_spi: ['view'],
    kelola_user: [],
    pengaturan: [],
    log_aktivitas: [],
    backup: [],
  },
  admin: {
    dashboard: ['view'],
    konsultasi: [],
    status_audit: [],
    proses_audit: [],
    profil_spi: [],
    kelola_user: ['view', 'create', 'edit', 'delete'],
    pengaturan: ['view', 'edit'],
    log_aktivitas: ['view'],
    backup: ['view', 'create'],
  },
  komiteaudit: {
    dashboard: ['view'],
    konsultasi: ['view'],
    status_audit: ['view'],
    proses_audit: ['view'],
    profil_spi: ['view'],
    kelola_user: [],
    pengaturan: [],
    log_aktivitas: [],
    backup: [],
  },
};

const ROLE_CONFIG = {
  auditee: { label: 'Auditee', color: 'bg-blue-500', icon: <IconUser className="w-4 h-4 text-white" /> },
  auditor: { label: 'Auditor', color: 'bg-violet-500', icon: <IconUserTie className="w-4 h-4 text-white" /> },
  kspi: { label: 'Kepala SPI', color: 'bg-indigo-500', icon: <IconCrown className="w-4 h-4 text-white" /> },
  admin: { label: 'Administrator', color: 'bg-emerald-500', icon: <IconGear className="w-4 h-4 text-white" /> },
  komiteaudit: { label: 'Komite Audit', color: 'bg-purple-500', icon: <IconShieldCheck className="w-4 h-4 text-white" /> },
};

const ManajemenRole = () => {
  const { user } = useAuth();
  const currentUser = user;

  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useState('auditee');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchPermissions = async () => {
      try {
        const response = await rolePermissionsAPI.get();
        if (!alive) return;
        const remote = response.data?.permissions || {};
        setRolePermissions((prev) => ({ ...prev, ...remote }));
      } catch (error) {
        console.error('Gagal memuat hak akses role:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchPermissions();
    const poller = setInterval(fetchPermissions, 5000);

    return () => {
      alive = false;
      clearInterval(poller);
    };
  }, []);

  const togglePermission = (moduleId, permission) => {
    setRolePermissions(prev => {
      const current = prev[selectedRole][moduleId] || [];
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission];
      return {
        ...prev,
        [selectedRole]: { ...prev[selectedRole], [moduleId]: updated },
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await rolePermissionsAPI.upsert(selectedRole, rolePermissions[selectedRole] || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Gagal menyimpan hak akses:', error);
      alert(error?.response?.data?.message || 'Gagal menyimpan hak akses.');
    }
  };

  const permLabels = { view: 'Lihat', create: 'Buat', edit: 'Edit', delete: 'Hapus' };
  const permColors = {
    view: 'bg-blue-100 text-blue-600 border-blue-200',
    create: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    edit: 'bg-amber-100 text-amber-600 border-amber-200',
    delete: 'bg-red-100 text-red-600 border-red-200',
  };

  const currentPerms = rolePermissions[selectedRole] || {};
  const rc = ROLE_CONFIG[selectedRole];

  return (
    <div className="space-y-6 animate-fadeInUp pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
              <IconKey className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Access Control</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Manajemen Role & Hak Akses</h1>
          <p className="text-indigo-200/50 text-[11px] mt-0.5">Atur permission setiap role terhadap modul-modul sistem</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Pilih Role:</span>
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === key
                  ? `${config.color} text-white shadow-lg`
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {selectedRole === key && config.icon}
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl p-4 bg-indigo-50/80 border border-indigo-200/60 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100">
          <IconInfoCircle className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-800">
            Mengatur hak akses untuk role: <span className="text-indigo-600">{rc.label}</span>
          </p>
          <p className="text-xs text-indigo-600/70 mt-0.5">Centang permission yang diizinkan untuk setiap modul</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl p-3 bg-white border border-slate-200 text-xs text-slate-500">
          Memuat matrix hak akses terbaru dari server...
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className={`w-9 h-9 ${rc.color} rounded-lg flex items-center justify-center`}>
            {rc.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Hak Akses — {rc.label}</h3>
            <p className="text-xs text-slate-400">Per modul sistem</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
              <tr>
                <th className="px-6 py-3 text-left w-1/3">Modul</th>
                {PERMISSIONS.map(p => (
                  <th key={p} className="px-4 py-3 text-center">{permLabels[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULES.map((mod, idx) => (
                <tr key={mod.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/20 transition-colors`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{mod.name}</p>
                    <p className="text-[10px] text-slate-400">{mod.description}</p>
                  </td>
                  {PERMISSIONS.map(perm => {
                    const has = (currentPerms[mod.id] || []).includes(perm);
                    return (
                      <td key={perm} className="px-4 py-4 text-center">
                        <button
                          onClick={() => togglePermission(mod.id, perm)}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                            has
                              ? `${permColors[perm]} border-current`
                              : 'bg-white border-slate-200 text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {has ? <IconCheckCircle className="w-4 h-4" /> : <IconX className="w-3 h-3" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <IconEye className="w-4 h-4 text-indigo-500" /> Ringkasan Akses {rc.label}
        </h3>
        <div className="flex flex-wrap gap-2">
          {MODULES.map(mod => {
            const perms = currentPerms[mod.id] || [];
            if (perms.length === 0) return null;
            return (
              <div key={mod.id} className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-700">{mod.name}: </span>
                {perms.map(p => (
                  <span key={p} className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ml-1 ${permColors[p]}`}>{permLabels[p]}</span>
                ))}
              </div>
            );
          })}
          {Object.values(currentPerms).every(p => p.length === 0) && (
            <p className="text-xs text-slate-400">Tidak ada hak akses yang diberikan</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
          <IconSave className="w-5 h-5" /> Simpan Hak Akses
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 animate-fadeInUp">
            <IconCheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold">Hak akses berhasil disimpan!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManajemenRole;
