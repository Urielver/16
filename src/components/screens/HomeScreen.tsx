import React, { useRef } from 'react';
import { EventSettings, TabType, Memory, OnlineGuest } from '../../types';

interface HomeScreenProps {
  eventSettings: EventSettings;
  guestName: string;
  guestTable: string;
  onUpdateGuest: (name: string, table: string) => void;
  onNavigate: (tab: TabType) => void;
  onSelectPhotoForPreview: (photoBase64: string, videoData?: { url: string; duration: number }) => void;
  memories: Memory[];
  onlineGuests?: OnlineGuest[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  onOpenPlaylist?: () => void;
  playlistCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  eventSettings,
  guestName,
  guestTable,
  onUpdateGuest,
  onNavigate,
  onSelectPhotoForPreview,
  memories,
  isAdminAuthenticated = false,
  onOpenAdminLogin,
  onOpenPlaylist,
  playlistCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedTables = [
    'Familia',
    'Amigos',
    'Amigos del colegio',
    'Primos',
    'Tíos o tías',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration || 15;
        tempVideo.currentTime = Math.min(1, duration / 2);
        tempVideo.onseeked = () => {
          const c = document.createElement('canvas');
          c.width = tempVideo.videoWidth || 720;
          c.height = tempVideo.videoHeight || 1280;
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(tempVideo, 0, 0, c.width, c.height);
          const thumb = c.toDataURL('image/jpeg', 0.85);
          onSelectPhotoForPreview(thumb, { url, duration: Math.min(duration, 30) });
          onNavigate('recuerdos');
        };
      };
    } else {
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
    <div className="w-full flex flex-col space-y-4 pt-1 pb-28">
      {/* Barra superior de Inicio: Botón de Inicio de Sesión con icono de ingreso */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-1.5 text-xs text-[#8d90a0]">
          <span className="w-2 h-2 rounded-full bg-[#7bd0ff] animate-pulse"></span>
          <span className="font-serif-gala tracking-wider text-[#b4c5ff] font-semibold text-xs">
            {eventSettings.eventName}
          </span>
        </div>

        {isAdminAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              <span>Admin Activo</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('ajustes')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2563eb]/25 hover:bg-[#2563eb]/40 text-[#7bd0ff] hover:text-white border border-[#7bd0ff]/40 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Abrir Solapa de Administración"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Administración</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181c28] hover:bg-[#2563eb]/30 border border-white/15 hover:border-[#7bd0ff]/50 text-white hover:text-[#7bd0ff] text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Iniciar sesión de Administrador o Quinceañera"
          >
            <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">login</span>
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>

      {/* 1. Hero Visual Card: Portrait & Gala Title */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0b0e15] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.85)]">
        <div className="relative w-full h-[320px] overflow-hidden group">
          <img
            src={eventSettings.coverImage}
            alt="Quinceañera Gala Portrait"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://i.pinimg.com/736x/0d/98/03/0d9803e22c32681563d3df833304ab2a.jpg';
            }}
            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
          />
          {/* Subtle Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/40 to-transparent pointer-events-none"></div>

          {/* Floating Monogram or Custom Logo Pill / Botón de Ingreso arriba */}
          <button
            type="button"
            onClick={isAdminAuthenticated ? () => onNavigate('ajustes') : onOpenAdminLogin}
            className="absolute top-4 right-4 flex items-center space-x-1.5 bg-[#0b0e15]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[#b4c5ff] hover:text-white hover:border-[#7bd0ff]/60 text-xs font-semibold shadow-lg active:scale-95 transition-all cursor-pointer"
            title={isAdminAuthenticated ? 'Panel de Administración' : 'Iniciar Sesión'}
          >
            {eventSettings.customLogoUrl ? (
              <img
                src={eventSettings.customLogoUrl}
                alt="Logo"
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[16px] text-[#7bd0ff]">
                {isAdminAuthenticated ? 'admin_panel_settings' : 'login'}
              </span>
            )}
            <span>{isAdminAuthenticated ? 'Admin Activo' : 'Ingreso Admin'}</span>
          </button>

          {/* Editorial Name Overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-left">
            <span className="text-[11px] font-sans-ui text-[#7bd0ff] font-semibold tracking-[0.2em] uppercase block mb-1">
              Gala de Quinceañera
            </span>
            <h1 className="font-serif-gala text-3xl font-bold text-white drop-shadow-md tracking-tight">
              {eventSettings.honoreeName}{' '}
              <span className="text-xl italic font-light text-[#b4c5ff]">B15</span>
            </h1>
            <p className="text-xs text-[#8d90a0] mt-0.5">
              {eventSettings.location} • {eventSettings.date}
            </p>
          </div>
        </div>

        {/* Warm Welcome Message */}
        <div className="p-4 pt-2.5 bg-[#0b0e15]/90 backdrop-blur-md border-t border-white/5 text-left">
          <p className="text-sm text-[#c3c6d7] leading-relaxed font-light">
            {eventSettings.welcomeMessage}
          </p>
        </div>
      </section>

      {/* 2. Guest Recognition: Grupo o Parentesco (Familia o Amigos) */}
      <section className="p-4 rounded-2xl glass-card space-y-3 text-left">
        <label className="flex items-center space-x-2 text-xs font-semibold text-[#e1e2ec] uppercase tracking-wider">
          <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">group</span>
          <span>¿Quién eres? (Familia o Amigos)</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={guestTable}
            onChange={(e) => onUpdateGuest(guestName, e.target.value)}
            placeholder="Ej. Familia, Amigos, Primos..."
            className="w-full bg-[#0b0e15]/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all font-sans-ui"
          />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center space-x-1.5 pt-0.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-[#8d90a0] shrink-0 font-medium">Opciones:</span>
          {suggestedTables.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onUpdateGuest(guestName, sug)}
              className={`border px-3 py-1 rounded-full text-xs shrink-0 transition-all font-sans-ui cursor-pointer ${
                guestTable === sug
                  ? 'bg-[#2563eb]/40 border-[#7bd0ff] text-[#7bd0ff] font-bold shadow-sm'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border-white/10'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Primary Shutter Trigger: Cámara de Fotos y Videos */}
      <section className="pt-1">
        <button
          type="button"
          onClick={() => onNavigate('camara')}
          className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#00a6e0] p-0.5 shadow-[0_0_24px_rgba(56,189,248,0.35)] active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          <div className="w-full bg-gradient-to-r from-[#2563eb] to-[#00a6e0] py-4 px-4 rounded-[14px] flex items-center justify-center space-x-3 text-white border-t border-white/25">
            <span className="material-symbols-outlined text-[26px] text-white animate-pulse">photo_camera</span>
            <span className="font-bold text-sm tracking-wide text-white drop-shadow-sm font-sans-ui">
              Sacar Foto o Grabar Video
            </span>
            <span className="material-symbols-outlined text-[20px] text-white/80 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </button>
      </section>

      {/* 4. Secondary Action: Subir desde galería & Ver Álbum */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-3 px-3 rounded-2xl bg-[#191b23] hover:bg-[#272a32] border border-white/10 text-xs text-[#c3c6d7] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-[#7bd0ff]">add_photo_alternate</span>
          <span>Elegir Galería</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          onClick={() => onNavigate('album')}
          className="py-3 px-3 rounded-2xl bg-[#191b23] hover:bg-[#272a32] border border-white/10 text-xs text-[#c3c6d7] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-amber-400">photo_library</span>
          <span>Ver Álbum ({memories.length})</span>
        </button>
      </div>

      {/* 5. Collaborative Playlist Action */}
      {onOpenPlaylist && (
        <button
          type="button"
          onClick={onOpenPlaylist}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#191b23] via-[#141722] to-[#1e2230] hover:border-[#7bd0ff]/40 border border-white/10 text-xs text-white font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[18px]">queue_music</span>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">Playlist Colaborativa (YouTube & Spotify)</h4>
              <p className="text-[10px] text-[#8d90a0]">Pide canciones para que suenen en vivo en la fiesta</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] text-[10px] font-bold font-mono border border-[#7bd0ff]/30">
              {playlistCount || 0} temas
            </span>
            <span className="material-symbols-outlined text-sm text-[#8d90a0]">arrow_forward</span>
          </div>
        </button>
      )}
    </div>
  );
};
