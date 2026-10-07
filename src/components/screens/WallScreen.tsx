import React, { useState, useRef } from 'react';
import { EventSettings, Memory, TabType, OnlineGuest } from '../../types';
import { downloadMemoriesAsZip } from '../../utils/zipDownload';
import { OnlineGuestsBar } from '../OnlineGuestsBar';
import { ContributorsList } from '../ContributorsList';

interface WallScreenProps {
  memories: Memory[];
  onToggleLike: (id: string) => void;
  onNavigate: (tab: TabType) => void;
  onDeleteMemory?: (id: string) => void;
  isAdminAuthenticated?: boolean;
  eventSettings?: EventSettings;
  onlineGuests?: OnlineGuest[];
  currentGuestName?: string;
}

export const WallScreen: React.FC<WallScreenProps> = ({
  memories,
  onToggleLike,
  onNavigate,
  onDeleteMemory,
  isAdminAuthenticated = false,
  eventSettings,
  onlineGuests = [],
  currentGuestName,
}) => {
  const [activeFilter, setActiveFilter] = useState<'todos' | 'videos' | 'fotos' | 'populares'>('todos');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');

  // Video player controls state inside modal
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoVolume, setVideoVolume] = useState<number>(1);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  const fallbackPhoto =
    'https://i.pinimg.com/736x/0d/98/03/0d9803e22c32681563d3df833304ab2a.jpg';

  // Sincronizar volumen y silencio en el reproductor de video modal
  React.useEffect(() => {
    if (selectedMemory && selectedMemory.mediaType === 'video' && modalVideoRef.current) {
      modalVideoRef.current.volume = isVideoMuted ? 0 : videoVolume;
      modalVideoRef.current.muted = isVideoMuted;
    }
  }, [selectedMemory, videoVolume, isVideoMuted]);

  const handleDownloadAllZip = async () => {
    if (memories.length === 0) return;
    setIsDownloadingZip(true);
    try {
      await downloadMemoriesAsZip(memories, eventSettings?.eventName || 'Mis 15 Bianca');
    } catch (e) {
      console.warn('ZIP download error:', e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Filter memories
  const getFilteredMemories = () => {
    let list = [...memories];
    if (selectedAuthor) {
      list = list.filter((m) => m.author.trim().toLowerCase() === selectedAuthor.trim().toLowerCase());
    }
    if (activeFilter === 'videos') {
      list = list.filter((m) => m.mediaType === 'video');
    } else if (activeFilter === 'fotos') {
      list = list.filter((m) => m.mediaType !== 'video');
    } else if (activeFilter === 'populares') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      list.sort((a, b) => b.timestamp - a.timestamp);
    }
    return list;
  };

  const filteredList = getFilteredMemories();

  const handleShare = async (mem: Memory) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Recuerdo de Mis 15 - ${mem.author}`,
          text: mem.message || '¡Mira esta foto de la fiesta!',
          url: window.location.href,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const handleDownload = (imgUrl: string, author: string, isVideo = false) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `Recuerdo_Mis15_${author.replace(/\s+/g, '_')}.${isVideo ? 'mp4' : 'jpg'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (id: string, author: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdminAuthenticated || !onDeleteMemory) {
      alert('Solo el administrador o la quinceañera pueden eliminar fotos o videos.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar este recuerdo de "${author}"?`)) {
      onDeleteMemory(id);
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    }
  };

  const toggleModalVideoPlay = () => {
    if (!modalVideoRef.current) return;
    if (modalVideoRef.current.paused) {
      modalVideoRef.current.play();
      setIsPlayingVideo(true);
    } else {
      modalVideoRef.current.pause();
      setIsPlayingVideo(false);
    }
  };

  const toggleModalVideoMute = () => {
    if (!modalVideoRef.current) return;
    const nextMuted = !isVideoMuted;
    modalVideoRef.current.muted = nextMuted;
    setIsVideoMuted(nextMuted);
  };

  const handleModalVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVideoVolume(val);
    if (modalVideoRef.current) {
      modalVideoRef.current.volume = val;
      modalVideoRef.current.muted = val === 0;
      setIsVideoMuted(val === 0);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-32 pt-1 relative text-left">
      {/* Admin Status / Session Indicator */}
      {isAdminAuthenticated ? (
        <div className="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-between text-xs text-amber-300 shadow-md">
          <div className="flex items-center gap-2 font-semibold">
            <span className="material-symbols-outlined text-lg text-amber-400">shield_person</span>
            <div>
              <span className="font-bold">Sesión de Administrador Activa</span>
              <p className="text-[10px] text-amber-200/80 font-normal">
                Puedes eliminar fotos y videos directamente tocando el ícono rojo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ajustes')}
            className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-[11px] font-bold text-amber-300 border border-amber-400/30 cursor-pointer"
          >
            Ajustes
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-[#8d90a0]">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
            <span>Álbum protegido • Solo el administrador puede eliminar fotos o videos</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigate('inicio')}
            className="text-[#7bd0ff] hover:underline font-bold text-[11px] cursor-pointer"
          >
            Acceso Admin
          </button>
        </div>
      )}

      {/* Invitados en Línea */}
      <OnlineGuestsBar
        onlineGuests={onlineGuests}
        currentGuestName={currentGuestName}
      />

      {/* Lista de Invitados que Subieron Fotos */}
      <ContributorsList
        memories={memories}
        selectedAuthor={selectedAuthor}
        onSelectAuthor={setSelectedAuthor}
      />

      {/* Header del Álbum & Filtros */}
      <section className="flex flex-col gap-2.5 px-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[22px]">photo_library</span>
            <h2 className="font-serif-gala text-lg font-bold">
              Álbum de Recuerdos
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#2563eb]/20 text-[#7bd0ff] px-2 py-0.5 rounded-full border border-[#7bd0ff]/30">
              {memories.length}
            </span>
          </div>

          {/* Selector de Vista (Grilla vs Lista Completa) */}
          <div className="flex items-center gap-1 bg-[#141722] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#8d90a0] hover:text-white'
              }`}
              title="Vista en cuadrícula"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'feed' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#8d90a0] hover:text-white'
              }`}
              title="Vista detallada"
            >
              <span className="material-symbols-outlined text-base">view_agenda</span>
            </button>
          </div>
        </div>

        {/* Filtros: Todos, Videos, Fotos, Populares */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-[#2563eb] text-white shadow-sm font-bold'
                : 'bg-[#191b23] text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            Todos ({memories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('videos')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === 'videos'
                ? 'bg-[#2563eb] text-white shadow-sm font-bold'
                : 'bg-[#191b23] text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">videocam</span>
            <span>Videos ({memories.filter((m) => m.mediaType === 'video').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('fotos')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === 'fotos'
                ? 'bg-[#2563eb] text-white shadow-sm font-bold'
                : 'bg-[#191b23] text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">image</span>
            <span>Fotos ({memories.filter((m) => m.mediaType !== 'video').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('populares')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === 'populares'
                ? 'bg-[#2563eb] text-white shadow-sm font-bold'
                : 'bg-[#191b23] text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">favorite</span>
            <span>Populares</span>
          </button>
        </div>
      </section>

      {/* Botones de acción rápida: Descargar ZIP y Tomar Foto */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadAllZip}
          disabled={isDownloadingZip || memories.length === 0}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">
            {isDownloadingZip ? 'sync' : 'folder_zip'}
          </span>
          <span>{isDownloadingZip ? 'Descargando...' : 'Descargar Todo en ZIP'}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('camara')}
          className="py-2 px-3.5 rounded-xl bg-[#2563eb]/25 hover:bg-[#2563eb]/40 border border-[#7bd0ff]/40 text-[#7bd0ff] hover:text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">photo_camera</span>
          <span>Subir Recuerdo</span>
        </button>
      </div>

      {/* Main Gallery Display */}
      {filteredList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#141722]/80 border border-white/10 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#7bd0ff]">photo_camera</span>
          <p className="text-sm text-white font-medium">Aún no hay recuerdos en esta sección.</p>
          <button
            type="button"
            onClick={() => onNavigate('camara')}
            className="py-2 px-4 rounded-xl bg-[#2563eb] text-white text-xs font-bold"
          >
            ¡Sé el primero en subir uno!
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Cuadrícula Elegante (2 Columnas) */
        <div className="grid grid-cols-2 gap-3">
          {filteredList.map((item, idx) => {
            const isVideo = item.mediaType === 'video';
            return (
              <div
                key={item.id}
                onClick={() => setSelectedMemory(item)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#0b0e15] border border-white/10 shadow-md hover:border-[#7bd0ff]/70 transition-all duration-300 cursor-pointer flex flex-col justify-end"
              >
                {/* Media preview */}
                {isVideo && item.videoUrl ? (
                  <video
                    src={item.videoUrl}
                    poster={item.image}
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={item.image}
                    alt={item.author}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = fallbackPhoto;
                    }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 border border-amber-400/40">
                    #{item.memoryNumber || (filteredList.length - idx)}
                  </span>

                  <div className="flex items-center gap-1">
                    {isVideo && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2563eb]/90 backdrop-blur-md text-white text-[9px] font-bold flex items-center gap-0.5 shadow-md">
                        <span className="material-symbols-outlined text-[11px]">play_arrow</span>
                        <span>Video</span>
                      </span>
                    )}

                    {/* Botón de eliminar directo para Administrador */}
                    {isAdminAuthenticated && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, item.author, e)}
                        className="w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        title="Eliminar foto o video (Admin)"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Play Icon for Video */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">play_circle</span>
                    </div>
                  </div>
                )}

                {/* Bottom info */}
                <div className="relative z-10 p-2.5 space-y-0.5 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate max-w-[70%]">
                      {item.author}
                    </p>
                    <span className="text-sm">{item.reaction || '💖'}</span>
                  </div>
                  <p className="text-[10px] text-[#8d90a0] truncate">
                    {item.table}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Feed Completo (Detallado) */
        <div className="flex flex-col gap-4">
          {filteredList.map((item, idx) => {
            const isVideo = item.mediaType === 'video';
            return (
              <article
                key={item.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all text-left shadow-lg"
              >
                {/* Header */}
                <div className="p-3 flex items-center justify-between border-b border-white/5 bg-[#10131a]/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white font-bold text-xs">
                      {item.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.author}</h4>
                      <p className="text-[10px] text-[#8d90a0]">
                        {item.table} • {item.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30">
                      #{item.memoryNumber || (filteredList.length - idx)}
                    </span>
                    {isAdminAuthenticated && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, item.author, e)}
                        className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Eliminar (Admin)"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Clickable to expand */}
                <div
                  onClick={() => setSelectedMemory(item)}
                  className="relative aspect-[4/5] bg-black cursor-pointer group overflow-hidden"
                >
                  {isVideo && item.videoUrl ? (
                    <video
                      src={item.videoUrl}
                      poster={item.image}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.image}
                      alt={item.author}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackPhoto;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Tap to expand hint */}
                  <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-[#7bd0ff] font-semibold border border-white/20 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[13px]">fullscreen</span>
                    <span>Tocar para agrandar</span>
                  </div>
                </div>

                {/* Message & Actions */}
                <div className="p-3 space-y-2 bg-[#0b0e15]/80">
                  {item.message && (
                    <p className="font-serif-gala italic text-xs text-white leading-snug">
                      "{item.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onToggleLike(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all active:scale-110 cursor-pointer ${
                        item.isLiked
                          ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40'
                          : 'bg-white/5 text-[#8d90a0] hover:text-rose-400 border border-white/10'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: item.isLiked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="text-xs font-bold font-mono">{item.likes || 0}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="w-8 h-8 rounded-full bg-[#191b23] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white"
                        title="Compartir"
                      >
                        <span className="material-symbols-outlined text-xs">share</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(isVideo && item.videoUrl ? item.videoUrl : item.image, item.author, isVideo)}
                        className="w-8 h-8 rounded-full bg-[#191b23] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white"
                        title="Descargar"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL AGRANDADO: LIGHTBOX COMPLETO DE FOTO O REPRODUCTOR DE VIDEO */}
      {/* ============================================================== */}
      {selectedMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#10131a] rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Header */}
            <div className="p-3 px-4 flex items-center justify-between border-b border-white/10 bg-[#141722]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#7bd0ff] flex items-center justify-center font-bold text-white text-xs">
                  {selectedMemory.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans-ui">{selectedMemory.author}</h4>
                  <p className="text-[10px] text-[#8d90a0]">
                    {selectedMemory.table} · {selectedMemory.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMemory.id, selectedMemory.author)}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Eliminar este recuerdo como administrador"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                    <span>Eliminar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Main Stage Media (Enlarged) */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] overflow-hidden">
              {selectedMemory.mediaType === 'video' && selectedMemory.videoUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video
                    ref={modalVideoRef}
                    src={selectedMemory.videoUrl}
                    poster={selectedMemory.image}
                    autoPlay
                    playsInline
                    loop
                    className="w-full max-h-[58vh] object-contain"
                    onPlay={() => setIsPlayingVideo(true)}
                    onPause={() => setIsPlayingVideo(false)}
                  />

                  {/* Comandos del Reproductor de Video: Volumen, Silenciar, Pausa */}
                  <div className="w-full bg-[#141722]/95 backdrop-blur-md p-2.5 px-3 border-t border-white/10 flex items-center justify-between gap-3 text-white">
                    <button
                      type="button"
                      onClick={toggleModalVideoPlay}
                      className="w-9 h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                      title={isPlayingVideo ? 'Pausar video' : 'Reproducir video'}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isPlayingVideo ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    {/* Controles de Sonido: Bajar / Subir Volumen y Silenciar */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <button
                        type="button"
                        onClick={toggleModalVideoMute}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isVideoMuted
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isVideoMuted ? 'Activar sonido' : 'Silenciar'}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isVideoMuted || videoVolume === 0 ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-[10px] text-[#8d90a0] font-mono">Vol:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isVideoMuted ? 0 : videoVolume}
                          onChange={handleModalVolumeChange}
                          className="w-full accent-[#7bd0ff] cursor-pointer"
                          title="Bajar o subir volumen del video"
                        />
                        <span className="text-[10px] text-[#7bd0ff] font-mono min-w-[28px]">
                          {isVideoMuted ? '0%' : `${Math.round(videoVolume * 100)}%`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (modalVideoRef.current?.requestFullscreen) {
                          modalVideoRef.current.requestFullscreen();
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                      title="Pantalla completa"
                    >
                      <span className="material-symbols-outlined text-sm">fullscreen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedMemory.image}
                  alt={selectedMemory.author}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackPhoto;
                  }}
                  className="w-full max-h-[64vh] object-contain"
                />
              )}
            </div>

            {/* Bottom Details & Dedication */}
            <div className="p-4 space-y-2.5 bg-[#10131a] border-t border-white/10 text-left">
              {selectedMemory.message && (
                <div className="p-3 rounded-xl bg-[#0b0e15] border border-white/10">
                  <p className="font-serif-gala italic text-sm text-white leading-relaxed">
                    "{selectedMemory.message}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => onToggleLike(selectedMemory.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-125 cursor-pointer ${
                    selectedMemory.isLiked
                      ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-sm'
                      : 'bg-white/5 text-[#8d90a0] hover:text-rose-400 border border-white/10'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: selectedMemory.isLiked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                  <span className="text-xs font-bold font-mono">{selectedMemory.likes || 0} Me gusta</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShare(selectedMemory)}
                    className="px-3 py-1.5 rounded-xl bg-[#1d212e] hover:bg-[#272a38] text-white text-xs font-semibold flex items-center gap-1 border border-white/10"
                  >
                    <span className="material-symbols-outlined text-xs">share</span>
                    <span>Compartir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        selectedMemory.mediaType === 'video' && selectedMemory.videoUrl
                          ? selectedMemory.videoUrl
                          : selectedMemory.image,
                        selectedMemory.author,
                        selectedMemory.mediaType === 'video'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-black text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
