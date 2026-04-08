import { useEffect, useState } from 'react';
import { IconTarget, IconBolt } from '../components/Icons';
import { spiAPI } from '../services/api';

const ProfilSPI = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const spiLogo = `${baseUrl}images/logo-spi-mark.png`;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await spiAPI.get();
        setProfile(response.data?.profile || null);
      } catch (error) {
        console.error('Failed to fetch SPI profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const visi = profile?.visi || 'Visi belum diatur.';
  const misi = profile?.misi || 'Misi belum diatur.';
  const struktur = profile?.struktur_organisasi || [];
  const kontak = {
    alamat: profile?.alamat || '-',
    telepon: profile?.telepon || '-',
    email: profile?.email || '-',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-transparent flex items-center justify-center">
            <img src={spiLogo} alt="Logo SPI" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500">Corporate Identity</p>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Profil SPI</h1>
            <p className="text-slate-500 text-sm">Satuan Pengawasan Intern - ringkas, profesional, dan berintegritas</p>
          </div>
        </div>
      </div>

      {/* Visi Misi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><IconTarget className="w-5 h-5" /></span>
            Visi
          </h3>
          <p className="text-slate-600 leading-relaxed">{visi}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><IconBolt className="w-5 h-5" /></span>
            Misi
          </h3>
          <p className="text-slate-600 leading-relaxed">{misi}</p>
        </div>
      </div>

      {/* Struktur Organisasi */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Struktur Organisasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {struktur.map((item, idx) => (
            <div key={idx} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center p-2 bg-white border border-slate-200/70">
                <img src={spiLogo} alt="Logo SPI" className="w-full h-full object-contain" />
              </div>
              <h4 className="font-bold text-slate-800">{item.nama || '-'}</h4>
              <p className="text-sm text-slate-500">{item.jabatan || '-'}</p>
            </div>
          ))}
          {struktur.length === 0 && (
            <div className="md:col-span-2 lg:col-span-4 text-center text-slate-500 py-6 text-sm">Struktur organisasi belum diisi.</div>
          )}
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Kontak</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-semibold">AD</div>
            <div>
              <p className="text-sm text-slate-500">Alamat</p>
              <p className="font-medium text-slate-800">{kontak.alamat}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-semibold">TLP</div>
            <div>
              <p className="text-sm text-slate-500">Telepon</p>
              <p className="font-medium text-slate-800">{kontak.telepon}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-semibold">EM</div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-800">{kontak.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilSPI;
