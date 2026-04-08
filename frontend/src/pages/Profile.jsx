import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IconLock, IconSave, IconEye, IconCheckCircle, IconExclamationCircle } from '../components/Icons';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const Profile = () => {
  const { user } = useAuth();
  const currentUser = user;
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    oldPass: '',
    newPass: '',
    confirmPass: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password strength calculator
  const getPasswordStrength = (pw) => {
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

  const pwd = getPasswordStrength(formData.newPass);

  // Password complexity requirements checklist
  const passwordChecks = [
    { label: 'Minimal 8 karakter', pass: formData.newPass.length >= 8 },
    { label: 'Huruf besar (A-Z)', pass: /[A-Z]/.test(formData.newPass) },
    { label: 'Huruf kecil (a-z)', pass: /[a-z]/.test(formData.newPass) },
    { label: 'Angka (0-9)', pass: /[0-9]/.test(formData.newPass) },
    { label: 'Karakter khusus (!@#$...)', pass: /[^A-Za-z0-9]/.test(formData.newPass) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (formData.newPass && formData.newPass !== formData.confirmPass) {
      setPasswordError('Password baru tidak cocok dengan konfirmasi!');
      return;
    }
    
    if (formData.newPass && !PASSWORD_REGEX.test(formData.newPass)) {
      setPasswordError('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.');
      return;
    }

    if (formData.newPass && !formData.oldPass) {
      setPasswordError('Password lama wajib diisi untuk mengganti password.');
      return;
    }

    setIsSubmitting(true);
    // Simulate save
    setTimeout(() => {
      alert('Profil berhasil diperbarui!');
      setIsSubmitting(false);
      setFormData({ ...formData, oldPass: '', newPass: '', confirmPass: '' });
      setPasswordError('');
    }, 1000);
  };

  const getAvatarColor = () => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="animate-fadeInUp">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-8">
          <div className="flex items-center gap-6 mb-8 border-b pb-8">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl bg-gradient-to-br ${getAvatarColor()}`}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800">{currentUser?.name || 'User'}</h3>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-1">
                {currentUser?.role === 'auditor' ? `Auditor SPI - ${currentUser?.biro || 'Aktif'}` : 'Pengguna Aktif'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Username / Nama
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  className="form-input"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Jabatan
                </label>
                <input 
                  type="text" 
                  value={currentUser?.role === 'auditor' ? 'Auditor Internal' : 'Pengguna'}
                  className="form-input bg-slate-100" 
                  readOnly
                />
              </div>
            </div>

            <div className="pt-6 border-t">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <IconLock className="w-4 h-4 text-indigo-500 inline" /> Ganti Password
              </h4>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 mb-4">
                  <IconExclamationCircle className="w-4 h-4 flex-shrink-0" />{passwordError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Password Lama
                  </label>
                  <div className="relative">
                    <input 
                      type={showOldPass ? 'text' : 'password'} 
                      value={formData.oldPass}
                      onChange={(e) => setFormData({ ...formData, oldPass: e.target.value })}
                      className="form-input pr-10" 
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                      {showOldPass ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPass ? 'text' : 'password'} 
                        value={formData.newPass}
                        onChange={(e) => setFormData({ ...formData, newPass: e.target.value })}
                        className="form-input pr-10" 
                        placeholder="Min 8 karakter kompleks"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                        {showNewPass ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {/* Strength Meter */}
                    {formData.newPass && (
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
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPass ? 'text' : 'password'} 
                        value={formData.confirmPass}
                        onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                        className="form-input pr-10" 
                        placeholder="Ulangi password baru"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                        {showConfirmPass ? <IconEye className="w-4 h-4" /> : <IconLock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {formData.confirmPass && formData.newPass === formData.confirmPass && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                        <IconCheckCircle className="w-3 h-3" /> Password cocok
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Complexity Checklist */}
                {formData.newPass && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Persyaratan Password</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {passwordChecks.map((check, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${check.pass ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            {check.pass && <IconCheckCircle className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={`text-[11px] ${check.pass ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconSave className="w-4 h-4" /> Simpan Perubahan
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
