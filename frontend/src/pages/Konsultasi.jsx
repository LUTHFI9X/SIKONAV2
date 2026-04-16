import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conversationAPI, messageAPI } from '../services/api';
import { subscribeToUserRealtime } from '../services/realtime';
import Skeleton, { SkeletonText } from '../components/Skeleton';
import {
  IconComments, IconCheck, IconClock, IconFileAlt, IconX,
  IconPaperclip, IconSend, IconSearch, IconFilter,
  IconCheckCircle, IconUser, IconHeadphones, IconArrowRight,
  IconShieldCheck
} from '../components/Icons';

const FALLBACK_CONVERSATION_SYNC_MS = 2500;
const FALLBACK_MESSAGE_SYNC_MS = 1800;
const AUTO_PREVIEW_ATTACHMENTS = false;

const Konsultasi = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = user;
  const userRole = currentUser?.role || 'auditee';
  const [auditors, setAuditors] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState({});
  const attachmentPreviewUrlsRef = useRef({});
  const failedAttachmentPreviewIdsRef = useRef(new Set());
  const [imageViewer, setImageViewer] = useState({
    open: false,
    url: '',
    name: '',
    loading: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const selectedChatRef = useRef(null);
  const conversationsRef = useRef([]);
  const hasLoadedConversationsRef = useRef(false);
  const syncConversationsInFlightRef = useRef(false);
  const syncMessagesInFlightRef = useRef(false);
  
  const [conversations, setConversations] = useState([]);

  const isKSPI = userRole === 'manajemen' && currentUser?.sub_role === 'kspi';
  const isAuditee = userRole === 'auditee';
  const isAuditor = userRole === 'auditor';
  const isSessionAnonim = currentUser?.isAnonymous === true;

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id ?? null;
    selectedChatRef.current = selectedChat ?? null;
  }, [selectedChat]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const mapStatus = (status) => {
    const mapped = {
      active: 'BARU',
      closed: 'SELESAI',
      archived: 'TINDAK LANJUT',
      pending: 'BARU',
      in_progress: 'MENUNGGU',
      completed: 'SELESAI',
      cancelled: 'TINDAK LANJUT',
    };
    return mapped[status] || 'BARU';
  };

  const mapStatusToApi = (status) => {
    const mapped = {
      BARU: 'active',
      MENUNGGU: 'active',
      SELESAI: 'closed',
      'TINDAK LANJUT': 'archived',
    };
    return mapped[status] || 'active';
  };

  const formatTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const isImageAttachment = (attachmentInfo) => {
    if (!attachmentInfo) return false;
    const type = (attachmentInfo.type || '').toLowerCase();
    if (type.startsWith('image/')) return true;

    const name = (attachmentInfo.name || '').toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].some((ext) => name.endsWith(ext));
  };

  const mapConversation = (conv) => {
    const counterpart = userRole === 'auditee' ? conv.auditor : conv.auditee;
    const isActiveChat = Number(conv.id) === Number(selectedChatIdRef.current);
    const unreadCount = conv.latest_message && conv.latest_message.sender_id !== currentUser?.id && !conv.latest_message.is_read ? 1 : 0;
    return {
      id: conv.id,
      auditeeId: conv.auditee_id,
      auditorId: conv.auditor_id,
      name: counterpart?.name || 'User',
      unit: conv.auditee?.department || '-',
      subject: conv.subject || 'Konsultasi Audit',
      lastMessage: conv.latest_message?.content || 'Belum ada pesan',
      lastTime: formatTime(conv.last_message_at || conv.created_at),
      unread: isActiveChat ? 0 : unreadCount,
      status: mapStatus(conv.status),
      messages: [],
      isAnonim: Boolean(conv.is_anonymous),
    };
  };

  const fetchData = useCallback(async () => {
    if (!hasLoadedConversationsRef.current) {
      setLoadingConversations(true);
    }

    try {
      const [auditorsRes, convRes] = await Promise.allSettled([
        conversationAPI.getAvailableAuditors(),
        conversationAPI.getAll(),
      ]);

      if (auditorsRes.status === 'fulfilled') {
        setAuditors(auditorsRes.value.data?.auditors || []);
      } else {
        setAuditors([]);
        console.error('Failed to load auditors:', auditorsRes.reason);
      }

      if (convRes.status !== 'fulfilled') {
        throw convRes.reason;
      }

      const mappedConversations = (convRes.value.data?.conversations || []).map(mapConversation);
      setConversations((prev) => mappedConversations.map((item) => {
        const prevItem = prev.find((p) => p.id === item.id);
        if (!prevItem) return item;
        return {
          ...item,
          messages: prevItem.messages || [],
        };
      }));

      setSelectedChat((prev) => {
        if (!prev) return prev;
        const next = mappedConversations.find((c) => c.id === prev.id);
        if (!next) return null;
        return {
          ...prev,
          ...next,
          messages: prev.messages || [],
          unread: 0,
        };
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      if (!hasLoadedConversationsRef.current) {
        hasLoadedConversationsRef.current = true;
        setLoadingConversations(false);
      }
    }
  }, [currentUser?.id, userRole]);

  const loadMessages = useCallback(async (conversationId, { silent = false } = {}) => {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await messageAPI.getAll(conversationId);
    const conversationMeta =
      conversationsRef.current.find((c) => Number(c.id) === Number(conversationId))
      || (selectedChatRef.current && Number(selectedChatRef.current.id) === Number(conversationId)
        ? selectedChatRef.current
        : null);

    const resolveSender = (msg) => {
      const senderRole = (msg.sender?.role || '').toLowerCase();
      if (senderRole === 'auditee' || senderRole === 'auditor') {
        return senderRole;
      }

      const senderId = Number(msg.sender_id);
      if (conversationMeta?.auditeeId && senderId === Number(conversationMeta.auditeeId)) {
        return 'auditee';
      }
      if (conversationMeta?.auditorId && senderId === Number(conversationMeta.auditorId)) {
        return 'auditor';
      }

      if (senderId === Number(currentUser?.id)) {
        return currentUser?.role === 'auditor' ? 'auditor' : 'auditee';
      }

      return currentUser?.role === 'auditor' ? 'auditee' : 'auditor';
    };

      const messages = (response.data?.messages || []).map((msg) => ({
        id: msg.id,
        sender: resolveSender(msg),
        isMine: Number(msg.sender_id) === Number(currentUser?.id),
        senderName: msg.sender?.name || 'User',
        text: msg.content,
        time: formatTime(msg.created_at),
        date: new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        attachment: msg.attachment_name
          ? {
              id: msg.id,
              name: msg.attachment_name,
              type: msg.attachment_type || '',
            }
          : null,
      }));

      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages, unread: 0 } : c)));
      setSelectedChat((prev) => (prev && prev.id === conversationId ? { ...prev, messages, unread: 0 } : prev));
    } catch (error) {
      if (!silent) {
        console.error('Failed to load messages:', error);
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const syncConversations = async () => {
      if (syncConversationsInFlightRef.current) return;
      syncConversationsInFlightRef.current = true;
      try {
        await fetchData();
      } finally {
        syncConversationsInFlightRef.current = false;
      }
    };

    syncConversations();
    const poller = setInterval(syncConversations, FALLBACK_CONVERSATION_SYNC_MS);

    const onFocus = () => syncConversations();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!selectedChat?.id) return;
    loadMessages(selectedChat.id);
  }, [selectedChat?.id, loadMessages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawConversationId = params.get('conversation');
    if (!rawConversationId) return;

    const conversationId = Number(rawConversationId);
    if (!Number.isFinite(conversationId)) {
      navigate('/konsultasi', { replace: true });
      return;
    }

    const targetConversation = conversations.find((conv) => Number(conv.id) === conversationId);
    if (!targetConversation) return;

    if (Number(selectedChat?.id) !== conversationId) {
      setSelectedChat(targetConversation);
      loadMessages(targetConversation.id, { silent: true });
    }

    navigate('/konsultasi', { replace: true });
  }, [location.search, conversations, selectedChat?.id, loadMessages, navigate]);

  useEffect(() => {
    if (!selectedChat?.id) return;

    const pollActiveMessages = setInterval(() => {
      if (syncMessagesInFlightRef.current) return;
      syncMessagesInFlightRef.current = true;
      loadMessages(selectedChat.id, { silent: true })
        .finally(() => {
          syncMessagesInFlightRef.current = false;
        });
    }, FALLBACK_MESSAGE_SYNC_MS);

    return () => clearInterval(pollActiveMessages);
  }, [selectedChat?.id, loadMessages]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToUserRealtime(currentUser.id, async (event) => {
      await fetchData();

      const activeChatId = selectedChatIdRef.current;
      if (activeChatId && Number(event?.conversation_id) === Number(activeChatId)) {
        await loadMessages(activeChatId, { silent: true });
      }
    });

    return unsubscribe;
  }, [currentUser?.id, fetchData, loadMessages]);

  // Get display name based on session anonim and viewer role
  const getDisplayName = (conv) => {
    // Auditee selalu lihat nama asli
    if (isAuditee) return conv.name;
    // Auditor & KSPI: kalau session anonim, tampilkan 'Anonim'
    if (isSessionAnonim) return 'Anonim';
    if (conv.isAnonim) return 'Anonim';
    return conv.name;
  };

  const isConvAnonim = (conv) => isSessionAnonim || conv.isAnonim;

  const getDisplayAvatar = (conv) => {
    if ((isAuditor || isKSPI) && isConvAnonim(conv)) return '🎭';
    return conv.name.charAt(0);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  useEffect(() => {
    if (!AUTO_PREVIEW_ATTACHMENTS) return;

    const pending = (selectedChat?.messages || []).filter((msg) => {
      return msg?.attachment?.id
        && isImageAttachment(msg?.attachment)
        && !attachmentPreviewUrls[msg.attachment.id]
        && !failedAttachmentPreviewIdsRef.current.has(msg.attachment.id);
    });

    if (pending.length === 0) return;

    let active = true;

    const loadPreviews = async () => {
      for (const msg of pending) {
        try {
          const response = await messageAPI.downloadAttachment(msg.attachment.id);
            const contentType = response.headers?.['content-type'] || msg?.attachment?.type || 'image/*';
            const blob = response.data instanceof Blob
              ? response.data
              : new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          if (!active) {
            window.URL.revokeObjectURL(url);
            continue;
          }
          setAttachmentPreviewUrls((prev) => ({ ...prev, [msg.attachment.id]: url }));
        } catch {
          // Ignore preview load failure; filename download still available.
          failedAttachmentPreviewIdsRef.current.add(msg.attachment.id);
        }
      }
    };

    loadPreviews();

    return () => {
      active = false;
    };
  }, [selectedChat?.messages, attachmentPreviewUrls]);

  useEffect(() => {
    attachmentPreviewUrlsRef.current = attachmentPreviewUrls;
  }, [attachmentPreviewUrls]);

  useEffect(() => {
    return () => {
      Object.values(attachmentPreviewUrlsRef.current).forEach((url) => {
        if (url) window.URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!message.trim() && !attachment) return;
    
    (async () => {
      try {
        await messageAPI.send(
          selectedChat.id,
          message,
          attachment || null,
          { is_anonymous: isSessionAnonim }
        );
        setMessage('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadMessages(selectedChat.id, { silent: true });
        await fetchData();
      } catch (error) {
        console.error('Send message failed:', error);
      }
    })();
  };

  // Allowed file types & max size for security
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`Tipe file tidak diizinkan. Format yang diterima: ${ALLOWED_EXTENSIONS.join(', ')}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadAttachment = async (attachmentInfo) => {
    try {
      const response = await messageAPI.downloadAttachment(attachmentInfo.id);
      const contentType = response.headers?.['content-type'] || attachmentInfo.type || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachmentInfo.name || 'lampiran');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Delay revoke for Safari/WebKit so download is not cancelled.
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Download attachment failed:', error);
      alert('Gagal mengunduh lampiran.');
    }
  };

  const handleViewImageAttachment = async (attachmentInfo) => {
    try {
      const existingUrl = attachmentPreviewUrls[attachmentInfo.id];
      if (existingUrl) {
        setImageViewer({ open: true, url: existingUrl, name: attachmentInfo.name || 'Gambar', loading: false });
        return;
      }

      setImageViewer({ open: true, url: '', name: attachmentInfo.name || 'Gambar', loading: true });

      const response = await messageAPI.downloadAttachment(attachmentInfo.id);
      const contentType = response.headers?.['content-type'] || attachmentInfo.type || 'image/*';
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      setAttachmentPreviewUrls((prev) => ({ ...prev, [attachmentInfo.id]: url }));
      setImageViewer({ open: true, url, name: attachmentInfo.name || 'Gambar', loading: false });
    } catch (error) {
      console.error('View image attachment failed:', error);
      setImageViewer({ open: true, url: '', name: attachmentInfo.name || 'Gambar', loading: false });
      alert('Gagal membuka gambar.');
    }
  };

  const closeImageViewer = () => {
    setImageViewer((prev) => ({ ...prev, open: false, loading: false }));
  };

  const handleStatusChange = async (convId, newStatus) => {
    try {
      await conversationAPI.updateStatus(convId, mapStatusToApi(newStatus));
      setConversations(prev => prev.map(conv => conv.id === convId ? { ...conv, status: newStatus } : conv));
      if (selectedChat?.id === convId) setSelectedChat(prev => ({ ...prev, status: newStatus }));
      await fetchData();
    } catch (error) {
      console.error('Update status failed:', error);
      alert('Gagal memperbarui status konsultasi. Silakan coba lagi.');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'BARU': { chip: 'konsultasi-status-baru', dot: 'konsultasi-status-dot-baru' },
      'MENUNGGU': { chip: 'konsultasi-status-menunggu', dot: 'konsultasi-status-dot-menunggu' },
      'SELESAI': { chip: 'konsultasi-status-selesai', dot: 'konsultasi-status-dot-selesai' },
      'TINDAK LANJUT': { chip: 'konsultasi-status-tindaklanjut', dot: 'konsultasi-status-dot-tindaklanjut' },
    };
    return configs[status] || { chip: 'konsultasi-status-baru', dot: 'konsultasi-status-dot-baru' };
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <>
    <div className="konsultasi-page h-full flex flex-col animate-fadeInUp">
      <div className="konsultasi-shell flex-1 flex gap-0 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm bg-white">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="konsultasi-list-panel w-[340px] flex flex-col border-r border-slate-100 bg-white">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <IconComments className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Konsultasi</h3>
                  <p className="text-[10px] text-slate-400">{conversations.length} percakapan</p>
                </div>
              </div>
              {totalUnread > 0 && (
                <span className="w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalUnread}</span>
              )}
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari percakapan..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1">
              {[{ value: 'all', label: 'Semua' }, { value: 'BARU', label: 'Baru' }, { value: 'MENUNGGU', label: 'Menunggu' }, { value: 'SELESAI', label: 'Selesai' }, { value: 'TINDAK LANJUT', label: 'Tindak Lanjut' }].map(f => (
                <button key={f.value} onClick={() => setFilterStatus(f.value)} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${filterStatus === f.value ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConversations ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <SkeletonText className="w-28" />
                          <SkeletonText className="w-10" />
                        </div>
                        <SkeletonText className="w-40 h-2.5" />
                        <SkeletonText className="w-32 h-2.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? filteredConversations.map((conv) => {
              const sc = getStatusConfig(conv.status);
              const auditor = auditors.find(a => a.id === conv.auditorId);
              return (
                <div 
                  key={conv.id} 
                  onClick={async () => {
                    setSelectedChat(conv);
                    await loadMessages(conv.id);
                  }}
                  className={`px-4 py-3.5 cursor-pointer transition-all border-l-[3px] ${
                    selectedChat?.id === conv.id 
                      ? 'bg-indigo-50/50 border-l-indigo-500' 
                      : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${(isAuditor || isKSPI) && isConvAnonim(conv) ? 'bg-gradient-to-br from-slate-500 to-slate-700' : `bg-gradient-to-br ${auditor?.gradient || 'from-indigo-500 to-purple-600'}`} flex items-center justify-center text-white font-bold text-sm relative flex-shrink-0`}>
                      {getDisplayAvatar(conv)}
                      {isConvAnonim(conv) && isAuditee && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center" title="Mode Anonim aktif">
                          <IconShieldCheck className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{getDisplayName(conv)}</h4>
                          {isConvAnonim(conv) && (isAuditor || isKSPI) && <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold flex-shrink-0">Anonim</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{conv.lastTime}</span>
                          {(conv.unread || 0) > 0 && <span className="w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{conv.unread}</span>}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{conv.unit} · {auditor?.shortName}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                  <div className="mt-2 ml-13">
                    <span className={`status-chip konsultasi-status-chip inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md text-[9px] font-bold ${sc.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span> {conv.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center">
                <IconComments className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Tidak ada percakapan ditemukan</p>
                {isAuditee && (
                  <Link to="/ajukan" className="inline-flex mt-3 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                    Ajukan Konsultasi Baru
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ MAIN CHAT PANEL ═══ */}
        <div className="konsultasi-chat-panel flex-1 flex flex-col bg-slate-50/50">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="konsultasi-chat-header px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${(isAuditor || isKSPI) && isConvAnonim(selectedChat) ? 'bg-gradient-to-br from-slate-500 to-slate-700' : `bg-gradient-to-br ${auditors.find(a => a.id === selectedChat.auditorId)?.gradient || 'from-indigo-500 to-purple-600'}`} flex items-center justify-center text-white font-bold shadow-sm`}>
                    {getDisplayAvatar(selectedChat)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{getDisplayName(selectedChat)}</h4>
                      {isConvAnonim(selectedChat) && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold ${isAuditee ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          <IconShieldCheck className="w-2.5 h-2.5" />
                          {isAuditee ? 'Anonim Aktif' : 'Anonim'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">{selectedChat.unit}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400">{selectedChat.subject}</span>
                    </div>
                  </div>
                </div>
                
                {/* Status + Controls */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const sc = getStatusConfig(selectedChat.status);
                    return <span className={`status-chip konsultasi-status-chip inline-flex items-center whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-bold ${sc.chip}`}>{selectedChat.status}</span>;
                  })()}
                  {/* Anonim indicator — set dari login, bukan toggle */}
                  {isAuditee && isSessionAnonim && (
                    <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200">
                      <IconShieldCheck className="w-3.5 h-3.5" />
                      Mode Anonim
                    </div>
                  )}
                  {userRole === 'auditor' && !isKSPI && (
                    <div className="flex gap-1.5 ml-2">
                      <button onClick={() => handleStatusChange(selectedChat.id, 'SELESAI')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1">
                        <IconCheck className="w-3 h-3" /> Selesai
                      </button>
                      <button onClick={() => handleStatusChange(selectedChat.id, 'TINDAK LANJUT')} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[10px] font-bold hover:bg-purple-600 transition-colors flex items-center gap-1">
                        <IconClock className="w-3 h-3" /> Tindak Lanjut
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="konsultasi-messages-area flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                {loadingMessages ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className="max-w-[70%]">
                          <SkeletonText className={`w-24 mb-1 ${idx % 2 === 0 ? '' : 'ml-auto'}`} />
                          <Skeleton className="h-20 rounded-2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedChat.messages.length > 0 ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {/* Group messages by date */}
                    {(() => {
                      let lastDate = '';
                      return selectedChat.messages.map((msg) => {
                        const showDate = msg.date !== lastDate;
                        lastDate = msg.date;
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-slate-200/60"></div>
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">{msg.date}</span>
                                <div className="flex-1 h-px bg-slate-200/60"></div>
                              </div>
                            )}
                            <div className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${msg.isMine ? 'order-1' : ''}`}>
                                <p className={`text-[10px] font-semibold mb-1 ${msg.isMine ? 'text-right text-indigo-500' : 'text-slate-500'}`}>
                                  {!msg.isMine && msg.sender === 'auditee' && (isAuditor || isKSPI) && isConvAnonim(selectedChat) ? `Anonim · ${selectedChat.unit}` : msg.senderName}
                                </p>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                  msg.isMine
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                                    : 'konsultasi-bubble-incoming bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm'
                                }`}>
                                  <p>{msg.text}</p>
                                    {msg.attachment && (
                                      <div className="mt-2 space-y-2">
                                        {isImageAttachment(msg.attachment) && attachmentPreviewUrls[msg.attachment.id] && (
                                          <button
                                            type="button"
                                            onClick={() => handleViewImageAttachment(msg.attachment)}
                                            className="block rounded-lg overflow-hidden border border-white/20 bg-black/10"
                                            title="Lihat gambar"
                                          >
                                            <img src={attachmentPreviewUrls[msg.attachment.id]} alt={msg.attachment.name} className="max-h-44 w-auto object-contain" />
                                          </button>
                                        )}
                                        <div className={`rounded-xl border px-3 py-2 ${msg.isMine ? 'border-white/25 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                                          <div className={`flex items-center gap-2 text-xs font-semibold mb-2 ${msg.isMine ? 'text-indigo-50' : 'text-slate-600'}`}>
                                            <IconFileAlt className="w-3.5 h-3.5" />
                                            <span className="truncate">{msg.attachment.name}</span>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {isImageAttachment(msg.attachment) && (
                                              <button
                                                type="button"
                                                onClick={() => handleViewImageAttachment(msg.attachment)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${msg.isMine ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                              >
                                                Lihat Gambar
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadAttachment(msg.attachment)}
                                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${msg.isMine ? 'bg-indigo-950/40 text-white hover:bg-indigo-950/55' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                            >
                                              Download File
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  <p className={`text-[10px] mt-2 ${msg.isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {msg.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <IconComments className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Belum ada pesan</p>
                    <p className="text-xs text-slate-300 mt-1">Mulai percakapan pertama Anda</p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              {!isKSPI && (
              <div className="konsultasi-input-area px-6 py-3 bg-white border-t border-slate-100">
                {attachment && (
                  <div className="px-3 py-2 mb-2 bg-indigo-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      <IconFileAlt className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{attachment.name}</span>
                    </div>
                    <button onClick={clearAttachment} className="text-red-400 hover:text-red-500 transition"><IconX className="w-3 h-3" /></button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all flex-shrink-0" title="Lampirkan File">
                    <IconPaperclip className="w-4 h-4" />
                  </button>
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" 
                    placeholder="Tulis pesan..."
                  />
                  <button type="submit" disabled={!message.trim() && !attachment} className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0">
                    <IconSend className="w-4 h-4" />
                  </button>
                </form>
              </div>
              )}
              {isKSPI && (
                <div className="konsultasi-readonly-area px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium">Mode view-only — KSPI tidak dapat mengirim pesan</p>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconHeadphones className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Tanya Auditor SPI</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">Pilih percakapan di sebelah kiri untuk melihat dan membalas konsultasi audit.</p>
                {isAuditee && (
                  <Link to="/ajukan" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-sm">
                    Buat Konsultasi
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {imageViewer.open && (
        <div className="fixed inset-0 z-[100] bg-black/70 p-4 flex items-center justify-center" onClick={closeImageViewer}>
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 truncate pr-4">{imageViewer.name}</p>
              <button type="button" onClick={closeImageViewer} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center" title="Tutup">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[75vh] bg-slate-100 flex items-center justify-center p-4">
              {imageViewer.loading && <p className="text-sm text-slate-500">Memuat gambar...</p>}
              {!imageViewer.loading && imageViewer.url && (
                <img src={imageViewer.url} alt={imageViewer.name} className="max-w-full max-h-full object-contain" />
              )}
              {!imageViewer.loading && !imageViewer.url && (
                <p className="text-sm text-slate-500">Gambar tidak dapat ditampilkan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Konsultasi;