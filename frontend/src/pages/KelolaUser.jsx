import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { IconSearch, IconUsers, IconUserPlus, IconTrash, IconEye, IconX, IconCheckCircle, IconExclamationCircle, IconClock, IconChevronDown, IconChevronUp, IconUserTie, IconUser, IconBriefcase } from '../components/Icons';

const ROLE_CONFIG = {
  auditor:   { label: 'Auditor',   color: 'emerald', gradient: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-400' },
  auditee:   { label: 'Auditee',   color: 'blue',    gradient: 'from-blue-500 to-indigo-600',     bg: 'bg-blue-50',     text: 'text-blue-700',    ring: 'ring-blue-400' },
  manajemen: { label: 'Manajemen', color: 'violet',  gradient: 'from-violet-500 to-purple-600',   bg: 'bg-violet-50',   text: 'text-violet-700',  ring: 'ring-violet-400' },
  admin:     { label: 'Admin',     color: 'amber',   gradient: 'from-amber-500 to-orange-600',    bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-400' },
};

const SUB_ROLE_LABELS = { kspi: 'KSPI', admin: 'Admin', komite: 'Komite Audit' };

const KelolaUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;

    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll();
        const mapped = (response.data?.users || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          subRole: u.sub_role,
          status: u.is_active ? 'active' : 'inactive',
          unit: u.department || '',
          biro: u.biro || '',
          createdAt: u.created_at,
          lastLogin: u.last_seen_at || '',
        }));
        if (!alive) return;
        setUsers(mapped);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchUsers();
    const poller = setInterval(fetchUsers, 5000);
    const onFocus = () => fetchUsers();
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  // Filtering
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase()) ||
                        (u.biro || u.unit || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let va, vb;
    if (sortField === 'name') { va = a.name; vb = b.name; }
    else if (sortField === 'role') { va = a.role; vb = b.role; }
    else if (sortField === 'createdAt') { va = a.createdAt || ''; vb = b.createdAt || ''; }
    else if (sortField === 'lastLogin') { va = a.lastLogin || ''; vb = b.lastLogin || ''; }
    else { va = a.name; vb = b.name; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleDelete = async (user) => {
    try {
      await userAPI.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteConfirm(null);
      setDeleteSuccess(user.name);
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (error) {
      console.error('Delete user failed:', error);
      alert('Gagal menghapus user.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatLoginTime = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split(' ');
    const d = new Date(parts[0]);
    const day = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    return `${day}, ${parts[1] || ''}`;
  };

  const getTimeSinceLogin = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    const last = new Date(dateStr);
    if (Number.isNaN(last.getTime())) return null;
    const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: 'Hari ini', color: 'text-emerald-600' };
    if (diff === 1) return { text: 'Kemarin', color: 'text-emerald-600' };
    if (diff <= 7) return { text: `${diff} hari lalu`, color: 'text-blue-600' };
    if (diff <= 30) return { text: `${Math.floor(diff / 7)} minggu lalu`, color: 'text-amber-600' };
    return { text: `${Math.floor(diff / 30)} bulan lalu`, color: 'text-red-500' };
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <IconChevronDown className="w-3 h-3 text-slate-300" />;
    return sortAsc ? <IconChevronUp className="w-3 h-3 text-indigo-600" /> : <IconChevronDown className="w-3 h-3 text-indigo-600" />;
  };

  const roleCounts = {
    all: users.length,
    auditor: users.filter(u => u.role === 'auditor').length,
    auditee: users.filter(u => u.role === 'auditee').length,
    manajemen: users.filter(u => u.role === 'manajemen').length,
    admin: users.filter(u => u.role === 'admin' || (u.role === 'manajemen' && u.subRole === 'admin')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola User</h1>
          <p className="text-slate-500 text-sm">Kelola dan pantau seluruh pengguna sistem SiKONA</p>
        </div>
        <Link to="/buat-user" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 text-sm">
          <IconUserPlus className="w-4 h-4" />
          Buat User Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total User',
            count: users.length,
            icon: <IconUsers className="w-8 h-8" />,
            light: 'bg-slate-50',
            iconColor: 'text-slate-600',
          },
          {
            label: 'Auditor',
            count: roleCounts.auditor,
            icon: <IconUserTie className="w-8 h-8" />,
            light: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Auditee',
            count: roleCounts.auditee,
            icon: <IconUser className="w-8 h-8" />,
            light: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Manajemen',
            count: roleCounts.manajemen,
            icon: <IconBriefcase className="w-8 h-8" />,
            light: 'bg-violet-50',
            iconColor: 'text-violet-600',
          },
        ].map((s, i) => (
          <div key={i} className={`${s.light} rounded-2xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
              <div className={`${s.iconColor} opacity-95`}>{s.icon}</div>
            </div>
            <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Search + Role Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau unit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <IconX className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Role Filter Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'auditor', label: 'Auditor' },
              { key: 'auditee', label: 'Auditee' },
              { key: 'manajemen', label: 'Manajemen' },
              { key: 'admin', label: 'Admin' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === f.key
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 text-[10px] ${roleFilter === f.key ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {roleCounts[f.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Success Toast */}
      {deleteSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeInUp">
          <IconCheckCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">User "{deleteSuccess}" berhasil dihapus</span>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Memuat data user...</div>
        ) : (
          <>
        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50/80 border-b border-slate-100">
          <button onClick={() => handleSort('name')} className="col-span-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
            Pengguna <SortIcon field="name" />
          </button>
          <button onClick={() => handleSort('role')} className="col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
            Role <SortIcon field="role" />
          </button>
          <div className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit / Biro</div>
          <button onClick={() => handleSort('lastLogin')} className="col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
            Login Terakhir <SortIcon field="lastLogin" />
          </button>
          <div className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</div>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconSearch className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Tidak ada user ditemukan</p>
            <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci atau filter</p>
          </div>
        ) : (
          sorted.map((user) => {
            const rc = ROLE_CONFIG[user.role];
            const loginInfo = getTimeSinceLogin(user.lastLogin);
            const isExpanded = expandedId === user.id;

            return (
              <div key={user.id} className="border-b border-slate-50 last:border-0">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors group">
                  {/* User Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${rc.gradient} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-offset-2 ${rc.ring}/30`}>
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${rc.bg} ${rc.text}`}>
                      {rc.label}
                    </span>
                    {user.subRole && (
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-1">{SUB_ROLE_LABELS[user.subRole]}</p>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="col-span-2 text-sm text-slate-600 truncate">
                    {user.biro || user.unit || '-'}
                  </div>

                  {/* Last Login */}
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600">{formatLoginTime(user.lastLogin)}</p>
                    {loginInfo && <p className={`text-[10px] font-medium ${loginInfo.color}`}>{loginInfo.text}</p>}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : user.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Detail"
                    >
                      <IconEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-5 pb-4 animate-fadeInUp">
                    <div className="ml-[52px] bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-4 border border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem icon={<IconClock className="w-3.5 h-3.5 text-indigo-500" />} label="Terdaftar Sejak" value={formatDate(user.createdAt)} />
                        <DetailItem icon={<IconCheckCircle className="w-3.5 h-3.5 text-emerald-500" />} label="Login Terakhir" value={formatLoginTime(user.lastLogin)} />
                        <DetailItem icon={<IconUsers className="w-3.5 h-3.5 text-blue-500" />} label="Role" value={`${rc.label}${user.subRole ? ` (${SUB_ROLE_LABELS[user.subRole]})` : ''}`} />
                        <DetailItem icon={<IconExclamationCircle className="w-3.5 h-3.5 text-amber-500" />} label="ID" value={`#${String(user.id).padStart(4, '0')}`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Menampilkan <span className="font-bold text-slate-600">{sorted.length}</span> dari <span className="font-bold text-slate-600">{users.length}</span> user
          </p>
          <div className="text-xs text-slate-400">
            Diurutkan: <span className="font-semibold text-slate-600">{
              sortField === 'name' ? 'Nama' : sortField === 'role' ? 'Role' : sortField === 'lastLogin' ? 'Login Terakhir' : 'Tanggal Daftar'
            }</span> ({sortAsc ? 'A-Z' : 'Z-A'})
          </div>
        </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeInUp" onClick={e => e.stopPropagation()}>
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconTrash className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus User?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Anda akan menghapus akun berikut. Tindakan ini tidak dapat dibatalkan.
            </p>

            {/* User Card Preview */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${ROLE_CONFIG[deleteConfirm.role].gradient} rounded-xl flex items-center justify-center text-white font-bold shadow-sm`}>
                {deleteConfirm.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-bold text-slate-800">{deleteConfirm.name}</p>
                <p className="text-xs text-slate-400">{deleteConfirm.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_CONFIG[deleteConfirm.role].bg} ${ROLE_CONFIG[deleteConfirm.role].text}`}>
                  {ROLE_CONFIG[deleteConfirm.role].label}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all text-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for expanded detail
const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5">{icon}</div>
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);

export default KelolaUser;
