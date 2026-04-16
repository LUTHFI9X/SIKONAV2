import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import {
  IconClock, IconShield, IconBolt, IconUser, IconUserTie,
  IconUsers, IconExclamationCircle,
  IconUserShield, IconBriefcase, IconLock, IconArrowRight, IconWave,
  IconCheckCircle, IconEye
} from '../components/Icons';

const Login = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const peruriLogoPng = `${baseUrl}images/logo-peruri.png`;
  const spiMarkLogo = `${baseUrl}images/logo-spi-mark.png`;
  const sikonaLogoPng = `${baseUrl}images/SiKONA_logo_transparent.png`;
  const sikonaIconPng = `${baseUrl}images/SiKONA_icon_transparent.png`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('auditee');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginOptions, setLoginOptions] = useState({ admins: [], auditors: [], managements: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('night-mode');
    document.body.classList.add('login-active');
    document.getElementById('root')?.classList.add('login-root-active');

    const fetchLoginOptions = async () => {
      setOptionsLoading(true);
      try {
        const response = await authAPI.loginOptions();
        setLoginOptions({
          admins: response.data?.admins || [],
          auditors: response.data?.auditors || [],
          managements: response.data?.managements || [],
        });
      } catch {
        setLoginOptions({ admins: [], auditors: [], managements: [] });
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchLoginOptions();

    return () => {
      document.body.classList.remove('login-active');
      document.getElementById('root')?.classList.remove('login-root-active');
    };
  }, []);

  const roleAccountOptions = useMemo(() => {
    if (selectedRole === 'auditor') return loginOptions.auditors;
    if (selectedRole === 'manajemen') return loginOptions.managements;
    if (selectedRole === 'admin') return loginOptions.admins;
    return [];
  }, [loginOptions, selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalEmail = email.trim();

    if (!finalEmail) {
      setError('Email wajib diisi atau dipilih.');
      return;
    }

    if (!password.trim()) {
      setError('Password wajib diisi');
      return;
    }

    setLoading(true);

    try {
      await login({
        email: finalEmail,
        password,
        role: selectedRole,
        is_anonymous: selectedRole === 'auditee' ? isAnonymous : false,
      });
      navigate('/dashboard');
    } catch (err) {
      const message =
        err?.response?.data?.errors?.credentials?.[0] ||
        err?.response?.data?.message ||
        'Login gagal. Periksa kembali kredensial Anda.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const roles = [
    { id: 'auditee', label: 'Auditee', Icon: IconUser, desc: 'Unit Kerja' },
    { id: 'auditor', label: 'Auditor', Icon: IconUserTie, desc: 'Tim Audit SPI' },
    { id: 'manajemen', label: 'Manajemen', Icon: IconUsers, desc: 'KSPI / Komite' },
    { id: 'admin', label: 'Admin', Icon: IconUserShield, desc: 'Admin' },
  ];

  return (
    <div className="login-page min-h-screen flex bg-slate-100 overflow-x-hidden">
      {/* ═══ LEFT PANEL — VISUAL BRANDING ═══ */}
      <div className="hidden md:flex flex-1 relative overflow-hidden login-brand-panel">
        {/* Background image with Ken Burns slow zoom */}
        <div className="absolute inset-0">
          <img src={`${baseUrl}images/aa05749d-f5a0-4fd5-8970-361ccf5837c4.webp`} alt="" className="w-full h-full object-cover opacity-36 saturate-95 contrast-105 brightness-78" />
        </div>
        {/* Transparent blur gradient overlay */}
        <div className="absolute inset-0 backdrop-blur-[1.5px]" style={{
          background: 'linear-gradient(135deg, rgba(2,6,23,0.82) 0%, rgba(29,39,106,0.68) 34%, rgba(45,55,140,0.62) 60%, rgba(35,65,135,0.58) 82%, rgba(2,6,23,0.86) 100%)'
        }}></div>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(60% 55% at 28% 30%, rgba(99,102,241,0.2) 0%, transparent 70%), radial-gradient(45% 45% at 78% 22%, rgba(79,70,229,0.14) 0%, transparent 72%), radial-gradient(55% 55% at 72% 78%, rgba(37,99,235,0.16) 0%, transparent 72%)'
        }}></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="w-full max-w-2xl px-10 py-12 bg-transparent">
            {/* Logo Poster — with breathing glow */}
            <div className="relative mb-10">
              <div className="relative z-10">
                <div className="flex flex-col items-center">
                  <img
                    src={sikonaLogoPng}
                    alt="SiKONA"
                    className="w-[340px] max-w-[72vw] h-auto object-contain drop-shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = sikonaIconPng;
                    }}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-slate-100 uppercase tracking-[0.3em] mt-1">Sistem Konsultasi Audit</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-base text-white/95 text-center max-w-sm leading-relaxed mx-auto">
              Platform konsultasi audit internal yang aman, terstruktur, dan siap mendukung eksekusi operasional harian.
            </p>

            {/* Feature cards */}
            <div className="flex items-center justify-center gap-0 mt-14">
                {[
                  { icon: <IconClock className="w-7 h-7" />, title: '07:45 - 16:30', desc: 'Jam Operasional' },
                  { icon: <IconShield className="w-7 h-7" />, title: 'Compliant', desc: 'Audit Trail Aktif' },
                  { icon: <IconBolt className="w-7 h-7" />, title: 'Efficient', desc: 'Workflow Cepat' },
                ].map((item, i) => (
                <div key={i} className="flex items-center">
                  {i > 0 && <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-10 flex-shrink-0"></div>}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-white mb-2">{item.icon}</span>
                    <p className="text-sm font-semibold text-white tracking-wide">{item.title}</p>
                    <p className="text-[11px] text-slate-200/90 mt-0.5 italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — LOGIN FORM ═══ */}
      <div className="login-right-panel login-enterprise-surface w-full md:w-[540px] lg:w-[560px] bg-gradient-to-b from-slate-100 via-white to-slate-100 flex flex-col relative overflow-y-auto">
        {/* Mobile header */}
        <div className="login-mobile-header md:hidden p-4 sm:p-5">
          <div className="flex items-center justify-center gap-3">
            <img src={peruriLogoPng} alt="PERURI" className="h-8 w-auto object-contain flex-shrink-0" />
            <div className="w-px h-9 bg-gradient-to-b from-transparent via-violet-200/60 to-transparent flex-shrink-0"></div>
            <div className="min-w-0">
              <img
                src={sikonaLogoPng}
                alt="SiKONA"
                className="h-9 w-auto object-contain"
              />
              <p className="text-[9px] font-semibold text-violet-100/90 uppercase tracking-[0.14em] mt-0.5 whitespace-nowrap">
                Sistem Konsultasi Audit
              </p>
            </div>
          </div>
        </div>

        <div className="login-form-wrap relative z-10 flex-1 flex items-start md:items-start 2xl:items-center justify-center p-3 sm:p-5 lg:p-8">
          <div className="w-full max-w-[400px] md:max-w-md pb-2 lg:pb-0 login-enterprise-content">

            {/* ─── Co-branded Header ─── */}
            <div className="hidden md:block mb-8">
              <div className="flex items-center justify-center gap-5">
                {/* PERURI Logo */}
                <div className="flex-shrink-0">
                  <img src={peruriLogoPng} alt="PERURI" className="h-10 object-contain" />
                </div>
                
                {/* Gradient Divider */}
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-300 to-transparent flex-shrink-0"></div>
                
                {/* SiKONA Brand */}
                <div className="min-w-0">
                  <img
                    src={sikonaLogoPng}
                    alt="SiKONA"
                    className="h-12 w-auto object-contain"
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Sistem Konsultasi Audit</p>
                </div>
              </div>

              {/* Gradient line below */}
              <div className="h-px bg-gradient-to-r from-[#2f3796]/45 via-[#5863c8]/40 to-[#9b6bff]/45 mt-6 rounded-full"></div>
            </div>

            {/* ─── Welcome Section ─── */}
            <div className="login-welcome mb-7 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 inline-flex items-center gap-2.5">
                Selamat Datang <IconWave className="w-7 h-7 text-[#8f6fff]" />
              </h2>
              <p className="text-slate-500 text-sm mt-1.5">Pilih peran Anda dan masuk ke dashboard kerja secara aman.</p>
            </div>

            {/* ─── Security Warning Banner ─── */}
            <div className="login-security-note bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
              <div className="flex items-start gap-2.5">
                <IconShield className="w-4 h-4 text-[#3f4cae] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Sistem ini hanya untuk pengguna yang berwenang. Akses tidak sah akan dicatat dan dapat ditindaklanjuti secara hukum.
                </p>
              </div>
            </div>

            {/* ─── Gradient Separator ─── */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>

            {/* ─── Role Selector Cards ─── */}
            <div className="login-role-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
              {roles.map((r) => {
                const isActive = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id)}
                    className={`relative p-3.5 rounded-xl text-center transition-all duration-300 border-2 group ${
                      isActive
                        ? 'bg-gradient-to-b from-[#eef0ff] to-white border-[#6772d9] shadow-sm shadow-[#6772d9]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-9 h-9 mx-auto mb-2 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-gradient-to-r from-[#2f3796] to-[#6f67e8] text-white shadow-md shadow-[#5f63d8]/35' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      <r.Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-xs font-bold transition-colors ${isActive ? 'text-[#3b48aa]' : 'text-slate-600'}`}>{r.label}</p>
                    <p className={`text-[9px] mt-0.5 transition-colors ${isActive ? 'text-[#7f87de]' : 'text-slate-400'}`}>{r.desc}</p>
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-[#4b59c7] to-[#9b6bff] rounded-full flex items-center justify-center shadow-md">
                        <IconCheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeInUp">
                  <IconExclamationCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              {(selectedRole === 'auditor' || selectedRole === 'manajemen') && (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <IconBriefcase className="w-3.5 h-3.5 text-[#6370d2]" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                      placeholder="nama@perusahaan.id"
                    />
                  </div>
                </>
              )}

              {/* Admin - Email + Password */}
              {selectedRole === 'admin' && (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <IconBriefcase className="w-3.5 h-3.5 text-[#6370d2]" /> Email Admin
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                      placeholder="admin@sikona.id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <IconLock className="w-3.5 h-3.5 text-[#6370d2]" /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full py-3 px-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                        {showPassword ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Password for Auditor/Manajemen */}
              {(selectedRole === 'auditor' || selectedRole === 'manajemen') && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <IconLock className="w-3.5 h-3.5 text-[#6370d2]" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3 px-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                      {showPassword ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Auditee - Departemen (wajib juga untuk anonim) */}
              {selectedRole === 'auditee' && (
                <>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <IconBriefcase className="w-3.5 h-3.5 text-[#6370d2]" /> Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                      placeholder="nama@perusahaan.id"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <IconLock className="w-3.5 h-3.5 text-[#6370d2]" /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full py-3 px-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6571d3] focus:bg-white focus:ring-2 focus:ring-[#6571d3]/20 transition-all"
                        placeholder="Masukkan password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                        {showPassword ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Anonim Checkbox */}
                  <div className={`p-3.5 rounded-xl border-2 transition-all duration-200 ${
                    isAnonymous 
                      ? 'bg-[#eef0ff] border-[#7a84df]' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mt-0.5 w-4.5 h-4.5 rounded-md border-2 border-slate-300 text-[#4f5dcc] focus:ring-[#4f5dcc] focus:ring-offset-0 cursor-pointer accent-[#4f5dcc]"
                      />
                      <div>
                        <span className={`text-sm font-bold ${isAnonymous ? 'text-[#3a46a2]' : 'text-slate-700'}`}>
                          Kirim sebagai Anonim
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          {isAnonymous 
                            ? 'Nama Anda akan disembunyikan dari auditor. Unit kerja tetap ditampilkan.'
                            : 'Centang untuk menyembunyikan nama Anda dari auditor saat konsultasi.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 mt-4 bg-gradient-to-r from-[#1f276f] via-[#2e3796] to-[#6f63e9] bg-[length:200%_auto] hover:bg-right text-white font-bold rounded-xl shadow-lg shadow-[#2e3796]/25 hover:shadow-[#2e3796]/40 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <IconArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4 mb-3"></div>

            {/* Bottom footer */}
            <div className="mx-auto flex items-center justify-center gap-3 pt-1 pb-2">
              <img src={spiMarkLogo} alt="SPI" className="h-[42px] object-contain" />
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                © {new Date().getFullYear()} Satuan Pengawasan Intern
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
