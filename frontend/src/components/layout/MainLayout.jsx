import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUX } from '../../contexts/UXContext';
import { conversationAPI, activityLogAPI } from '../../services/api';
import { IconUser, IconMoon, IconSun, IconBell, IconClock, IconGear, IconChevronDown, IconMenu, IconX } from '../Icons';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const { user } = useAuth();
  const { t, language, toggleLanguage, accessibilityMode, toggleAccessibilityMode } = useUX();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = user;
  const [isNightMode, setIsNightMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [showUxTip, setShowUxTip] = useState(() => localStorage.getItem('sikona-ux-tip-dismissed') !== '1');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  const commandInputRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('sikona-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialNight = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsNightMode(initialNight);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('night-mode', isNightMode);
    localStorage.setItem('sikona-theme', isNightMode ? 'dark' : 'light');

    return () => {
      document.documentElement.classList.remove('night-mode');
    };
  }, [isNightMode]);

  const isChatRole = useMemo(() => currentUser?.role === 'auditee' || currentUser?.role === 'auditor', [currentUser?.role]);
  const isAdminLike = useMemo(
    () => currentUser?.role === 'admin' || (currentUser?.role === 'manajemen' && currentUser?.sub_role === 'admin'),
    [currentUser?.role, currentUser?.sub_role]
  );

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.id) {
        setNotifications([]);
        setNotifUnread(0);
        return;
      }

      try {
        if (isChatRole) {
          const response = await conversationAPI.getAll();
          const conversations = response.data?.conversations || [];
          const unreadItems = conversations
            .filter((conv) => {
              const latest = conv?.latest_message;
              if (!latest) return false;
              const own = Number(latest.sender_id) === Number(currentUser.id);
              const read = latest.is_read === true || Number(latest.is_read) === 1;
              return !own && !read;
            })
            .slice(0, 8)
            .map((conv) => ({
              id: `conv-${conv.id}`,
              conversationId: conv.id,
              title: conv.subject || `Konsultasi #${conv.id}`,
              subtitle: conv.latest_message?.content || 'Ada pesan baru',
              time: new Date(conv.latest_message?.created_at || conv.last_message_at || conv.created_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));

          setNotifications(unreadItems);
          setNotifUnread(unreadItems.length);
          return;
        }

        if (isAdminLike) {
          const response = await activityLogAPI.getAll({ per_page: 8 });
          const logs = response.data?.logs || response.data?.data || [];
          const items = logs.slice(0, 8).map((log, idx) => ({
            id: `log-${log.id || idx}`,
            title: log?.action || 'Aktivitas sistem',
            subtitle: log?.description || 'Perubahan data terbaru',
            time: new Date(log?.created_at || Date.now()).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));

          setNotifications(items);
          setNotifUnread(0);
          return;
        }

        setNotifications([]);
        setNotifUnread(0);
      } catch {
        setNotifications([]);
        setNotifUnread(0);
      }
    };

    fetchNotifications();
    const poller = setInterval(fetchNotifications, 5000);
    const onFocus = () => fetchNotifications();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [currentUser?.id, isAdminLike, isChatRole]);

  const handleNotificationClick = (item) => {
    if (!item) return;

    setNotifOpen(false);

    if (isChatRole && item.conversationId) {
      navigate(`/konsultasi?conversation=${item.conversationId}`);
    }
  };

  useEffect(() => {
    const onOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
        setSettingsOpen(false);
        setNotifOpen(false);
        setOnboardingOpen(false);
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (commandOpen) {
      window.setTimeout(() => commandInputRef.current?.focus(), 0);
    }
  }, [commandOpen]);

  const commandItems = useMemo(() => {
    const items = [
      { key: 'dashboard', label: t('common.dashboard', 'Dashboard'), path: '/dashboard' },
      { key: 'konsultasi', label: t('common.consultation', 'Konsultasi'), path: '/konsultasi' },
      { key: 'status-audit', label: t('common.auditStatus', 'Status Konsultasi'), path: '/status-audit' },
      { key: 'proses-audit', label: t('common.auditProcess', 'Proses Konsultasi'), path: '/proses-audit' },
      { key: 'laporan', label: t('common.reports', 'Laporan'), path: '/laporan' },
      { key: 'profil-spi', label: t('common.profileSPI', 'Profil SPI'), path: '/profil-spi' },
    ];

    if (isAdminLike) {
      items.push({ key: 'kelola-user', label: t('menu.userManagement', 'Kelola User'), path: '/kelola-user' });
    }

    return items;
  }, [isAdminLike, t]);

  const filteredCommandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter((item) => item.label.toLowerCase().includes(q) || item.path.includes(q));
  }, [commandItems, commandQuery]);

  const onboardingSteps = useMemo(() => {
    const isId = language === 'id';
    const role = currentUser?.role;
    const roleGuide = isId
      ? {
        auditee: 'Fokus utama Anda: unggah dokumen pada tahap 1 dan 6, lalu koordinasi temuan lewat menu Laporan.',
        auditor: 'Fokus utama Anda: validasi proses konsultasi, review dokumen, dan dorong status hingga siap arsip.',
        admin: 'Fokus utama Anda: monitor aktivitas sistem, kelola user, dan jaga konfigurasi tetap konsisten.',
        manajemen: 'Fokus utama Anda: pantau ringkasan, tindak lanjut prioritas, serta kualitas penyelesaian audit.',
        default: 'Fokus utama Anda: gunakan sidebar sebagai pusat navigasi dan notifikasi sebagai daftar tugas harian.',
      }
      : {
        auditee: 'Your primary focus: upload documents for stages 1 and 6, then coordinate findings from Reports.',
        auditor: 'Your primary focus: validate audit progress, review documents, and move status toward archive-ready.',
        admin: 'Your primary focus: monitor system activities, manage users, and keep configurations consistent.',
        manajemen: 'Your primary focus: track summaries, priority follow-ups, and overall audit completion quality.',
        default: 'Your primary focus: use the sidebar as your navigation hub and notifications as your daily queue.',
      };

    return [
      {
        eyebrow: isId ? 'Mulai Cepat' : 'Quick Start',
        title: isId ? 'Navigasi Instan dengan Command Palette' : 'Instant Navigation with Command Palette',
        body: isId
          ? 'Tekan Cmd/Ctrl + K untuk membuka command palette. Ketik nama halaman, lalu Enter untuk langsung berpindah tanpa membuka menu satu per satu.'
          : 'Press Cmd/Ctrl + K to open the command palette. Type a page name, then hit Enter to jump without browsing every menu.',
        highlights: isId
          ? ['Shortcut universal: Cmd/Ctrl + K', 'Pencarian cepat menu dan halaman', 'Aman dipakai dari layar mana pun']
          : ['Universal shortcut: Cmd/Ctrl + K', 'Fast menu and page search', 'Works safely from any screen'],
        tip: isId ? 'Mulai dengan mengetik: dashboard, laporan, atau proses konsultasi.' : 'Start by typing: dashboard, reports, or consultation process.',
      },
      {
        eyebrow: isId ? 'Kontrol Tampilan' : 'Display Control',
        title: isId ? 'Atur Bahasa, A11y, dan Night Mode' : 'Set Language, A11y, and Night Mode',
        body: isId
          ? 'Buka Quick Settings di header untuk mengganti bahasa, mengaktifkan mode aksesibilitas, dan menyesuaikan tampilan terang/gelap sesuai kenyamanan kerja.'
          : 'Open Quick Settings in the header to switch language, enable accessibility mode, and tune light/dark appearance for comfort.',
        highlights: isId
          ? ['Bahasa ID/EN bisa diganti kapan saja', 'Mode A11y meningkatkan keterbacaan', 'Night mode untuk sesi kerja panjang']
          : ['Switch ID/EN anytime', 'A11y mode improves readability', 'Night mode for long work sessions'],
        tip: isId ? 'Jika teks terasa kecil atau ramai, aktifkan A11y terlebih dahulu.' : 'If text feels small or crowded, enable A11y first.',
      },
      {
        eyebrow: isId ? 'Alur Operasional' : 'Operational Flow',
        title: isId ? 'Pahami Urutan Kerja Harian' : 'Understand the Daily Work Sequence',
        body: isId
          ? 'Alur paling efisien: cek notifikasi, buka Proses Konsultasi untuk status tahap, lalu tindak lanjuti detail dokumen lewat menu Laporan.'
          : 'Most efficient sequence: check notifications, open Consultation Process for stage status, then handle document details in Reports.',
        highlights: isId
          ? ['Notifikasi sebagai prioritas tugas', 'Proses Konsultasi untuk tracking tahapan', 'Laporan untuk review, replace, delete, arsip']
          : ['Notifications as task priority', 'Consultation Process for stage tracking', 'Reports for review, replace, delete, archive'],
        tip: isId ? 'Gunakan filter/status untuk fokus ke item yang paling urgent.' : 'Use filters/status to focus on the most urgent items.',
      },
      {
        eyebrow: isId ? 'Panduan Peran' : 'Role Guidance',
        title: isId ? 'Prioritas Sesuai Role Anda' : 'Priorities for Your Role',
        body: roleGuide[role] || roleGuide.default,
        highlights: isId
          ? ['Setiap role memiliki hak aksi berbeda', 'Status dokumen menentukan tombol aksi', 'Arsip menandai finalisasi proses']
          : ['Each role has different action permissions', 'Document status controls available actions', 'Archive marks process finalization'],
        tip: isId ? 'Jika tombol tidak muncul, cek status dokumen dan role login Anda.' : 'If an action button is missing, check document status and your signed-in role.',
      },
      {
        eyebrow: isId ? 'Best Practice' : 'Best Practice',
        title: isId ? 'Checklist Sebelum Menutup Hari Kerja' : 'End-of-Day Checklist',
        body: isId
          ? 'Pastikan tidak ada notifikasi penting tertinggal, progres tahap sudah ter-update, dan dokumen review sudah disimpan/diarsipkan sesuai status.'
          : 'Ensure no important notifications are pending, stage progress is updated, and reviewed documents are saved/archived correctly.',
        highlights: isId
          ? ['Perbarui status setelah aksi dokumen', 'Selesaikan item review prioritas', 'Gunakan arsip untuk menutup siklus']
          : ['Update status after document actions', 'Finish priority review items', 'Use archive to close the cycle'],
        tip: isId ? 'Konsistensi update status membuat progres tim lebih akurat.' : 'Consistent status updates keep team progress accurate.',
      },
    ];
  }, [language, currentUser?.role]);

  useEffect(() => {
    if (!currentUser?.id) return;
    setOnboardingOpen(true);
  }, [currentUser?.id]);

  const closeOnboarding = () => {
    setOnboardingOpen(false);
    setOnboardingStep(0);
  };
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/dashboard': t('common.dashboard', 'Dashboard'),
      '/konsultasi': t('common.consultation', 'Konsultasi'),
      '/ajukan': t('menu.submitFollowUp', 'Ajukan Tindak Lanjut'),
      '/status-audit': t('common.auditStatus', 'Status Konsultasi'),
      '/proses-audit': t('common.auditProcess', 'Proses Konsultasi'),
      '/profil-spi': t('common.profileSPI', 'Profil SPI'),
      '/kelola-user': t('menu.userManagement', 'Kelola User'),
      '/buat-user': t('menu.createUser', 'Buat User Baru'),
      '/auditee-list': t('menu.auditeeList', 'Daftar Auditee'),
      '/profile': t('common.profileSettings', 'Pengaturan Profil'),
    };
    return titles[path] || t('common.dashboard', 'Dashboard');
  };

  const getRoleDisplay = () => {
    const role = currentUser?.role;
    const subRole = currentUser?.sub_role;
    if (role === 'auditee') {
      const unitKerja = currentUser?.unit || currentUser?.dept || '';
      return unitKerja ? `AUDITEE - ${unitKerja.toUpperCase()}` : 'AUDITEE';
    }
    if (role === 'auditor') return 'AUDITOR SPI';
    if (role === 'admin') return 'ADMIN';
    if (role === 'manajemen') {
      if (subRole === 'admin') return 'ADMIN';
      if (subRole === 'kspi') return 'KSPI';
      if (subRole === 'komite') return 'KOMITE AUDIT';
      return 'MANAJEMEN';
    }
    return 'USER';
  };

  return (
    <div className={`min-h-screen h-screen overflow-hidden transition-colors duration-300 ${isNightMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950' : 'bg-gradient-to-br from-[#f0f4ff] via-[#faf5ff] to-[#f0fdfa]'}`}>
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/28 lg:hidden"
        />
      )}
      <div className="lg:ml-[296px] h-screen flex flex-col overflow-hidden">
        {/* Modern Header */}
        <header className={`h-[72px] min-h-[72px] backdrop-blur-xl border-b px-3 sm:px-4 lg:px-8 flex items-center justify-between z-40 transition-colors duration-300 ${isNightMode ? 'bg-slate-900/80 border-slate-700/70' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka menu"
              className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${isNightMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <IconMenu className="w-5 h-5" />
            </button>
            <h2 className={`text-base sm:text-lg lg:text-xl font-bold truncate ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className={`relative w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${isNightMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Notifikasi"
              >
                <IconBell className="w-5 h-5" />
                {notifUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/40">
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className={`absolute right-0 mt-2 w-[360px] rounded-2xl border shadow-xl overflow-hidden z-50 ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <p className={`text-sm font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>{t('common.notifications', 'Notifikasi')}</p>
                    {notifUnread > 0 && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white">{notifUnread} new</span>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isNightMode ? 'border-slate-800 hover:bg-slate-800/70' : 'border-slate-100 hover:bg-slate-50'} ${isChatRole && item.conversationId ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <p className={`text-sm font-semibold truncate ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.title}</p>
                          <p className={`text-xs mt-0.5 truncate ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.subtitle}</p>
                          <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <IconClock className="w-3 h-3" />
                            {item.time}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-10 text-center">
                        <IconBell className={`w-8 h-8 mx-auto mb-2 ${isNightMode ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={`text-xs ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.noNotifications', 'Belum ada notifikasi terbaru.')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((prev) => !prev)}
                className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all inline-flex items-center gap-2 ${isNightMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Quick Settings"
              >
                <IconGear className="w-4 h-4" />
                <span className="hidden sm:inline">Quick</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isNightMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                  {language === 'id' ? 'ID' : 'EN'}
                </span>
                <IconChevronDown className={`w-3.5 h-3.5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {settingsOpen && (
                <div className={`absolute right-0 mt-2 w-[260px] rounded-2xl border shadow-xl overflow-hidden z-50 ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className={`px-4 py-3 border-b ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isNightMode ? 'text-slate-300' : 'text-slate-500'}`}>Quick Settings</p>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className={`rounded-xl border p-2.5 ${isNightMode ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                      <p className={`text-[11px] font-bold mb-2 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('common.language', 'Bahasa')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => language !== 'id' && toggleLanguage()}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${language === 'id' ? 'bg-indigo-600 text-white border-indigo-500' : (isNightMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}`}
                        >
                          ID
                        </button>
                        <button
                          type="button"
                          onClick={() => language !== 'en' && toggleLanguage()}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${language === 'en' ? 'bg-indigo-600 text-white border-indigo-500' : (isNightMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}`}
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleAccessibilityMode}
                      className={`w-full rounded-xl border px-3 py-2 text-left flex items-center justify-between transition-colors ${accessibilityMode ? 'bg-amber-500/15 border-amber-400 text-amber-700' : (isNightMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}`}
                    >
                      <span className="text-xs font-bold">{t('common.accessibility', 'Aksesibilitas')}</span>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${accessibilityMode ? 'bg-amber-500 text-white' : (isNightMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600')}`}>
                        {accessibilityMode ? t('ux.a11yOn', 'A11y On') : t('ux.a11yOff', 'A11y')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingOpen(true);
                        setSettingsOpen(false);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${isNightMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {t('common.onboarding', 'Panduan Awal')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsNightMode((prev) => !prev)}
              className={`hidden md:inline-flex relative items-center h-11 w-[142px] px-1.5 rounded-2xl border text-xs font-bold transition-all ${isNightMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title="Toggle Night Mode"
            >
              <span className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl transition-all duration-300 ${isNightMode ? 'left-[41px] bg-indigo-500/25' : 'left-[6px] bg-amber-100'}`} />
              <span className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isNightMode ? 'text-slate-500' : 'text-amber-600'}`}>
                <IconSun className="w-4 h-4" />
              </span>
              <span className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isNightMode ? 'text-indigo-300' : 'text-slate-400'}`}>
                <IconMoon className="w-4 h-4" />
              </span>
              <span className={`relative z-10 ml-1 pr-2 font-semibold text-sm ${isNightMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {isNightMode ? t('ux.darkMode', 'Night') : t('ux.lightMode', 'Light')}
              </span>
            </button>
            {/* User Profile */}
            <div className={`flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l ${isNightMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="hidden xl:block text-right">
                <p className={`text-sm font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {currentUser?.role === 'auditee' && currentUser?.isAnonymous ? 'Anonim' : (currentUser?.name || 'User')}
                </p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{getRoleDisplay()}</p>
              </div>
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${
                currentUser?.role === 'auditee' && currentUser?.isAnonymous
                  ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
              }`}>
                {currentUser?.role === 'auditee' && currentUser?.isAnonymous
                  ? <span className="text-lg">🎭</span>
                  : <IconUser className="w-5 h-5" />
                }
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
          {showUxTip && (
            <div className={`mb-5 rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${isNightMode ? 'bg-indigo-950/30 border-indigo-800 text-indigo-100' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
              <p className="text-sm font-medium">{t('ux.quickTip', 'Tip cepat: tekan Cmd/Ctrl + K untuk pindah halaman lebih cepat.')}</p>
              <button
                type="button"
                aria-label="Tutup tip"
                onClick={() => {
                  setShowUxTip(false);
                  localStorage.setItem('sikona-ux-tip-dismissed', '1');
                }}
                className={`text-xs font-bold px-2 py-1 rounded ${isNightMode ? 'bg-indigo-900/60 hover:bg-indigo-900' : 'bg-white hover:bg-indigo-100'}`}
              >
                {t('common.close', 'Tutup')}
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={() => setCommandOpen(false)}>
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`px-4 py-3 border-b ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <input
                ref={commandInputRef}
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder={t('ux.commandPlaceholder', 'Cari halaman...')}
                aria-label="Cari perintah"
                className={`w-full px-3 py-2 rounded-lg text-sm outline-none border ${isNightMode ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {filteredCommandItems.length > 0 ? filteredCommandItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setCommandOpen(false);
                    setCommandQuery('');
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${isNightMode ? 'border-slate-800 hover:bg-slate-800 text-slate-100' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className={`text-xs mt-0.5 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.path}</p>
                </button>
              )) : (
                <div className={`px-4 py-8 text-center text-sm ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('ux.noCommandResult', 'Tidak ada hasil untuk pencarian ini.')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {onboardingOpen && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-5 overflow-y-auto" onClick={() => closeOnboarding()}>
          <div
            className={`onboarding-premium-shell my-2 sm:my-0 w-full max-w-5xl max-h-[96vh] max-h-[96dvh] rounded-3xl border shadow-2xl overflow-y-auto lg:overflow-hidden ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Tutup panduan"
              onClick={() => closeOnboarding()}
              className={`lg:hidden sticky top-2 right-2 ml-auto mr-2 mt-2 z-20 w-9 h-9 rounded-full border flex items-center justify-center ${isNightMode ? 'bg-slate-900/90 border-slate-600 text-slate-200' : 'bg-white/90 border-slate-300 text-slate-700'}`}
            >
              <IconX className="w-4 h-4" />
            </button>
            <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className={`onboarding-premium-rail p-5 sm:p-6 border-b lg:border-b-0 lg:border-r ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <p className={`text-[11px] uppercase tracking-[0.22em] font-bold ${isNightMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  {language === 'id' ? 'Guide' : 'Guide'}
                </p>
                <h3 className={`text-xl font-bold mt-2 ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {t('ux.onboardingTitle', 'Panduan Awal SiKONA')}
                </h3>
                <p className={`text-sm mt-2 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {language === 'id'
                    ? 'Panduan langkah demi langkah untuk memastikan onboarding Anda cepat, rapi, dan siap produksi.'
                    : 'A step-by-step guide to keep your onboarding fast, structured, and production-ready.'}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  {onboardingSteps.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full ${idx <= onboardingStep ? 'bg-indigo-500' : (isNightMode ? 'bg-slate-700' : 'bg-slate-200')}`}
                    />
                  ))}
                </div>

                <p className={`text-xs mt-3 font-semibold ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {language === 'id'
                    ? `Langkah ${onboardingStep + 1} dari ${onboardingSteps.length}`
                    : `Step ${onboardingStep + 1} of ${onboardingSteps.length}`}
                </p>

                <div className="mt-5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {onboardingSteps.map((step, idx) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setOnboardingStep(idx)}
                      className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${idx === onboardingStep
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : (isNightMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{step.eyebrow}</p>
                      <p className="text-xs font-bold mt-0.5 line-clamp-2">{step.title}</p>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="flex flex-col min-h-[420px] sm:min-h-[520px]">
                <div className={`px-5 sm:px-7 py-5 border-b ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                    {onboardingSteps[onboardingStep]?.eyebrow}
                  </div>
                  <h4 className={`text-xl sm:text-2xl font-bold mt-3 leading-snug ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {onboardingSteps[onboardingStep]?.title}
                  </h4>
                  <p className={`text-sm sm:text-[15px] mt-3 leading-relaxed ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {onboardingSteps[onboardingStep]?.body}
                  </p>
                </div>

                <div className="px-5 sm:px-7 py-5 flex-1 overflow-y-auto">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {language === 'id' ? 'Checklist Praktis' : 'Practical Checklist'}
                  </p>
                  <div className="grid gap-2.5">
                    {onboardingSteps[onboardingStep]?.highlights?.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        className={`rounded-xl border px-3 py-2.5 flex items-start gap-3 ${isNightMode ? 'bg-slate-800/70 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        <span className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${isNightMode ? 'bg-indigo-500/25 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                          {idx + 1}
                        </span>
                        <p className="text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`mt-4 rounded-xl border px-4 py-3 ${isNightMode ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    <p className="text-xs uppercase tracking-wider font-bold">{language === 'id' ? 'Pro Tip' : 'Pro Tip'}</p>
                    <p className="text-sm font-semibold mt-1.5 leading-relaxed">{onboardingSteps[onboardingStep]?.tip}</p>
                  </div>
                </div>

                <div className={`px-5 sm:px-7 py-4 border-t flex flex-wrap items-center justify-between gap-2 ${isNightMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => closeOnboarding()}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${isNightMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {t('common.close', 'Tutup')}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => closeOnboarding()}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${isNightMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {t('ux.onboardingSkip', 'Lewati')}
                    </button>
                    {onboardingStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setOnboardingStep((prev) => Math.max(0, prev - 1))}
                        className={`px-3 py-2 rounded-lg text-xs font-bold ${isNightMode ? 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                      >
                        {t('common.back', 'Kembali')}
                      </button>
                    )}
                    {onboardingStep < onboardingSteps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setOnboardingStep((prev) => Math.min(onboardingSteps.length - 1, prev + 1))}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        {t('common.next', 'Lanjut')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => closeOnboarding()}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {t('common.finish', 'Selesai')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
