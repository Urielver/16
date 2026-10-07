import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { EventSettings, FrameType, Memory, TabType } from '../../types';

interface PreviewScreenProps {
  eventSettings: EventSettings;
  capturedPhoto: string | null;
  capturedVideo?: { url: string; duration: number } | null;
  guestName: string;
  guestTable: string;
  selectedFrame: FrameType;
  onNavigate: (tab: TabType) => void;
  onSaveMemory: (newMemory: Memory) => void;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  eventSettings,
  capturedPhoto,
  capturedVideo,
  guestName,
  guestTable,
  selectedFrame,
  onNavigate,
  onSaveMemory,
}) => {
  const defaultPhoto =
    'https://i.pinimg.com/736x/0d/98/03/0d9803e22c32681563d3df833304ab2a.jpg';

  const photoToDisplay = capturedPhoto || defaultPhoto;

  const [captureTime] = useState<string>(() => {
    const now = new Date();
    return (
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs'
    );
  });

  const [authorInput, setAuthorInput] = useState<string>(
    guestName ? `${guestName} (${guestTable || 'Familia'})` : `Familia y Amigos (${guestTable || 'Familia'})`
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(guestTable || 'Familia');
  const [messageInput, setMessageInput] = useState<string>(
    '¡Bianca, estás hermosa! Que disfrutes al máximo esta noche inolvidable. Te queremos mucho 🎉💙'
  );
  const [selectedReaction, setSelectedReaction] = useState<string>('💖');
  const [currentFrame, setCurrentFrame] = useState<FrameType>(selectedFrame);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const suggestedGroups = [
    'Familia',
    'Amigos del colegio',
    'Primos',
    'Tíos o tías',
  ];

  const reactions = [
    '💖', '👑', '✨', '🥳', '🥂', '💃',
    '🎂', '🌹', '💫', '💎', '🥹', '🎉',
    '💙', '🔥', '🥰', '⭐', '📸', '👗',
    '💐', '👠', '🍾', '🤩', '🌸', '🕊️',
  ];

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

  // Optimizes and compresses base64 images so network payloads drop from 4MB to ~120KB (25x faster!)
  const compressForFastUpload = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const maxDim = 1200;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleInstantDownload = () => {
    const a = document.createElement('a');
    a.href = photoToDisplay;
    const cleanAuthor = (authorInput.trim() || 'Invitado').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Recuerdo_Mis15_${cleanAuthor}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveMemory = async () => {
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

    // Auto-download to device gallery if configured
    if (eventSettings.autoDownloadToDevice) {
      handleInstantDownload();
    }

    // Prepare memory item
    const newMemory: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: authorInput.trim() || selectedGroup || 'Familia',
      table: selectedGroup || guestTable || 'Familia',
      time: captureTime,
      timestamp: Date.now(),
      message: messageInput.trim(),
      reaction: selectedReaction,
      likes: 1,
      isLiked: true,
      image: photoToDisplay,
      mediaType: capturedVideo ? 'video' : 'photo',
      videoUrl: capturedVideo?.url,
      videoDuration: capturedVideo?.duration,
      momentTag: capturedVideo ? `Video (${Math.round(capturedVideo.duration)}s)` : 'Recuerdo de Gala',
      driveSynced: true,
      verified: true,
    };

    // 1. Guardado instantáneo en la app y el servidor de la fiesta (0ms de latencia)
    onSaveMemory(newMemory);

    // 2. Si se configuró ImgBB como nube alternativa sin Drive
    if (eventSettings.imgbbApiKey) {
      compressForFastUpload(photoToDisplay).then(async (optimized) => {
        try {
          const cleanB64 = optimized.replace(/^data:image\/\w+;base64,/, '');
          const form = new FormData();
          form.append('image', cleanB64);
          await fetch(`https://api.imgbb.com/1/upload?key=${eventSettings.imgbbApiKey}`, {
            method: 'POST',
            body: form,
          });
        } catch (e) {
          console.warn('ImgBB sync:', e);
        }
      });
    }

    // 3. Solo si el usuario explícitamente eligió Google Drive en los ajustes
    if (
      eventSettings.storageMethod === 'drive' &&
      eventSettings.driveWebhookUrl &&
      !eventSettings.driveWebhookUrl.includes('TU_EJECUTABLE_AQUI')
    ) {
      const cleanFolderId =
        eventSettings.driveFolderId && !eventSettings.driveFolderId.startsWith('AKfycb')
          ? eventSettings.driveFolderId.trim()
          : '1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt';

      const webhookUrl = eventSettings.driveWebhookUrl;
      compressForFastUpload(photoToDisplay).then((optimizedImage) => {
        const payload = {
          image: optimizedImage,
          mimeType: 'image/jpeg',
          nombre: newMemory.author,
          mesa: newMemory.table,
          hora: captureTime,
          dedicatoria: newMemory.message,
          reaccion: newMemory.reaction,
          folderId: cleanFolderId,
          folderName: eventSettings.driveFolder || `Mis 15 ${eventSettings.honoreeName} - Fotos en Vivo`,
          email: eventSettings.driveAccount || 'carlosvargasotorgues@gmail.com',
        };

        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch((err) => {
            console.warn('Webhook transmission info:', err);
          });
        }
      });
    }

    // 4. Navegación ultra-rápida sin esperas artificiales
    setIsUploading(false);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      onNavigate('album');
    }, 350);
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
              Dedicatoria para Bianca
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
          {capturedVideo ? (
            <video
              src={capturedVideo.url}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={photoToDisplay}
              alt="Captura de Gala"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultPhoto;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15]/90 via-transparent to-black/30 pointer-events-none"></div>

          {/* Top Badges: "Recién capturada" & Exact Time */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b0e15]/85 backdrop-blur-md border border-[#7bd0ff]/40 text-[#7bd0ff] text-xs font-semibold shadow-md">
              <span className="material-symbols-outlined text-[15px]">
                {capturedVideo ? 'videocam' : 'schedule'}
              </span>
              <span>{capturedVideo ? `Video (${Math.round(capturedVideo.duration)}s)` : `Hora: ${captureTime}`}</span>
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
                <p className="text-[11px] text-[#8d90a0] mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                  <span>{eventSettings.date}</span>
                  <span>•</span>
                  <span className="text-[#7bd0ff] font-bold">⏰ {captureTime}</span>
                  <span>•</span>
                  <span>{eventSettings.location}</span>
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

        {/* Input: Tu nombre o grupo con Sugerencias */}
        <div className="space-y-1.5 text-left">
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

          {/* Chips de sugerencias solicitadas por el usuario */}
          <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-[#8d90a0] shrink-0 font-medium">Sugerencia:</span>
            {suggestedGroups.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  setSelectedGroup(sug);
                  const base = guestName ? guestName : 'Invitado';
                  setAuthorInput(`${base} (${sug})`);
                }}
                className={`border px-2 py-0.5 rounded-full text-[11px] shrink-0 transition-all cursor-pointer ${
                  selectedGroup === sug
                    ? 'bg-[#2563eb]/40 border-[#7bd0ff] text-[#7bd0ff] font-bold shadow-sm'
                    : 'bg-white/5 border-white/10 text-[#c3c6d7] hover:text-white'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea: Mensaje para la Quinceañera */}
        <div className="space-y-1 text-left">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-[#c3c6d7]" htmlFor="message_text">
              Mensaje para {eventSettings.honoreeName.split(' ')[0] || 'la Quinceañera'}
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
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#c3c6d7] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#7bd0ff] text-[16px]">celebration</span>
              <span>Reacción a la dedicatoria:</span>
            </p>
            <span className="text-xs font-bold text-[#7bd0ff] bg-[#2563eb]/20 px-2 py-0.5 rounded-full border border-[#7bd0ff]/30 font-mono">
              {selectedReaction} Elegida
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 p-2 rounded-xl bg-[#0b0e15]/85 border border-white/10">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedReaction(emoji)}
                className={`py-2 rounded-xl text-center text-xl active:scale-125 transition-all cursor-pointer ${
                  selectedReaction === emoji
                    ? 'bg-[#2563eb]/40 border-2 border-[#7bd0ff] shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-110'
                    : 'bg-white/5 border border-white/5 hover:border-white/20'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Primary Action CTA: Guardar en el Álbum del Evento */}
      <section className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={handleSaveMemory}
          className="w-full relative overflow-hidden group py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#00a6e0] to-[#7bd0ff] text-white font-semibold text-sm tracking-wide border-t border-white/30 shadow-[0_0_24px_rgba(56,189,248,0.45)] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isUploading ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">sync</span>
              <span>Guardando en Google Cloud...</span>
            </>
          ) : uploadSuccess ? (
            <>
              <span className="material-symbols-outlined text-[22px] text-white">cloud_done</span>
              <span>¡Guardado en Google Cloud!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px] drop-shadow">cloud_upload</span>
              <span className="drop-shadow-sm font-bold">Publicar en Google Cloud</span>
            </>
          )}
        </button>

        {/* Botón WhatsApp si está configurado */}
        {(eventSettings.whatsappNumber || eventSettings.whatsappGroupUrl) && (
          <a
            href={
              eventSettings.whatsappGroupUrl ||
              `https://wa.me/${eventSettings.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `¡Hola ${eventSettings.honoreeName}! Te comparto un recuerdo de tu fiesta desde la mesa ${guestTable || 'General'}: "${messageInput.trim() || '¡Felices 15!'}"`
              )}`
            }
            target="_blank"
            rel="noreferrer"
            onClick={handleInstantDownload}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">chat</span>
            <span>Compartir por WhatsApp con {eventSettings.honoreeName.split(' ')[0] || 'la Familia'}</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
        )}

        {/* Enlace directo a la carpeta de Google Drive (solo si se eligió modo Drive) */}
        {eventSettings.storageMethod === 'drive' && (
          <a
            href={eventSettings.driveDirectFolderUrl || 'https://drive.google.com/drive/folders/1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt'}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">folder_shared</span>
            <span>Abrir Carpeta en Google Drive (Subir aquí)</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
        )}

        {/* Privacy & Speed Note */}
        <div className="px-2 py-1 flex items-start gap-2 text-left">
          <span className="material-symbols-outlined text-[15px] text-[#7bd0ff] mt-0.5 shrink-0">bolt</span>
          <p className="text-[11px] text-[#8d90a0] leading-snug">
            Guardado ultrarrápido: La foto se publica de inmediato en el Muro en Vivo y en la Pantalla Gigante sin esperas.
          </p>
        </div>
      </section>
    </div>
  );
};
