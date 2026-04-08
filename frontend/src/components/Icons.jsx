/**
 * SiKONA SVG Icon Library
 * Professional inline SVG icons to replace Font Awesome
 * All icons accept className for sizing/coloring via Tailwind
 */

// Helper: creates a standardized SVG wrapper
const SvgIcon = ({ children, className = 'w-5 h-5', viewBox = '0 0 24 24', fill = 'none', ...props }) => (
  <svg className={className} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
);

// ═══════════════════════════════════════════
// NAVIGATION & UI
// ═══════════════════════════════════════════

export const IconDashboard = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconMessage = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSend = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconPaperPlane = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconChartBar = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconListCheck = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconBuilding = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconUsers = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconUserPlus = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconUsersGear = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="11" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 8v1m0 4v1m-2.5-4.5l.87.5m3.26 1.88l.87.5m-5-.5l.87-.5m3.26-1.88l.87-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconGear = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconLogout = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// STATUS & INDICATORS
// ═══════════════════════════════════════════

export const IconCheck = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconCheckCircle = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconClock = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSpinner = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconXCircle = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M15 9l-6 6m0-6l6 6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconX = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconInfoCircle = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconExclamationCircle = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSignal = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// FILES & DOCUMENTS
// ═══════════════════════════════════════════

export const IconFileAlt = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconFolder = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconFolderOpen = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconCloudUpload = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M16 16l-4-4-4 4M12 12v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconPaperclip = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSave = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════

export const IconEye = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconTrash = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSearch = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconArrowLeft = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconArrowRight = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconChevronDown = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconChevronUp = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconChevronRight = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// IDENTITY & ROLES
// ═══════════════════════════════════════════

export const IconUser = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconUserTie = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 11l-2 10h4l-2-10z" fill="currentColor" opacity="0.3"/>
  </SvgIcon>
);

export const IconUserShield = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M15 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 8l2 1v4c0 2.5-2 4.5-4 5.5-2-1-4-3-4-5.5V9l4-1 2 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconUserGroup = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconBriefcase = ({ className }) => (
  <SvgIcon className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// SECURITY & SHIELD
// ═══════════════════════════════════════════

export const IconShield = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconShieldCheck = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconLock = ({ className }) => (
  <SvgIcon className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// MISC & SPECIAL
// ═══════════════════════════════════════════

export const IconBolt = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconTag = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconInbox = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 12h-6l-2 3H10l-2-3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconArchive = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 8v13H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 3h22v5H1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconLayerGroup = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconListUl = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconEnvelope = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconStickyNote = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconClipboardList = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconChartPie = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21.21 15.89A10 10 0 118 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12A10 10 0 0012 2v10h10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconTools = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconHardHat = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M2 18h20M4 18v-4a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconComments = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconRefresh = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// WELCOME & GREETING (replaces emoji)
// ═══════════════════════════════════════════

export const IconWave = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18.8 8.1l-1.5-2.6c-.5-.8-1.5-1.1-2.3-.6s-1.1 1.5-.6 2.3l.8 1.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.2 4.2l-1-1.7c-.5-.8-1.5-1.1-2.3-.6s-1.1 1.5-.6 2.3l2.5 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.6 5c-.5-.8-1.5-1.1-2.3-.6S7.2 5.9 7.7 6.7l1.5 2.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.9 8.3c-.5-.8-1.5-1.1-2.3-.6s-1.1 1.5-.6 2.3l3.5 6c1.5 2.6 4.8 3.5 7.4 2s3.5-4.8 2-7.4l-2-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconTarget = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconCrown = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M2 16l4-8 4 4 4-8 4 8 4-4v8H2v-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M2 20h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconLightbulb = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M9 21h6M12 3a6 6 0 014 10.5V17H8v-3.5A6 6 0 0112 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconMedal = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M15.477 12.89l1.523 8.11L12 18l-5 3 1.523-8.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ═══════════════════════════════════════════
// ADDITIONAL ICONS (Dashboard & Konsultasi Redesign)
// ═══════════════════════════════════════════

export const IconCalendar = ({ className }) => (
  <SvgIcon className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconTrendUp = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconActivity = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconBell = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconFilter = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconMessageSquare = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconPhone = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconZap = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconAward = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconPieChart = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21.21 15.89A10 10 0 118 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12A10 10 0 0012 2v10h10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconBarChart2 = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconHash = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconStar = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconHeadphones = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M3 18v-6a9 9 0 0118 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

// ─── Admin System Icons ───

export const IconHistory = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSliders = ({ className }) => (
  <SvgIcon className={className}>
    <line x1="4" y1="21" x2="4" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4" y1="10" x2="4" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="8" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="21" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="12" x2="20" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="14" x2="7" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="17" y1="16" x2="23" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconDatabase = ({ className }) => (
  <SvgIcon className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconDownload = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconUpload = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);

export const IconKey = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconToggle = ({ className }) => (
  <SvgIcon className={className}>
    <rect x="1" y="5" width="22" height="14" rx="7" stroke="currentColor" strokeWidth="2"/>
    <circle cx="16" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </SvgIcon>
);

export const IconMoon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </SvgIcon>
);

export const IconSun = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </SvgIcon>
);
