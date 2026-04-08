import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activityLogAPI } from '../services/api';
import {
  IconHistory, IconSearch, IconFilter, IconUser, IconEye,
  IconTrash, IconUserPlus, IconCheckCircle, IconClock, IconShieldCheck,
  IconDownload, IconChevronDown, IconX, IconKey, IconGear
} from '../components/Icons';

const typeConfig = {
  auth:   { label: 'Autentikasi', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <IconKey className="w-3.5 h-3.5" /> },
  user:   { label: 'User',        bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: <IconUser className="w-3.5 h-3.5" /> },
  view:   { label: 'Akses',       bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: <IconEye className="w-3.5 h-3.5" /> },
  file:   { label: 'Dokumen',     bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: <IconDownload className="w-3.5 h-3.5" /> },
  status: { label: 'Status',      bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: <IconCheckCircle className="w-3.5 h-3.5" /> },
  role:   { label: 'Role',        bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: <IconShieldCheck className="w-3.5 h-3.5" /> },
  system: { label: 'Sistem',      bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <IconGear className="w-3.5 h-3.5" /> },
};

const mapEventTypeToCategory = (eventType = '') => {
  if (eventType.includes('login') || eventType.includes('logout')) return 'auth';
  if (eventType.includes('role')) return 'role';
  if (eventType.includes('user') || eventType.includes('password')) return 'user';
  if (eventType.includes('file') || eventType.includes('upload')) return 'file';
  if (eventType.includes('status')) return 'status';
  if (eventType.includes('view')) return 'view';
  return 'system';
};

const prettyAction = (eventType = '') => eventType
  .split('_')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const LogAktivitas = () => {
  const { user } = useAuth();
  const currentUser = user;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [statsToday, setStatsToday] = useState({ total: 0, today: 0, logins_today: 0, failed_logins_today: 0 });

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      if (alive) setLoadingLogs(true);
      try {
        const [logsRes, statsRes] = await Promise.all([
          activityLogAPI.getAll({ per_page: 200 }),
          activityLogAPI.getStats(),
        ]);

        const items = logsRes.data?.data || [];
        const mapped = items.map((item) => ({
          id: item.id,
          user: item.user_name || 'Sistem',
          role: item.user_role || '-',
          action: prettyAction(item.event_type),
          detail: item.description || '-',
          target: item.target_type || '-',
          timestamp: item.created_at ? new Date(item.created_at).toLocaleString('sv-SE').replace('T', ' ') : '-',
          type: mapEventTypeToCategory(item.event_type),
        }));

        if (!alive) return;

        setLogs(mapped);
        setStatsToday({
          total: statsRes.data?.total || 0,
          today: statsRes.data?.today || 0,
          logins_today: statsRes.data?.logins_today || 0,
          failed_logins_today: statsRes.data?.failed_logins_today || 0,
        });
      } catch {
        if (alive) setLogs([]);
      } finally {
        if (alive) setLoadingLogs(false);
      }
    };

    fetchData();

    const poller = setInterval(fetchData, 5000);
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = searchQuery === '' || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || log.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                <IconHistory className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Audit Trail</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Log Aktivitas Sistem</h1>
            <p className="text-indigo-200/50 text-[11px] mt-0.5">Pantau seluruh aktivitas pengguna dalam sistem</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-white">{statsToday.today}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Hari Ini</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-blue-300">{statsToday.logins_today}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Login</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-rose-300">{statsToday.failed_logins_today}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Gagal Login</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas, user, atau detail..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[{ value: 'all', label: 'Semua' }, ...Object.entries(typeConfig).map(([k, v]) => ({ value: k, label: v.label }))].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterType === f.value ? 'bg-indigo-500 text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <IconHistory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Riwayat Aktivitas</h3>
              <p className="text-xs text-slate-400">{filteredLogs.length} log ditemukan</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5">
            <IconDownload className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
              <tr>
                <th className="px-6 py-3 text-left">Waktu</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Tipe</th>
                <th className="px-6 py-3 text-left">Aksi</th>
                <th className="px-6 py-3 text-left">Detail</th>
                <th className="px-6 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingLogs ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Memuat log aktivitas...</td>
                </tr>
              ) : filteredLogs.map((log, idx) => {
                const tc = typeConfig[log.type] || typeConfig.system;
                return (
                  <tr key={log.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconClock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600 font-mono">{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{log.user}</p>
                        <p className="text-[10px] text-slate-400">{log.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${tc.bg} ${tc.text} border ${tc.border}`}>
                        {tc.icon} {tc.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-700">{log.action}</td>
                    <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate">{log.detail}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{log.target}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loadingLogs && filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconSearch className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Tidak Ada Log</h3>
            <p className="text-sm text-slate-500">Tidak ditemukan aktivitas dengan filter yang dipilih</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogAktivitas;
