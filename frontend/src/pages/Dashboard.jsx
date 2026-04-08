import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI, conversationAPI, userAPI, activityLogAPI } from '../services/api';
import { subscribeToRoleRealtime } from '../services/realtime';
import {
  BIRO_LIST,
} from '../data';
import {
  IconWave, IconTarget, IconGear, IconCrown, IconShieldCheck, IconLightbulb,
  IconListUl, IconCalendar, IconTrendUp, IconActivity, IconBell,
  IconCheckCircle, IconClock, IconXCircle, IconChartBar, IconUsers,
  IconComments, IconArrowRight, IconBarChart2, IconStar, IconHeadphones,
  IconFileAlt, IconClipboardList, IconBuilding, IconHistory, IconSliders,
  IconKey, IconDatabase, IconUserPlus, IconUsersGear
} from '../components/Icons';
import { SkeletonCard } from '../components/Skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const currentUser = user;
  
  const role = currentUser?.role;
  const subRole = currentUser?.sub_role;

  if (role === 'auditee') return <AuditeeDashboard user={currentUser} />;
  if (role === 'auditor') return <AuditorDashboard user={currentUser} />;
  if (role === 'admin' || (role === 'manajemen' && subRole === 'admin')) {
    return <AdminDashboard user={currentUser} />;
  }
  if (role === 'manajemen') {
    if (subRole === 'komite') return <KomiteDashboard user={currentUser} />;
    return <ManajemenDashboard user={currentUser} subRole={subRole} />;
  }
  return <DefaultDashboard />;
};

// ═══════════════════════════════════════════
// AUDITOR DATA (dari data/shared.js → BIRO_LIST)
// ═══════════════════════════════════════════

const normalizeBiro = (value = '') => String(value).toLowerCase().trim();

const getBiroVisual = (biroName, index) => {
  const key = normalizeBiro(biroName);
  const mapped = BIRO_LIST.find((b) => {
    const name = normalizeBiro(b.name);
    const shortName = normalizeBiro(b.shortName);
    return name.includes(key) || key.includes(name) || shortName.includes(key) || key.includes(shortName);
  });

  if (mapped) return mapped;

  const fallback = BIRO_LIST[index % BIRO_LIST.length] || {
    initials: 'A',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-purple-600',
  };

  return {
    ...fallback,
    name: biroName || fallback.name || 'Biro Auditor',
    initials: (biroName || fallback.name || 'A').charAt(0).toUpperCase(),
  };
};

// Live Clock
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return (
    <div className="text-right">
      <p className="text-2xl font-mono font-bold tracking-wider">{time.toLocaleTimeString('id-ID')}</p>
      <p className="text-xs opacity-70 mt-0.5">{days[time.getDay()]}, {time.getDate()} {months[time.getMonth()]} {time.getFullYear()}</p>
    </div>
  );
};

// Mini Bar Chart
const MiniBarChart = ({ data, color }) => (
  <div className="flex items-end gap-1 h-10">
    {data.map((val, i) => (
      <div key={i} className={`w-1.5 rounded-full ${color} transition-all duration-500`} style={{ height: `${val}%`, opacity: 0.4 + (val / 100) * 0.6 }}></div>
    ))}
  </div>
);

// ═══════════════════════════════════════════
// AUDITEE DASHBOARD
// ═══════════════════════════════════════════

