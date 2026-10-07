import React, { useState } from 'react';
import { OnlineGuest } from '../types';

interface OnlineGuestsBarProps {
  onlineGuests: OnlineGuest[];
  currentGuestName?: string;
}

export const OnlineGuestsBar: React.FC<OnlineGuestsBarProps> = ({
  onlineGuests,
  currentGuestName,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter out duplicates by name or id
  const uniqueGuests = React.useMemo(() => {
    const map = new Map<string, OnlineGuest>();
    onlineGuests.forEach((g) => {
      const key = g.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, g);
      }
    });
    return Array.from(map.values());
  }, [onlineGuests]);

  const count = Math.max(uniqueGuests.length, 1);

  return (
    <>
      <div className="w-full bg-[#10131a]/80 backdrop-blur-md border border-[#7bd0ff]/20 rounded-2xl p-2.5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white font-sans-ui flex items-center gap-1">
              <span>Invitados en línea ahora:</span>
              <span className="text-[#7bd0ff] font-mono font-bold bg-[#2563eb]/20 px-2 py-0.5 rounded-full border border-[#7bd0ff]/30">
                {count} {count === 1 ? 'persona' : 'personas'}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-[11px] font-bold text-[#7bd0ff] hover:text-white flex items-center gap-0.5 cursor-pointer transition-colors"
          >
            <span>Ver lista</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Horizontal avatar scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {uniqueGuests.slice(0, 8).map((guest, idx) => {
            const isMe = currentGuestName && guest.name.toLowerCase() === currentGuestName.toLowerCase();
            return (
              <div
                key={guest.id || idx}
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 transition-all cursor-pointer ${
                  isMe
                    ? 'bg-[#2563eb]/30 border-[#7bd0ff] text-[#7bd0ff]'
                    : 'bg-[#191b23]/90 border-white/10 text-[#c3c6d7] hover:border-white/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold truncate max-w-[120px]">{guest.name}</span>
                {isMe && <span className="text-[9px] text-amber-300 font-bold">(Tú)</span>}
              </div>
            );
          })}
          {uniqueGuests.length > 8 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#7bd0ff] bg-white/5 border border-white/10 shrink-0"
            >
              +{uniqueGuests.length - 8} más
            </button>
          )}
        </div>
      </div>

      {/* Modal / Dialog showing all online guests */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#10131a] border border-[#7bd0ff]/30 rounded-3xl p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-sm font-bold text-white font-serif-gala">
                  Personas en Línea en Este Momento ({count})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8d90a0] hover:text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8d90a0] leading-snug">
              Invitados conectados en vivo participando en la fiesta de Bianca desde sus teléfonos.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {uniqueGuests.map((guest, idx) => (
                <div
                  key={guest.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white text-xs font-bold font-serif-gala">
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-tight">
                        {guest.name}
                      </p>
                      <p className="text-[10px] text-[#8d90a0] mt-0.5">
                        {guest.table || 'Mesa del Evento'}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    En vivo
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold shadow-md hover:bg-[#1d4ed8] active:scale-95 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
