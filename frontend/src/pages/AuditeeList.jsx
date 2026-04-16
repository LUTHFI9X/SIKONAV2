import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conversationAPI, userAPI } from '../services/api';
import { 
  IconComments, IconUserGroup, IconSearch, IconCheckCircle, 
  IconClock, IconXCircle, IconEnvelope, IconEye,
  IconChartBar, IconHeadphones
} from '../components/Icons';

const AuditeeList = () => {
  const { user } = useAuth();
  const currentUser = user;
  const userBiro = currentUser?.biro || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [allAuditees, setAllAuditees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mapStatus = (status) => {
      if (status === 'closed') return 'Selesai';
      if (status === 'archived') return 'Tindak Lanjut';
      if (status === 'active') return 'Baru';
      if (status === 'completed') return 'Selesai';
      if (status === 'in_progress') return 'Proses';
      if (status === 'pending') return 'Baru';
      if (status === 'cancelled') return 'Tindak Lanjut';
      return 'Tindak Lanjut';
    };

    const fetchData = async () => {
      try {
        const [auditeesRes, conversationsRes] = await Promise.all([
          userAPI.getAuditees(),
          conversationAPI.getAll(),
        ]);

        const auditeeMap = new Map((auditeesRes.data?.auditees || []).map((a) => [a.id, a]));
        const grouped = new Map();

        (conversationsRes.data?.conversations || []).forEach((conv) => {
          const auditee = conv.auditee || auditeeMap.get(conv.auditee_id);
          if (!auditee) return;
          const convTime = conv.last_message_at || conv.created_at || null;

          const existing = grouped.get(auditee.id) || {
            id: auditee.id,
            name: auditee.name,
            unit: auditee.department || '-',
            biro: userBiro,
            tujuanKonsultasi: conv.subject || 'Konsultasi Audit',
            konsultasiDikirim: 0,
            lastKonsultasi: convTime,
            status: mapStatus(conv.status),
          };

          existing.konsultasiDikirim += 1;
          if (!existing.lastKonsultasi || (convTime && convTime > existing.lastKonsultasi)) {
            existing.lastKonsultasi = convTime;
            existing.tujuanKonsultasi = conv.subject || existing.tujuanKonsultasi;
            existing.status = mapStatus(conv.status);
          }
          grouped.set(auditee.id, existing);
        });

        setAllAuditees(Array.from(grouped.values()));
      } catch (error) {
        console.error('Failed to fetch auditee list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const poller = setInterval(fetchData, 4000);

    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, [userBiro]);

  // Filter auditee berdasarkan biro auditor yang login
  // Auditor hanya bisa melihat auditee yang mengirim konsultasi ke biro-nya
  const auditees = useMemo(() => {
    let filtered = allAuditees;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.unit.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    return filtered;
  }, [allAuditees, userBiro, searchQuery, filterStatus]);

  // Stats berdasarkan biro
  const biroAuditees = allAuditees;
  const totalKonsultasiDikirim = biroAuditees.reduce((sum, a) => sum + a.konsultasiDikirim, 0);
  const stats = {
    total: biroAuditees.length,
    selesai: biroAuditees.filter(a => a.status === 'Selesai').length,
    proses: biroAuditees.filter(a => a.status === 'Proses' || a.status === 'Tindak Lanjut').length,
    baru: biroAuditees.filter(a => a.status === 'Baru').length,
    totalKonsultasi: totalKonsultasiDikirim,
  };

  const getStatusColor = (status) => {
    const colors = {
      'Selesai': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Tindak Lanjut': 'bg-amber-100 text-amber-700 border-amber-200',
      'Baru': 'bg-blue-100 text-blue-700 border-blue-200',
      'Proses': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'Selesai') return <IconCheckCircle className="w-3.5 h-3.5" />;
    if (status === 'Proses' || status === 'Tindak Lanjut') return <IconClock className="w-3.5 h-3.5" />;
    return <IconEnvelope className="w-3.5 h-3.5" />;
  };

  const formatLastKonsultasi = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
                <IconUserGroup className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Daftar Auditee</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{userBiro || 'Biro Auditor'}</h1>
            <p className="text-indigo-200/50 text-[11px] mt-0.5">Auditee yang mengirim konsultasi ke biro Anda</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-white">{stats.total}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Auditee</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-indigo-300">{stats.totalKonsultasi}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Konsultasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <IconUserGroup className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500 font-medium">Total Auditee</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <IconEnvelope className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalKonsultasi}</p>
          <p className="text-xs text-slate-500 font-medium">Konsultasi Dikirim</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <IconCheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.selesai}</p>
          <p className="text-xs text-slate-500 font-medium">Selesai</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <IconClock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.proses + stats.baru}</p>
          <p className="text-xs text-slate-500 font-medium">Dalam Proses</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama auditee atau unit kerja..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'Selesai', label: 'Selesai' },
            { key: 'Proses', label: 'Proses' },
            { key: 'Baru', label: 'Baru' },
            { key: 'Tindak Lanjut', label: 'Tindak Lanjut' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === f.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <IconChartBar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Manajemen Jawaban Auditee</h3>
              <p className="text-xs text-slate-400">Menampilkan auditee dari {userBiro || 'biro Anda'}</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {auditees.length} Auditee
          </span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Memuat data auditee...</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
              <tr>
                <th className="p-4">Nama Auditee</th>
                <th className="p-4">Unit Kerja</th>
                <th className="p-4">Tujuan Konsultasi</th>
                <th className="p-4">Konsultasi Dikirim</th>
                <th className="p-4">Terakhir Kirim</th>
                <th className="p-4">Status Konsultasi</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {auditees.map((auditee) => (
                <tr key={auditee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                        {auditee.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{auditee.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{auditee.unit}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconHeadphones className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{auditee.tujuanKonsultasi}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <IconEnvelope className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{auditee.konsultasiDikirim}</p>
                        <p className="text-[10px] text-slate-400">konsultasi</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-500">{formatLastKonsultasi(auditee.lastKonsultasi)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(auditee.status)}`}>
                      {getStatusIcon(auditee.status)} {auditee.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to="/konsultasi" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5">
                        <IconComments className="w-3.5 h-3.5" /> Chat
                      </Link>
                      <Link to="/proses-audit" className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all inline-flex items-center gap-1.5">
                        <IconEye className="w-3.5 h-3.5" /> Detail
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {!loading && auditees.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconUserGroup className="w-9 h-9 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-700 mb-2 text-lg">Tidak Ada Auditee</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? 'Tidak ditemukan auditee dengan filter yang dipilih' 
                : 'Belum ada auditee yang mengirim konsultasi ke biro Anda'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditeeList;
