import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { backupAPI } from '../services/api';
import {
  IconDatabase, IconDownload, IconUpload, IconCheckCircle, IconClock,
  IconTrash, IconInfoCircle, IconShieldCheck, IconSave, IconSearch,
  IconFileAlt, IconHistory
} from '../components/Icons';

const BackupRestore = () => {
  const { user } = useAuth();
  const currentUser = user;

  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await backupAPI.getAll();
      const items = response.data?.backups || [];
      setBackups(items.map((item) => ({
        id: item.id,
        filename: item.filename,
        size: item.size_readable || '-',
        date: item.date,
        type: item.type,
        status: item.status,
      })));
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await backupAPI.create();
      await fetchBackups();
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal membuat backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDelete = async (id) => {
    const backup = backups.find((b) => b.id === id);
    if (!backup) return;

    try {
      await backupAPI.remove(backup.filename);
      await fetchBackups();
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal menghapus backup.');
    }

    setDeleteConfirm(null);
  };

  const handleDownload = async (filename) => {
    try {
      const response = await backupAPI.download(filename);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal mengunduh backup.');
    }
  };

  const handleRestore = async (id) => {
    const backup = backups.find((b) => b.id === id);
    if (!backup || isRestoring) return;

    setIsRestoring(true);
    try {
      const response = await backupAPI.restore(backup.filename);
      alert(response?.data?.message || `Restore berhasil dari ${backup.filename}.`);
      await fetchBackups();
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal restore backup.');
    } finally {
      setIsRestoring(false);
      setRestoreConfirm(null);
    }
  };

  const autoBackups = backups.filter(b => b.type === 'auto');
  const manualBackups = backups.filter(b => b.type === 'manual');

  return (
    <div className="space-y-6 animate-fadeInUp pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                <IconDatabase className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Data Management</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Backup & Restore (Real DB)</h1>
            <p className="text-indigo-200/50 text-[11px] mt-0.5">Kelola backup & restore database SiKONA</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-white">{backups.length}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Total</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-emerald-300">{autoBackups.length}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Otomatis</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-blue-300">{manualBackups.length}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Manual</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup Now */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
              <IconDownload className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Backup Sekarang</h3>
              <p className="text-xs text-slate-400">Buat backup database secara manual</p>
            </div>
          </div>
          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="w-full px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isBackingUp ? (
              <><IconClock className="w-4 h-4 animate-spin" /> Sedang Backup...</>
            ) : (
              <><IconDatabase className="w-4 h-4" /> Buat Backup</>
            )}
          </button>
          {backupSuccess && (
            <div className="mt-3 flex items-center gap-2 text-emerald-600 animate-fadeInUp">
              <IconCheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold">Backup berhasil dibuat!</span>
            </div>
          )}
        </div>

        {/* Restore */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <IconUpload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Restore dari File</h3>
              <p className="text-xs text-slate-400">Unggah file backup (.sql) untuk restore</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (backups.length === 0) {
                alert('Belum ada file backup untuk direstore.');
                return;
              }
              setRestoreConfirm(backups[0].id);
            }}
            disabled={isRestoring}
            className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isRestoring ? (
              <><IconClock className="w-4 h-4 animate-spin" /> Sedang Restore...</>
            ) : (
              <><IconUpload className="w-4 h-4" /> Restore Otomatis</>
            )}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <IconInfoCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h4 className="font-bold text-amber-700">Peringatan</h4>
          <p className="text-amber-600 text-sm">Restore database akan <span className="font-bold">mengganti seluruh data</span> yang ada. Pastikan Anda sudah backup data terbaru sebelum melakukan restore.</p>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <IconHistory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Riwayat Backup</h3>
              <p className="text-xs text-slate-400">{backups.length} backup tersedia</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
              <tr>
                <th className="px-6 py-3 text-left">File</th>
                <th className="px-6 py-3 text-left">Ukuran</th>
                <th className="px-6 py-3 text-left">Tanggal</th>
                <th className="px-6 py-3 text-left">Tipe</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm">Memuat data backup...</td>
                </tr>
              ) : backups.map((backup, idx) => (
                <tr key={backup.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconFileAlt className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 truncate max-w-[250px]">{backup.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{backup.size}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5">
                      <IconClock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600 font-mono">{backup.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold ${
                      backup.type === 'auto' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {backup.type === 'auto' ? 'Otomatis' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600">
                      <IconCheckCircle className="w-3 h-3" /> Berhasil
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleDownload(backup.filename)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1">
                        <IconDownload className="w-3 h-3" /> Download
                      </button>
                      <button
                        onClick={() => setRestoreConfirm(backup.id)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all flex items-center gap-1"
                      >
                        <IconUpload className="w-3 h-3" /> Restore
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(backup.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1"
                      >
                        <IconTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && backups.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconDatabase className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Belum Ada Backup</h3>
            <p className="text-sm text-slate-500">Belum ada backup database yang tersedia</p>
          </div>
        )}
      </div>

      {/* Confirm Restore Modal */}
      {restoreConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRestoreConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconInfoCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Restore</h3>
              <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin restore database dari backup ini? Data saat ini akan digantikan.</p>
              <div className="flex gap-3">
                <button onClick={() => setRestoreConfirm(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Batal</button>
                <button
                  onClick={() => handleRestore(restoreConfirm)}
                  disabled={isRestoring}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
                >
                  {isRestoring ? 'Memproses...' : 'Ya, Restore'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconTrash className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Backup</h3>
              <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus file backup ini? Tindakan ini tidak dapat dikembalikan.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Batal</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all">Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;
