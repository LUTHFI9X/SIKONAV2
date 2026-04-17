import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI, conversationAPI, messageAPI } from '../services/api';
import { subscribeToUserRealtime } from '../services/realtime';
import {
  IconChartPie, IconCheckCircle, IconSpinner, IconClock, IconXCircle,
  IconLayerGroup, IconChartBar, IconEnvelope, IconStickyNote, IconSearch,
  IconX, IconInbox, IconClipboardList, IconSend, IconEye, IconDownload, IconFileAlt
} from '../components/Icons';
import { SkeletonTableRows } from '../components/Skeleton';

const StatusAudit = () => {
  const { user } = useAuth();
  const currentUser = user;
  const userRole = currentUser?.role || 'auditee';
  const userBiro = currentUser?.biro || currentUser?.department || currentUser?.unit || '';

  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [pesanModal, setPesanModal] = useState(null);
  const [tindakLanjutModal, setTindakLanjutModal] = useState(null);
  const [subjectModal, setSubjectModal] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null); // { url, fileName, mimeType }
  const [pesanText, setPesanText] = useState('');
  const [tindakLanjutText, setTindakLanjutText] = useState('');

  // Pesan & Tindak Lanjut data per audit
  const [pesanData, setPesanData] = useState({});
  const [tindakLanjutData, setTindakLanjutData] = useState({});
  
  const [audits, setAudits] = useState([]);

  const mapStatus = (status) => {
    if (status === 'active') return 'proses';
    if (status === 'closed') return 'selesai';
    if (status === 'archived') return 'tindaklanjut';
    if (status === 'completed') return 'selesai';
    if (status === 'in_progress') return 'proses';
    if (status === 'cancelled') return 'tindaklanjut';
    return 'menunggu';
  };

  const inferMimeType = (fileName = '') => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'doc') return 'application/msword';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return 'application/octet-stream';
  };

  const canPreviewInline = (fileName = '') => {
    const mime = inferMimeType(fileName);
    return mime === 'application/pdf' || mime.startsWith('image/');
  };

  const apiErrorMessage = (error, fallback) => {
    return error?.response?.data?.message
      || error?.response?.data?.errors
      || fallback;
  };

  const fetchAudits = useCallback(async () => {
    try {
      const [auditRes, conversationRes] = await Promise.all([
        auditAPI.getAll(),
        conversationAPI.getAll(),
      ]);

      const auditProcesses = auditRes.data?.audit_processes || [];
      const mappedFromAuditProcess = auditProcesses.map((a) => {
        const issueMessage = a.conversation?.first_message || a.conversation?.latest_message || null;
        return ({
        id: a.id,
        source: 'audit',
        rawId: a.id,
        unitKerja: a.auditee?.department || a.auditee?.name || '-',
        subject: a.conversation?.subject || `Audit ${a.tahun_audit || ''}`.trim(),
        issueSummary: issueMessage?.content || '-',
        attachmentMessageId: issueMessage?.attachment_name ? issueMessage.id : null,
        attachmentName: issueMessage?.attachment_name || '',
        attachmentType: issueMessage?.attachment_type || '',
        auditor: a.auditor?.biro || a.biro || '-',
        date: (a.updated_at || a.created_at) ? new Date(a.updated_at || a.created_at).toLocaleDateString('id-ID') : '-',
        status: mapStatus(a.status),
        pesanCount: a.pesan_spi_count || 0,
        tindakLanjutCount: a.tindak_lanjut_count || 0,
        _rawStatus: a.status,
      });
      });

      const conversations = conversationRes.data?.conversations || [];
      const mappedFromConversations = conversations.map((c) => {
        const issueMessage = c.first_message || c.latest_message || null;
        return ({
        id: c.audit_process?.id || `conv-${c.id}`,
        source: c.audit_process?.id ? 'audit' : 'conversation',
        rawId: c.audit_process?.id || c.id,
        unitKerja: c.auditee?.department || c.auditee?.name || '-',
        subject: c.subject || 'Konsultasi Audit',
        issueSummary: issueMessage?.content || '-',
        attachmentMessageId: issueMessage?.attachment_name ? issueMessage.id : null,
        attachmentName: issueMessage?.attachment_name || '',
        attachmentType: issueMessage?.attachment_type || '',
        auditor: c.auditor?.biro || '-',
        date: (c.last_message_at || c.created_at)
          ? new Date(c.last_message_at || c.created_at).toLocaleDateString('id-ID')
          : '-',
        status: mapStatus(c.status),
        pesanCount: c.audit_process?.pesan_spi_count || 0,
        tindakLanjutCount: c.audit_process?.tindak_lanjut_count || 0,
        _rawStatus: c.status,
      });
      });

      const shouldUseConversationFallback = mappedFromAuditProcess.length === 0;
      setAudits(shouldUseConversationFallback ? mappedFromConversations : mappedFromAuditProcess);
    } catch (error) {
      console.error('Failed to fetch status konsultasi:', error);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchAudits();

    const poller = setInterval(fetchAudits, 4000);
    const onFocus = () => fetchAudits();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAudits]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToUserRealtime(currentUser.id, async () => {
      await fetchAudits();
    });

    return unsubscribe;
  }, [currentUser?.id, fetchAudits]);

  const statusColors = {
    selesai: 'status-pill--selesai',
    proses: 'status-pill--proses',
    menunggu: 'status-pill--menunggu',
    tindaklanjut: 'status-pill--tindaklanjut',
  };

  const statusSelectColors = {
    selesai: 'status-select--selesai',
    proses: 'status-select--proses',
    menunggu: 'status-select--menunggu',
    tindaklanjut: 'status-select--tindaklanjut',
  };

  const statusLabels = { selesai: 'Selesai', proses: 'Dalam Proses', menunggu: 'Menunggu', tindaklanjut: 'Tindak Lanjut' };

  const resolveAuditId = async (auditRow) => {
    if (!auditRow) return null;
    if (auditRow.source === 'audit') return auditRow.rawId;

    try {
      const response = await conversationAPI.getById(auditRow.rawId);
      const processId = response.data?.conversation?.audit_process?.id;
      return processId || null;
    } catch (error) {
      console.error('Gagal resolve consultation process dari conversation:', error);
      return null;
    }
  };

  const handleStatusChange = async (auditId, newStatus) => {
    // Hanya auditor dari biro terkait yang bisa mengubah status
    const audit = audits.find(a => a.id === auditId);
    if (userRole !== 'auditor' && userRole !== 'manajemen') return;
    if (userRole === 'auditor' && audit && !audit.auditor.includes(userBiro?.split(' ')[0] || '---')) return;
    
    try {
      if (audit?.source === 'conversation') {
        const conversationStatus = newStatus === 'selesai'
          ? 'closed'
          : newStatus === 'tindaklanjut'
            ? 'archived'
            : 'active';
        await conversationAPI.updateStatus(audit.rawId, conversationStatus);
      } else {
        const backendStatus = newStatus === 'selesai'
          ? 'completed'
          : newStatus === 'proses'
            ? 'in_progress'
            : newStatus === 'tindaklanjut'
              ? 'cancelled'
              : 'pending';
        await auditAPI.updateStatus(auditId, backendStatus);
      }
      await fetchAudits();
    } catch (error) {
      console.error('Failed to update consultation status:', error);
      alert('Gagal memperbarui status konsultasi.');
    }
  };

  // Check if the current user can change consultation status
  const isKSPI = userRole === 'manajemen' && currentUser?.sub_role === 'kspi';
  const canChangeStatus = (audit) => {
    void audit;
    if (isKSPI) return false; // KSPI hanya view
    if (userRole === 'manajemen') return true;
    if (userRole === 'auditor') return true;
    return false; // auditee tidak bisa ubah status
  };

  const closeAttachmentPreview = () => {
    if (attachmentPreview?.url) {
      window.URL.revokeObjectURL(attachmentPreview.url);
    }
    setAttachmentPreview(null);
  };

  const handleAttachmentAction = async (audit, mode = 'download') => {
    if (!audit?.attachmentMessageId) return;

    try {
      const response = await messageAPI.downloadAttachment(audit.attachmentMessageId);
      const headerType = response.headers['content-type'] || '';
      const guessed = inferMimeType(audit.attachmentName);
      const contentType = !headerType || headerType === 'application/octet-stream' ? guessed : headerType;
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      if (mode === 'view') {
        if (!canPreviewInline(audit.attachmentName)) {
          window.URL.revokeObjectURL(url);
          alert('Tipe file ini tidak didukung untuk preview. Silakan gunakan tombol Download.');
          return;
        }

        if (attachmentPreview?.url) {
          window.URL.revokeObjectURL(attachmentPreview.url);
        }

        setAttachmentPreview({
          url,
          fileName: audit.attachmentName || 'lampiran',
          mimeType: contentType,
        });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = audit.attachmentName || 'lampiran';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
      }
    } catch (error) {
      console.error('Gagal mengunduh lampiran subject:', error);
      alert(error?.response?.data?.message || 'Lampiran tidak dapat dibuka/diunduh.');
    }
  };

  // Handle Pesan SPI
  const handleSendPesan = async (auditId) => {
    if (pesanText.trim()) {
      try {
        if (!auditId) {
          alert('Proses Konsultasi Audit belum tersedia untuk catatan ini.');
          return;
        }
        await auditAPI.addNote(auditId, 'pesan_spi', pesanText.trim());
        const response = await auditAPI.getNotes(auditId, 'pesan_spi');
        const notes = response.data?.notes || [];
        setPesanData((prev) => ({
          ...prev,
          [auditId]: notes.map((n) => ({
            text: n.message,
            date: new Date(n.created_at).toLocaleString('id-ID'),
            sender: n.user?.name || 'User',
          })),
        }));
        setPesanText('');
        await fetchAudits();
      } catch (error) {
        console.error('Gagal kirim pesan SPI:', error);
        alert(typeof apiErrorMessage(error, 'Gagal mengirim pesan SPI.') === 'string'
          ? apiErrorMessage(error, 'Gagal mengirim pesan SPI.')
          : 'Gagal mengirim pesan SPI.');
      }
    }
  };

  // Handle Tindak Lanjut
  const handleSendTindakLanjut = async (auditId) => {
    if (tindakLanjutText.trim()) {
      try {
        if (!auditId) {
          alert('Proses Konsultasi Audit belum tersedia untuk catatan ini.');
          return;
        }
        await auditAPI.addNote(auditId, 'tindak_lanjut', tindakLanjutText.trim());
        const response = await auditAPI.getNotes(auditId, 'tindak_lanjut');
        const notes = response.data?.notes || [];
        setTindakLanjutData((prev) => ({
          ...prev,
          [auditId]: notes.map((n) => ({
            text: n.message,
            date: new Date(n.created_at).toLocaleString('id-ID'),
            sender: n.user?.name || 'User',
          })),
        }));
        setTindakLanjutText('');
        await fetchAudits();
      } catch (error) {
        console.error('Gagal kirim tindak lanjut:', error);
        alert(typeof apiErrorMessage(error, 'Gagal mengirim tindak lanjut.') === 'string'
          ? apiErrorMessage(error, 'Gagal mengirim tindak lanjut.')
          : 'Gagal mengirim tindak lanjut.');
      }
    }
  };

  useEffect(() => {
    if (!pesanModal || pesanModal.source !== 'audit') return;

    let alive = true;
    const refreshPesan = async () => {
      try {
        const response = await auditAPI.getNotes(pesanModal.rawId, 'pesan_spi');
        if (!alive) return;
        const notes = response.data?.notes || [];
        setPesanData((prev) => ({
          ...prev,
          [pesanModal.id]: notes.map((n) => ({
            text: n.message,
            date: new Date(n.created_at).toLocaleString('id-ID'),
            sender: n.user?.name || 'User',
          })),
        }));
      } catch (error) {
        console.error('Gagal refresh pesan SPI:', error);
      }
    };

    refreshPesan();
    const poller = setInterval(refreshPesan, 3000);
    return () => {
      alive = false;
      clearInterval(poller);
    };
  }, [pesanModal]);

  useEffect(() => {
    if (!tindakLanjutModal || tindakLanjutModal.source !== 'audit') return;

    let alive = true;
    const refreshTindakLanjut = async () => {
      try {
        const response = await auditAPI.getNotes(tindakLanjutModal.rawId, 'tindak_lanjut');
        if (!alive) return;
        const notes = response.data?.notes || [];
        setTindakLanjutData((prev) => ({
          ...prev,
          [tindakLanjutModal.id]: notes.map((n) => ({
            text: n.message,
            date: new Date(n.created_at).toLocaleString('id-ID'),
            sender: n.user?.name || 'User',
          })),
        }));
      } catch (error) {
        console.error('Gagal refresh tindak lanjut:', error);
      }
    };

    refreshTindakLanjut();
    const poller = setInterval(refreshTindakLanjut, 3000);
    return () => {
      alive = false;
      clearInterval(poller);
    };
  }, [tindakLanjutModal]);

  // Filter by role:
  // Auditee: hanya lihat audit dari unit kerja sendiri yang pernah dikirim
  // Auditor: hanya lihat audit di biro miliknya
  // Manajemen: lihat semua
  const biroFilteredAudits = audits;
  const filteredAudits = filter === 'all' ? biroFilteredAudits : biroFilteredAudits.filter(a => a.status === filter);

  return (
    <div className="status-audit-page space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#1f0a4f] via-[#3b0f89] to-[#111a47] p-6 text-white shadow-[0_18px_45px_-22px_rgba(49,13,125,0.95)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(129,140,248,0.35),transparent_40%),radial-gradient(circle_at_88%_14%,rgba(244,114,182,0.24),transparent_34%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                <IconChartPie className="w-3.5 h-3.5 text-indigo-200" />
              </div>
              <span className="text-indigo-100 text-[10px] font-semibold uppercase tracking-wider">Monitoring</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">Status Konsultasi</h1>
            <p className="text-indigo-100/80 text-[11px] md:text-xs mt-1.5 max-w-lg">Pantau status seluruh proses konsultasi</p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-2.5">
            {[
              { label: 'Total', value: biroFilteredAudits.length, color: 'text-white' },
              { label: 'Selesai', value: biroFilteredAudits.filter(a => a.status === 'selesai').length, color: 'text-emerald-200' },
              { label: 'Menunggu', value: biroFilteredAudits.filter(a => a.status === 'menunggu').length, color: 'text-amber-200' },
            ].map((s, i) => (
              <div key={i} className="min-w-[92px] rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
                <p className={`text-xl leading-tight font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-indigo-100/85 uppercase tracking-[0.12em] font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-extrabold text-indigo-600">{biroFilteredAudits.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <IconChartPie className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai</p>
              <p className="text-3xl font-extrabold text-emerald-600">{biroFilteredAudits.filter(a => a.status === 'selesai').length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <IconCheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proses</p>
              <p className="text-3xl font-extrabold text-blue-600">{biroFilteredAudits.filter(a => a.status === 'proses').length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <IconSpinner className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu</p>
              <p className="text-3xl font-extrabold text-amber-600">{biroFilteredAudits.filter(a => a.status === 'menunggu').length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <IconClock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'selesai', 'proses', 'menunggu', 'tindaklanjut'].map((f) => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`biro-btn px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' && <IconLayerGroup className="w-4 h-4" />}
            {f === 'selesai' && <IconCheckCircle className="w-4 h-4" />}
            {f === 'proses' && <IconSpinner className="w-4 h-4" />}
            {f === 'menunggu' && <IconClock className="w-4 h-4" />}
            {f === 'tindaklanjut' && <IconXCircle className="w-4 h-4" />}
            {f === 'all' ? 'Semua' : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <IconChartBar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Monitoring Konsultasi</h3>
              <p className="text-sm text-slate-500">Pantau status seluruh proses konsultasi</p>
            </div>
          </div>
        </div>
        {loading ? (
          <SkeletonTableRows rows={6} columns={6} />
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm table-fixed">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[28%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-[10px] uppercase text-slate-500 font-bold border-b">
            <tr>
              <th className="p-4 whitespace-nowrap">Unit Auditee</th>
              <th className="p-4 whitespace-nowrap">Subject dan Ringkasan</th>
              <th className="p-4 whitespace-nowrap">Auditor</th>
              <th className="p-4 whitespace-nowrap">Update</th>
              <th className="p-4 whitespace-nowrap">Status Konsultasi</th>
              <th className="p-4 text-right whitespace-nowrap">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredAudits.map((audit) => (
              <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 align-top">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow">
                      {audit.unitKerja.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800 break-words">{audit.unitKerja}</span>
                  </div>
                </td>
                <td className="p-4 align-top">
                  <button
                    onClick={() => setSubjectModal(audit)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                  >
                    <p className="text-xs font-bold text-indigo-700 break-words leading-snug">{audit.subject || '-'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 break-words leading-snug">{audit.issueSummary || '-'}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-semibold mt-1">
                      <IconEye className="w-3 h-3" /> Lihat Detail
                    </span>
                  </button>
                </td>
                <td className="p-4 text-slate-600 text-sm align-top break-words">{audit.auditor}</td>
                <td className="p-4 text-slate-500 text-sm align-top whitespace-nowrap">{audit.date}</td>
                <td className="p-4 align-top">
                  {canChangeStatus(audit) ? (
                    <select 
                      value={audit.status}
                      onChange={(e) => handleStatusChange(audit.id, e.target.value)}
                      className={`status-select w-full px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none focus:ring-2 ${statusSelectColors[audit.status]}`}
                    >
                      <option value="menunggu">Menunggu</option>
                      <option value="proses">Dalam Proses</option>
                      <option value="selesai">Selesai</option>
                      <option value="tindaklanjut">Tindak Lanjut</option>
                    </select>
                  ) : (
                    <span className={`status-pill px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center whitespace-nowrap ${statusColors[audit.status]}`}>
                      {statusLabels[audit.status]}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right align-top">
                  <div className="flex flex-col items-end gap-1.5">
                    <button 
                      onClick={async () => {
                        const resolvedAuditId = await resolveAuditId(audit);
                        const enriched = resolvedAuditId
                          ? { ...audit, source: 'audit', rawId: resolvedAuditId, id: resolvedAuditId }
                          : audit;

                        setPesanModal(enriched);
                        setPesanText('');
                        if (enriched.source === 'audit') {
                          const response = await auditAPI.getNotes(enriched.rawId, 'pesan_spi');
                          const notes = response.data?.notes || [];
                          setPesanData((prev) => ({
                            ...prev,
                            [enriched.id]: notes.map((n) => ({
                              text: n.message,
                              date: new Date(n.created_at).toLocaleString('id-ID'),
                              sender: n.user?.name || 'User',
                            })),
                          }));
                        }
                      }}
                      className="status-action-btn status-action-btn--pesan min-w-[126px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center"
                    >
                      <IconEnvelope className="w-3.5 h-3.5 mr-1 inline" /> Pesan SPI
                      {audit.pesanCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[10px]">{audit.pesanCount}</span>
                      )}
                    </button>
                    <button 
                      onClick={async () => {
                        const resolvedAuditId = await resolveAuditId(audit);
                        const enriched = resolvedAuditId
                          ? { ...audit, source: 'audit', rawId: resolvedAuditId, id: resolvedAuditId }
                          : audit;

                        setTindakLanjutModal(enriched);
                        setTindakLanjutText('');
                        if (enriched.source === 'audit') {
                          const response = await auditAPI.getNotes(enriched.rawId, 'tindak_lanjut');
                          const notes = response.data?.notes || [];
                          setTindakLanjutData((prev) => ({
                            ...prev,
                            [enriched.id]: notes.map((n) => ({
                              text: n.message,
                              date: new Date(n.created_at).toLocaleString('id-ID'),
                              sender: n.user?.name || 'User',
                            })),
                          }));
                        }
                      }}
                      className="status-action-btn status-action-btn--tindak min-w-[126px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center"
                    >
                      <IconStickyNote className="w-3.5 h-3.5 mr-1 inline" /> Tindak Lanjut
                      {audit.tindakLanjutCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">{audit.tindakLanjutCount}</span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
        
        {!loading && filteredAudits.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconSearch className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Tidak Ada Data</h3>
            <p className="text-sm text-slate-500">Tidak ditemukan audit dengan filter yang dipilih</p>
            <Link to="/konsultasi" className="inline-flex mt-4 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-colors">
              Buka Halaman Konsultasi
            </Link>
          </div>
        )}
      </div>

      {/* Modal Pesan SPI */}
      {subjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSubjectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Detail Subject</h3>
                <p className="text-xs text-slate-500">{subjectModal.unitKerja} - {subjectModal.auditor}</p>
              </div>
              <button onClick={() => setSubjectModal(null)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject / Judul</p>
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 text-sm font-semibold text-indigo-800">
                  {subjectModal.subject || '-'}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Uraian Permasalahan Auditee</p>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">
                  {subjectModal.issueSummary || '-'}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Timeline Ringkas</p>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status Saat Ini</span>
                    <span className="font-bold text-slate-700">{statusLabels[subjectModal.status] || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Update Terakhir</span>
                    <span className="font-semibold text-slate-700">{subjectModal.date || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Pesan SPI</span>
                    <span className="font-semibold text-slate-700">{subjectModal.pesanCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tindak Lanjut</span>
                    <span className="font-semibold text-slate-700">{subjectModal.tindakLanjutCount || 0}</span>
                  </div>
                </div>
              </div>

              {subjectModal.attachmentMessageId && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lampiran Auditee</p>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconFileAlt className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <p className="text-sm text-slate-700 truncate">{subjectModal.attachmentName || 'Lampiran'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAttachmentAction(subjectModal, 'view')}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-all"
                      >
                        <IconEye className="w-3.5 h-3.5 mr-1 inline" /> Lihat
                      </button>
                      <button
                        onClick={() => handleAttachmentAction(subjectModal, 'download')}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        <IconDownload className="w-3.5 h-3.5 mr-1 inline" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pesan SPI */}
      {attachmentPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={closeAttachmentPreview}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800">Preview Lampiran</h3>
                <p className="text-xs text-slate-500 truncate">{attachmentPreview.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = attachmentPreview.url;
                    link.download = attachmentPreview.fileName;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  <IconDownload className="w-3.5 h-3.5 mr-1 inline" /> Download
                </button>
                <button onClick={closeAttachmentPreview} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-4 h-[75vh] flex items-center justify-center">
              {attachmentPreview.mimeType.startsWith('image/') ? (
                <img src={attachmentPreview.url} alt={attachmentPreview.fileName} className="max-w-full max-h-full object-contain rounded-lg border border-slate-200 bg-white" />
              ) : (
                <iframe title="Preview Lampiran" src={attachmentPreview.url} className="w-full h-full rounded-lg border border-slate-200 bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pesan SPI */}
      {pesanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPesanModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <IconEnvelope className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Pesan SPI</h3>
                  <p className="text-xs text-slate-500">{pesanModal.unitKerja} - {pesanModal.subject}</p>
                </div>
              </div>
              <button onClick={() => setPesanModal(null)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(!pesanData[pesanModal.id] || pesanData[pesanModal.id].length === 0) ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconInbox className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">{userRole === 'auditee' ? 'Belum ada pesan dari Auditor' : 'Belum ada pesan'}</p>
                </div>
              ) : (
                pesanData[pesanModal.id].map((msg, idx) => (
                  <div key={idx} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600">{msg.sender}</span>
                      <span className="text-[10px] text-slate-400">{msg.date}</span>
                    </div>
                    <p className="text-sm text-slate-700">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            {userRole !== 'auditee' && !isKSPI && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pesanText}
                  onChange={(e) => setPesanText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPesan(pesanModal?.source === 'audit' ? pesanModal.rawId : null)}
                  placeholder="Tulis pesan..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                />
                <button 
                  onClick={() => handleSendPesan(pesanModal?.source === 'audit' ? pesanModal.rawId : null)}
                  className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all"
                >
                  <IconSend className="w-4 h-4" />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Tindak Lanjut */}
      {tindakLanjutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setTindakLanjutModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <IconStickyNote className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Tindak Lanjut</h3>
                  <p className="text-xs text-slate-500">{tindakLanjutModal.unitKerja} - {tindakLanjutModal.subject}</p>
                </div>
              </div>
              <button onClick={() => setTindakLanjutModal(null)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(!tindakLanjutData[tindakLanjutModal.id] || tindakLanjutData[tindakLanjutModal.id].length === 0) ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconClipboardList className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">{userRole === 'auditee' ? 'Belum ada tindak lanjut dari Auditor' : 'Belum ada tindak lanjut'}</p>
                </div>
              ) : (
                tindakLanjutData[tindakLanjutModal.id].map((item, idx) => (
                  <div key={idx} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-600">{item.sender}</span>
                      <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>
                    <p className="text-sm text-slate-700">{item.text}</p>
                  </div>
                ))
              )}
            </div>
            {userRole !== 'auditee' && !isKSPI && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tindakLanjutText}
                  onChange={(e) => setTindakLanjutText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTindakLanjut(tindakLanjutModal?.source === 'audit' ? tindakLanjutModal.rawId : null)}
                  placeholder="Tulis tindak lanjut..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button 
                  onClick={() => handleSendTindakLanjut(tindakLanjutModal?.source === 'audit' ? tindakLanjutModal.rawId : null)}
                  className="px-5 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                >
                  <IconSend className="w-4 h-4" />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusAudit;
