import { useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { IconArrowLeft, IconArrowRight, IconCheck, IconCheckCircle, IconUser, IconUsers, IconLock, IconEye, IconShieldCheck, IconUserPlus } from '../components/Icons';

const ROLES = [
  { value: 'auditor',   label: 'Auditor',   desc: 'Melakukan audit dan konsultasi pada unit kerja',   emoji: '🔍', gradient: 'from-emerald-500 to-teal-600',   ring: 'ring-emerald-400', bg: 'bg-emerald-50' },
  { value: 'auditee',   label: 'Auditee',   desc: 'Unit kerja yang menerima audit dan konsultasi',    emoji: '📋', gradient: 'from-blue-500 to-indigo-600',     ring: 'ring-blue-400',    bg: 'bg-blue-50' },
  { value: 'manajemen', label: 'Manajemen', desc: 'Pemantauan proses audit (KSPI & Komite)',           emoji: '👔', gradient: 'from-violet-500 to-purple-600',   ring: 'ring-violet-400',  bg: 'bg-violet-50' },
  { value: 'admin',     label: 'Admin',     desc: 'Admin — kelola user & pengaturan sistem',           emoji: '⚙️', gradient: 'from-amber-500 to-orange-600',    ring: 'ring-amber-400',   bg: 'bg-amber-50' },
];

const SUB_ROLES = {
  manajemen: [
    { value: 'kspi',         label: 'KSPI',         desc: 'Ketua SPI — memantau seluruh proses audit' },
    { value: 'komite',       label: 'Komite Audit', desc: 'Komite — pengawasan kinerja audit' },
  ],
};

const BIRO_OPTIONS = [
  'Perencanaan Audit',
  'Operasional & TI',
  'Keuangan & Fraud',
];


const STEPS = [
  { id: 1, title: 'Informasi Dasar', subtitle: 'Data personal' },
  { id: 2, title: 'Peran & Akses', subtitle: 'Role & penempatan' },
  { id: 3, title: 'Konfirmasi', subtitle: 'Review & simpan' },
];

const BuatUser = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    namaLengkap: '',
    email: '',
    password: '',
    konfirmasiPassword: '',
    role: '',
    subRole: '',
    biro: '',
    unit: '',
  });

  const [errors, setErrors] = useState({});

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (submitError) setSubmitError('');
  };

  // Password complexity regex: min 8, uppercase, lowercase, digit, special char
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Password strength
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

  const pwd = getPasswordStrength(form.password);

  // Validation
  const validateStep1 = () => {
    const e = {};
    if (!form.namaLengkap.trim()) e.namaLengkap = 'Nama lengkap wajib diisi';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
    if (!form.password) e.password = 'Password wajib diisi';
    else if (form.password.length < 8) e.password = 'Minimal 8 karakter';
    else if (!PASSWORD_REGEX.test(form.password)) e.password = 'Harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus';
    if (form.password !== form.konfirmasiPassword) e.konfirmasiPassword = 'Password tidak cocok';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.role) e.role = 'Pilih role terlebih dahulu';
    if (form.role === 'manajemen' && !form.subRole) e.subRole = 'Pilih sub-role';
    if (form.role === 'auditor' && !form.biro) e.biro = 'Pilih biro penempatan';
    if (form.role === 'auditee' && !form.unit) e.unit = 'Pilih unit kerja';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const normalizedRole = form.role === 'admin' ? 'manajemen' : form.role;
      const normalizedSubRole = form.role === 'admin'
        ? 'admin'
        : (normalizedRole === 'manajemen' ? (form.subRole || null) : null);

      const payload = {
        name: form.namaLengkap.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: normalizedRole,
        sub_role: normalizedSubRole,
        department: normalizedRole === 'auditee' ? form.unit.trim() : null,
        biro: normalizedRole === 'auditor' ? form.biro : null,
      };

      await userAPI.create(payload);
      setSuccess(true);
    } catch (error) {
      const errorBag = error?.response?.data?.errors;
      if (errorBag && typeof errorBag === 'object') {
        const mappedErrors = {};
        if (errorBag.name?.[0]) mappedErrors.namaLengkap = errorBag.name[0];
        if (errorBag.email?.[0]) mappedErrors.email = errorBag.email[0];
        if (errorBag.password?.[0]) mappedErrors.password = errorBag.password[0];
        if (errorBag.role?.[0]) mappedErrors.role = errorBag.role[0];
        if (errorBag.sub_role?.[0]) mappedErrors.subRole = errorBag.sub_role[0];
        if (errorBag.department?.[0]) mappedErrors.unit = errorBag.department[0];
        if (errorBag.biro?.[0]) mappedErrors.biro = errorBag.biro[0];
        setErrors(prev => ({ ...prev, ...mappedErrors }));
      }

      setSubmitError(
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        'Gagal membuat user. Periksa kembali data yang dimasukkan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = form.namaLengkap.trim()
    ? form.namaLengkap.trim().split(' ').map(n => n[0]?.toUpperCase()).slice(0, 2).join('')
    : '?';

  const selectedRole = ROLES.find(r => r.value === form.role);

  // Success State
  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center animate-fadeInUp max-w-md">
          {/* Success animation */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <IconCheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">User Berhasil Dibuat!</h2>
          <p className="text-slate-500 mb-6">
            Akun <span className="font-bold text-indigo-600">{form.namaLengkap}</span> telah berhasil dibuat dengan role <span className="font-bold text-indigo-600">{selectedRole?.label}</span>.
          </p>

          {/* Created User Card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 text-left border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${selectedRole?.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {initials}
              </div>
              <div>
                <p className="font-bold text-slate-800">{form.namaLengkap}</p>
                <p className="text-sm text-slate-400">{form.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedRole?.bg} text-slate-600`}>{selectedRole?.label}</span>
                  {form.subRole && <span className="px-2 py-0.5 bg-violet-50 rounded text-[10px] font-bold text-violet-600">{SUB_ROLES.manajemen.find(s => s.value === form.subRole)?.label}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setForm({ namaLengkap: '', email: '', password: '', konfirmasiPassword: '', role: '', subRole: '', biro: '', unit: '' });
                setStep(1);
                setSuccess(false);
                setErrors({});
                setSubmitError('');
              }}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <IconUserPlus className="w-4 h-4" />
              Buat User Lagi
            </button>
            <Link
              to="/kelola-user"
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              <IconUsers className="w-4 h-4" />
              Lihat Daftar User
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/kelola-user" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <IconArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat User Baru</h1>
          <p className="text-slate-500 text-sm">Tambahkan pengguna baru ke sistem SiKONA</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                {/* Step Circle */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step > s.id
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : step === s.id
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-110'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <IconCheck className="w-5 h-5" /> : s.id}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-bold ${step >= s.id ? 'text-slate-800' : 'text-slate-400'}`}>{s.title}</p>
                  <p className="text-[10px] text-slate-400">{s.subtitle}</p>
                </div>
              </div>
              {/* Connector Line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-4 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    step > s.id ? 'w-full bg-gradient-to-r from-emerald-400 to-teal-500' : 'w-0'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Step 1: Informasi Dasar */}
        {step === 1 && (
          <div className="p-6 space-y-5 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <IconUser className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Informasi Dasar</h3>
                <p className="text-xs text-slate-400">Masukkan data personal pengguna</p>
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <IconUserPlus className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Name */}
            <FormField label="Nama Lengkap" error={errors.namaLengkap} required>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={form.namaLengkap}
                onChange={e => updateForm('namaLengkap', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
                className={`form-input ${errors.namaLengkap ? 'border-red-400 focus:ring-red-500/30' : ''}`}
              />
            </FormField>

            {/* Email */}
            <FormField label="Email" error={errors.email} required>
              <input
                type="email"
                placeholder="nama@sikona.id"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className={`form-input ${errors.email ? 'border-red-400 focus:ring-red-500/30' : ''}`}
              />
            </FormField>

            {/* Password */}
            <FormField label="Password" error={errors.password} required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8: huruf besar, kecil, angka, karakter khusus"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  className={`form-input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-500/30' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <IconEye className="w-4 h-4" /> : <IconLock className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength Meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(l => (
                      <div key={l} className={`h-1.5 flex-1 rounded-full transition-all ${l <= pwd.level ? pwd.color : 'bg-slate-100'}`} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 ${pwd.color.replace('bg-', 'text-')}`}>{pwd.label}</p>
                </div>
              )}
            </FormField>

            {/* Confirm Password */}
            <FormField label="Konfirmasi Password" error={errors.konfirmasiPassword} required>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  value={form.konfirmasiPassword}
                  onChange={e => updateForm('konfirmasiPassword', e.target.value)}
                  className={`form-input pr-10 ${errors.konfirmasiPassword ? 'border-red-400 focus:ring-red-500/30' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <IconEye className="w-4 h-4" /> : <IconLock className="w-4 h-4" />}
                </button>
              </div>
              {form.konfirmasiPassword && form.password === form.konfirmasiPassword && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <IconCheckCircle className="w-3 h-3" /> Password cocok
                </p>
              )}
            </FormField>
          </div>
        )}

        {/* Step 2: Peran & Akses */}
        {step === 2 && (
          <div className="p-6 space-y-5 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <IconShieldCheck className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Peran & Akses</h3>
                <p className="text-xs text-slate-400">Tentukan role dan penempatan pengguna</p>
              </div>
            </div>

            {/* Role Selection Cards */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 block">
                Pilih Role <span className="text-red-400">*</span>
              </label>
              {errors.role && <p className="text-xs text-red-500 mb-2">{errors.role}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { updateForm('role', r.value); updateForm('subRole', ''); updateForm('biro', ''); updateForm('unit', ''); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.role === r.value
                        ? `border-transparent ring-2 ${r.ring} bg-gradient-to-br ${r.gradient} text-white shadow-lg`
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{r.emoji}</span>
                    <p className={`font-bold text-sm ${form.role === r.value ? 'text-white' : 'text-slate-800'}`}>{r.label}</p>
                    <p className={`text-[11px] mt-1 leading-snug ${form.role === r.value ? 'text-white/80' : 'text-slate-400'}`}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            {/* Sub-Role for Manajemen */}
            {form.role === 'manajemen' && (
              <div className="animate-fadeInUp">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 block">
                  Sub-Role Manajemen <span className="text-red-400">*</span>
                </label>
                {errors.subRole && <p className="text-xs text-red-500 mb-2">{errors.subRole}</p>}
                <div className="space-y-2">
                  {SUB_ROLES.manajemen.map(sr => (
                    <button
                      key={sr.value}
                      onClick={() => updateForm('subRole', sr.value)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        form.subRole === sr.value
                          ? 'border-violet-400 bg-violet-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                        form.subRole === sr.value ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {form.subRole === sr.value ? <IconCheck className="w-4 h-4" /> : sr.label[0]}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${form.subRole === sr.value ? 'text-violet-700' : 'text-slate-700'}`}>{sr.label}</p>
                        <p className="text-[10px] text-slate-400">{sr.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Biro Selection for Auditor */}
            {form.role === 'auditor' && (
              <div className="animate-fadeInUp">
                <FormField label="Biro Penempatan" error={errors.biro} required>
                  <select value={form.biro} onChange={e => updateForm('biro', e.target.value)} className={`form-input ${errors.biro ? 'border-red-400' : ''}`}>
                    <option value="">-- Pilih Biro --</option>
                    {BIRO_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </FormField>
              </div>
            )}

            {/* Unit Kerja for Auditee — free text */}
            {form.role === 'auditee' && (
              <div className="animate-fadeInUp">
                <FormField label="Unit Kerja" error={errors.unit} required>
                  <input
                    type="text"
                    placeholder="Ketik nama unit kerja, contoh: Bagian Keuangan"
                    value={form.unit}
                    onChange={e => updateForm('unit', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
                    className={`form-input ${errors.unit ? 'border-red-400 focus:ring-red-500/30' : ''}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Masukkan nama unit kerja / departemen Anda di perusahaan</p>
                </FormField>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Konfirmasi */}
        {step === 3 && (
          <div className="p-6 space-y-5 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Konfirmasi Data</h3>
                <p className="text-xs text-slate-400">Pastikan semua data sudah benar sebelum menyimpan</p>
              </div>
            </div>

            {/* User Preview Card */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start gap-5">
                <div className={`w-20 h-20 bg-gradient-to-br ${selectedRole?.gradient || 'from-indigo-500 to-purple-600'} rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-black text-slate-800">{form.namaLengkap || '-'}</h4>
                  <p className="text-sm text-slate-400 mb-3">{form.email || '-'}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedRole.bg} text-slate-700`}>
                        {selectedRole.emoji} {selectedRole.label}
                      </span>
                    )}
                    {form.subRole && (
                      <span className="px-3 py-1 bg-violet-100 rounded-lg text-xs font-bold text-violet-700">
                        {SUB_ROLES.manajemen.find(s => s.value === form.subRole)?.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-4">
              <ReviewItem label="Nama Lengkap" value={form.namaLengkap} />
              <ReviewItem label="Email" value={form.email} />
              <ReviewItem label="Role" value={selectedRole?.label || '-'} />
              <ReviewItem label={form.role === 'auditor' ? 'Biro' : form.role === 'auditee' ? 'Unit Kerja' : 'Sub-Role'} value={form.biro || form.unit || (form.subRole ? SUB_ROLES.manajemen.find(s => s.value === form.subRole)?.label : '-')} />
              <ReviewItem label="Password" value={'•'.repeat(form.password.length)} />
              <ReviewItem label="Kekuatan Password" value={pwd.label} highlight={pwd.color.replace('bg-', 'text-')} />
            </div>

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Perhatian</p>
                <p className="text-xs text-amber-600 mt-0.5">Pastikan email dan password sudah benar. User yang dibuat dapat langsung login ke sistem SiKONA.</p>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600 font-medium">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button onClick={prevStep} className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all text-sm flex items-center gap-2">
              <IconArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          ) : (
            <Link to="/kelola-user" className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all text-sm flex items-center gap-2">
              <IconArrowLeft className="w-4 h-4" />
              Batal
            </Link>
          )}

          {step < 3 ? (
            <button onClick={nextStep} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm flex items-center gap-2">
              Lanjutkan
              <IconArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <IconCheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Form Field
const FormField = ({ label, error, required, children }) => (
  <div>
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

// Review Item
const ReviewItem = ({ label, value, highlight }) => (
  <div className="bg-white rounded-xl p-3 border border-slate-100">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-sm font-bold ${highlight || 'text-slate-800'}`}>{value || '-'}</p>
  </div>
);

export default BuatUser;