const AuditeeDashboard = ({ user }) => {
  const [stats, setStats] = useState({ total: 0, selesai: 0, action: 0, ditolak: 0 });
  const [auditorBiros, setAuditorBiros] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let alive = true;

    const fetchDashboard = async () => {
      try {
        const [conversationRes, auditorRes] = await Promise.all([
          conversationAPI.getAll(),
          userAPI.getAuditors(),
        ]);

        const conversations = conversationRes.data?.conversations || [];
        const auditors = auditorRes.data?.auditors || [];
        const selesai = conversations.filter((c) => c.status === 'closed').length;
        const action = conversations.filter((c) => c.status === 'active').length;
        const ditolak = conversations.filter((c) => c.status === 'archived').length;
        if (!alive) return;
        setStats({ total: conversations.length, selesai, action, ditolak });

        const activeStatuses = new Set(['active']);
        const activeByBiro = conversations.reduce((acc, c) => {
          if (!activeStatuses.has(c.status)) return acc;
          const biro = c?.auditor?.biro || c?.subject || '';
          if (!biro) return acc;
          acc[biro] = (acc[biro] || 0) + 1;
          return acc;
        }, {});

        const biroRows = auditors.map((auditor, index) => {
          const visual = getBiroVisual(auditor.biro, index);
          return {
            id: auditor.id,
            name: visual.name,
            initials: visual.initials,
            gradientFrom: visual.gradientFrom,
            gradientTo: visual.gradientTo,
            totalKonsultasi: activeByBiro[auditor.biro] || 0,
          };
        });

        if (!alive) return;
        setAuditorBiros(biroRows);

        const recent = [...conversations]
          .sort((a, b) => {
            const da = new Date(a.last_message_at || a.created_at || 0).getTime();
            const db = new Date(b.last_message_at || b.created_at || 0).getTime();
            return db - da;
          })
          .slice(0, 5)
          .map((item, idx) => ({
            id: item.id || idx,
            action: item.subject
              ? `Konsultasi: ${item.subject}`
              : `Konsultasi #${item.id}`,
            time: new Date(item.last_message_at || item.created_at || Date.now()).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: item.status === 'closed' ? 'success' : item.status === 'archived' ? 'warning' : 'info',
          }));

        setRecentActivity(recent);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      }
    };
    fetchDashboard();

    const poller = setInterval(fetchDashboard, 2000);
    const onFocus = () => fetchDashboard();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDashboard();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <div className="auditor-dashboard space-y-6 animate-fadeInUp">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-16"></div>
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-white/20 rounded-full"></div>
        <div className="absolute top-8 right-1/3 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center"><IconWave className="w-5 h-5 text-white" /></div>
              <span className="text-indigo-200 text-sm font-medium">Selamat datang kembali,</span>
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">{user?.name || 'Auditee'}</h2>
            <p className="text-indigo-100/60 text-sm">Unit Kerja: <span className="text-white font-semibold">{user?.department || user?.unit || '-'}</span></p>
          </div>
          <div className="hidden md:flex items-center gap-5">
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest mt-1 font-semibold">Total</p>
            </div>
            <div className="text-white/40"><LiveClock /></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Selesai" value={stats.selesai} icon={<IconCheckCircle className="w-5 h-5" />} color="emerald" trend="+2 bulan ini" chartData={[40,60,55,80,70,90,100]} />
        <MetricCard title="Perlu Tindak Lanjut" value={stats.action} icon={<IconClock className="w-5 h-5" />} color="amber" trend="1 menunggu" chartData={[30,20,40,35,25,30,20]} />
        <MetricCard title="Ditolak" value={stats.ditolak} icon={<IconXCircle className="w-5 h-5" />} color="red" trend="Perbaiki & ajukan ulang" chartData={[10,20,15,10,5,15,10]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auditor Selection */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><IconHeadphones className="w-4 h-4 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Pilih Biro Auditor</h3>
                <p className="text-xs text-slate-400">Mulai konsultasi baru</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{auditorBiros.length} Biro</span>
          </div>
          <div className="p-5 space-y-3">
            {auditorBiros.map((auditor) => (
              <div key={auditor.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-200">
                <div className={`w-12 h-12 bg-gradient-to-br ${auditor.gradientFrom} ${auditor.gradientTo} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0`}>
                  {auditor.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm truncate">{auditor.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{auditor.totalKonsultasi} konsultasi aktif</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to="/konsultasi" className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5">
                    <IconComments className="w-3.5 h-3.5" /> Chat
                  </Link>
                  <Link to="/ajukan" className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-all flex items-center gap-1.5">
                    <IconClipboardList className="w-3.5 h-3.5" /> Tindak Lanjut
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <IconActivity className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm">Aktivitas Terkini</h3>
            </div>
            <div className="p-4 space-y-1">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.type === 'success' ? 'bg-emerald-400' : item.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{item.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3"><IconLightbulb className="w-4 h-4 text-amber-400" /><span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tips Cepat</span></div>
            <h4 className="font-bold text-sm mb-2">Butuh Bantuan Audit?</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">Ajukan pertanyaan langsung ke Auditor SPI untuk panduan yang tepat.</p>
            <Link to="/ajukan" className="inline-flex items-center gap-2 bg-white text-slate-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
              Ajukan Sekarang <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// AUDITOR DASHBOARD
// ═══════════════════════════════════════════

const AuditorDashboard = ({ user }) => {
  const [stats, setStats] = useState({ total: 0, selesai: 0, baru: 0 });
  const [antrianAuditee, setAntrianAuditee] = useState([]);
  const [performance, setPerformance] = useState({
    tiketDiselesaikan: 0,
    waktuRespon: 0,
    kepuasanAuditee: 0,
  });

  useEffect(() => {
    let alive = true;

    const fetchDashboard = async () => {
      try {
        const response = await conversationAPI.getAll();
        const conversations = response.data?.conversations || [];
        const pendingStatuses = ['active'];
        const queue = conversations
          .filter((c) => pendingStatuses.includes(c.status))
          .slice(0, 10)
          .map((c) => {
            const auditeeName = c.auditee?.name || c.requester?.name || 'Auditee';
            const department = c.auditee?.department || c.requester?.department || '-';
            const priority = c.status === 'pending' ? 'high' : 'medium';
            return {
              id: c.id,
              name: auditeeName,
              unit: department,
              time: c.created_at ? new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
              priority,
              status: c.status === 'pending' ? 'MENUNGGU' : 'DIPROSES',
            };
          });

        const total = conversations.length;
        const selesai = conversations.filter((c) => c.status === 'closed').length;
        const baru = conversations.filter((c) => pendingStatuses.includes(c.status)).length;
        const cancelled = conversations.filter((c) => c.status === 'archived').length;
        const selesaiRate = total > 0 ? Math.round((selesai / total) * 100) : 0;
        const responRate = total > 0 ? Math.max(35, Math.min(100, 100 - Math.round((baru / total) * 65))) : 0;
        const kepuasanRate = total > 0 ? Math.max(30, Math.min(100, 100 - Math.round((cancelled / total) * 100))) : 0;

        if (!alive) return;

        setStats({
          total,
          selesai,
          baru,
        });
        setAntrianAuditee(queue);
        setPerformance({
          tiketDiselesaikan: selesaiRate,
          waktuRespon: responRate,
          kepuasanAuditee: kepuasanRate,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      }
    };

    fetchDashboard();

    const poller = setInterval(fetchDashboard, 4000);
    const onFocus = () => fetchDashboard();
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const completionRate = stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;
  const activeRate = stats.total > 0 ? Math.round((stats.baru / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Welcome Banner */}
      <div className="auditor-hero relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full -mb-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><IconTarget className="w-5 h-5 text-indigo-400" /></div>
              <span className="auditor-hero-label text-slate-300 text-sm font-medium">Panel Auditor</span>
            </div>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">{user?.biro || 'Biro Auditor'}</h2>
            <p className="auditor-hero-subtitle text-slate-300/80 text-sm">{user?.name || 'Auditor'}</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="auditor-hero-stat text-center px-5 py-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Tiket</p>
            </div>
            <div className="auditor-hero-stat text-center px-5 py-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-amber-400">{stats.baru}</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-0.5">Aktif</p>
            </div>
            <div className="auditor-hero-clock text-slate-300"><LiveClock /></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Tiket Masuk"
          value={stats.total}
          icon={<IconComments className="w-5 h-5" />}
          color="indigo"
          trend={stats.total > 0 ? `${stats.baru} tiket aktif` : 'Belum ada tiket'}
        />
        <MetricCard
          title="Sudah Dijawab"
          value={stats.selesai}
          icon={<IconCheckCircle className="w-5 h-5" />}
          color="emerald"
          trend={`${completionRate}% dari total tiket`}
        />
        <MetricCard
          title="Kasus Aktif"
          value={stats.baru}
          icon={<IconClock className="w-5 h-5" />}
          color="amber"
          trend={`${activeRate}% dari total tiket`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Antrian */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><IconListUl className="w-4 h-4 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Antrian Konsultasi Auditee</h3>
                <p className="text-xs text-slate-400">Daftar yang perlu ditangani</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">{antrianAuditee.filter(a => a.status === 'MENUNGGU').length} Menunggu</span>
          </div>
          <div className="divide-y divide-slate-100">
            {antrianAuditee.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`}>{item.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                    {item.priority === 'high' && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[9px] font-bold rounded">URGENT</span>}
                  </div>
                  <p className="text-xs text-slate-400">{item.unit} · {item.time}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${item.status === 'MENUNGGU' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{item.status}</span>
                <Link to="/konsultasi" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">Balas</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><IconBarChart2 className="w-4 h-4 text-indigo-500" /> Performa Minggu Ini</h3>
            <div className="space-y-4">
              <ProgressItem label="Tiket Diselesaikan" value={performance.tiketDiselesaikan} color="emerald" />
              <ProgressItem label="Waktu Respon" value={performance.waktuRespon} color="blue" />
              <ProgressItem label="Kepuasan Auditee" value={performance.kepuasanAuditee} color="purple" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/konsultasi" className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all text-center group">
              <IconComments className="w-6 h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-700">Konsultasi</p>
            </Link>
            <Link to="/proses-audit" className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all text-center group">
              <IconClipboardList className="w-6 h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-700">Proses Audit</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MANAJEMEN DASHBOARD (KSPI / Admin)
// ═══════════════════════════════════════════

const ManajemenDashboard = ({ user, subRole }) => {
  const [selectedBiro, setSelectedBiro] = useState('all');
  const [loadingMgmt, setLoadingMgmt] = useState(true);
  const [userStatsMgmt, setUserStatsMgmt] = useState({ total: 0, active: 0 });
  const [allStats, setAllStats] = useState({ total: 0, aktif: 0, selesai: 0, pengguna: 0 });
  const [biroPerfRaw, setBiroPerfRaw] = useState([]);
  const [summaryMgmt, setSummaryMgmt] = useState({ uptime: '-', userAktif: 0, tiketHariIni: 0 });
  const hasLoadedMgmtRef = useRef(false);
  const isFetchingMgmtRef = useRef(false);

  const readOnly = subRole === 'komite';
  const getRoleIcon = () => readOnly ? <IconShieldCheck className="w-5 h-5" /> : (subRole === 'admin' ? <IconGear className="w-5 h-5" /> : <IconCrown className="w-5 h-5" />);
  const getRoleTitle = () => {
    if (readOnly) return 'Komite Audit';
    if (subRole === 'admin') return 'Administrator';
    return 'Kepala SPI';
  };

  const fetchMgmtDashboard = useCallback(async ({ silent = false } = {}) => {
      if (isFetchingMgmtRef.current) return;

      isFetchingMgmtRef.current = true;
      const shouldShowLoading = !silent && !hasLoadedMgmtRef.current;
      if (shouldShowLoading) setLoadingMgmt(true);

      try {
        const [userStatsResult, auditResult, auditeesResult, auditorsResult] = await Promise.allSettled([
          userAPI.getStatistics(),
          auditAPI.getAll(),
          userAPI.getAuditees(),
          userAPI.getAuditors(),
        ]);

        const userStatsApi = userStatsResult.status === 'fulfilled' ? (userStatsResult.value.data || {}) : {};
        const auditees = auditeesResult.status === 'fulfilled'
          ? (auditeesResult.value.data?.auditees || [])
          : [];
        const auditors = auditorsResult.status === 'fulfilled'
          ? (auditorsResult.value.data?.auditors || [])
          : [];

        const derivedActiveUsers = [...auditees, ...auditors].filter((u) => u?.is_online).length;
        const derivedTotalUsers = auditees.length + auditors.length;

        const userStats = {
          total: userStatsApi.total ?? derivedTotalUsers,
          active: userStatsApi.active ?? userStatsApi.online ?? derivedActiveUsers,
        };

        const processes = auditResult.status === 'fulfilled'
          ? (auditResult.value.data?.audit_processes || [])
          : [];

        const grouped = processes.reduce((acc, p) => {
          const biro = p.biro || p.auditor?.biro || 'Tanpa Biro';
          if (!acc[biro]) acc[biro] = { biro, total: 0, selesai: 0 };
          acc[biro].total += 1;
          if (p.status === 'completed') acc[biro].selesai += 1;
          return acc;
        }, {});

        const perfRows = Object.values(grouped).map((row) => ({
          key: row.biro.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: row.biro,
          konsultasi: row.total,
          selesai: row.selesai,
          rate: row.total > 0 ? Math.round((row.selesai / row.total) * 100) : 0,
        }));

        const today = new Date().toISOString().slice(0, 10);
        const tiketHariIni = processes.filter((p) => (p.created_at || '').slice(0, 10) === today).length;

        setUserStatsMgmt(userStats);
        setAllStats({
          total: processes.length,
          aktif: processes.filter((p) => p.status === 'pending' || p.status === 'in_progress').length,
          selesai: processes.filter((p) => p.status === 'completed').length,
          pengguna: userStats.total || 0,
        });
        setBiroPerfRaw(perfRows);
        setSummaryMgmt({
          uptime: '-',
          userAktif: userStats.active || 0,
          tiketHariIni,
        });
        hasLoadedMgmtRef.current = true;
      } catch (error) {
        console.error('Failed to fetch management dashboard:', error);
      } finally {
        if (shouldShowLoading) setLoadingMgmt(false);
        isFetchingMgmtRef.current = false;
      }
    }, []);

  useEffect(() => {
    fetchMgmtDashboard();

    const poller = setInterval(() => fetchMgmtDashboard({ silent: true }), 15000);
    const onFocus = () => fetchMgmtDashboard({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchMgmtDashboard({ silent: true });
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchMgmtDashboard]);

  useEffect(() => {
    if (subRole !== 'kspi') return;

    const unsubscribe = subscribeToRoleRealtime('kspi', async () => {
      await fetchMgmtDashboard({ silent: true });
    });

    return unsubscribe;
  }, [subRole, fetchMgmtDashboard]);

  const biroOptions = [
    { value: 'all', label: 'Semua Biro' },
    ...biroPerfRaw.map((b) => ({ value: b.key, label: b.name })),
  ];

  const biroPerfData = selectedBiro === 'all'
    ? biroPerfRaw
    : biroPerfRaw.filter((b) => b.key === selectedBiro);

  const stats = selectedBiro === 'all'
    ? allStats
    : {
        total: biroPerfData.reduce((sum, b) => sum + b.konsultasi, 0),
        aktif: 0,
        selesai: biroPerfData.reduce((sum, b) => sum + b.selesai, 0),
        pengguna: userStatsMgmt.total || 0,
      };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/15 rounded-full -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full -mb-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">{getRoleIcon()}</div>
              <span className="text-indigo-300 text-sm font-medium">Dashboard {getRoleTitle()}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{user?.name || getRoleTitle()}</h2>
            <p className="text-indigo-200/50 text-sm mt-1">Monitor seluruh aktivitas konsultasi audit (data real API)</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && subRole === 'kspi' && (
              <div className="flex bg-white/10 rounded-lg p-0.5">
                {biroOptions.map((biro) => (
                  <button key={biro.value} onClick={() => setSelectedBiro(biro.value)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${selectedBiro === biro.value ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>{biro.label}</button>
                ))}
              </div>
            )}
            <div className="text-indigo-300/50 hidden md:block"><LiveClock /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Konsultasi" value={stats.total} icon={<IconFileAlt className="w-5 h-5" />} color="indigo" trend={selectedBiro === 'all' ? 'Semua biro' : biroOptions.find(b => b.value === selectedBiro)?.label} />
        <MetricCard title="Aktif" value={stats.aktif} icon={<IconClock className="w-5 h-5" />} color="blue" trend="Sedang berjalan" />
        <MetricCard title="Selesai" value={stats.selesai} icon={<IconCheckCircle className="w-5 h-5" />} color="emerald" trend={stats.total > 0 ? `${Math.round((stats.selesai / stats.total) * 100)}% selesai` : 'Belum ada data'} />
        <MetricCard title="Pengguna" value={stats.pengguna} icon={<IconUsers className="w-5 h-5" />} color="purple" trend="Dari tabel users" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><IconBarChart2 className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Performa Biro Audit</h3>
              <p className="text-xs text-slate-400">Tingkat penyelesaian konsultasi</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {loadingMgmt ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : biroPerfData.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data proses audit dari biro.</p>
            ) : biroPerfData.map((biro, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-purple-600' : 'bg-indigo-600'}`}>{biro.name.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{biro.name}</p>
                      <p className="text-[11px] text-slate-400">{biro.konsultasi} konsultasi · {biro.selesai} selesai</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${biro.rate >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>{biro.rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${biro.rate >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${biro.rate}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {!readOnly && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><IconStar className="w-4 h-4 text-amber-500" /> Aksi Cepat</h3>
              <div className="space-y-2">
                <Link to="/laporan" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><IconFileAlt className="w-4 h-4 text-indigo-600" /></div>
                  <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">Laporan Konsultasi</span>
                </Link>
                <Link to="/status-audit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><IconClipboardList className="w-4 h-4 text-emerald-600" /></div>
                  <span className="text-sm text-slate-700 font-medium group-hover:text-emerald-600 transition-colors">Status Audit</span>
                </Link>
                {subRole === 'admin' && (
                  <Link to="/kelola-user" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><IconUsers className="w-4 h-4 text-purple-600" /></div>
                    <span className="text-sm text-slate-700 font-medium group-hover:text-purple-600 transition-colors">Kelola User</span>
                  </Link>
                )}
                {subRole === 'kspi' && (
                  <Link to="/profil-spi" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><IconBuilding className="w-4 h-4 text-blue-600" /></div>
                    <span className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors">Profil SPI</span>
                  </Link>
                )}
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><IconActivity className="w-4 h-4 text-emerald-400" /> Ringkasan Sistem</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Uptime</span><span className="text-emerald-400 font-semibold">{summaryMgmt.uptime}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">User Aktif</span><span className="text-white font-semibold">{summaryMgmt.userAktif}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Tiket Hari Ini</span><span className="text-white font-semibold">{summaryMgmt.tiketHariIni}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════

const AdminDashboard = ({ user }) => {
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    auditor: 0,
    auditee: 0,
    manajemen: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [summaryAdmin, setSummaryAdmin] = useState({ uptime: '-', userAktif: 0, aktivitasHariIni: 0 });

  useEffect(() => {
    let alive = true;

    const fetchDashboard = async () => {
      try {
        const [userRes, logRes, logStatsRes] = await Promise.all([
          userAPI.getStatistics(),
          activityLogAPI.getAll({ per_page: 5 }),
          activityLogAPI.getStats(),
        ]);

        const data = userRes.data || {};
        const logItems = logRes.data?.data || [];
        const logStats = logStatsRes.data || {};

        if (!alive) return;
        setUserStats({
          total: data.total || 0,
          active: data.active || 0,
          inactive: (data.total || 0) - (data.active || 0),
          auditor: data.auditors || 0,
          auditee: data.auditees || 0,
          manajemen: data.manajemen || 0,
        });

        const mappedRecent = logItems.map((item) => {
          const type = item.event_type || '';
          const mappedType = type.includes('delete')
            ? 'delete'
            : type.includes('role')
              ? 'role'
              : type.includes('setting')
                ? 'setting'
                : type.includes('backup')
                  ? 'system'
                  : 'user';

          return {
            id: item.id,
            action: item.description || type || 'Aktivitas sistem',
            time: item.created_at
              ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '-',
            type: mappedType,
          };
        });

        setRecentActivities(mappedRecent);
        setSummaryAdmin({
          uptime: '-',
          userAktif: data.online || data.active || 0,
          aktivitasHariIni: logStats.today || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      }
    };

    fetchDashboard();

    const poller = setInterval(fetchDashboard, 3000);
    const onFocus = () => fetchDashboard();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDashboard();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const activityConfig = {
    user: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <IconUserPlus className="w-3.5 h-3.5" /> },
    delete: { bg: 'bg-red-50', text: 'text-red-600', icon: <IconXCircle className="w-3.5 h-3.5" /> },
    role: { bg: 'bg-purple-50', text: 'text-purple-600', icon: <IconKey className="w-3.5 h-3.5" /> },
    system: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <IconDatabase className="w-3.5 h-3.5" /> },
    setting: { bg: 'bg-amber-50', text: 'text-amber-600', icon: <IconSliders className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/15 rounded-full -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full -mb-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><IconGear className="w-5 h-5" /></div>
              <span className="text-indigo-300 text-sm font-medium">Dashboard Administrator</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{user?.name || 'Administrator'}</h2>
            <p className="text-indigo-200/50 text-sm mt-1">Kelola pengguna & konfigurasi sistem SiKONA</p>
          </div>
          <div className="hidden md:block text-indigo-300/50"><LiveClock /></div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Pengguna" value={userStats.total} icon={<IconUsers className="w-5 h-5" />} color="indigo" trend={`${userStats.active} aktif`} chartData={[50,55,58,60,62,65,70]} />
        <MetricCard title="Auditor" value={userStats.auditor} icon={<IconClipboardList className="w-5 h-5" />} color="purple" trend="Terdaftar" chartData={[30,35,38,40,42,45,48]} />
        <MetricCard title="Auditee" value={userStats.auditee} icon={<IconUsers className="w-5 h-5" />} color="blue" trend="Terdaftar" chartData={[20,25,28,30,32,35,38]} />
        <MetricCard title="Non-Aktif" value={userStats.inactive} icon={<IconXCircle className="w-5 h-5" />} color="red" trend="Perlu review" chartData={[10,8,12,10,5,8,6]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><IconBarChart2 className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Distribusi Pengguna</h3>
              <p className="text-xs text-slate-400">Breakdown berdasarkan role</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Auditor', count: userStats.auditor, total: userStats.total, color: 'bg-violet-500' },
              { label: 'Auditee', count: userStats.auditee, total: userStats.total, color: 'bg-blue-500' },
              { label: 'Manajemen', count: userStats.manajemen, total: userStats.total, color: 'bg-indigo-500' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${item.color}`}>{item.label.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.count} dari {item.total} pengguna</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-700">{item.total > 0 ? Math.round((item.count / item.total) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><IconStar className="w-4 h-4 text-amber-500" /> Aksi Cepat</h3>
            <div className="space-y-2">
              <Link to="/kelola-user" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><IconUsersGear className="w-4 h-4 text-indigo-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">Kelola User</span>
              </Link>
              <Link to="/buat-user" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><IconUserPlus className="w-4 h-4 text-emerald-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-emerald-600 transition-colors">Buat User Baru</span>
              </Link>
              <Link to="/manajemen-role" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><IconKey className="w-4 h-4 text-purple-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-purple-600 transition-colors">Role & Hak Akses</span>
              </Link>
              <Link to="/log-aktivitas" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><IconHistory className="w-4 h-4 text-blue-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors">Log Aktivitas</span>
              </Link>
              <Link to="/pengaturan-sistem" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><IconSliders className="w-4 h-4 text-amber-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-amber-600 transition-colors">Pengaturan Sistem</span>
              </Link>
              <Link to="/backup-restore" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><IconDatabase className="w-4 h-4 text-red-600" /></div>
                <span className="text-sm text-slate-700 font-medium group-hover:text-red-600 transition-colors">Backup & Restore</span>
              </Link>
            </div>
          </div>

          {/* System Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><IconActivity className="w-4 h-4 text-emerald-400" /> Ringkasan Sistem</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Uptime</span><span className="text-emerald-400 font-semibold">{summaryAdmin.uptime}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">User Aktif</span><span className="text-white font-semibold">{summaryAdmin.userAktif}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Aktivitas Hari Ini</span><span className="text-white font-semibold">{summaryAdmin.aktivitasHariIni}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><IconHistory className="w-4 h-4 text-white" /></div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Aktivitas Terbaru</h3>
            <p className="text-xs text-slate-400">Hari ini</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {recentActivities.length === 0 && (
            <div className="text-sm text-slate-500">Belum ada aktivitas terbaru.</div>
          )}
          {recentActivities.map(act => {
            const ac = activityConfig[act.type] || activityConfig.user;
            return (
              <div key={act.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 ${ac.bg} rounded-lg flex items-center justify-center ${ac.text} flex-shrink-0`}>{ac.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{act.action}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconClock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// KOMITE AUDIT DASHBOARD
// ═══════════════════════════════════════════

const KomiteDashboard = ({ user }) => <ManajemenDashboard user={user} subRole="komite" />;

// DEFAULT
const DefaultDashboard = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-slate-200/60">
      <h1 className="text-xl font-bold text-slate-800 mb-3">Dashboard</h1>
      <p className="text-slate-500 text-sm">Silakan login untuk mengakses dashboard</p>
      <Link to="/login" className="inline-block mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors">Masuk ke Sistem</Link>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════

const MetricCard = ({ title, value, icon, color, trend, chartData }) => {
  const cm = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', bar: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500', bar: 'bg-amber-400' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500', bar: 'bg-red-400' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500', bar: 'bg-blue-400' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500', bar: 'bg-indigo-400' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500', bar: 'bg-purple-400' },
  };
  const c = cm[color] || cm.indigo;
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center ${c.icon}`}>{icon}</div>
        {chartData && <MiniBarChart data={chartData} color={c.bar} />}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{title}</p>
      {trend && <p className={`text-[10px] ${c.text} font-semibold mt-2 flex items-center gap-1`}><IconTrendUp className="w-3 h-3" /> {trend}</p>}
    </div>
  );
};

const ProgressItem = ({ label, value, color }) => {
  const cm = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', purple: 'bg-purple-500' };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600 font-medium">{label}</span><span className="text-slate-800 font-bold">{value}%</span></div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${cm[color] || 'bg-indigo-500'}`} style={{ width: `${value}%` }}></div></div>
    </div>
  );
};

export default Dashboard;