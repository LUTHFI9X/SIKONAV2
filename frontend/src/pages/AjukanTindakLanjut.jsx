import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conversationAPI, messageAPI } from '../services/api';
import {
  IconPaperPlane, IconClock, IconUser, IconBriefcase, IconTag,
  IconFileAlt, IconPaperclip, IconCloudUpload, IconX, IconChevronDown,
  IconLock
} from '../components/Icons';

const AjukanTindakLanjut = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUser = user;
  const [auditors, setAuditors] = useState([]);
  const OPERATION_START_MINUTES = (7 * 60) + 45;
  const OPERATION_END_MINUTES = (16 * 60) + 30;
  
  const [formData, setFormData] = useState({
    nama: currentUser?.name || '',
    unit: currentUser?.department || currentUser?.unit || currentUser?.dept || '',
    kategori: '',
    subject: '',
    uraian: '',
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const selectedAuditor = auditors.find((a) => a.biro === formData.kategori);
  const currentMinutes = (currentTime.getHours() * 60) + currentTime.getMinutes();
  const withinOperationalHours = currentMinutes >= OPERATION_START_MINUTES && currentMinutes <= OPERATION_END_MINUTES;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const fetchAuditors = async () => {
      try {
        const response = await conversationAPI.getAvailableAuditors();
        setAuditors(response.data?.auditors || []);
      } catch (error) {
        console.error('Failed to fetch auditors:', error);
      }
    };

    fetchAuditors();

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      nama: currentUser?.name || '',
      unit: currentUser?.department || currentUser?.unit || currentUser?.dept || '',
    }));
  }, [currentUser]);

  const formatDateTime = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kategori || !formData.subject.trim() || !formData.uraian) {
      alert('Silakan lengkapi kategori, subject/judul, dan uraian permasalahan');
      return;
    }

    if (!selectedAuditor) {
      alert('Auditor untuk biro ini tidak ditemukan.');
      return;
    }

    if (!withinOperationalHours) {
      alert('Pengajuan hanya dapat dilakukan pada jam operasional 07:45 - 16:30.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const convResponse = await conversationAPI.create(
        selectedAuditor.id,
        formData.subject.trim(),
        { is_anonymous: currentUser?.isAnonymous === true }
      );
      const conversationId = convResponse.data?.conversation?.id;

      if (!conversationId) {
        throw new Error('Conversation tidak terbentuk.');
      }

      await messageAPI.send(conversationId, formData.uraian, file || null);
      alert('Konsultasi berhasil dikirim!');
      setIsSubmitting(false);
      navigate('/konsultasi');
    } catch (error) {
      console.error('Submit konsultasi gagal:', error);
      alert('Gagal mengirim konsultasi. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    document.getElementById('ajukanFile').value = '';
  };

  return (
    <div className="animate-fadeInUp">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <IconPaperPlane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Ajukan Tindak Lanjut</h3>
              <p className="text-sm text-slate-500">Sampaikan permasalahan Anda ke tim auditor</p>
            </div>
          </div>

          {/* Waktu Realtime */}
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 mb-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <IconClock className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Pengiriman</p>
              <p className="text-sm font-bold text-indigo-600">{formatDateTime(currentTime)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <IconUser className="w-4 h-4 mr-1 text-indigo-400 inline" /> Nama
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.nama}
                  className="form-input bg-slate-300/80 cursor-not-allowed font-semibold text-slate-500 border-slate-300 pr-10 select-none" 
                  readOnly 
                  disabled
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IconLock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <IconLock className="w-3 h-3" /> Terisi otomatis dari akun login Anda
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <IconBriefcase className="w-4 h-4 mr-1 text-indigo-400 inline" /> Unit Kerja
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.unit}
                  className="form-input bg-slate-300/80 cursor-not-allowed font-semibold text-slate-500 border-slate-300 uppercase pr-10 select-none" 
                  readOnly 
                  disabled
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IconLock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <IconLock className="w-3 h-3" /> Terisi otomatis dari akun login Anda
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <IconTag className="w-4 h-4 mr-1 text-indigo-400 inline" /> Kategori Konsultasi
              </label>
              <div className="relative">
                <select 
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="form-input appearance-none cursor-pointer pr-12"
                >
                  <option value="">Pilih Kategori</option>
                  {auditors.map((auditor) => (
                    <option key={auditor.id} value={auditor.biro}>{auditor.biro}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <IconChevronDown className="w-4 h-4" />
                </div>
              </div>
              {formData.kategori && (
                <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                  withinOperationalHours
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${withinOperationalHours ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  {withinOperationalHours ? 'Konsultasi tersedia pada jam operasional (07:45 - 16:30).' : 'Saat ini di luar jam operasional (07:45 - 16:30).'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Subject / Judul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="form-input"
                placeholder="Contoh: Permintaan Klarifikasi Prosedur Pengadaan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <IconFileAlt className="w-4 h-4 mr-1 text-indigo-400 inline" /> Uraian Permasalahan <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={formData.uraian}
                onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                rows="5" 
                className="form-input resize-none" 
                placeholder="Jelaskan masalah atau pertanyaan Anda..."
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <IconPaperclip className="w-4 h-4 mr-1 text-indigo-400 inline" /> Lampiran (opsional)
              </label>
              <input 
                type="file" 
                id="ajukanFile" 
                className="hidden" 
                accept=".pdf,.doc,.docx,image/*" 
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => document.getElementById('ajukanFile').click()} 
                  className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 text-sm font-bold text-slate-600 group"
                >
                  <IconCloudUpload className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>Upload File</span>
                  <span className="text-[11px] font-normal text-slate-400">(PDF, DOC, Foto)</span>
                </button>
                {file && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg text-sm text-indigo-600">
                    <IconFileAlt className="w-4 h-4" />
                    <span className="font-medium">{file.name}</span>
                    <button type="button" onClick={clearFile} className="text-red-500 hover:text-red-600">
                      <IconX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting || !withinOperationalHours}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : !withinOperationalHours ? (
                  <>
                    <IconClock className="w-4 h-4" />
                    Di Luar Jam Operasional
                  </>
                ) : (
                  <>
                    <IconPaperPlane className="w-4 h-4" /> Kirim Konsultasi
                  </>
                )}
              </button>
              {!withinOperationalHours && (
                <p className="text-[11px] text-red-500 mt-2 font-semibold text-center">
                  Pengajuan terkunci. Silakan kirim pada jam 07:45 - 16:30.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjukanTindakLanjut;
