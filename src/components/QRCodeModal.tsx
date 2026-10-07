import React from 'react';
import { EventSettings } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSettings: EventSettings;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  eventSettings,
}) => {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://valen15.fiesta.live';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentUrl);
    alert('¡Enlace del evento copiado al portapapeles!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card rounded-3xl p-6 text-center border border-[#7bd0ff]/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] text-xs font-bold uppercase tracking-wider mb-2 border border-[#7bd0ff]/30">
          <span className="material-symbols-outlined text-sm">qr_code_2</span>
          Código de Mesas
        </span>

        <h3 className="font-serif-gala text-xl font-bold text-white mb-1">
          {eventSettings.eventName}
        </h3>
        <p className="text-xs text-[#8d90a0] mb-4 font-light">
          Imprime o comparte este código en cada mesa del salón para que los invitados suban sus fotos sin instalar apps.
        </p>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#7bd0ff]/50 flex flex-col items-center justify-center mx-auto w-52 h-52 relative overflow-hidden">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
              currentUrl
            )}&margin=4`}
            alt="Código QR del Evento"
            className="w-full h-full object-contain"
          />
          {/* Center Gala Monogram Badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {eventSettings.customLogoUrl ? (
              <img
                src={eventSettings.customLogoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#2563eb] shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#10131a] border-2 border-[#2563eb] flex items-center justify-center shadow-lg">
                <span className="font-serif-gala text-xs font-bold text-[#7bd0ff]">B15</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs font-mono text-[#7bd0ff] font-bold mt-3 break-all px-2">
          {currentUrl}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            <span>Copiar Enlace</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-[#0b0e15] text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Imprimir QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
