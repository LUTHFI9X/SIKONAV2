// ═══════════════════════════════════════════════════════════════
// SiKONA Brand Logo Component
// Recreated SVG matching brand identity:
//   - Gear cog (top-left, grey/blue)
//   - Clipboard/document (tilted, blue-purple)
//   - Magnifying glass + checkmark (center, purple-pink gradient ring)
//   - Bar chart ascending (right, gradient)
//   - Rising arrow with swoosh (pink-purple)
//   - Curved ribbon at bottom
//   - "SiKONA" text with gradient "O"
// ═══════════════════════════════════════════════════════════════

/**
 * Brand Icon only (no text)
 * @param {object} props - { size: number, className: string }
 */
export const SikonaIcon = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="skGradPurplePink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="50%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#d946ef"/>
      </linearGradient>
      <linearGradient id="skGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="50%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="skGradPink" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#ec4899"/>
      </linearGradient>
      <linearGradient id="skGradBar" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#ec4899"/>
      </linearGradient>
      <linearGradient id="skGradGear" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569"/>
        <stop offset="100%" stopColor="#64748b"/>
      </linearGradient>
    </defs>

    {/* ── Gear cog (top-left) ── */}
    <g transform="translate(8, 2) scale(1.1)">
      <path d="M28,4 L32,4 L34,10 L40,7 L43,11 L38,16 L43,21 L40,25 L34,23 L32,28 L28,28 L26,23 L20,25 L17,21 L22,16 L17,11 L20,7 L26,10 Z" 
        fill="url(#skGradGear)"/>
      <circle cx="30" cy="16" r="5" fill="#1e293b"/>
    </g>

    {/* ── Clipboard / document (tilted, behind) ── */}
    <g transform="translate(62, 2) rotate(15, 25, 30)">
      <rect x="0" y="0" width="50" height="65" rx="7" fill="url(#skGradBlue)" opacity="0.75"/>
      {/* Clip tab */}
      <rect x="14" y="-4" width="22" height="10" rx="3" fill="url(#skGradBlue)" opacity="0.9"/>
      {/* Lines */}
      <rect x="10" y="16" width="30" height="3.5" rx="1.75" fill="white" opacity="0.35"/>
      <rect x="10" y="24" width="22" height="3" rx="1.5" fill="white" opacity="0.25"/>
      <rect x="10" y="31" width="26" height="3" rx="1.5" fill="white" opacity="0.2"/>
      {/* Checkmark on clipboard */}
      <path d="M15 42 L20 47 L32 35" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3"/>
    </g>

    {/* ── Bar chart (right side, ascending) ── */}
    <rect x="142" y="88" width="13" height="32" rx="3.5" fill="url(#skGradBar)" opacity="0.5"/>
    <rect x="160" y="62" width="13" height="58" rx="3.5" fill="url(#skGradBar)" opacity="0.7"/>
    <rect x="178" y="36" width="13" height="84" rx="3.5" fill="url(#skGradBar)" opacity="0.9"/>

    {/* ── Rising arrow (swooping curve + arrowhead) ── */}
    <path d="M30,172 Q75,148 115,115 Q140,94 160,60 L176,32" 
      stroke="url(#skGradPink)" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <polygon points="180,22 188,38 174,34" fill="#ec4899"/>

    {/* ── Magnifying glass (center focal point) ── */}
    {/* Glass body */}
    <circle cx="82" cy="108" r="37" fill="white"/>
    <circle cx="82" cy="108" r="37" fill="none" stroke="url(#skGradPurplePink)" strokeWidth="8"/>
    {/* Handle */}
    <line x1="54" y1="135" x2="24" y2="166" stroke="url(#skGradPurplePink)" strokeWidth="13" strokeLinecap="round"/>
    {/* Checkmark inside */}
    <path d="M62 110 L75 123 L103 90" stroke="url(#skGradPurplePink)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

    {/* ── Bottom swoosh ribbon ── */}
    <path d="M8,185 Q55,162 108,172 Q148,180 195,158" 
      stroke="url(#skGradPurplePink)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.35"/>
    <path d="M12,194 Q65,175 118,183 Q155,190 192,172" 
      stroke="url(#skGradPink)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.2"/>
  </svg>
);


/**
 * Brand Logo with "SiKONA" text (vertical layout — icon above text)
 * For poster/left panel login
 * @param {object} props - { iconSize, className }
 */
export const SikonaLogoVertical = ({ iconSize = 140, className = '' }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <SikonaIcon size={iconSize} className="drop-shadow-2xl" />
    <SikonaWordmark size="text-5xl" className="mt-2" />
    <p className="text-sm font-bold text-violet-300/70 uppercase tracking-[0.3em] mt-1">
      Sistem Konsultasi Audit
    </p>
  </div>
);


/**
 * Brand Logo horizontal (icon + text side by side)
 * For sidebar
 * @param {object} props - { iconSize, className }
 */
export const SikonaLogoHorizontal = ({ iconSize = 44, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <SikonaIcon size={iconSize} className="drop-shadow-xl flex-shrink-0" />
    <div className="min-w-0">
      <SikonaWordmark size="text-xl" />
      <p className="text-violet-400/70 text-[10px] font-semibold tracking-wider mt-0.5">Sistem Konsultasi Audit</p>
    </div>
  </div>
);


/**
 * Brand Banner (horizontal bar — purple bg, icon + SiKONA + v1.0)
 * For above login form
 * @param {object} props - { className }
 */
export const SikonaBanner = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <SikonaIcon size={48} className="flex-shrink-0 drop-shadow-lg" />
    <div className="min-w-0">
      <SikonaWordmark size="text-2xl" dark={true} />
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-0.5">Sistem Konsultasi Audit</p>
    </div>
  </div>
);


/**
 * SiKONA wordmark — "Si" dark/white + "K" dark/white + "O" gradient pink-purple + "NA" dark/white
 * @param {object} props - { size, dark (for light bg), className }
 */
export const SikonaWordmark = ({ size = 'text-4xl', dark = false, className = '' }) => (
  <span className={`font-black tracking-tight ${size} ${className}`}>
    <span className={dark ? 'text-slate-900' : 'text-white'}>Si</span>
    <span className={dark ? 'text-slate-900' : 'text-white'}>K</span>
    <svg viewBox="0 0 60 60" className="inline-block" style={{ width: '0.75em', height: '0.75em', verticalAlign: 'baseline', marginBottom: '-0.04em' }}>
      <defs>
        <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#d946ef"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <mask id="oMask">
          <circle cx="30" cy="30" r="28" fill="white"/>
          <circle cx="30" cy="30" r="16" fill="black"/>
        </mask>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#oGrad)" mask="url(#oMask)"/>
    </svg>
    <span className={dark ? 'text-slate-900' : 'text-white'}>NA</span>
  </span>
);


export default SikonaIcon;
