import React, { useRef, useState } from 'react';
import { EventSettings, Memory, TabType } from '../../types';

interface HomeScreenProps {
  eventSettings: EventSettings;
  guestName: string;
  guestTable: string;
  onUpdateGuest: (name: string, table: string) => void;
  onNavigate: (tab: TabType) => void;
  onSelectPhotoForPreview: (photoBase64: string) => void;
  memories: Memory[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  eventSettings,
  guestName,
  guestTable,
  onUpdateGuest,
  onNavigate,
  onSelectPhotoForPreview,
  memories,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const suggestedTables = [
    'Familia Real',
    'Mesa VIP',
    'Corte de Honor',
    'Mesa 4 - Primos & Amigos',
    'Amigos Colegio',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectPhotoForPreview(event.target.result as string);
          onNavigate('recuerdos');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 pt-2 pb-32">
      {/* 1. Hero Visual Card: Portrait & Couture Typography */}
      <section className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0b0e15] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.85)]">
        <div className="relative w-full h-[290px] overflow-hidden group">
          <img
            src={eventSettings.coverImage}
            alt="Quinceañera Gala Portrait"
            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
          />
          {/* Subtle Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/40 to-transparent pointer-events-none"></div>

          {/* Floating Pill Tag */}
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-[#0b0e15]/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[#b4c5ff] text-xs font-semibold shadow-lg">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span>XV Gala Night</span>
          </div>

          {/* Editorial Name Overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-left">
            <span className="text-[11px] font-sans-ui text-[#7bd0ff] font-semibold tracking-[0.2em] uppercase block mb-1">
              Gala de Quince
            </span>
            <h1 className="font-serif-gala text-3xl font-bold text-white drop-shadow-md tracking-tight">
              {eventSettings.honoreeName}{' '}
              <span className="text-xl italic font-light text-[#b4c5ff]">Mis XV</span>
            </h1>
          </div>
        </div>

        {/* Warm Welcome Message */}
        <div className="p-4 pt-2 bg-[#0b0e15]/90 backdrop-blur-md border-t border-white/5">
          <p className="text-sm text-[#c3c6d7] leading-relaxed font-light">
            {eventSettings.welcomeMessage}
          </p>
        </div>
      </section>

      {/* 2. Guest Recognition / Table Selector */}
      <section className="p-4 rounded-xl glass-card space-y-2.5">
        <label className="flex items-center space-x-2 text-xs font-semibold text-[#e1e2ec] uppercase tracking-wider">
          <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">table_restaurant</span>
          <span>¿Cuál es tu nombre o mesa?</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={guestTable}
            onChange={(e) => onUpdateGuest(guestName, e.target.value)}
            placeholder="ej. Mesa 4 - Primos & Amigos"
            className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all font-sans-ui"
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0] hover:text-[#7bd0ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-[#8d90a0] shrink-0 font-medium">Sugeridos:</span>
          {suggestedTables.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onUpdateGuest(guestName, sug)}
              className={`border px-2.5 py-0.5 rounded-full text-xs shrink-0 transition-all font-sans-ui ${
                guestTable === sug
                  ? 'bg-[#2563eb]/30 border-[#7bd0ff] text-[#7bd0ff] font-semibold'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border-white/10'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Primary Call-to-Action: Shutter Trigger */}
      <section className="pt-1">
        <button
          type="button"
          onClick={() => onNavigate('camara')}
          className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#00a6e0] p-0.5 shadow-[0_0_24px_rgba(56,189,248,0.35)] active:scale-95 transition-transform duration-150"
        >
          <div className="w-full bg-gradient-to-r from-[#2563eb] to-[#00a6e0] py-3.5 px-4 rounded-[10px] flex items-center justify-center space-x-3 text-white border-t border-white/25">
            <span className="material-symbols-outlined text-[24px] text-white animate-pulse">photo_camera</span>
            <span className="font-semibold text-sm tracking-wide text-white drop-shadow-sm font-sans-ui">
              Abrir Cámara de Recuerdos
            </span>
            <span className="material-symbols-outlined text-[20px] text-white/80 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </button>
      </section>

      {/* 4. Secondary Actions: Subir desde Galería o Ver Muro */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-2.5 px-3 rounded-xl bg-[#191b23] hover:bg-[#272a32] border border-white/10 text-xs text-[#c3c6d7] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base text-[#7bd0ff]">add_photo_alternate</span>
          <span>Elegir Galería</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          onClick={() => onNavigate('album')}
          className="py-2.5 px-3 rounded-xl bg-[#191b23] hover:bg-[#272a32] border border-white/10 text-xs text-[#c3c6d7] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base text-amber-400">auto_awesome_motion</span>
          <span>Ver Muro en Vivo</span>
        </button>
      </div>

      {/* 5. Safe Storage Cloud Sync Information Card */}
      <section className="rounded-xl p-3.5 glass-card flex items-start space-x-3 shadow-inner">
        <div className="w-10 h-10 rounded-lg bg-[#272a32] border border-[#7bd0ff]/30 flex items-center justify-center shrink-0 text-[#7bd0ff] shadow-sm">
          <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
        </div>
        <div className="space-y-0.5 flex-1 text-left">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-white">Google Drive Cloud</span>
            <span className="bg-[#00a6e0]/20 text-[#7bd0ff] text-[10px] font-bold px-1.5 py-0.5 rounded tracking-tight border border-[#7bd0ff]/30">
              AUTO SYNC
            </span>
          </div>
          <p className="text-xs text-[#8d90a0] leading-snug">
            Tus fotos se guardan automáticamente en la nube privada de Valentina. Recuerdos seguros para toda la vida.
          </p>
          {eventSettings.driveDirectFolderUrl && (
            <a
              href={eventSettings.driveDirectFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold hover:underline mt-1"
            >
              <span>📁 Abrir carpeta compartida de Google Drive</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          )}
        </div>
      </section>

      {/* 6. Galería de la Fiesta Completa & Dinámica */}
      <section className="pt-2">
        <div className="flex justify-between items-center mb-2.5 px-1">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[20px]">
              photo_library
            </span>
            <span className="font-serif-gala text-base font-bold text-white">
              Galería de la Fiesta
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#7bd0ff] bg-[#2563eb]/20 px-2.5 py-0.5 rounded-full border border-[#7bd0ff]/20">
            {memories.length} {memories.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>

        {/* Dynamic Responsive Grid of Memories */}
        <div className="grid grid-cols-3 gap-2.5">
          {memories.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMemory(item)}
              className="relative rounded-xl overflow-hidden aspect-square border border-white/10 group cursor-pointer bg-[#0b0e15] shadow-md hover:border-[#7bd0ff]/60 transition-all duration-300"
            >
              <img
                src={item.image}
                alt={item.author}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

              {/* Bottom tag with author & reaction */}
              <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[10px] text-white">
                <span className="truncate font-medium drop-shadow-sm max-w-[70%]">
                  {item.author.split(' ')[0]}
                </span>
                <span className="text-xs">{item.reaction || '💙'}</span>
              </div>
            </div>
          ))}

          {/* "+ Subir Foto" Action Card */}
          <button
            type="button"
            onClick={() => onNavigate('camara')}
            className="rounded-xl aspect-square border-2 border-dashed border-[#7bd0ff]/40 flex flex-col items-center justify-center p-2 text-center bg-[#2563eb]/10 hover:border-[#7bd0ff] hover:bg-[#2563eb]/25 transition-all group cursor-pointer active:scale-95 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-[#7bd0ff]/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#7bd0ff] text-xl">
                add_a_photo
              </span>
            </div>
            <span className="text-[11px] text-white font-bold tracking-tight">Tu foto</span>
            <span className="text-[9px] text-[#7bd0ff]">aquí</span>
          </button>
        </div>

        {/* Ver Álbum Completo Button */}
        <button
          type="button"
          onClick={() => onNavigate('album')}
          className="w-full mt-3 py-3 px-4 rounded-xl bg-[#1d1f27] hover:bg-[#2563eb]/20 border border-white/10 hover:border-[#7bd0ff]/40 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
        >
          <span>Ver todas las fotos en el Muro ({memories.length})</span>
          <span className="material-symbols-outlined text-sm text-[#7bd0ff]">arrow_forward</span>
        </button>
      </section>

      {/* Lightbox Modal for Full View when tapping any photo */}
      {selectedMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            className="relative max-w-sm w-full bg-[#10131a] rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative aspect-[4/5] bg-black">
              <img
                src={selectedMemory.image}
                alt={selectedMemory.author}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedMemory(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-sans-ui">
                    {selectedMemory.author}
                  </h4>
                  <p className="text-[11px] text-[#8d90a0]">
                    {selectedMemory.table} · {selectedMemory.time}
                  </p>
                </div>
                <span className="text-2xl">{selectedMemory.reaction || '💙'}</span>
              </div>

              {selectedMemory.message && (
                <p className="text-xs text-[#c3c6d7] italic bg-[#0b0e15] p-2.5 rounded-xl border border-white/5">
                  "{selectedMemory.message}"
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedMemory(null);
                  onNavigate('album');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-[#0b0e15] text-xs font-bold transition-opacity hover:opacity-95 cursor-pointer mt-1"
              >
                Ver en el Muro en Vivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
