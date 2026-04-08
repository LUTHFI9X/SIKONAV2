import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { IconLock, IconShield, IconEye, IconCheckCircle, IconExclamationCircle } from './Icons';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ForcePasswordChange = () => {
  const { mustChangePassword, passwordExpired, clearPasswordFlags } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mustChangePassword && !passwordExpired) return null;

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Lemah', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Cukup', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'Baik', color: 'bg-blue-500' };
    return { level: 4, label: 'Kuat', color: 'bg-emerald-500' };
  };

  const pwd = getStrength(newPassword);

  const checks = [
    { label: 'Minimal 8 karakter', pass: newPassword.length >= 8 },
    { label: 'Huruf besar (A-Z)', pass: /[A-Z]/.test(newPassword) },
    { label: 'Huruf kecil (a-z)', pass: /[a-z]/.test(newPassword) },
    { label: 'Angka (0-9)', pass: /[0-9]/.test(newPassword) },
    { label: 'Karakter khusus', pass: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPassword.trim()) {
      setError('Password lama wajib diisi.');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Password baru harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (oldPassword === newPassword) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.updatePassword({
        current_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      clearPasswordFlags();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setError(
        errors?.current_password?.[0] ||
        errors?.password?.[0] ||
        err?.response?.data?.message ||
        'Gagal mengubah password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <IconShield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {passwordExpired ? 'Password Kedaluwarsa' : 'Ganti Password'}
              </h2>
              <p className="text-amber-100 text-xs">
                {passwordExpired
                  ? 'Password Anda telah melewati masa berlaku 90 hari.'
                  : 'Anda harus mengganti password sebelum melanjutkan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <IconExclamationCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Old Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password Lama</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showOld ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Min 8: huruf besar, kecil, angka, spesial"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showNew ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
              </button>
            </div>
            {/* Strength Meter */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className={`h-1.5 flex-1 rounded-full transition-all ${l <= pwd.level ? pwd.color : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className={`text-[10px] font-semibold mt-1 ${pwd.color.replace('bg-', 'text-')}`}>{pwd.label}</p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Ulangi password baru"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showConfirm ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
              </button>
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                <IconCheckCircle className="w-3 h-3" /> Password cocok
              </p>
            )}
          </div>

          {/* Complexity Checklist */}
          {newPassword && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Persyaratan</p>
              <div className="grid grid-cols-2 gap-1.5">
                {checks.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${c.pass ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {c.pass && <IconCheckCircle className="w-2 h-2 text-white" />}
                    </div>
                    <span className={`text-[10px] ${c.pass ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <IconLock className="w-4 h-4" />
                Ubah Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
