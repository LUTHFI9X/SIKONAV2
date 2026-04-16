import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TAHAPAN_AUDIT } from '../data';
import { auditAPI } from '../services/api';
import { showConfirm } from '../services/notify';
import {
  IconComments, IconBolt, IconFolderOpen, IconArrowLeft, IconCheck,
  IconFileAlt, IconEye, IconTrash, IconCloudUpload, IconInfoCircle,
  IconSave, IconChevronUp, IconCheckCircle, IconClock, IconTrendUp,
  IconSearch, IconChartBar, IconLock
} from '../components/Icons';

const ProsesAudit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user;
  const userRole = currentUser?.role || 'auditee';
  const userName = currentUser?.name || '';
  const [konsultasiData, setKonsultasiData] = useState([]);

  // State untuk selected konsultasi
  const [selectedKonsultasi, setSelectedKonsultasi] = useState(null);
  
  // State untuk tahap yang dipilih di horizontal stepper
  const [selectedTahap, setSelectedTahap] = useState(null);

  // State untuk file yang diupload per konsultasi per tahapan
  const [allUploadedFiles, setAllUploadedFiles] = useState({});

  const fetchProcesses = useCallback(async () => {
    try {
      const response = await auditAPI.getAll();
      const processes = response.data?.audit_processes || [];
      const mapped = processes.map((p) => ({
        id: p.id,
        namaAuditee: (p.auditee?.name || '-').toUpperCase(),
        unitKerja: p.auditee?.department || '-',
        kategori: p.biro || p.auditor?.biro || '-',
        progress_percentage: p.progress_percentage || 0,
        statusRaw: p.status || 'pending',
        raw: p,
      }));

      const mappedFiles = {};
      processes.forEach((p) => {
        const docs = p.documents || [];
        const stagedDocs = docs.reduce((acc, doc) => {
          acc[doc.tahap_no] = {
            name: doc.file_name,
            size: formatFileSize(doc.file_size || 0),
          };
          return acc;
        }, {});

        if (p.status === 'completed') {
          stagedDocs[10] = {
            name: 'Finalisasi Otomatis',
            size: 'Sistem',
          };
        }

        mappedFiles[p.id] = stagedDocs;
      });

      setKonsultasiData(mapped);
      setAllUploadedFiles(mappedFiles);

      setCatatanAuditor(processes.reduce((acc, p) => {
        acc[p.id] = p.catatan_auditor || '';
        return acc;
      }, {}));

      setSelectedKonsultasi((prev) => {
        if (!prev) return prev;
        const refreshed = mapped.find((item) => item.id === prev.id);
        if (!refreshed) return null;
        return refreshed;
      });
    } catch (error) {
      console.error('Failed to fetch consultation processes:', error);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();

    const poller = setInterval(fetchProcesses, 4000);
    const onFocus = () => fetchProcesses();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchProcesses]);

  // State untuk catatan auditor per konsultasi
  const [catatanAuditor, setCatatanAuditor] = useState({});

  const fileInputRefs = useRef({});

  // Calculate progress for a specific konsultasi
  const getProgress = (konsultasiId) => {
    const backendProgress = konsultasiData.find((k) => k.id === konsultasiId)?.progress_percentage;
    if (typeof backendProgress === 'number') return backendProgress;

    const files = allUploadedFiles[konsultasiId] || {};
    const completed = Object.values(files).filter(f => f !== null).length;
    return Math.round((completed / 10) * 100);
  };

  // Get uploaded files for selected konsultasi
  const uploadedFiles = selectedKonsultasi ? (allUploadedFiles[selectedKonsultasi.id] || {}) : {};
  const completedCount = Object.values(uploadedFiles).filter(f => f !== null).length;
  const pendingCount = 10 - completedCount;
  const progressPercent = selectedKonsultasi ? getProgress(selectedKonsultasi.id) : 0;

  // Filter konsultasi berdasarkan role:
  // Auditee: hanya lihat konsultasi milik sendiri (berdasarkan nama)
  // Auditor: lihat semua konsultasi yang dikirim ke biro-nya
  // Manajemen: lihat semua konsultasi
  const daftarKonsultasi = konsultasiData.filter((k) => k.statusRaw !== 'cancelled');

  // Check if user can upload a specific tahap
  // Rule upload:
  // - Auditee: tahap 1 dan 6
  // - Auditor: selain tahap 1 dan 6
  // - Manajemen non-KSPI: semua tahap
  // - KSPI: view-only
  const isKSPI = userRole === 'manajemen' && currentUser?.sub_role === 'kspi';
  const canUpload = (tahapNo) => {
    if (isKSPI) return false; // KSPI hanya view
    if (userRole === 'manajemen') return true;
    if (userRole === 'auditee') return tahapNo === 1 || tahapNo === 6;
    if (userRole === 'auditor') return tahapNo >= 1 && tahapNo <= 10 && tahapNo !== 1 && tahapNo !== 6;
    return false;
  };

  const canUploadInProcess = (tahapNo) => canUpload(tahapNo) && tahapNo !== 9 && tahapNo !== 10;
  const getTahapOwnerLabel = (tahapNo) => {
    if (tahapNo === 9) return 'Menu Laporan';
    if (tahapNo === 10) return 'Finalisasi Otomatis';
    if (tahapNo === 1 || tahapNo === 6) return 'Auditee';
    return 'Auditor';
  };

  const handleViewFile = async (tahapNo) => {
    if (!selectedKonsultasi) return;

    try {
      const response = await auditAPI.downloadDokumen(selectedKonsultasi.id, tahapNo);
      const fileBlob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });

      const fileName = uploadedFiles[tahapNo]?.name || `dokumen-tahap-${tahapNo}`;
      const url = window.URL.createObjectURL(fileBlob);

      // Try open preview in a new tab first.
      const opened = window.open(url, '_blank', 'noopener,noreferrer');

      // If popup is blocked, fallback to forced download.
      if (!opened) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error('Lihat dokumen gagal:', error);
      alert(error?.response?.data?.message || 'Gagal membuka file dokumen.');
    }
  };

  // Handle file upload
  const handleFileUpload = async (tahapNo, event) => {
    const file = event.target.files[0];
    if (!file || !selectedKonsultasi) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Ukuran file maksimal 50MB');
      return;
    }
    
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic', 'heif'];
    const isAllowedMime = file.type.startsWith('image/')
      || file.type === 'application/pdf'
      || file.type === 'application/msword'
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.type === 'application/vnd.ms-excel'
      || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || file.type === 'application/vnd.ms-powerpoint'
      || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      || file.type === 'text/csv'
      || file.type === 'text/plain';

    if (!isAllowedMime && !allowedExtensions.includes(extension)) {
      alert('Tipe file harus PDF, Word, Excel, PowerPoint, TXT, CSV, atau gambar.');
      return;
    }

    try {
      await auditAPI.uploadDokumen(selectedKonsultasi.id, file, tahapNo);
      await fetchProcesses();
      event.target.value = '';
    } catch (error) {
      console.error('Upload dokumen gagal:', error);
      alert(error?.response?.data?.message || 'Gagal upload dokumen.');
    }
  };

  // Handle file delete
  const handleFileDelete = async (tahapNo) => {
    if (!selectedKonsultasi) return;
    const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus file ini?', {
      title: 'Hapus Dokumen',
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      await auditAPI.deleteDokumen(selectedKonsultasi.id, tahapNo);
      await fetchProcesses();
    } catch (error) {
      console.error('Hapus dokumen gagal:', error);
      alert(error?.response?.data?.message || 'Gagal menghapus dokumen.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Trigger file input
  const triggerFileInput = (tahapNo) => {
    if (fileInputRefs.current[tahapNo]) {
      fileInputRefs.current[tahapNo].value = '';
      fileInputRefs.current[tahapNo].click();
    }
  };

  // Overall stats for auditee
  const overallStats = {
    total: daftarKonsultasi.length,
    selesai: daftarKonsultasi.filter(k => getProgress(k.id) === 100).length,
    proses: daftarKonsultasi.filter(k => { const p = getProgress(k.id); return p > 0 && p < 100; }).length,
    belum: daftarKonsultasi.filter(k => getProgress(k.id) === 0).length,
    avgProgress: daftarKonsultasi.length > 0 ? Math.round(daftarKonsultasi.reduce((sum, k) => sum + getProgress(k.id), 0) / daftarKonsultasi.length) : 0,
  };

  return (
    <div className="proses-audit-page space-y-6 animate-fadeInUp pb-8">
      {/* Header - Professional Dark Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                <IconComments className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Proses Konsultasi</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Proses Konsultasi Audit</h1>
            <p className="text-indigo-200/50 text-[11px] mt-0.5">Pantau dan kelola seluruh tahapan konsultasi audit</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-white">{overallStats.total}</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Konsultasi</p>
            </div>
            <div className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-lg font-bold text-emerald-300">{overallStats.avgProgress}%</p>
              <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">Rata-rata</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Info Banner */}
      <div className={`rounded-xl p-4 border flex items-center gap-4 ${
        userRole === 'auditee' 
          ? 'bg-blue-50/80 border-blue-200/60' 
          : userRole === 'auditor' 
            ? 'bg-violet-50/80 border-violet-200/60' 
            : 'bg-emerald-50/80 border-emerald-200/60'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          userRole === 'auditee' ? 'bg-blue-100' : userRole === 'auditor' ? 'bg-violet-100' : 'bg-emerald-100'
        }`}>
          <IconInfoCircle className={`w-5 h-5 ${
            userRole === 'auditee' ? 'text-blue-500' : userRole === 'auditor' ? 'text-violet-500' : 'text-emerald-500'
          }`} />
        </div>
        <div>
          <p className={`text-sm md:text-[15px] font-semibold leading-relaxed break-words ${
            userRole === 'auditee' ? 'text-blue-800' : userRole === 'auditor' ? 'text-violet-800' : 'text-emerald-800'
          }`}>
            {userRole === 'auditee' && 'Auditee hanya dapat upload dokumen Tahap 1 dan Tahap 6. Tahap 9 dikelola di menu Laporan, Tahap 10 finalisasi otomatis saat diarsipkan.'}
            {userRole === 'auditor' && 'Auditor hanya dapat upload dokumen selain Tahap 1 dan Tahap 6. Tahap 9 dikelola di menu Laporan, Tahap 10 finalisasi otomatis saat diarsipkan.'}
            {userRole === 'manajemen' && isKSPI && 'Anda memiliki akses view-only untuk melihat seluruh tahapan dokumen.'}
            {userRole === 'manajemen' && !isKSPI && 'Anda memiliki akses kelola tahapan 1-8. Tahap 9 dikelola di menu Laporan, Tahap 10 finalisasi otomatis saat diarsipkan.'}
          </p>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center"><IconComments className="w-5 h-5 text-indigo-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{overallStats.total}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Konsultasi</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><IconCheckCircle className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{overallStats.selesai}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Selesai (100%)</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><IconClock className="w-5 h-5 text-blue-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{overallStats.proses}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Dalam Proses</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center"><IconTrendUp className="w-5 h-5 text-amber-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{overallStats.avgProgress}%</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Progress Rata-rata</p>
        </div>
      </div>

      {/* Daftar Konsultasi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <IconChartBar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daftar Konsultasi</h3>
              <p className="text-xs text-slate-400">Pilih konsultasi untuk melihat detail tahapan</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{daftarKonsultasi.length} Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Auditee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftarKonsultasi.map((item, idx) => {
                const itemProgress = getProgress(item.id);
                return (
                <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-white'} ${selectedKonsultasi?.id === item.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-indigo-600">{item.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.namaAuditee}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.unitKerja}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.kategori}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${itemProgress === 100 ? 'bg-emerald-500' : itemProgress > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                          style={{ width: `${itemProgress}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold ${itemProgress === 100 ? 'text-emerald-500' : itemProgress > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{itemProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedKonsultasi(selectedKonsultasi?.id === item.id ? null : item)}
                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                        selectedKonsultasi?.id === item.id 
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      }`}
                    >
                      {selectedKonsultasi?.id === item.id ? <><IconChevronUp className="w-4 h-4" /> Tutup</> : <><IconEye className="w-4 h-4" /> Lihat</>}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {daftarKonsultasi.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconFolderOpen className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Belum Ada Konsultasi</h3>
            <p className="text-sm text-slate-500">Proses Konsultasi hanya menampilkan data dengan status Dalam Proses. Ubah status dari menu Status Konsultasi terlebih dahulu.</p>
          </div>
        )}
      </div>

      {/* Detail Proses Konsultasi - Muncul dengan animasi jika ada yang dipilih */}
      {selectedKonsultasi && (
        <div className="space-y-6 animate-slideDown">
          {/* Header with Info + Progress Ring */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {selectedKonsultasi.namaAuditee.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedKonsultasi.namaAuditee}</h3>
                  <p className="text-xs text-slate-500">{selectedKonsultasi.kategori} · {selectedKonsultasi.unitKerja}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                      <circle cx="20" cy="20" r="16" stroke={progressPercent === 100 ? '#22c55e' : '#6366f1'} strokeWidth="3" fill="none"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPercent / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-700">{progressPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{completedCount}/10</p>
                    <p className="text-[10px] text-slate-400">tahap selesai</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedKonsultasi(null)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <IconArrowLeft className="w-4 h-4" /> Kembali
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Stepper + Detail Panel — Clean & Professional */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <IconFolderOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tahapan & Upload Dokumen</h3>
                  <p className="text-xs text-slate-400">Klik tahapan untuk melihat detail & upload dokumen</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${progressPercent === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {completedCount}/10 selesai
                </div>
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="2.5" fill="none" />
                    <circle cx="20" cy="20" r="16" stroke={progressPercent === 100 ? '#10b981' : '#4f46e5'} strokeWidth="2.5" fill="none"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPercent / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-700">{progressPercent}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar — single-color, clean */}
            <div className="px-6 pt-5">
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* Horizontal Stepper — semantic colors only */}
            <div className="px-4 md:px-6 py-6">
              <div className="flex items-start">
                {TAHAPAN_AUDIT.map((tahap, idx) => {
                  const isDone = !!uploadedFiles[tahap.no];
                  const isActive = selectedTahap === tahap.no;
                  const isLast = idx === TAHAPAN_AUDIT.length - 1;
                  const canUploadThis = canUploadInProcess(tahap.no);
                  const nextDone = !isLast && !!uploadedFiles[TAHAPAN_AUDIT[idx + 1]?.no];
                  return (
                    <div key={tahap.no} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setSelectedTahap(isActive ? null : tahap.no)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all duration-200 cursor-pointer relative ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-100 scale-110'
                              : isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white hover:shadow-md'
                                : canUploadThis
                                  ? 'bg-white border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                          title={tahap.tahapan}
                        >
                          {isDone && !isActive ? <IconCheck className="w-4 h-4" /> : tahap.no}
                          {!canUploadThis && !isDone && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white">
                              <IconLock className="w-2 h-2 text-slate-400" />
                            </div>
                          )}
                        </button>
                        <p className={`text-[9px] font-medium mt-1.5 text-center leading-tight w-14 truncate ${
                          isActive ? 'text-indigo-600 font-bold' : isDone ? 'text-emerald-600' : 'text-slate-400'
                        }`} title={tahap.tahapan}>
                          {tahap.tahapan.length > 12 ? tahap.tahapan.substring(0, 11) + '…' : tahap.tahapan}
                        </p>
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-0.5 mx-1 mt-[19px] rounded-full transition-all duration-300 ${
                          isDone && nextDone ? 'bg-emerald-400' : isDone ? 'bg-emerald-200' : 'bg-slate-200'
                        }`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel — clean, consistent indigo/emerald/slate */}
            {selectedTahap && (() => {
              const tahap = TAHAPAN_AUDIT.find(t => t.no === selectedTahap);
              const isDone = !!uploadedFiles[selectedTahap];
              const file = uploadedFiles[selectedTahap];
              const canUploadThis = canUploadInProcess(selectedTahap);
              if (!tahap) return null;
              return (
                <div className="border-t border-slate-100 animate-fadeInUp">
                  <div className="p-6 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Tahap Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                            {isDone ? <IconCheck className="w-5 h-5" /> : selectedTahap}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800">Tahap {selectedTahap}: {tahap.tahapan}</h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{tahap.detail}</p>
                          </div>
                        </div>
                        <div className="space-y-2.5 ml-[56px]">
                          <div className="flex items-center gap-2">
                            <IconFileAlt className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">Dokumen: <span className="font-semibold text-slate-700">{tahap.dokumen}</span></span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isDone ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <IconCheckCircle className="w-3 h-3" /> Selesai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                <IconClock className="w-3 h-3" /> Pending
                              </span>
                            )}
                            {!canUploadThis && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                                <IconLock className="w-3 h-3" />
                                Dikelola {getTahapOwnerLabel(selectedTahap)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Navigation */}
                        <div className="flex items-center gap-2 mt-5 ml-[56px]">
                          <button
                            onClick={() => setSelectedTahap(prev => Math.max(1, prev - 1))}
                            disabled={selectedTahap === 1}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                          >
                            <IconArrowLeft className="w-3 h-3" /> Sebelumnya
                          </button>
                          <button
                            onClick={() => setSelectedTahap(prev => Math.min(10, prev + 1))}
                            disabled={selectedTahap === 10}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                          >
                            Selanjutnya <IconArrowLeft className="w-3 h-3 rotate-180" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Upload / File / Locked */}
                      <div className="w-full md:w-80 flex-shrink-0">
                        {selectedTahap === 10 ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <IconLock className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Finalisasi Otomatis</p>
                            <p className="text-[11px] text-slate-400">Tahap 10 terisi otomatis saat status konsultasi diarsipkan.</p>
                          </div>
                        ) : selectedTahap === 9 && !isDone ? (
                          <div className="rounded-xl border border-indigo-200 bg-white p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <IconFileAlt className="w-5 h-5 text-indigo-500" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Tahap ini dikelola di menu Laporan</p>
                            <p className="text-[11px] text-slate-400 mb-4">Upload Draft LHK dilakukan melalui menu khusus Laporan.</p>
                            <button
                              type="button"
                              onClick={() => navigate('/laporan')}
                              className="px-3.5 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all"
                            >
                              Buka Menu Laporan
                            </button>
                          </div>
                        ) : isDone ? (
                          <div className="rounded-xl p-4 bg-white border border-emerald-200">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-11 h-11 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                <IconFileAlt className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{file.size}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewFile(selectedTahap)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white transition-all flex items-center justify-center gap-1.5"
                              >
                                <IconEye className="w-3.5 h-3.5" /> Lihat File
                              </button>
                              {canUploadThis && (
                                <button onClick={() => handleFileDelete(selectedTahap)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-1.5">
                                  <IconTrash className="w-3.5 h-3.5" /> Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        ) : canUploadThis ? (
                          <div
                            onClick={() => triggerFileInput(selectedTahap)}
                            className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                          >
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                              <IconCloudUpload className="w-6 h-6 text-indigo-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 mb-1">Upload Dokumen</p>
                            <p className="text-[11px] text-slate-400">PDF, DOC, DOCX, atau gambar (maks. 20MB)</p>
                            <p className="text-[10px] text-indigo-500 font-semibold mt-2">Klik untuk memilih file</p>
                            <input type="file" ref={el => fileInputRefs.current[selectedTahap] = el} onChange={(e) => handleFileUpload(selectedTahap, e)} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*" />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <IconLock className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Tidak Dapat Upload</p>
                            <p className="text-[11px] text-slate-400">Tahap ini dikelola oleh {getTahapOwnerLabel(selectedTahap)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Alert Dokumen Belum Lengkap */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <IconInfoCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-amber-700">Dokumen Belum Lengkap</h4>
                <p className="text-amber-600 text-sm">Upload semua dokumen yang diperlukan untuk melanjutkan</p>
              </div>
            </div>
          )}

          {/* Catatan Auditor */}
          {userRole !== 'auditee' && !isKSPI && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Catatan Auditor:</label>
            <textarea 
              value={catatanAuditor[selectedKonsultasi.id] || ''}
              onChange={(e) => setCatatanAuditor(prev => ({ ...prev, [selectedKonsultasi.id]: e.target.value }))}
              placeholder="Masukkan catatan..."
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          )}

          {/* Catatan Auditor - Read Only for Auditee & KSPI */}
          {(userRole === 'auditee' || isKSPI) && catatanAuditor[selectedKonsultasi.id] && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Catatan dari Auditor:</label>
            <div className="w-full p-4 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 min-h-[80px]">
              {catatanAuditor[selectedKonsultasi.id]}
            </div>
          </div>
          )}

          {/* Tombol Simpan - hanya untuk auditor/manajemen (bukan KSPI) */}
          {userRole !== 'auditee' && !isKSPI && (
          <button 
            onClick={async () => {
              try {
                await auditAPI.updateCatatan(selectedKonsultasi.id, catatanAuditor[selectedKonsultasi.id] || '-');
                await fetchProcesses();
                alert('Progres tahapan berhasil disimpan!');
              } catch (error) {
                console.error('Simpan catatan gagal:', error);
                alert(error?.response?.data?.message || 'Gagal menyimpan progres tahapan.');
              }
            }}
            className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <IconSave className="w-5 h-5" />
            Simpan Progres Tahapan
          </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProsesAudit;
