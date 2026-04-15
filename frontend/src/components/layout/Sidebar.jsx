import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUX } from '../../contexts/UXContext';
import { conversationAPI } from '../../services/api';
import {
  IconDashboard, IconMessage, IconPaperPlane, IconChartBar, IconListCheck,
  IconBuilding, IconUserGroup, IconUsersGear, IconUserPlus, IconGear, IconLogout,
  IconHistory, IconSliders, IconKey, IconDatabase, IconFileAlt, IconX
} from '../Icons';
import { SikonaWordmark } from '../SikonaLogo';

const Sidebar = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useUX();
  const navigate = useNavigate();
  const currentUser = user;
  const [konsultasiUnread, setKonsultasiUnread] = useState(0);
  const baseUrl = import.meta.env.BASE_URL || '/';
  const sikonaLogoSvg = `${baseUrl}images/logo_final_exact_palette.svg`;
  const sikonaLogoFallback = `${baseUrl}images/SiKONA_logo_transparent.png`;

  const handleLogout = async () => {
    if (typeof onClose === 'function') onClose();
    await logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => {
    if (typeof onClose === 'function') onClose();
  };

  useEffect(() => {
    const role = currentUser?.role;
    if (role !== 'auditee' && role !== 'auditor') {
      setKonsultasiUnread(0);
      return;
    }

    let active = true;

    const fetchUnread = async () => {
      try {
        const response = await conversationAPI.getAll();
        const conversations = response.data?.conversations || [];
        const totalUnread = conversations.reduce((sum, conv) => {
          const latest = conv?.latest_message;
          if (!latest) return sum;

          const isOwnMessage = Number(latest.sender_id) === Number(currentUser?.id);
          const isRead = latest.is_read === true || Number(latest.is_read) === 1;
          return sum + (!isOwnMessage && !isRead ? 1 : 0);
        }, 0);

        if (!active) return;
        setKonsultasiUnread(totalUnread);
      } catch {
        if (!active) return;
        setKonsultasiUnread(0);
      }
    };

    fetchUnread();
    const poller = setInterval(fetchUnread, 4000);
    const onFocus = () => fetchUnread();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [currentUser?.id, currentUser?.role]);

  const getMenuItems = () => {
    const role = currentUser?.role;
    const subRole = currentUser?.sub_role;
    const isAdminLike = role === 'admin' || (role === 'manajemen' && subRole === 'admin');

    const baseItems = [
      { path: '/dashboard', Icon: IconDashboard, label: t('common.dashboard', 'Dashboard'), iconHover: 'group-hover:scale-110' }
    ];

    if (role === 'auditee') {
      return [
        ...baseItems,
        { path: '/konsultasi', Icon: IconMessage, label: t('menu.askAuditor', 'Tanya Auditor'), iconHover: 'group-hover:-translate-y-0.5 group-hover:scale-110' },
        { path: '/ajukan', Icon: IconPaperPlane, label: t('menu.submitFollowUp', 'Ajukan Tindak Lanjut'), iconHover: 'group-hover:translate-x-1' },
        { path: '/status-audit', Icon: IconChartBar, label: t('common.auditStatus', 'Status Audit'), iconHover: 'group-hover:scale-110' },
        { path: '/proses-audit', Icon: IconListCheck, label: t('common.auditProcess', 'Proses Audit'), iconHover: 'group-hover:-rotate-6 group-hover:scale-110' },
        { path: '/profil-spi', Icon: IconBuilding, label: t('common.profileSPI', 'Profil SPI'), iconHover: 'group-hover:-translate-y-0.5' },
      ];
    }
    if (role === 'auditor') {
      return [
        ...baseItems,
        { path: '/konsultasi', Icon: IconMessage, label: t('common.consultation', 'Konsultasi'), iconHover: 'group-hover:-translate-y-0.5 group-hover:scale-110' },
        { path: '/auditee-list', Icon: IconUserGroup, label: t('menu.auditeeList', 'Daftar Auditee'), iconHover: 'group-hover:scale-110' },
        { path: '/status-audit', Icon: IconChartBar, label: t('common.auditStatus', 'Status Audit'), iconHover: 'group-hover:scale-110' },
        { path: '/proses-audit', Icon: IconListCheck, label: t('common.auditProcess', 'Proses Audit'), iconHover: 'group-hover:-rotate-6 group-hover:scale-110' },
        { path: '/laporan', Icon: IconFileAlt, label: t('common.reports', 'Laporan'), iconHover: 'group-hover:scale-110' },
        { path: '/profil-spi', Icon: IconBuilding, label: t('common.profileSPI', 'Profil SPI'), iconHover: 'group-hover:-translate-y-0.5' },
      ];
    }
    if (isAdminLike) {
      return [
        ...baseItems,
        { path: '/kelola-user', Icon: IconUsersGear, label: t('menu.userManagement', 'Kelola User'), isAdmin: true, iconHover: 'group-hover:rotate-90' },
        { path: '/buat-user', Icon: IconUserPlus, label: t('menu.createUser', 'Buat User Baru'), isAdmin: true, iconHover: 'group-hover:scale-110' },
        { path: '/manajemen-role', Icon: IconKey, label: t('menu.roleAccess', 'Role & Hak Akses'), isAdmin: true, iconHover: 'group-hover:scale-110' },
        { path: '/log-aktivitas', Icon: IconHistory, label: t('menu.activityLog', 'Log Aktivitas'), isAdmin: true, iconHover: 'group-hover:-rotate-45' },
        { path: '/pengaturan-sistem', Icon: IconSliders, label: t('menu.systemSettings', 'Pengaturan Sistem'), isAdmin: true, iconHover: 'group-hover:scale-110' },
        { path: '/backup-restore', Icon: IconDatabase, label: t('menu.backupRestore', 'Backup & Restore'), isAdmin: true, iconHover: 'group-hover:scale-110' },
      ];
    }
    if (role === 'manajemen') {
      // Komite Audit: hanya Dashboard performa
      if (subRole === 'komite') {
        return [...baseItems];
      }
      // KSPI: monitoring laporan & audit (tanpa Konsultasi)
      return [
        ...baseItems,
        { path: '/status-audit', Icon: IconChartBar, label: t('common.auditStatus', 'Status Audit'), iconHover: 'group-hover:scale-110' },
        { path: '/proses-audit', Icon: IconListCheck, label: t('common.auditProcess', 'Proses Audit'), iconHover: 'group-hover:-rotate-6 group-hover:scale-110' },
        { path: '/laporan', Icon: IconFileAlt, label: t('common.reports', 'Laporan'), iconHover: 'group-hover:scale-110' },
        { path: '/profil-spi', Icon: IconBuilding, label: t('common.profileSPI', 'Profil SPI'), iconHover: 'group-hover:-translate-y-0.5' },
      ];
    }
    return baseItems;
  };

  const menuItems = getMenuItems();
  const mainMenuItems = menuItems.filter(item => !item.isAdmin);
  const adminMenuItems = menuItems.filter(item => item.isAdmin);

  return (
    <aside className={`sidebar z-[120] transform-gpu transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0 shadow-2xl shadow-slate-950/45' : '-translate-x-full'} lg:translate-x-0 lg:shadow-none`}>
      {/* Logo Section */}
      <div className="p-5 mb-2 relative">
        <button
          type="button"
          onClick={closeMobileSidebar}
          aria-label="Tutup sidebar"
          className="lg:hidden absolute top-3 right-3 w-8 h-8 rounded-lg border border-violet-400/25 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 flex items-center justify-center"
        >
          <IconX className="w-4 h-4" />
        </button>
        <div className="flex items-center justify-center gap-3">
          <img
            src={sikonaLogoSvg}
            alt="SiKONA"
            className="h-12 w-auto object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = sikonaLogoFallback;
            }}
          />
          <div className="min-w-0">
            <SikonaWordmark size="text-xl" />
            <p className="text-violet-400/70 text-[10px] font-semibold tracking-wider mt-0.5">Sistem Konsultasi Audit</p>
          </div>
        </div>
        {/* Separator line with glow */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin">
        {mainMenuItems.map((item, index) => (
          <div key={item.path}>
            {index === 1 && (
              <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-violet-400/50 select-none flex items-center gap-2">
                <span className="flex-1 h-px bg-gradient-to-r from-violet-500/20 to-transparent"></span>
                <span>{t('menu.mainMenu', 'Menu Utama')}</span>
                <span className="flex-1 h-px bg-gradient-to-l from-violet-500/20 to-transparent"></span>
              </div>
            )}
            <NavLink
              to={item.path}
              onClick={closeMobileSidebar}
              className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
            >
              <item.Icon className={`w-5 h-5 transition-transform duration-300 ${item.iconHover || ''}`} />
              <span className="flex-1">{item.label}</span>
              {item.path === '/konsultasi' && konsultasiUnread > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/30">
                  {konsultasiUnread > 99 ? '99+' : konsultasiUnread}
                </span>
              )}
            </NavLink>
          </div>
        ))}
        
        {/* Admin Menu Section */}
        {adminMenuItems.length > 0 && (
          <>
            <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-violet-400/50 select-none flex items-center gap-2">
              <span className="flex-1 h-px bg-gradient-to-r from-violet-500/20 to-transparent"></span>
              <span>{t('menu.systemMenu', 'Kelola Sistem')}</span>
              <span className="flex-1 h-px bg-gradient-to-l from-violet-500/20 to-transparent"></span>
            </div>
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
              >
                <item.Icon className={`w-5 h-5 transition-transform duration-300 ${item.iconHover || ''}`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      
      {/* Bottom Section */}
      <div className="p-4 border-t border-violet-500/10 space-y-1 relative">
        {/* Top glow line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        
        {(currentUser?.role === 'auditor' || currentUser?.role === 'admin' || (currentUser?.role === 'manajemen' && currentUser?.sub_role === 'admin')) && (
          <NavLink 
            to="/profile" 
            onClick={closeMobileSidebar}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-violet-300 hover:bg-violet-500/10 hover:text-white rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm group ${isActive ? 'bg-violet-500/10 text-white' : ''}`}
          >
            <IconGear className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            <span>{t('common.profileSettings', 'Pengaturan Profil')}</span>
          </NavLink>
        )}
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400/80 hover:bg-red-500/10 hover:text-red-300 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm group"
        >
          <IconLogout className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          <span>{t('common.logout', 'Keluar')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
