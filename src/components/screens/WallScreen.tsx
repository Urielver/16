import React, { useState } from 'react';
import { EventSettings, Memory, TabType } from '../../types';

interface WallScreenProps {
  memories: Memory[];
  onToggleLike: (id: string) => void;
  onNavigate: (tab: TabType) => void;
  onDeleteMemory?: (id: string) => void;
  isAdminAuthenticated?: boolean;
  eventSettings?: EventSettings;
}

export const WallScreen: React.FC<WallScreenProps> = ({
  memories,
  onToggleLike,
  onNavigate,
  onDeleteMemory,
  isAdminAuthenticated,
  eventSettings,
}) => {
  const [activeFilter, setActiveFilter] = useState<'recientes' | 'populares' | 'selfies'>('recientes');

  // Filter memories
  const getFilteredMemories = () => {
    let list = [...memories];
    if (activeFilter === 'populares') {
      list.sort((a, b) => b.likes - a.likes);
    } else if (activeFilter === 'selfies') {
      list = list.filter((m) => m.momentTag?.toLowerCase().includes('amigas') || m.momentTag?.toLowerCase().includes('amigos') || m.momentTag?.toLowerCase().includes('cotillón'));
      if (list.length === 0) list = memories;
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
      alert('¡Enlace del recuerdo copiado al portapapeles!');
    }
  };

  const handleDownload = (imgUrl: string, author: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `Recuerdo_Mis15_${author.replace(/\s+/g, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-32 pt-1 relative">
      {/* Admin Status / Protected Wall Indicator */}
      {isAdminAuthenticated ? (
        <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-base text-amber-400">shield_person</span>
            <span>Sesión de Administrador: Eliminación de fotos permitida</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ajustes')}
            className="text-[11px] font-bold text-[#7bd0ff] hover:underline cursor-pointer"
          >
            Ajustes
          </button>
        </div>
      ) : (
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-[#8d90a0]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
            <span>Muro protegido • Solo el administrador puede eliminar fotos</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigate('ajustes')}
            className="text-[#7bd0ff] hover:underline font-medium text-[10px] cursor-pointer"
          >
            Acceso Admin
          </button>
        </div>
      )}

      {/* Sub-header & Filter Bar */}
      <section className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-[#c3c6d7]">
          <span className="material-symbols-outlined text-[#7bd0ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
            photo_library
          </span>
          <span className="text-xs font-semibold text-white font-sans-ui">
            {memories.length + 138} fotos subidas
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#191b23] border border-white/10 rounded-full p-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('recientes')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'recientes'
                ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Recientes
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('populares')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'populares'
                ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Populares
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('selfies')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === 'selfies'
                ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Selfies
          </button>
        </div>
      </section>

      {/* Banner Informativo Google Drive Sync */}
      <section>
        <div className="relative overflow-hidden rounded-2xl glass-card p-4 border border-[#7bd0ff]/30 bg-gradient-to-br from-[#191b23]/95 via-[#1d1f27]/85 to-[#2563eb]/20 ambient-glow">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#7bd0ff]/15 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-start gap-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-full bg-[#2563eb]/30 border border-[#7bd0ff]/40 flex items-center justify-center shrink-0 text-[#7bd0ff]">
              <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-gala text-base text-white font-semibold tracking-wide">
                  Álbum Oficial Drive
                </h3>
                <span className="flex items-center text-xs font-semibold text-[#7bd0ff]">
                  <span className="material-symbols-outlined text-sm mr-0.5 animate-spin">sync</span>
                  Sincronizando
                </span>
              </div>
              <p className="text-xs text-[#c3c6d7] mt-1 leading-snug font-light">
                Sincronizado en tiempo real. ¡Tus tomas se guardan automáticamente en alta resolución!
              </p>

              {/* Botón directo a carpeta compartida si está configurada */}
              {eventSettings?.driveDirectFolderUrl && (
                <a
                  href={eventSettings.driveDirectFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">folder_shared</span>
                  <span>Abrir Carpeta de Google Drive (Subir varias fotos a la vez)</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              )}

              {/* Progress Line */}
              <div className="w-full bg-[#32353d]/70 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] h-full rounded-full w-4/5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Stream / Bento Gallery Feed */}
      <main className="flex flex-col gap-4">
        {filteredList.map((item, idx) => (
          <article
            key={item.id}
            className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 border border-white/10 text-left"
          >
            {/* Header info */}
            <div className="p-3 flex items-center justify-between border-b border-white/5 bg-[#10131a]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white font-serif-gala font-semibold text-xs border border-white/20 shadow-sm">
                  {item.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white leading-tight font-sans-ui">
                    {item.author}
                  </h4>
                  <p className="text-[11px] text-[#8d90a0] flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[#7bd0ff] font-mono font-semibold">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {item.time}
                    </span>
                    <span>•</span>
                    <span>{item.table}</span>
                  </p>
                </div>
              </div>

              {item.driveSynced && (
                <div className="flex items-center gap-1 bg-[#272a32]/70 px-2 py-0.5 rounded-full border border-white/10">
                  <span
                    className="material-symbols-outlined text-[#7bd0ff] text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span className="text-[11px] text-[#7bd0ff] font-semibold">Drive Sync</span>
                </div>
              )}
            </div>

            {/* Photo Card View */}
            <div className="relative w-full aspect-[4/5] bg-[#0b0e15] overflow-hidden group">
              <img
                src={item.image}
                alt={item.momentTag || 'Recuerdo'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15]/95 via-transparent to-transparent pointer-events-none"></div>

              {/* Exact capture time badge on photo */}
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-[#7bd0ff]/40 text-[10px] font-mono font-bold text-[#7bd0ff] flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                <span>{item.time}</span>
              </div>

              {/* Tag Pill if cotillon/pista */}
              {item.momentTag && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0b0e15]/75 backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-md">
                  <span
                    className="material-symbols-outlined text-amber-400 text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  <span className="text-[11px] text-white font-medium">{item.momentTag}</span>
                </div>
              )}

              {/* Dedicatoria Overlay */}
              {item.message && (
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#0b0e15]/85 backdrop-blur-md border border-white/10">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#7bd0ff] text-base shrink-0 mt-0.5">
                      format_quote
                    </span>
                    <p className="font-serif-gala italic text-sm text-white leading-snug">
                      "{item.message}"
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => onToggleLike(item.id)}
                      className={`flex items-center gap-1.5 transition-transform active:scale-90 ${
                        item.isLiked ? 'text-rose-400' : 'text-[#7bd0ff]'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        favorite
                      </span>
                      <span className="text-xs font-semibold">{item.likes}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="w-7 h-7 rounded-full bg-[#191b23] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white transition-colors"
                        title="Compartir"
                      >
                        <span className="material-symbols-outlined text-xs">share</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(item.image, item.author)}
                        className="w-7 h-7 rounded-full bg-[#191b23] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white transition-colors"
                        title="Descargar"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                      </button>

                      {/* Solo el Administrador Autenticado puede ver y pulsar el botón de eliminar */}
                      {isAdminAuthenticated && onDeleteMemory && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Seguro que deseas eliminar la foto de "${item.author}"? Esta acción solo la puede realizar el administrador.`
                              )
                            ) {
                              onDeleteMemory(item.id);
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          title="Eliminar foto (Exclusivo Administrador)"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </main>

      {/* Floating Action Button (FAB): Take photo instantly */}
      <aside className="fixed bottom-20 right-4 z-40 max-w-[480px] w-full pointer-events-none flex justify-end px-3">
        <button
          type="button"
          onClick={() => onNavigate('camara')}
          aria-label="Tomar foto instantánea"
          className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-[#2563eb] via-[#00a6e0] to-[#7bd0ff] text-white flex items-center justify-center shutter-glow border-t border-white/30 active:scale-90 transition-transform duration-150 shadow-xl cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-white font-semibold">photo_camera</span>
            <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-white text-[#2563eb] font-bold text-[10px] flex items-center justify-center shadow-sm">
              +
            </span>
          </div>
        </button>
      </aside>

      {/* Pie Informativo y Acceso Discreto para Administradores */}
      <section className="mt-4 mb-4 pt-4 pb-2 border-t border-white/10 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => onNavigate('ajustes')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#191b23]/80 border border-white/10 text-[#8d90a0] hover:text-[#7bd0ff] hover:border-[#7bd0ff]/40 transition-all text-xs font-semibold group active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base group-hover:text-[#7bd0ff] transition-colors">
            lock
          </span>
          <span>Acceso Quinceañera / Admin</span>
        </button>
        <p className="text-[11px] text-[#8d90a0]/80 mt-2 max-w-[280px]">
          Gestión exclusiva y moderación para borrar o descargar el archivo completo de Google Drive.
        </p>
      </section>
    </div>
  );
};
