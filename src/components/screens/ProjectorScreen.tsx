import React, { useState, useEffect } from 'react';
import { EventSettings, Memory, TabType } from '../../types';
import { carouselGallery } from '../../data/initialData';

interface ProjectorScreenProps {
  eventSettings: EventSettings;
  memories: Memory[];
  onNavigate: (tab: TabType) => void;
}

export const ProjectorScreen: React.FC<ProjectorScreenProps> = ({
  eventSettings,
  memories,
  onNavigate,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(8);
  const [clockTime, setClockTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  // 8-second auto-rotate projection slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCurrentIndex((idx) => (idx + 1) % memories.length);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [memories.length]);

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#7bd0ff] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <span className="material-symbols-outlined text-white font-bold text-xl">auto_awesome</span>
          </div>
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
              onClick={() => onNavigate('inicio')}
              title="Salir al modo invitado"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              <span className="hidden sm:inline">Salir</span>
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
            {/* Projected photo */}
            <img
              src={activeMemory.image}
              alt="Spotlight Quinceañera"
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05] transition-all duration-1000 group-hover:scale-[1.01]"
            />

            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15] via-[#0b0e15]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e15]/60 via-transparent to-transparent"></div>

            {/* Top Badges: "Recién Compartida" & Time */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 bg-[#2563eb]/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/25 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span className="text-xs font-bold uppercase tracking-wider font-sans-ui">
                  ¡Recién compartida en vivo!
                </span>
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
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7bd0ff] text-sm">history</span>
                <span className="text-xs font-bold text-[#b4c5ff] tracking-wider uppercase font-sans-ui">
                  Últimos Recuerdos en Pantalla
                </span>
              </div>

              {/* Countdown indicator */}
              <div className="flex items-center gap-2 text-[#8d90a0] text-xs">
                <span>
                  Siguiente foto en <span className="text-[#7bd0ff] font-mono font-bold">{countdown}s</span>
                </span>
                <div className="w-20 h-1.5 bg-[#272a32] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] rounded-full transition-all duration-1000"
                    style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {carouselGallery.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`relative rounded-xl overflow-hidden aspect-[16/10] group cursor-pointer transition-all ${
                    currentIndex % 4 === i
                      ? 'border-2 border-[#7bd0ff] shadow-[0_0_15px_rgba(123,208,255,0.4)] scale-102'
                      : 'border border-white/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1 left-1 bg-[#0b0e15]/90 px-1.5 py-0.5 rounded text-[10px] text-[#7bd0ff] font-medium">
                    {item.title}
                  </div>
                </div>
              ))}
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

            {/* High-Contrast Clean QR Frame with Center V15 Emblem */}
            <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.4)] border-4 border-[#7bd0ff] flex flex-col items-center justify-center transform transition-transform hover:scale-[1.02] w-48 h-48 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.href : 'https://valen15.fiesta.live'
                )}&margin=4`}
                alt="Código QR del Salón"
                className="w-full h-full object-contain"
              />
              {/* Center Gala Monogram Emblem */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-[#10131a] border-2 border-[#2563eb] flex items-center justify-center shadow-lg">
                  <span className="font-serif-gala text-xs font-bold text-[#7bd0ff]">V15</span>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[#7bd0ff] font-mono font-bold text-xs tracking-tight break-all max-w-xs">
              {typeof window !== 'undefined'
                ? window.location.hostname
                : 'valen15.fiesta.live'}
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

          {/* LIVE METRICS CARD (PARTY PARTICIPATION STATS) */}
          <div className="rounded-2xl bg-[#191b23]/90 backdrop-blur-md border border-white/10 p-3.5 shadow-md text-left">
            <h4 className="text-xs text-[#8d90a0] tracking-wider uppercase mb-2 font-bold flex items-center gap-1.5 font-sans-ui">
              <span className="material-symbols-outlined text-sm text-[#7bd0ff]">insights</span>
              Participación de la Noche
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-[#b4c5ff] font-bold">
                  {memories.length + 138}
                </div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Fotos Subidas</div>
              </div>

              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-[#7bd0ff] font-bold">89</div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Dedicatorias</div>
              </div>

              <div className="p-2 bg-[#1d1f27]/80 rounded-xl border border-white/5">
                <div className="font-serif-gala text-xl text-emerald-400 font-bold">14/16</div>
                <div className="text-[10px] text-[#8d90a0] font-medium font-sans-ui">Mesas Conectadas</div>
              </div>
            </div>
          </div>

          {/* CLOUD BACKUP FOOTER BADGE */}
          <div className="rounded-xl bg-[#0b0e15]/90 border border-white/10 p-2.5 px-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#1d1f27] flex items-center justify-center text-[#7bd0ff]">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cloud_done
                </span>
              </div>
              <div>
                <div className="text-xs text-white font-semibold font-sans-ui">
                  Respaldo Automático en Google Drive
                </div>
                <div className="text-[10px] text-[#8d90a0] font-light">
                  Álbum Privado de los 15 de {eventSettings.honoreeName.split(' ')[0]}
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
    </div>
  );
};
