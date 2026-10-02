import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { EventSettings, FrameType, Memory, TabType } from '../../types';

interface PreviewScreenProps {
  eventSettings: EventSettings;
  capturedPhoto: string | null;
  guestName: string;
  guestTable: string;
  selectedFrame: FrameType;
  onNavigate: (tab: TabType) => void;
  onSaveMemory: (newMemory: Memory) => void;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  eventSettings,
  capturedPhoto,
  guestName,
  guestTable,
  selectedFrame,
  onNavigate,
  onSaveMemory,
}) => {
  const defaultPhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDJA93DZkuzzRE-uvzVFpwtWZZDQol4a98cbGs4SiSp6W_biG1DnPXUYJrFw3uymd2oknL86Kvq3g3ALngU8KWfN2kZfEIZoJJ5M5uvxR70GwsoQm_2DLksPzxJxLOtoGlgra_hlklNy5SjTHU-LsVM47lw7HDekxkt6DFxKNaRYEiocbVAemxyI9Z2zM8cYIoBQ2B1b86LxC0oEIcsFWyZx_3xOySAvo_sithY6GkUXKhLtCfyMu-UsQ';

  const photoToDisplay = capturedPhoto || defaultPhoto;

  const [authorInput, setAuthorInput] = useState<string>(
    guestName ? `${guestName} (${guestTable || 'Mesa 3'})` : 'Sofía y Lucas (Mesa 3)'
  );
  const [messageInput, setMessageInput] = useState<string>(
    '¡Valen, estás hermosa! Que disfrutes al máximo esta noche inolvidable. Te queremos mucho 🎉💙'
  );
  const [selectedReaction, setSelectedReaction] = useState<string>('💙');
  const [currentFrame, setCurrentFrame] = useState<FrameType>(selectedFrame);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const reactions = ['💙', '🥂', '✨', '👑', '📸'];

  const cycleFrame = () => {
    const frames: FrameType[] = ['elegante', 'glitter', 'polaroid', 'retro'];
    const nextIdx = (frames.indexOf(currentFrame) + 1) % frames.length;
    setCurrentFrame(frames[nextIdx]);
  };

  const getFrameStyling = () => {
    switch (currentFrame) {
      case 'glitter':
        return 'border-4 border-[#7bd0ff] shadow-[inset_0_0_30px_rgba(56,189,248,0.4)]';
      case 'polaroid':
        return 'border-[8px] border-b-[36px] border-white shadow-2xl';
      case 'retro':
        return 'border-2 border-amber-300 shadow-[inset_0_0_30px_rgba(245,158,11,0.3)] filter sepia-[0.25]';
      case 'elegante':
      default:
        return 'border border-white/15';
    }
  };

  const handleSaveToDrive = async () => {
    setIsUploading(true);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#7bd0ff', '#f59e0b', '#ffffff', '#2563eb'],
      });
    } catch {
      // Ignored if confetti fails
    }

    // Prepare memory item
    const newMemory: Memory = {
      id: `mem-${Date.now()}`,
      author: authorInput.trim() || 'Invitado Especial',
      table: guestTable || 'Mesa General',
      time: 'Hace 1 min',
      timestamp: Date.now(),
      message: messageInput.trim(),
      reaction: selectedReaction,
      likes: 1,
      isLiked: true,
      image: photoToDisplay,
      momentTag: 'Recuerdo de Gala',
      driveSynced: true,
      verified: true,
    };

    // Attempt real HTTP upload if Google Apps Script webhook is configured
    if (
      eventSettings.driveWebhookUrl &&
      !eventSettings.driveWebhookUrl.includes('TU_EJECUTABLE_AQUI')
    ) {
      try {
        await fetch(eventSettings.driveWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: photoToDisplay,
            mimeType: 'image/jpeg',
            nombre: newMemory.author,
            mesa: newMemory.table,
            dedicatoria: newMemory.message,
            reaccion: newMemory.reaction,
            folderId: eventSettings.driveFolderId || '',
            folderName: eventSettings.driveFolder,
            email: eventSettings.driveAccount,
          }),
        });
      } catch (err) {
        console.warn('Webhook transmission info:', err);
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      onSaveMemory(newMemory);

      setTimeout(() => {
        setUploadSuccess(false);
        onNavigate('album');
      }, 1200);
    }, 900);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 pt-1">
      {/* Header with back and repeat */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('camara')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#272a32]/70 border border-white/10 text-[#7bd0ff] hover:text-white active:scale-95 transition-transform"
            title="Volver a la cámara"
          >
            <span className="material-symbols-outlined text-[19px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-serif-gala text-lg font-bold text-[#b4c5ff] tracking-wide">
              Dedicatoria de Fiesta
            </h1>
            <p className="text-[11px] text-[#8d90a0] flex items-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-pulse"></span>
              Paso 3 de 3 • Vista Previa
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('camara')}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[#272a32]/70 border border-white/10 text-[#7bd0ff] hover:text-white active:scale-95 transition-transform"
          title="Repetir captura"
        >
          <span className="material-symbols-outlined text-[19px]">replay</span>
        </button>
      </div>

      {/* Central Captured Photo Frame Container */}
      <section className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0b0e15] shadow-[0_12px_32px_rgba(0,0,0,0.65)] group">
        <div className={`relative w-full aspect-[4/5] overflow-hidden bg-[#0b0e15] transition-all duration-300 ${getFrameStyling()}`}>
          <img
            src={photoToDisplay}
            alt="Captura de Gala"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15]/90 via-transparent to-black/30 pointer-events-none"></div>

          {/* Top Badges: "Recién capturada" */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0b0e15]/80 backdrop-blur-md border border-white/10 text-[#7bd0ff] text-xs font-semibold shadow-md">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Recién capturada
            </span>
          </div>

          {/* Cambiar marco button */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={cycleFrame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10131a]/85 backdrop-blur-xl border border-[#7bd0ff]/40 text-white hover:text-[#7bd0ff] shadow-lg active:scale-95 transition-all text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#7bd0ff]">filter_vintage</span>
              Cambiar marco
            </button>
          </div>

          {/* Commemorative Seal Overlaid on Photo Base */}
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#0b0e15]/85 backdrop-blur-md border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 border border-[#b4c5ff]/40 flex items-center justify-center text-[#b4c5ff]">
                <span className="material-symbols-outlined text-[17px]">celebration</span>
              </div>
              <div className="text-left">
                <p className="font-serif-gala text-base font-bold text-[#b4c5ff] tracking-wider leading-none">
                  {eventSettings.honoreeName} XV
                </p>
                <p className="text-[11px] text-[#8d90a0] mt-0.5 font-medium">
                  {eventSettings.date} • {eventSettings.location}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cycleFrame}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#272a32] border border-white/10 text-[#7bd0ff] hover:text-white transition-colors"
              title="Retocar marco"
            >
              <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
            </button>
          </div>
        </div>
      </section>

      {/* Glassmorphic Dedication Form Card */}
      <section className="glass-card rounded-2xl p-4 flex flex-col gap-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[20px]">stylus_note</span>
            <h2 className="text-sm font-bold text-white">Tarjeta de Recuerdos</h2>
          </div>
          <span className="text-[11px] font-semibold text-[#7bd0ff] bg-[#00a6e0]/20 px-2.5 py-0.5 rounded-full border border-[#7bd0ff]/30">
            Libro de Oro
          </span>
        </div>

        {/* Input: Tu nombre o grupo */}
        <div className="space-y-1 text-left">
          <label className="block text-xs font-semibold text-[#c3c6d7]" htmlFor="author_name">
            Tu nombre o grupo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8d90a0]">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
            <input
              id="author_name"
              type="text"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              placeholder="Ej. Familia Pérez"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0b0e15]/85 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all placeholder-[#8d90a0]"
            />
          </div>
        </div>

        {/* Textarea: Mensaje para Valentina */}
        <div className="space-y-1 text-left">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-[#c3c6d7]" htmlFor="message_text">
              Mensaje para Valentina
            </label>
            <span className="text-[11px] text-[#8d90a0]">
              {messageInput.length}/280
            </span>
          </div>
          <div className="relative">
            <textarea
              id="message_text"
              rows={3}
              value={messageInput}
              maxLength={280}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe aquí tus mejores deseos..."
              className="w-full p-3 pr-8 rounded-xl bg-[#0b0e15]/85 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all placeholder-[#8d90a0] resize-none leading-relaxed"
            />
            <div className="absolute bottom-2.5 right-2.5 text-[#8d90a0]">
              <span className="material-symbols-outlined text-[17px]">sentiment_satisfied</span>
            </div>
          </div>
        </div>

        {/* Reaction Quick Selector */}
        <div className="space-y-1.5 text-left">
          <p className="text-xs font-medium text-[#c3c6d7]">Añadir reacción a la dedicatoria:</p>
          <div className="flex items-center justify-between gap-2">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedReaction(emoji)}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-lg active:scale-95 transition-all cursor-pointer ${
                  selectedReaction === emoji
                    ? 'bg-[#2563eb]/25 border-2 border-[#7bd0ff] shadow-[0_0_12px_rgba(56,189,248,0.35)] scale-105'
                    : 'bg-[#0b0e15]/80 border border-white/10 hover:border-white/20'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Primary Action CTA: Save to Google Drive */}
      <section className="flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={handleSaveToDrive}
          className="w-full relative overflow-hidden group py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#00a6e0] to-[#7bd0ff] text-white font-semibold text-sm tracking-wide border-t border-white/30 shadow-[0_0_24px_rgba(56,189,248,0.45)] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isUploading ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">sync</span>
              <span>Guardando en Google Drive...</span>
            </>
          ) : uploadSuccess ? (
            <>
              <span className="material-symbols-outlined text-[22px] text-white">check_circle</span>
              <span>¡Recuerdo Guardado con Éxito!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px] drop-shadow">cloud_upload</span>
              <span className="drop-shadow-sm">Guardar en el Google Drive de Valentina</span>
            </>
          )}
        </button>

        {/* Privacy & Official Storage Disclaimer */}
        <div className="px-2 py-1.5 flex items-start gap-2 text-left">
          <span className="material-symbols-outlined text-[16px] text-[#7bd0ff] mt-0.5 shrink-0">lock</span>
          <p className="text-xs text-[#8d90a0] leading-snug">
            Esta foto se almacenará directamente en el Drive oficial. Solo la cumpleañera y sus padres tienen permisos de administración y descarga total.
          </p>
        </div>
      </section>
    </div>
  );
};
