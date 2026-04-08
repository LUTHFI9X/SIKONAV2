import { useEffect, useState } from 'react';
import { systemSettingsAPI } from '../services/api';
import {
  IconSliders, IconSave, IconCheckCircle, IconBuilding, IconGear,
  IconCloudUpload, IconBell, IconShieldCheck, IconInfoCircle, IconToggle
} from '../components/Icons';

const PengaturanSistem = () => {
  const [settings, setSettings] = useState({
    namaInstansi: 'Satuan Pengawasan Intern (SPI)',
    emailAdmin: 'admin@spi.go.id',
    periodeAudit: 'Q1 2026',
    maxUploadSize: '10',
    allowedFileTypes: 'PDF, DOC, DOCX, PNG, JPG',
    sessionTimeout: '30',
    maintenanceMode: false,
    emailNotification: true,
    autoBackup: true,
    backupFrequency: 'daily',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
  });
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const [saved, setSaved] = useState(false);

  const mapApiToUi = (raw) => ({
    namaInstansi: raw?.nama_instansi || 'Satuan Pengawasan Intern (SPI)',
    emailAdmin: raw?.email_admin || '',
    periodeAudit: raw?.periode_audit || '',
    maxUploadSize: String(raw?.max_upload_size_mb ?? 10),
    allowedFileTypes: raw?.allowed_file_types || 'PDF, DOC, DOCX, PNG, JPG',
    sessionTimeout: String(raw?.session_timeout_minutes ?? 30),
    maintenanceMode: !!raw?.maintenance_mode,
    emailNotification: !!raw?.email_notification,
    autoBackup: !!raw?.auto_backup,
    backupFrequency: raw?.backup_frequency || 'daily',
    maxLoginAttempts: String(raw?.max_login_attempts ?? 5),
    passwordMinLength: String(raw?.password_min_length ?? 8),
  });

  const mapUiToApi = (raw) => ({
    nama_instansi: raw.namaInstansi,
    email_admin: raw.emailAdmin || null,
    periode_audit: raw.periodeAudit || null,
    max_upload_size_mb: Number(raw.maxUploadSize || 10),
    allowed_file_types: raw.allowedFileTypes,
    session_timeout_minutes: Number(raw.sessionTimeout || 30),
    maintenance_mode: !!raw.maintenanceMode,
    email_notification: !!raw.emailNotification,
    auto_backup: !!raw.autoBackup,
    backup_frequency: raw.backupFrequency,
    max_login_attempts: Number(raw.maxLoginAttempts || 5),
    password_min_length: Number(raw.passwordMinLength || 8),
  });

  useEffect(() => {
    let alive = true;

    const fetchSettings = async () => {
      try {
        const response = await systemSettingsAPI.get();
        if (!alive) return;
        const mapped = mapApiToUi(response.data?.settings);
        setSettings((prev) => (isDirty ? prev : mapped));
      } catch (error) {
        console.error('Gagal memuat pengaturan sistem:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchSettings();
    const poller = setInterval(fetchSettings, 5000);

    return () => {
      alive = false;
      clearInterval(poller);
    };
  }, [isDirty]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const payload = mapUiToApi(settings);
      await systemSettingsAPI.update(payload);
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
      alert(error?.response?.data?.message || 'Gagal menyimpan pengaturan sistem.');
    }
  };

  const SettingGroup = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );

  const InputField = ({ label, description, value, onChange, type = 'text', suffix }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-64 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
        {suffix && <span className="text-xs text-slate-400 font-medium">{suffix}</span>}
      </div>
    </div>
  );

  const ToggleField = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? 'bg-indigo-500' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${value ? 'left-[26px]' : 'left-0.5'}`}></div>
      </button>
    </div>
  );

  const SelectField = ({ label, description, value, onChange, options }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeInUp pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
              <IconSliders className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <span className="text-indigo-300 text-[10px] font-medium uppercase tracking-wider">Konfigurasi</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Pengaturan Sistem</h1>
          <p className="text-indigo-200/50 text-[11px] mt-0.5">Kelola konfigurasi umum aplikasi SiKONA</p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 text-xs text-slate-500">
          Memuat pengaturan terbaru dari server...
        </div>
      )}

      {/* Informasi Instansi */}
      <SettingGroup title="Informasi Instansi" icon={<IconBuilding className="w-4 h-4 text-white" />}>
        <InputField label="Nama Instansi" description="Nama organisasi yang ditampilkan di aplikasi" value={settings.namaInstansi} onChange={(v) => handleChange('namaInstansi', v)} />
        <InputField label="Email Admin" description="Email untuk notifikasi sistem" value={settings.emailAdmin} onChange={(v) => handleChange('emailAdmin', v)} type="email" />
        <InputField label="Periode Audit Aktif" description="Periode audit yang sedang berjalan" value={settings.periodeAudit} onChange={(v) => handleChange('periodeAudit', v)} />
      </SettingGroup>

      {/* Upload & File */}
      <SettingGroup title="Upload & File" icon={<IconCloudUpload className="w-4 h-4 text-white" />}>
        <InputField label="Ukuran Upload Maksimal" description="Batas ukuran file yang diizinkan" value={settings.maxUploadSize} onChange={(v) => handleChange('maxUploadSize', v)} type="number" suffix="MB" />
        <InputField label="Tipe File Diizinkan" description="Format dokumen yang bisa diupload" value={settings.allowedFileTypes} onChange={(v) => handleChange('allowedFileTypes', v)} />
      </SettingGroup>

      {/* Keamanan */}
      <SettingGroup title="Keamanan" icon={<IconShieldCheck className="w-4 h-4 text-white" />}>
        <InputField label="Session Timeout" description="Durasi sesi login sebelum otomatis keluar" value={settings.sessionTimeout} onChange={(v) => handleChange('sessionTimeout', v)} type="number" suffix="menit" />
        <InputField label="Maksimal Percobaan Login" description="Jumlah percobaan login gagal sebelum akun dikunci" value={settings.maxLoginAttempts} onChange={(v) => handleChange('maxLoginAttempts', v)} type="number" suffix="kali" />
        <InputField label="Panjang Password Minimal" description="Jumlah karakter minimum untuk password" value={settings.passwordMinLength} onChange={(v) => handleChange('passwordMinLength', v)} type="number" suffix="karakter" />
      </SettingGroup>

      {/* Notifikasi & Sistem */}
      <SettingGroup title="Notifikasi & Sistem" icon={<IconBell className="w-4 h-4 text-white" />}>
        <ToggleField label="Notifikasi Email" description="Kirim notifikasi email saat ada aktivitas penting" value={settings.emailNotification} onChange={(v) => handleChange('emailNotification', v)} />
        <ToggleField label="Auto Backup" description="Backup otomatis database secara berkala" value={settings.autoBackup} onChange={(v) => handleChange('autoBackup', v)} />
        {settings.autoBackup && (
          <SelectField label="Frekuensi Backup" description="Seberapa sering backup otomatis dijalankan" value={settings.backupFrequency} onChange={(v) => handleChange('backupFrequency', v)} options={[
            { value: 'daily', label: 'Setiap Hari' },
            { value: 'weekly', label: 'Setiap Minggu' },
            { value: 'monthly', label: 'Setiap Bulan' },
          ]} />
        )}
        <ToggleField label="Mode Maintenance" description="Aktifkan mode maintenance — user non-admin tidak bisa login" value={settings.maintenanceMode} onChange={(v) => handleChange('maintenanceMode', v)} />
      </SettingGroup>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <IconSave className="w-5 h-5" />
          Simpan Pengaturan
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 animate-fadeInUp">
            <IconCheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold">Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PengaturanSistem;
