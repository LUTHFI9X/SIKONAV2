import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UXContext = createContext(null);

const DICTIONARY = {
  id: {
    common: {
      dashboard: 'Dashboard',
      consultation: 'Konsultasi',
      auditStatus: 'Status Konsultasi',
      auditProcess: 'Proses Konsultasi',
      reports: 'Laporan',
      profileSPI: 'Profil SPI',
      profileSettings: 'Pengaturan Profil',
      logout: 'Keluar',
      notifications: 'Notifikasi',
      noNotifications: 'Belum ada notifikasi terbaru.',
      search: 'Cari...',
      close: 'Tutup',
      back: 'Kembali',
      next: 'Lanjut',
      finish: 'Selesai',
      language: 'Bahasa',
      accessibility: 'Aksesibilitas',
      onboarding: 'Panduan Awal',
    },
    menu: {
      askAuditor: 'Tanya Auditor',
      submitFollowUp: 'Ajukan Tindak Lanjut',
      auditeeList: 'Daftar Auditee',
      userManagement: 'Kelola User',
      createUser: 'Buat User Baru',
      roleAccess: 'Role & Hak Akses',
      activityLog: 'Log Aktivitas',
      systemSettings: 'Pengaturan Sistem',
      backupRestore: 'Backup & Restore',
      mainMenu: 'Menu Utama',
      systemMenu: 'Kelola Sistem',
    },
    ux: {
      quickTip: 'Tip cepat: tekan Cmd/Ctrl + K untuk pindah halaman lebih cepat.',
      commandPlaceholder: 'Cari halaman...',
      noCommandResult: 'Tidak ada hasil untuk pencarian ini.',
      darkMode: 'Night',
      lightMode: 'Light',
      langButton: 'ID',
      a11yOn: 'A11y On',
      a11yOff: 'A11y',
      onboardingTitle: 'Panduan Awal SiKONA',
      onboardingIntro: 'Fitur utama untuk membantu Anda mulai lebih cepat.',
      onboardingStep1Title: 'Navigasi Cepat',
      onboardingStep1Body: 'Gunakan Cmd/Ctrl + K untuk membuka command palette dan lompat ke halaman tujuan.',
      onboardingStep2Title: 'Kontrol Tampilan',
      onboardingStep2Body: 'Ubah Light/Night mode dan aktifkan A11y untuk teks lebih nyaman dibaca.',
      onboardingStep3Title: 'Alur Kerja Harian',
      onboardingStep3Body: 'Pantau notifikasi di kanan atas, lalu lanjutkan proses dari menu utama di sidebar.',
      onboardingSkip: 'Lewati',
      onboardingOpen: 'Panduan',
      onboardingDontShow: 'Jangan tampilkan lagi',
    },
  },
  en: {
    common: {
      dashboard: 'Dashboard',
      consultation: 'Consultation',
      auditStatus: 'Consultation Status',
      auditProcess: 'Consultation Process',
      reports: 'Reports',
      profileSPI: 'SPI Profile',
      profileSettings: 'Profile Settings',
      logout: 'Sign Out',
      notifications: 'Notifications',
      noNotifications: 'No recent notifications.',
      search: 'Search...',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      language: 'Language',
      accessibility: 'Accessibility',
      onboarding: 'Onboarding',
    },
    menu: {
      askAuditor: 'Ask Auditor',
      submitFollowUp: 'Submit Follow-up',
      auditeeList: 'Auditee List',
      userManagement: 'User Management',
      createUser: 'Create User',
      roleAccess: 'Role & Access',
      activityLog: 'Activity Log',
      systemSettings: 'System Settings',
      backupRestore: 'Backup & Restore',
      mainMenu: 'Main Menu',
      systemMenu: 'System Management',
    },
    ux: {
      quickTip: 'Quick tip: press Cmd/Ctrl + K to jump between pages faster.',
      commandPlaceholder: 'Search pages...',
      noCommandResult: 'No results found for this query.',
      darkMode: 'Night',
      lightMode: 'Light',
      langButton: 'EN',
      a11yOn: 'A11y On',
      a11yOff: 'A11y',
      onboardingTitle: 'SiKONA Quick Onboarding',
      onboardingIntro: 'Core features to help you get started quickly.',
      onboardingStep1Title: 'Quick Navigation',
      onboardingStep1Body: 'Use Cmd/Ctrl + K to open the command palette and jump to a page instantly.',
      onboardingStep2Title: 'Display Controls',
      onboardingStep2Body: 'Switch Light/Night mode and enable A11y mode for more readable text.',
      onboardingStep3Title: 'Daily Workflow',
      onboardingStep3Body: 'Check notifications in the header, then continue from the sidebar main menu.',
      onboardingSkip: 'Skip',
      onboardingOpen: 'Guide',
      onboardingDontShow: 'Do not show again',
    },
  },
};

const resolveMessage = (lang, key, fallback = '') => {
  const source = DICTIONARY[lang] || DICTIONARY.id;
  const value = key.split('.').reduce((acc, part) => (acc && acc[part] ? acc[part] : null), source);
  return typeof value === 'string' ? value : fallback || key;
};

export const UXProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('sikona-language') || 'id');
  const [accessibilityMode, setAccessibilityMode] = useState(() => localStorage.getItem('sikona-a11y') === '1');

  useEffect(() => {
    localStorage.setItem('sikona-language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('sikona-a11y', accessibilityMode ? '1' : '0');
    document.documentElement.classList.toggle('accessibility-mode', accessibilityMode);

    return () => {
      document.documentElement.classList.remove('accessibility-mode');
    };
  }, [accessibilityMode]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((prev) => (prev === 'id' ? 'en' : 'id')),
    accessibilityMode,
    setAccessibilityMode,
    toggleAccessibilityMode: () => setAccessibilityMode((prev) => !prev),
    t: (key, fallback = '') => resolveMessage(language, key, fallback),
  }), [language, accessibilityMode]);

  return <UXContext.Provider value={value}>{children}</UXContext.Provider>;
};

export const useUX = () => {
  const context = useContext(UXContext);
  if (!context) throw new Error('useUX must be used within UXProvider');
  return context;
};
