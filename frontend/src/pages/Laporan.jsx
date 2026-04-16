import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI, userAPI } from '../services/api';
import { showConfirm } from '../services/notify';
import Skeleton, { SkeletonText, SkeletonTableRows } from '../components/Skeleton';
import {
  IconFileAlt, IconUpload, IconDownload, IconCheckCircle,
  IconExclamationCircle, IconSearch, IconChevronDown, IconClock,
  IconEye, IconTrash, IconXCircle, IconArchive, IconSpinner, IconArrowRight
} from '../components/Icons';

/* ═══════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════ */
const ROWS_PER_PAGE = 7;

const STATUS_CONFIG = {
  draft:    { label: 'Draft',           color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-400',    icon: IconSpinner },
  review:   { label: 'Review',          color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-400',   icon: IconClock },
  arsip:    { label: 'Diarsipkan',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400', icon: IconArchive },
};

/* ═══════════════════════════════════════
   PAGINATION ICONS
   ═══════════════════════════════════════ */
const ChevronLeft = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);
const ChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
);

/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */
const Laporan = () => {
  const DRAFT_LHK_TAHAP = 10;
  const MAX_UPLOAD_MB = 50;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic', 'heif'];
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];
  const { user } = useAuth();
  const currentUser = user;
  const userBiro  = currentUser?.biro;
  const isAuditor = currentUser?.role === 'auditor';
  const isKSPI    = currentUser?.role === 'manajemen' && currentUser?.sub_role === 'kspi';
  const [konsultasiProses, setKonsultasiProses] = useState([]);
  const [biroList, setBiroList] = useState([]);

  /* ── State ── */
  const [laporan, setLaporan]           = useState({});
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterBiro, setFilterBiro]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | belum | draft | review | arsip
  const [currentPage, setCurrentPage]   = useState(1);
  const [detailId, setDetailId]         = useState(null);    // slide-over
  const [uploadModal, setUploadModal]   = useState(null);    // upload target id
  const [uploadForm, setUploadForm]     = useState({ nomorLHK: '', perihal: '', catatan: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [previewFile, setPreviewFile]   = useState(null);   // { fileName, fileSize, ... }
  const [previewUrl, setPreviewUrl]     = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [loadingLaporan, setLoadingLaporan] = useState(true);
  const [flashMessage, setFlashMessage] = useState('');
  const uploadFileRef = useRef(null);

  const inferMimeType = (fileName = '') => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    return 'application/octet-stream';
  };

  const canInlinePreview = (fileName = '') => {
    const mime = inferMimeType(fileName);
    return mime === 'application/pdf' || mime.startsWith('image/');
  };

  const validateLhkFile = (file) => {
    if (!file) return { ok: false, message: 'File tidak ditemukan.' };

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isAllowedMime = file.type?.startsWith('image/') || ALLOWED_MIME_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      return { ok: false, message: 'Format file harus PDF, Word, Excel, PowerPoint, TXT, CSV, atau gambar.' };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: `Ukuran file maksimal ${MAX_UPLOAD_MB} MB.` };
    }

    return { ok: true, message: '' };
  };

  const fetchData = useCallback(async () => {
    try {
      const [auditRes, auditorsRes] = await Promise.all([
        auditAPI.getAll(),
        userAPI.getAuditors(),
      ]);

      const processes = auditRes.data?.audit_processes || [];
      const mappedProses = processes.map((p) => ({
        id: p.id,
        namaAuditee: p.auditee?.name || '-',
        unitKerja: p.auditee?.department || '-',
        kategori: p.biro || p.auditor?.biro || '-',
      }));

      const mappedLaporan = {};
      processes.forEach((p) => {
        const draftDoc = p.documents?.find((doc) => Number(doc.tahap_no) === DRAFT_LHK_TAHAP);
        const fallbackDoc = p.documents?.[p.documents.length - 1];
        const targetDoc = draftDoc || fallbackDoc;
        if (!targetDoc) return;

        const lhkStage = p.lhk_stage === 'review' ? 'review' : 'draft';
        const mappedStatus = p.status === 'completed' ? 'arsip' : lhkStage;

        mappedLaporan[p.id] = {
          auditProcessId: p.id,
          tahapNo: Number(targetDoc.tahap_no),
          fileName: targetDoc.file_name || p.dokumen_path?.split('/').pop() || 'draft-lhk.pdf',
          fileSize: targetDoc.file_size ? `${(targetDoc.file_size / 1024 / 1024).toFixed(1)} MB` : '-',
          uploadedAt: targetDoc.created_at ? new Date(targetDoc.created_at).toLocaleString('id-ID') : (p.updated_at ? new Date(p.updated_at).toLocaleString('id-ID') : '-'),
          nomorLHK: '',
          perihal: `Audit ${p.tahun_audit || ''}`.trim(),
          catatan: p.catatan_auditor || '',
          reviewNote: p.lhk_review_note || '',
          reviewApproved: p.lhk_review_approved,
          status: mappedStatus,
        };
      });

      const mappedBiro = (auditorsRes.data?.auditors || []).map((a, idx) => ({
        id: a.id || idx + 1,
        name: a.biro,
        shortName: a.biro,
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-purple-600',
      }));

      setKonsultasiProses(mappedProses);
      setLaporan(mappedLaporan);
      setBiroList(mappedBiro);
    } catch (error) {
      console.error('Failed to fetch laporan data:', error);
    } finally {
      setLoadingLaporan(false);
    }
  }, [DRAFT_LHK_TAHAP]);

  useEffect(() => {
    fetchData();

    const poller = setInterval(fetchData, 4000);
    return () => clearInterval(poller);
  }, [fetchData]);

  /* ── Filtered + Paginated ── */
  const filteredData = useMemo(() => {
    let data = [...konsultasiProses];
    if (isAuditor && userBiro) data = data.filter(k => k.kategori === userBiro);
    if (filterBiro !== 'all')   data = data.filter(k => k.kategori === filterBiro);
    if (filterStatus === 'belum')  data = data.filter(k => !laporan[k.id]);
    if (filterStatus === 'draft')  data = data.filter(k => laporan[k.id]?.status === 'draft');
    if (filterStatus === 'review') data = data.filter(k => laporan[k.id]?.status === 'review');
    if (filterStatus === 'arsip')  data = data.filter(k => laporan[k.id]?.status === 'arsip');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(k =>
        k.namaAuditee.toLowerCase().includes(q) ||
        k.unitKerja.toLowerCase().includes(q) ||
        (laporan[k.id]?.nomorLHK || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [searchQuery, filterBiro, filterStatus, laporan, isAuditor, userBiro]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const pagedData  = filteredData.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const setSearch  = (v) => { setSearchQuery(v);  setCurrentPage(1); };
  const setBiro    = (v) => { setFilterBiro(v);   setCurrentPage(1); };
  const setStatus  = (v) => { setFilterStatus(v === filterStatus ? 'all' : v); setCurrentPage(1); };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const relevant = isAuditor && userBiro ? konsultasiProses.filter(k => k.kategori === userBiro) : konsultasiProses;
    const uploaded = relevant.filter(k => laporan[k.id]);
    const inDraft    = relevant.filter(k => laporan[k.id]?.status === 'draft');
    const inReview   = relevant.filter(k => laporan[k.id]?.status === 'review');
    const archived   = relevant.filter(k => laporan[k.id]?.status === 'arsip');
    return { total: relevant.length, uploaded: uploaded.length, belum: relevant.length - uploaded.length, inDraft: inDraft.length, inReview: inReview.length, archived: archived.length };
  }, [laporan, isAuditor, userBiro]);

  /* ── Detail ── */
  const detailKonsultasi = detailId ? konsultasiProses.find(k => k.id === detailId) : null;
  const detailLaporan    = detailId ? laporan[detailId] : null;

  /* ── Helpers ── */
  const getBiroInfo = (kategori) => biroList.find(b => b.name === kategori);

  const openUploadModal = (id) => {
    const existing = laporan[id];
    setUploadModal(id);
    setUploadForm({
      nomorLHK: existing?.nomorLHK || '',
      perihal:  existing?.perihal  || '',
      catatan:  existing?.catatan  || '',
    });
    setSelectedFile(null);
  };

  const isUploadDirty = !!selectedFile || !!uploadForm.nomorLHK.trim() || !!uploadForm.perihal.trim() || !!uploadForm.catatan.trim();

  const attemptCloseUploadModal = async () => {
    if (isUploadDirty) {
      const confirmed = await showConfirm('Perubahan belum disimpan. Yakin ingin menutup form upload?', {
        title: 'Konfirmasi Tutup Form',
        confirmText: 'Tutup',
        cancelText: 'Lanjut Edit',
      });
      if (!confirmed) return;
    }
    setUploadModal(null);
    setSelectedFile(null);
  };

  const handleDelete = async (id) => {
    const existing = laporan[id];
    if (!existing?.tahapNo) {
      alert('Data dokumen tidak valid.');
      return;
    }

    if (existing.status !== 'draft') {
      alert('Dokumen hanya bisa dihapus saat status Draft.');
      return;
    }

    const confirmed = await showConfirm('Yakin ingin menghapus draft LHK ini?', {
      title: 'Hapus Draft LHK',
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      await auditAPI.deleteDokumen(id, existing.tahapNo);
      await fetchData();
      if (detailId === id) setDetailId(null);
    } catch (error) {
      console.error('Hapus draft gagal:', error);
      alert(error?.response?.data?.message || 'Gagal menghapus draft LHK.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const validation = validateLhkFile(file);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }
    setSelectedFile(file); e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    const validation = validateLhkFile(file);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile || !uploadModal) return;
    if (laporan[uploadModal] && laporan[uploadModal]?.status !== 'draft') {
      alert('Dokumen hanya bisa diganti saat status Draft.');
      return;
    }
    if (!uploadForm.nomorLHK.trim()) { alert('Nomor LHK wajib diisi.'); return; }
    if (!uploadForm.perihal.trim())  { alert('Perihal wajib diisi.'); return; }
    try {
      await auditAPI.uploadDokumen(uploadModal, selectedFile, DRAFT_LHK_TAHAP);
      await auditAPI.updateLhkStage(uploadModal, 'draft');
      if (uploadForm.catatan.trim()) {
        await auditAPI.updateCatatan(uploadModal, uploadForm.catatan.trim());
      }
      await auditAPI.updateStatus(uploadModal, 'in_progress');
      await fetchData();
      setUploadModal(null); setSelectedFile(null);
      setFlashMessage('Draft LHK berhasil diunggah.');
    } catch (error) {
      console.error('Upload draft gagal:', error);
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 413) {
        alert('Upload gagal: ukuran file melebihi batas server. Saat ini server Anda masih membatasi upload maksimal 2MB.');
        return;
      }
      alert(serverMessage || 'Gagal upload draft LHK. Cek ukuran file dan izin akses.');
    }
  };

  const handleMoveToReview = async (id) => {
    const existing = laporan[id];
    if (!existing) return;
    if (existing.status !== 'draft') {
      alert('Hanya draft yang dapat dipindahkan ke tahap Review.');
      return;
    }

    try {
      await auditAPI.updateLhkStage(id, 'review');
      await fetchData();
      setFlashMessage('Draft LHK berhasil dipindahkan ke tahap Review.');
    } catch (error) {
      console.error('Pindah ke review gagal:', error);
      alert(error?.response?.data?.message || 'Gagal memindahkan draft ke tahap Review.');
    }
  };

  const handleBulkArchive = async () => {
    const targetIds = filteredData
      .filter((k) => laporan[k.id] && laporan[k.id].status === 'review' && laporan[k.id].reviewApproved === true)
      .map((k) => k.id);

    if (targetIds.length === 0) {
      alert('Tidak ada laporan review (ON) yang dapat diarsipkan pada filter saat ini.');
      return;
    }

    const confirmed = await showConfirm(`Arsipkan ${targetIds.length} draft sekaligus?`, {
      title: 'Arsipkan Massal',
      confirmText: 'Arsipkan',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      await Promise.all(targetIds.map((id) => auditAPI.updateStatus(id, 'completed')));
      await fetchData();
      setFlashMessage(`${targetIds.length} laporan review berhasil diarsipkan.`);
    } catch (error) {
      console.error('Bulk archive gagal:', error);
      alert('Gagal mengarsipkan sebagian laporan review. Coba lagi.');
    }
  };

  useEffect(() => {
    if (!flashMessage) return;
    const timer = setTimeout(() => setFlashMessage(''), 2800);
    return () => clearTimeout(timer);
  }, [flashMessage]);

  useEffect(() => {
    if (!uploadModal) return;

    const onBeforeUnload = (event) => {
      if (!isUploadDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [uploadModal, isUploadDirty]);

  /* ── Status Advancement (Auditor) ── */
  const handleAdvanceStatus = async (id) => {
    const current = laporan[id];
    if (!current || current.status !== 'review') {
      return;
    }

    if (current.reviewApproved !== true) {
      alert('Review Tahap 11 masih OFF. Aktifkan ON di Proses Konsultasi sebelum arsip.');
      return;
    }

    try {
      await auditAPI.updateStatus(id, 'completed');
      await fetchData();
    } catch (error) {
      console.error('Update status laporan gagal:', error);
      alert('Gagal mengarsipkan laporan.');
    }
  };

  const downloadLaporanFile = async (fileInfo, mode = 'download') => {
    if (!fileInfo?.auditProcessId || !fileInfo?.tahapNo) return;

    try {
      const response = await auditAPI.downloadDokumen(fileInfo.auditProcessId, fileInfo.tahapNo);
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const fileBlob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(fileBlob);

      if (mode === 'view') {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          const link = document.createElement('a');
          link.href = url;
          link.download = fileInfo.fileName || 'draft-lhk.pdf';
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileInfo.fileName || 'draft-lhk.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error('Unduh dokumen gagal:', error);
      alert(error?.response?.data?.message || 'Gagal mengunduh dokumen.');
    }
  };

  useEffect(() => {
    let objectUrl = '';

    const loadPreview = async () => {
      if (!previewFile?.auditProcessId || !previewFile?.tahapNo) {
        setPreviewUrl('');
        setPreviewError('Dokumen tidak valid untuk dipreview.');
        return;
      }

      setPreviewLoading(true);
      setPreviewError('');
      setPreviewUrl('');

      try {
        const response = await auditAPI.downloadDokumen(previewFile.auditProcessId, previewFile.tahapNo);
        const headerType = response.headers['content-type'] || '';
        const guessedType = inferMimeType(previewFile.fileName);
        const contentType = !headerType || headerType === 'application/octet-stream' ? guessedType : headerType;
        const fileBlob = new Blob([response.data], { type: contentType });
        objectUrl = window.URL.createObjectURL(fileBlob);
        setPreviewUrl(objectUrl);
      } catch (error) {
        console.error('Preview dokumen gagal:', error);
        setPreviewError(error?.response?.data?.message || 'Preview dokumen gagal dimuat.');
      } finally {
        setPreviewLoading(false);
      }
    };

    if (previewFile) {
      loadPreview();
    } else {
      setPreviewUrl('');
      setPreviewError('');
      setPreviewLoading(false);
    }

    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [previewFile]);

  /* ── Status badge renderer ── */
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${cfg.bg} ${cfg.color} ${cfg.border} border text-[10px] font-bold rounded-lg`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="space-y-5 animate-fadeInUp">
      <input ref={uploadFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*" onChange={handleFileSelect} className="hidden" />

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center"><IconFileAlt className="w-3.5 h-3.5 text-indigo-300" /></div>
              <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Laporan Hasil Konsultasi</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{isKSPI ? 'Monitoring Draft & Review LHK' : 'Kelola Draft & Review LHK'}</h1>
            <p className="text-indigo-200/50 text-[11px] mt-0.5 max-w-md">
              {isKSPI ? 'Lihat dan download dokumen Draft/Review LHK dari seluruh biro auditor.' : 'Upload Draft (Tahap 10), lanjut Review (Tahap 11), lalu arsipkan.'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {[
              { label: 'Total',    value: stats.total,    color: 'text-white' },
              { label: 'Draft',    value: stats.inDraft,   color: 'text-blue-300' },
              { label: 'Review',   value: stats.inReview,  color: 'text-amber-300' },
              { label: 'Arsip',    value: stats.archived,  color: 'text-emerald-300' },
            ].map((s, i) => (
              <div key={i} className="text-center px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[8px] text-indigo-200 uppercase tracking-widest font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Flow Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'all',    label: 'Semua',         value: stats.total,    icon: <IconFileAlt className="w-4 h-4" />,   bg: 'bg-indigo-50',  ic: 'text-indigo-500',  ring: 'ring-indigo-100 border-indigo-300' },
          { key: 'belum',  label: 'Belum Upload',  value: stats.belum,    icon: <IconClock className="w-4 h-4" />,     bg: 'bg-slate-50',   ic: 'text-slate-500',   ring: 'ring-slate-100 border-slate-300' },
          { key: 'draft',  label: 'Draft',         value: stats.inDraft,  icon: <IconSpinner className="w-4 h-4" />,   bg: 'bg-blue-50',    ic: 'text-blue-500',    ring: 'ring-blue-100 border-blue-300' },
          { key: 'review', label: 'Review',        value: stats.inReview, icon: <IconClock className="w-4 h-4" />,     bg: 'bg-amber-50',   ic: 'text-amber-500',   ring: 'ring-amber-100 border-amber-300' },
          { key: 'arsip',  label: 'Diarsipkan',    value: stats.archived, icon: <IconArchive className="w-4 h-4" />,   bg: 'bg-emerald-50', ic: 'text-emerald-500', ring: 'ring-emerald-100 border-emerald-300' },
        ].map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${filterStatus === f.key ? `bg-white shadow-sm ring-2 ${f.ring}` : 'border-slate-200/60 bg-white hover:border-slate-300'}`}>
            <div className={`w-8 h-8 ${f.bg} rounded-lg flex items-center justify-center ${f.ic} flex-shrink-0`}>{f.icon}</div>
            <div className="text-left min-w-0">
              <p className="text-base font-bold text-slate-800 leading-tight">{f.value}</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider truncate">{f.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TABLE
         ══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

        {flashMessage && (
          <div className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold px-4 py-3">
            {flashMessage}
          </div>
        )}

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari nama auditee atau nomor LHK..." value={searchQuery} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors" />
          </div>
          {isKSPI && (
            <div className="relative">
              <select value={filterBiro} onChange={(e) => setBiro(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer focus:outline-none focus:border-indigo-400">
                <option value="all">Semua Biro</option>
                {biroList.map(b => <option key={b.id} value={b.name}>{b.shortName}</option>)}
              </select>
              <IconChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          {isAuditor && (
            <button
              type="button"
              onClick={handleBulkArchive}
              className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              Arsipkan Semua Review (ON)
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-medium ml-auto">{filteredData.length} konsultasi</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="pl-5 pr-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">No</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auditee</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biro Auditor</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen LHK</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingLaporan ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <SkeletonTableRows rows={6} columns={6} />
                  </td>
                </tr>
              ) : pagedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <IconFileAlt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Tidak ada data</p>
                    <p className="text-xs text-slate-300 mt-0.5">Coba ubah filter atau kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                pagedData.map((k, idx) => {
                  const ld   = laporan[k.id];
                  const biro = getBiroInfo(k.kategori);
                  const rowNum = (safePage - 1) * ROWS_PER_PAGE + idx + 1;

                  return (
                    <tr key={k.id} className="group hover:bg-indigo-50/40 transition-colors cursor-pointer" onClick={() => setDetailId(k.id)}>
                      {/* No */}
                      <td className="pl-5 pr-2 py-3">
                        <span className="text-xs font-semibold text-slate-400">{rowNum}</span>
                      </td>

                      {/* Auditee */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 bg-gradient-to-br ${biro?.gradientFrom || 'from-indigo-500'} ${biro?.gradientTo || 'to-purple-600'} rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
                            {k.namaAuditee.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{k.namaAuditee}</p>
                            <p className="text-[10px] text-slate-400">{k.unitKerja}</p>
                          </div>
                        </div>
                      </td>

                      {/* Biro */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-slate-600">{biro?.shortName || k.kategori}</span>
                      </td>

                      {/* Dokumen LHK */}
                      <td className="px-3 py-3">
                        {ld ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconFileAlt className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{ld.fileName}</p>
                              <p className="text-[9px] text-slate-400">{ld.fileSize} · {ld.uploadedAt}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded-md border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Belum upload
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        {ld ? <StatusBadge status={ld.status} /> : <span className="text-[10px] text-slate-300">—</span>}
                      </td>

                      {/* Aksi */}
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {ld && (
                            <button onClick={() => setDetailId(k.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Lihat Detail">
                              <IconEye className="w-4 h-4" />
                            </button>
                          )}
                          {ld && (
                            <button onClick={() => downloadLaporanFile(ld, 'download')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download">
                              <IconDownload className="w-4 h-4" />
                            </button>
                          )}
                          {isAuditor && !ld && (
                            <button onClick={() => openUploadModal(k.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-sm" title="Upload Draft LHK">
                              <IconUpload className="w-3 h-3" /> Upload
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Fill empty rows */}
              {pagedData.length > 0 && pagedData.length < ROWS_PER_PAGE && Array.from({ length: ROWS_PER_PAGE - pagedData.length }).map((_, i) => (
                <tr key={`empty-${i}`}><td colSpan={6} className="px-5 py-3">&nbsp;</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-[11px] text-slate-400">
            Menampilkan <span className="font-bold text-slate-600">{filteredData.length > 0 ? (safePage - 1) * ROWS_PER_PAGE + 1 : 0}</span>–<span className="font-bold text-slate-600">{Math.min(safePage * ROWS_PER_PAGE, filteredData.length)}</span> dari <span className="font-bold text-slate-600">{filteredData.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === safePage ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
            <button disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KSPI banner */}
        {isKSPI && (
          <div className="px-5 py-2.5 bg-indigo-50 border-t border-indigo-200/60 flex items-center gap-2">
            <IconExclamationCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <p className="text-[10px] text-indigo-500 font-medium">Mode View-Only — Upload Draft, kelola Review, dan arsip hanya dapat dilakukan oleh auditor biro terkait.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
         SLIDE-OVER DETAIL
         ═══════════════════════════════════════ */}
      {detailId && detailKonsultasi && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetailId(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Detail Konsultasi</h3>
                <button onClick={() => setDetailId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <IconXCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {(() => { const biro = getBiroInfo(detailKonsultasi.kategori); return (
                  <div className={`w-12 h-12 bg-gradient-to-br ${biro?.gradientFrom || 'from-indigo-500'} ${biro?.gradientTo || 'to-purple-600'} rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg`}>
                    {detailKonsultasi.namaAuditee.charAt(0)}
                  </div>
                ); })()}
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{detailKonsultasi.namaAuditee}</h2>
                  <p className="text-xs text-slate-400">{detailKonsultasi.unitKerja} · <span className="text-indigo-500 font-medium">{getBiroInfo(detailKonsultasi.kategori)?.shortName}</span></p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLaporan ? (
                <>
                  {/* Status Banner */}
                  {(() => {
                    const cfg = STATUS_CONFIG[detailLaporan.status];
                    if (!cfg) return null;
                    const StatusIcon = cfg.icon;
                    return (
                      <div className={`flex items-center gap-3 px-4 py-3 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                        <div>
                          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {detailLaporan.status === 'draft' && 'Masih berstatus draft. Dokumen masih dapat diganti atau dihapus.'}
                            {detailLaporan.status === 'review' && 'Sedang masuk tahap review. Keputusan ON/OFF Tahap 11 dikelola di Proses Konsultasi.'}
                            {detailLaporan.status === 'arsip' && 'Dokumen telah diarsipkan dan tidak dapat dihapus atau diganti.'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status Flow Indicator */}
                  <div className="flex items-center gap-1 px-2">
                    {['draft', 'review', 'arsip'].map((step, i) => {
                      const stepOrder = { draft: 0, review: 1, arsip: 2 };
                      const currentOrder = stepOrder[detailLaporan.status] ?? 0;
                      const isCompleted = stepOrder[step] <= currentOrder;
                      const isCurrent = step === detailLaporan.status;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              isCompleted
                                ? isCurrent
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                  : 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              {isCompleted && !isCurrent ? <IconCheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <p className={`text-[9px] font-semibold mt-1.5 ${isCompleted ? 'text-slate-700' : 'text-slate-300'}`}>
                              {step === 'draft' ? 'Draft' : step === 'review' ? 'Review' : 'Arsip'}
                            </p>
                          </div>
                          {i < 2 && (
                            <div className={`h-0.5 flex-1 rounded-full mx-1 mb-5 ${stepOrder[step] < currentOrder ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* File card */}
                  <div
                    onClick={() => setPreviewFile(detailLaporan)}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group/file"
                  >
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <IconFileAlt className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{detailLaporan.fileName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{detailLaporan.fileSize}</p>
                    </div>
                    <div className="flex-shrink-0 p-1.5 text-slate-300 group-hover/file:text-indigo-500 transition-colors">
                      <IconEye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-4">
                    {[
                      { label: 'Nomor LHK',     value: detailLaporan.nomorLHK || '—' },
                      { label: 'Tanggal Upload', value: detailLaporan.uploadedAt },
                      { label: 'Biro Auditor',   value: getBiroInfo(detailKonsultasi.kategori)?.shortName || '—' },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {detailLaporan.perihal && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Perihal</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{detailLaporan.perihal}</p>
                    </div>
                  )}

                  {detailLaporan.catatan && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Catatan</p>
                      <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">{detailLaporan.catatan}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-10">
                  <div className="w-20 h-20 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center">
                    {isAuditor ? <IconUpload className="w-10 h-10 text-indigo-300" /> : <IconClock className="w-10 h-10 text-slate-200" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 mb-1">Belum Ada Draft LHK</h3>
                  <p className="text-xs text-slate-400 mb-5 text-center max-w-xs">
                    {isAuditor ? 'Upload draft LHK untuk konsultasi ini.' : 'Menunggu auditor biro terkait mengupload draft LHK.'}
                  </p>
                  {isAuditor && (
                    <button onClick={() => { setDetailId(null); openUploadModal(detailId); }} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors shadow-sm">
                      <IconUpload className="w-4 h-4" /> Upload Draft LHK
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            {detailLaporan && (
              <div className="px-6 py-4 border-t border-slate-100 bg-white space-y-2.5">
                {/* Row 1 — View & Download */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewFile(detailLaporan)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors shadow-sm">
                    <IconEye className="w-4 h-4" /> Lihat File
                  </button>
                  <button onClick={() => downloadLaporanFile(detailLaporan, 'download')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                    <IconDownload className="w-4 h-4" /> Download
                  </button>
                </div>
                {/* Row 2 — Auditor actions (Ganti · Hapus · Arsipkan) */}
                {isAuditor && detailLaporan.status === 'draft' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setDetailId(null); openUploadModal(detailId); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 text-amber-600 text-sm font-semibold rounded-xl hover:bg-amber-100 border border-amber-200/60 transition-colors">
                      <IconUpload className="w-4 h-4" /> Ganti
                    </button>
                    <button onClick={() => handleDelete(detailId)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-200/60 transition-colors">
                      <IconTrash className="w-4 h-4" /> Hapus
                    </button>
                    <button onClick={() => handleMoveToReview(detailId)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-100 border border-indigo-200/60 transition-colors">
                      <IconArrowRight className="w-4 h-4" /> Ke Review
                    </button>
                  </div>
                )}
                {isAuditor && detailLaporan.status === 'review' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdvanceStatus(detailId)}
                      disabled={detailLaporan.reviewApproved !== true}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <IconArchive className="w-4 h-4" /> Arsipkan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         UPLOAD MODAL
         ═══════════════════════════════════════ */}
      {uploadModal && isAuditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={attemptCloseUploadModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center"><IconUpload className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-lg font-bold">{laporan[uploadModal] ? 'Ganti Draft LHK' : 'Upload Draft LHK'}</h3>
                  <p className="text-indigo-200 text-xs">{konsultasiProses.find(x => x.id === uploadModal)?.namaAuditee} — {konsultasiProses.find(x => x.id === uploadModal)?.unitKerja}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Drag & Drop */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => uploadFileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-indigo-400 bg-indigo-50' : selectedFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0"><IconFileAlt className="w-6 h-6 text-red-400" /></div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><IconXCircle className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 mx-auto mb-3 bg-indigo-50 rounded-full flex items-center justify-center">
                      <IconUpload className={`w-7 h-7 ${dragOver ? 'text-indigo-600' : 'text-indigo-400'} transition-colors`} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{dragOver ? 'Lepaskan file di sini' : 'Drag & drop dokumen atau klik untuk pilih'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Format: PDF, Word, Excel, PowerPoint, TXT, CSV, gambar · Maksimal 50 MB</p>
                  </>
                )}
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nomor LHK <span className="text-red-400">*</span></label>
                  <input type="text" value={uploadForm.nomorLHK} onChange={(e) => setUploadForm(p => ({ ...p, nomorLHK: e.target.value.toUpperCase() }))} placeholder="contoh: LHK/001/SPI/III/2026"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Perihal <span className="text-red-400">*</span></label>
                  <input type="text" value={uploadForm.perihal} onChange={(e) => setUploadForm(p => ({ ...p, perihal: e.target.value }))} placeholder="contoh: Konsultasi Tata Kelola Aset"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan <span className="text-slate-400 font-normal">(opsional)</span></label>
                  <textarea value={uploadForm.catatan} onChange={(e) => setUploadForm(p => ({ ...p, catatan: e.target.value }))} placeholder="Catatan tambahan..." rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmitUpload} disabled={!selectedFile}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <IconUpload className="w-4 h-4" /> {laporan[uploadModal] ? 'Ganti File' : 'Upload'}
                </button>
                <button onClick={attemptCloseUploadModal}
                  className="px-5 py-3 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         PREVIEW FILE MODAL
         ═══════════════════════════════════════ */}
      {previewFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-fadeInUp" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconFileAlt className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{previewFile.fileName}</p>
                  <p className="text-[10px] text-slate-400">{previewFile.fileSize} · {previewFile.uploadedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => downloadLaporanFile(previewFile, 'download')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors">
                  <IconDownload className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <IconXCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Preview Body */}
            <div className="flex-1 overflow-auto bg-slate-100 p-6 flex items-center justify-center min-h-[60vh]">
              {previewLoading && (
                <div className="w-full max-w-xl space-y-3">
                  <SkeletonText className="w-40 mx-auto" />
                  <Skeleton className="h-[50vh] rounded-xl border border-slate-200" />
                </div>
              )}

              {!previewLoading && previewUrl && canInlinePreview(previewFile?.fileName) && (
                inferMimeType(previewFile?.fileName) === 'application/pdf' ? (
                  <iframe
                    title="Preview Dokumen LHK"
                    src={previewUrl}
                    className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewFile?.fileName || 'Preview Dokumen'}
                    className="max-w-full max-h-[70vh] rounded-xl border border-slate-200 bg-white object-contain"
                  />
                )
              )}

              {!previewLoading && (!previewUrl || !canInlinePreview(previewFile?.fileName)) && (
                <div className="text-center">
                  <div className="w-24 h-32 mx-auto mb-4 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <IconFileAlt className="w-12 h-12 text-red-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">Preview Dokumen</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {previewError || (!canInlinePreview(previewFile?.fileName)
                      ? 'Tipe file ini belum didukung untuk preview langsung. Gunakan tombol Download untuk membuka file.'
                      : 'Preview tidak tersedia. Gunakan tombol Download untuk mengunduh file.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default Laporan;
