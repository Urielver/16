import React, { useState, useEffect, useRef } from 'react';
import { EventSettings, Memory, TabType, PlaylistItem } from '../../types';
import { carouselGallery, initialPlaylist } from '../../data/initialData';
import { PlaylistModal } from '../PlaylistModal';

interface ProjectorScreenProps {
  eventSettings: EventSettings;
  memories: Memory[];
  onNavigate: (tab: TabType) => void;
  playlist?: PlaylistItem[];
  onAddSong?: (song: PlaylistItem) => void;
  onVoteSong?: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
  guestName?: string;
  guestTable?: string;
  guestId?: string;
  isAdminAuthenticated?: boolean;
}

export const ProjectorScreen: React.FC<ProjectorScreenProps> = ({
  eventSettings,
  memories,
  onNavigate,
  playlist = [],
  onAddSong,
  onVoteSong,
  onDeleteSong,
  guestName = '',
  guestTable = '',
  guestId = '',
  isAdminAuthenticated = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(5);
  const [clockTime, setClockTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Collaborative Playlist in Live Screen (YouTube & Spotify)
  // "no tiene que arranca" -> Starts in paused/idle state (false) so it doesn't autoplay without user permission!
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState<boolean>(false);
  const [isPlaylistMuted, setIsPlaylistMuted] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const audioPlaylistRef = useRef<HTMLAudioElement | null>(null);

  const songsList = playlist && playlist.length > 0 ? playlist : initialPlaylist;
  const currentSong = songsList[currentSongIndex % songsList.length];

  const activeMemory = memories[currentIndex % memories.length] || memories[0];

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Avance automático en carrusel cada 5 segundos (configurable y pausible)
  useEffect(() => {
    if (!isAutoPlay || memories.length === 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCurrentIndex((idx) => (idx + 1) % memories.length);
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoPlay, intervalSeconds, memories.length]);

  // Navegación con teclado (Flechas y Barra espaciadora)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memories.length, isAutoPlay, intervalSeconds]);

  const handleNextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % memories.length);
    setCountdown(intervalSeconds);
  };

  const handlePrevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
    setCountdown(intervalSeconds);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => !prev);
    setCountdown(intervalSeconds);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e15] flex flex-col overflow-y-auto lg:overflow-hidden select-none text-[#e1e2ec]">
      {/* Ambient Backdrop Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#2563eb]/20 blur-[140px]"></div>
        <div className="absolute top-1/2 -right-32 w-[550px] h-[550px] rounded-full bg-[#00a6e0]/15 blur-[160px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[500px] rounded-full bg-[#5069bb]/15 blur-[180px]"></div>
      </div>

      {/* TOP APP BAR / GALA CINEMATIC HEADER */}
      <header className="relative z-20 w-full bg-[#10131a]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          {eventSettings.customLogoUrl ? (
            <img
              src={eventSettings.customLogoUrl}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover border border-[#7bd0ff]/40 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#7bd0ff] flex items-center justify-center font-bold font-serif-gala text-white text-base shadow-[0_0_20px_rgba(56,189,248,0.4)]">
              B15
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="font-serif-gala text-base lg:text-lg font-bold tracking-wide text-[#b4c5ff]">
                {eventSettings.eventName}
              </h1>
              <span className="text-[#7bd0ff] font-serif-gala text-sm italic hidden sm:inline">
                · Gala Nocturna
              </span>
            </div>
            <p className="text-[10px] text-[#8d90a0] tracking-widest uppercase">
              {eventSettings.location} • {eventSettings.date}
            </p>
          </div>
        </div>

        {/* Center: Live Hall Broadcasting Pill */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#191b23]/90 border border-white/15 rounded-full px-4 py-1 shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7bd0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7bd0ff]"></span>
            </span>
            <span className="text-xs font-bold text-[#7bd0ff] tracking-wider uppercase font-sans-ui">
              EN VIVO EN EL SALÓN
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-white tracking-wide flex items-center gap-1">
              <span className="material-symbols-outlined text-[#7bd0ff] text-sm">photo_library</span>
              <strong className="text-[#b4c5ff] font-bold">{memories.length + 138}</strong> fotos
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#8d90a0] text-xs">
            <span className="material-symbols-outlined text-[#7bd0ff] text-sm">tag</span>
            <span className="text-white font-bold">{eventSettings.hashtag}</span>
          </div>
        </div>

        {/* Right: Clock & Fullscreen Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-mono font-bold text-[#b4c5ff] tracking-wider">{clockTime}</div>
            <div className="text-[10px] text-[#8d90a0] font-sans-ui">TIEMPO REAL</div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            {/* Botón Control del Carrusel Automático 5s */}
            <button
              type="button"
              onClick={toggleAutoPlay}
              title={isAutoPlay ? 'Pausar avance automático (Espacio)' : 'Activar avance automático cada 5 segundos (Espacio)'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAutoPlay
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isAutoPlay ? 'pause_circle' : 'play_circle'}
              </span>
              <span className="font-sans-ui hidden md:inline">
                {isAutoPlay ? `Carrusel: ${intervalSeconds}s` : 'Pausado'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Pantalla Completa'}
              className="w-9 h-9 rounded-full bg-[#272a32] border border-white/15 text-[#7bd0ff] hover:text-white flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('album')}
              title="Volver al Álbum de Recuerdos"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Volver al Álbum</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN PROJECTION CANVAS (SPLIT 65% / 35% VIEWPORT) */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden max-w-[1920px] mx-auto w-full">
        {/* LEFT COLUMN: LIVE SPOTLIGHT FEATURE PHOTO & RECENT QUEUE (65% -> col-span-8) */}
        <section className="lg:col-span-8 flex flex-col justify-between h-full gap-4">
          {/* Main Stage Photo Card */}
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-[#191b23]/70 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-end group min-h-[380px] lg:min-h-0">
            {/* Projected photo or video */}
            {activeMemory.mediaType === 'video' && activeMemory.videoUrl ? (
              <video
                src={activeMemory.videoUrl}
                autoPlay
                loop
                muted={isVideoMuted}
                playsInline
                poster={activeMemory.image}
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
              />
            ) : (
              <img
                src={activeMemory.image}
                alt="Spotlight Quinceañera"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://i.pinimg.com/736x/0d/98/03/0d9803e22c32681563d3df833304ab2a.jpg';
                }}
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05] transition-all duration-1000 group-hover:scale-[1.01]"
              />
            )}

            {/* Video Sound Audio Control Overlay */}
            {activeMemory.mediaType === 'video' && (
              <div className="absolute top-16 left-4 z-20">
                <button
                  type="button"
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-lg cursor-pointer ${
                    isVideoMuted
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  }`}
                  title={isVideoMuted ? 'Activar sonido del video' : 'Silenciar sonido'}
                >
                  <span className="material-symbols-outlined text-base">
                    {isVideoMuted ? 'volume_off' : 'volume_up'}
                  </span>
                  <span>{isVideoMuted ? 'Video Silenciado (Tocar para escuchar)' : 'Sonido de Video Activado 🔊'}</span>
                </button>
              </div>
            )}

            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/40 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e15]/60 via-transparent to-transparent pointer-events-none"></div>

            {/* Top Badges: "Recién Compartida" & Time & Sequential Number */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#2563eb]/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/25 shadow-[0_0_20px_rgba(37,99,235,0.6)]">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  <span className="text-xs font-bold uppercase tracking-wider font-sans-ui">
                    {activeMemory.mediaType === 'video' ? '¡Video en vivo!' : '¡Recién compartida en vivo!'}
                  </span>
                </div>
                {/* Sequential Number Badge */}
                <div className="bg-amber-400 text-black px-3 py-1 rounded-full font-mono font-bold text-xs shadow-lg flex items-center gap-1">
                  <span>#</span>
                  <span>{activeMemory.memoryNumber || (currentIndex + 1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0b0e15]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[#7bd0ff] text-xs">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{activeMemory.time}</span>
              </div>
            </div>

            {/* Floating Emotional Reaction Floaters */}
            <div className="absolute right-4 top-20 flex flex-col gap-2.5 z-10">
              <div className="bg-[#10131a]/80 backdrop-blur-md border border-white/15 rounded-full w-11 h-11 flex items-center justify-center text-lg shadow-lg hover:scale-110 transition-transform">
                {activeMemory.reaction || '💙'}
              </div>
              <div className="bg-[#10131a]/80 backdrop-blur-md border border-white/15 rounded-full w-11 h-11 flex items-center justify-center text-lg shadow-lg hover:scale-110 transition-transform">
                👑
              </div>
              <div className="bg-[#10131a]/80 backdrop-blur-md border border-white/15 rounded-full w-11 h-11 flex items-center justify-center text-lg shadow-lg hover:scale-110 transition-transform">
                ✨
              </div>
            </div>

            {/* Flechas de navegación rápida sobre la foto */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              title="Foto anterior (o flecha izquierda)"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0b0e15]/70 hover:bg-[#0b0e15] border border-white/20 text-white flex items-center justify-center opacity-60 hover:opacity-100 transition-all active:scale-90 shadow-2xl cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={handleNextPhoto}
              title="Siguiente foto (o flecha derecha)"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0b0e15]/70 hover:bg-[#0b0e15] border border-white/20 text-white flex items-center justify-center opacity-60 hover:opacity-100 transition-all active:scale-90 shadow-2xl cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>

            {/* Guest Dedication & Attribution Banner Over Photo Bottom */}
            <div className="relative z-10 p-5 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/90 to-transparent backdrop-blur-sm border-t border-white/10 text-left">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  {/* Guest metadata */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#7bd0ff] to-[#2563eb] p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#1d1f27] flex items-center justify-center font-bold text-[#7bd0ff] text-xs">
                        {activeMemory.author.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#b4c5ff] tracking-wide font-sans-ui">
                        {activeMemory.author}
                      </h3>
                      <div className="flex items-center gap-2 text-[#8d90a0] text-xs">
                        <span className="text-[#7bd0ff] font-medium">{activeMemory.table}</span>
                        <span>•</span>
                        <span>Cámara Trasera HD</span>
                      </div>
                    </div>
                  </div>

                  {/* Dedication quote */}
                  <p className="font-serif-gala italic text-base lg:text-lg text-white font-medium leading-snug pt-1 drop-shadow">
                    “{activeMemory.message || '¡Qué emoción tan grande verte brillar con tanta luz, mi reina hermosa! ¡Te amamos con todo el corazón!'}”
                  </p>
                </div>

                {/* Likes Counter Pill */}
                <div className="hidden sm:flex flex-col items-center justify-center bg-[#272a32]/85 border border-white/15 rounded-2xl px-4 py-2 shadow-xl min-w-[90px]">
                  <span
                    className="material-symbols-outlined text-[#7bd0ff] text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                  <span className="text-base font-bold text-[#b4c5ff]">{activeMemory.likes}</span>
                  <span className="text-[10px] text-[#8d90a0]">Abrazos</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM QUEUE: RECENT MOMENTS STRIP & AUTO-ROTATE PROGRESS */}
          <div className="bg-[#0b0e15]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-lg flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7bd0ff] text-sm">history</span>
                <span className="text-xs font-bold text-[#b4c5ff] tracking-wider uppercase font-sans-ui">
                  Carrusel de Fotos ({memories.length} en rotación)
                </span>
              </div>

              {/* Countdown indicator y Controles de velocidad */}
              <div className="flex items-center gap-2 text-[#8d90a0] text-xs">
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#7bd0ff] hover:underline cursor-pointer"
                  title="Pausar o reanudar el avance cada 5s"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isAutoPlay ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isAutoPlay ? `Avanza cada ${intervalSeconds}s:` : 'Pausado:'}</span>
                </button>
                <span className="text-[#7bd0ff] font-mono font-bold">{countdown}s</span>
                <div className="w-24 h-1.5 bg-[#272a32] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] rounded-full transition-all duration-1000"
                    style={{
                      width: isAutoPlay
                        ? `${((intervalSeconds - countdown) / intervalSeconds) * 100}%`
                        : '0%',
                    }}
                  ></div>
                </div>

                {/* Selector de velocidad con 5 segundos por defecto */}
                <div className="hidden sm:flex items-center gap-1 bg-[#1d1f27] border border-white/10 rounded-full p-0.5 ml-1">
                  {[3, 5, 8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setIntervalSeconds(sec);
                        setCountdown(sec);
                        setIsAutoPlay(true);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        intervalSeconds === sec
                          ? 'bg-[#2563eb] text-white shadow-sm'
                          : 'text-[#8d90a0] hover:text-white'
                      }`}
                      title={`Cambiar a ${sec} segundos por foto`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail Strip con fotos reales de los invitados */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 gap-2 pt-1 overflow-hidden">
              {(memories.length > 0 ? memories.slice(0, 6) : carouselGallery).map((item: any, i: number) => {
                const imgUrl = item.image || item.img;
                const authorName = item.author || item.title || `Foto #${i + 1}`;
                const isSelected = currentIndex % (memories.length || 1) === i;

                return (
                  <div
                    key={item.id || i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setCountdown(intervalSeconds);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-[16/10] group cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-[#7bd0ff] shadow-[0_0_15px_rgba(123,208,255,0.4)] scale-102 ring-2 ring-[#7bd0ff]/40'
                        : 'border border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={authorName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 left-1 right-1 bg-[#0b0e15]/90 px-1.5 py-0.5 rounded text-[9px] text-[#7bd0ff] font-medium truncate text-left">
                      {authorName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE GUEST QR PORTAL & LIVE ENGAGEMENT (35% -> col-span-4) */}
        <aside className="lg:col-span-4 flex flex-col justify-between h-full gap-4">
          {/* MAIN QR PORTAL CARD */}
          <div className="relative rounded-2xl bg-[#1d1f27]/90 backdrop-blur-xl border border-[#7bd0ff]/30 p-5 shadow-2xl flex flex-col items-center text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#7bd0ff]/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#2563eb]/25 blur-3xl pointer-events-none"></div>

            {/* Header of QR Box */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-1.5 bg-[#7bd0ff]/15 text-[#7bd0ff] px-3 py-1 rounded-full border border-[#7bd0ff]/30 mb-2">
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                <span className="text-xs font-bold uppercase tracking-wider">Tu foto aquí</span>
              </div>
              <h2 className="font-serif-gala text-xl font-bold text-white">
                ¡Sube tu foto a esta pantalla!
              </h2>
              <p className="text-xs text-[#8d90a0] mt-1 max-w-xs font-light">
                Apunta con la cámara de tu teléfono desde tu mesa sin instalar ninguna app.
              </p>
            </div>

            {/* High-Contrast Clean QR Frame with Center B15 Emblem */}
            <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.4)] border-4 border-[#7bd0ff] flex flex-col items-center justify-center transform transition-transform hover:scale-[1.02] w-48 h-48 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.href : 'https://bianca15.fiesta.live'
                )}&margin=4`}
                alt="Código QR del Salón"
                className="w-full h-full object-contain"
              />
              {/* Center Gala Monogram Emblem */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-[#10131a] border-2 border-[#2563eb] flex items-center justify-center shadow-lg overflow-hidden">
                  {eventSettings.customLogoUrl ? (
                    <img
                      src={eventSettings.customLogoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif-gala text-xs font-bold text-[#7bd0ff]">B15</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 text-[#7bd0ff] font-mono font-bold text-xs tracking-tight break-all max-w-xs">
              {typeof window !== 'undefined'
                ? window.location.hostname
                : 'mis15.fiesta.live'}
            </div>

            {/* 3-Step Simple Instructions */}
            <div className="w-full mt-3 grid grid-cols-3 gap-2 text-left">
              <div className="bg-[#0b0e15]/80 border border-white/10 rounded-xl p-2 flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-[#2563eb]/40 text-[#7bd0ff] font-bold text-xs flex items-center justify-center mb-1">
                  1
                </div>
                <p className="text-[11px] leading-tight text-white font-medium">Escanea el código QR</p>
              </div>

              <div className="bg-[#0b0e15]/80 border border-white/10 rounded-xl p-2 flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-[#2563eb]/40 text-[#7bd0ff] font-bold text-xs flex items-center justify-center mb-1">
                  2
                </div>
                <p className="text-[11px] leading-tight text-white font-medium">Elige tu mejor foto o selfie</p>
              </div>

              <div className="bg-[#0b0e15]/80 border border-white/10 rounded-xl p-2 flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-[#7bd0ff]/30 text-[#7bd0ff] font-bold text-xs flex items-center justify-center mb-1">
                  3
                </div>
                <p className="text-[11px] leading-tight text-[#7bd0ff] font-bold">¡Mírala en pantalla!</p>
              </div>
            </div>
          </div>

          {/* REPRODUCTOR DE PLAYLIST COLABORATIVA (YOUTUBE & SPOTIFY) */}
          <div className="rounded-2xl bg-[#191b23]/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-[19px]">queue_music</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif-gala text-xs font-bold text-white tracking-wide">
                      Playlist Colaborativa
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] text-[10px] font-bold font-mono border border-[#7bd0ff]/30">
                      {songsList.length} temas
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#8d90a0]">
                    <span className="text-red-400 font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">smart_display</span> YouTube
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">music_note</span> Spotify
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-[#2563eb]/25 hover:bg-[#2563eb]/40 border border-[#7bd0ff]/40 text-[#7bd0ff] hover:text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                title="Pedir una canción para la fiesta"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Pedir Tema</span>
              </button>
            </div>

            {/* Current Song Display & Embed Player (No arranca automáticamente: arranca cuando se toca Play) */}
            <div className="p-3 rounded-xl bg-[#0b0e15] border border-white/10 space-y-2.5">
              {/* Media Embed when Playing */}
              {isPlayingPlaylist && currentSong ? (
                <div className="space-y-2">
                  {currentSong.platform === 'youtube' && currentSong.videoId ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1&enablejsapi=1${isPlaylistMuted ? '&mute=1' : ''}`}
                        title={currentSong.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : currentSong.platform === 'spotify' && currentSong.spotifyId ? (
                    <div className="relative w-full h-[80px] rounded-xl overflow-hidden bg-black border border-white/10">
                      <iframe
                        src={`https://open.spotify.com/embed/track/${currentSong.spotifyId}?utm_source=generator&theme=0`}
                        width="100%"
                        height="80"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="border-0 rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-[#141722] border border-white/10 flex items-center justify-between text-xs text-[#7bd0ff]">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base animate-pulse">music_note</span>
                        <span>Reproduciendo audio de la fiesta</span>
                      </span>
                      <audio
                        ref={audioPlaylistRef}
                        src={currentSong.url || eventSettings.backgroundSongUrl}
                        autoPlay
                        loop={false}
                        muted={isPlaylistMuted}
                        onEnded={() => setCurrentSongIndex((idx) => (idx + 1) % songsList.length)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#141722]/70 border border-white/5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#7bd0ff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">headphones</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate text-xs">{currentSong?.title || 'Playlist lista'}</p>
                      <p className="text-[10px] text-[#8d90a0] truncate">Reproductor listo • No arranca automáticamente</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlayingPlaylist(true)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white font-bold text-xs flex items-center gap-1 active:scale-95 shadow-md shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    <span>Iniciar</span>
                  </button>
                </div>
              )}

              {/* Song details */}
              <div className="flex items-start justify-between gap-2 text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                        currentSong?.platform === 'youtube'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {currentSong?.platform === 'youtube' ? 'YouTube' : 'Spotify'}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate max-w-[180px]">
                      {currentSong?.title || 'Vals de la Fiesta'}
                    </h4>
                  </div>

                  <p className="text-[11px] text-[#8d90a0] truncate mt-0.5">
                    {currentSong?.artist ? `${currentSong.artist} • ` : ''}Pedida por{' '}
                    <strong className="text-[#c3c6d7]">{currentSong?.addedBy || 'Invitado'}</strong>{' '}
                    ({currentSong?.table || 'Mesa'})
                  </p>
                  {currentSong?.note && (
                    <p className="text-[10px] text-[#7bd0ff] italic mt-0.5 truncate">
                      "{currentSong.note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  <span>{currentSong?.likes || 1}</span>
                </div>
              </div>

              {/* Player Controls (Play, Pause, Next, Prev, Mute) */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentSongIndex((idx) => (idx - 1 + songsList.length) % songsList.length)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors active:scale-95"
                    title="Canción anterior"
                  >
                    <span className="material-symbols-outlined text-sm">skip_previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlayingPlaylist(!isPlayingPlaylist)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                      isPlayingPlaylist
                        ? 'bg-amber-400 text-black shadow-amber-400/20'
                        : 'bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-white shadow-blue-500/30'
                    }`}
                    title={isPlayingPlaylist ? 'Pausar reproductor de playlist' : 'Reproducir playlist colaborativa'}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isPlayingPlaylist ? 'pause' : 'play_arrow'}
                    </span>
                    <span>{isPlayingPlaylist ? 'Pausar' : 'Reproducir'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentSongIndex((idx) => (idx + 1) % songsList.length)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors active:scale-95"
                    title="Siguiente canción"
                  >
                    <span className="material-symbols-outlined text-sm">skip_next</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPlaylistMuted(!isPlaylistMuted)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors"
                    title={isPlaylistMuted ? 'Activar sonido' : 'Silenciar'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isPlaylistMuted ? 'volume_off' : 'volume_up'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className="text-[10px] text-[#7bd0ff] hover:underline font-bold px-1.5 py-1"
                    title="Ver todas las canciones pedidas"
                  >
                    Ver lista ({songsList.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Next in Queue Preview */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d90a0] block">
                Siguientes en cola:
              </span>
              <div className="space-y-1">
                {songsList.slice(1, 3).map((song) => (
                  <div
                    key={song.id}
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[75%]">
                      <span
                        className={`material-symbols-outlined text-[13px] ${
                          song.platform === 'youtube' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {song.platform === 'youtube' ? 'smart_display' : 'music_note'}
                      </span>
                      <span className="truncate text-white text-[11px] font-medium">{song.title}</span>
                    </div>
                    <span className="text-[10px] text-[#7bd0ff] font-mono shrink-0">
                      ❤️ {song.likes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LIVE METRICS CARD (PARTY PARTICIPATION STATS) */}
          <div className="rounded-2xl bg-[#191b23]/90 backdrop-blur-md border border-white/10 p-3.5 shadow-md text-left">
            <h4 className="text-xs text-[#8d90a0] tracking-wider uppercase mb-2 font-bold flex items-center gap-1.5 font-sans-ui">
              <span className="material-symbols-outlined text-sm text-[#7bd0ff]">insights</span>
              Participación de la Noche
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-[#b4c5ff] font-bold">
                  {memories.length}
                </div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Recuerdos Subidos</div>
              </div>

              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-[#7bd0ff] font-bold">
                  {memories.filter((m) => m.message && m.message.trim().length > 0).length}
                </div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Dedicatorias</div>
              </div>

              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-emerald-400 font-bold">14/16</div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Mesas Conectadas</div>
              </div>
            </div>
          </div>

          {/* CLOUD / LOCAL STORAGE BADGE */}
          <div className="rounded-xl bg-[#0b0e15]/90 border border-white/10 p-2.5 px-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#1d1f27] flex items-center justify-center text-[#7bd0ff]">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {eventSettings.storageMethod === 'app_local' ? 'folder_zip' : 'cloud_done'}
                </span>
              </div>
              <div>
                <div className="text-xs text-white font-semibold font-sans-ui">
                  {eventSettings.storageMethod === 'app_local'
                    ? 'Álbum Digital de Recuerdos Activo'
                    : 'Respaldo en la Nube Activo'}
                </div>
                <div className="text-[10px] text-[#8d90a0] font-light">
                  {eventSettings.storageMethod === 'app_local'
                    ? `Guardado seguro en la fiesta de ${eventSettings.honoreeName.split(' ')[0]}`
                    : `Álbum de los 15 de ${eventSettings.honoreeName.split(' ')[0]}`}
                </div>
              </div>
            </div>

            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7bd0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7bd0ff]"></span>
            </span>
          </div>
        </aside>
      </main>

      {/* Modal para pedir canciones en la Playlist Colaborativa */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlist={songsList}
        onAddSong={(newSong) => {
          if (onAddSong) onAddSong(newSong);
        }}
        onVoteSong={(songId) => {
          if (onVoteSong) onVoteSong(songId);
        }}
        onDeleteSong={onDeleteSong}
        currentGuestName={guestName}
        currentGuestTable={guestTable}
        guestId={guestId}
        isAdminAuthenticated={isAdminAuthenticated}
        currentPlayingSongId={isPlayingPlaylist ? currentSong?.id : null}
        eventSettings={eventSettings}
      />
    </div>
  );
};
