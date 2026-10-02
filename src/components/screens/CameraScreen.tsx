import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EventSettings, FrameType, TabType } from '../../types';

interface CameraScreenProps {
  eventSettings: EventSettings;
  onNavigate: (tab: TabType) => void;
  onCapturePhoto: (photoBase64: string, frame: FrameType) => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  eventSettings,
  onNavigate,
  onCapturePhoto,
}) => {
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('elegante');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);
  const [timerCount, setTimerCount] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback ballroom party image if device camera is inaccessible or permission denied
  const fallbackBallroomImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCa62ZLWo5Xvew-Mp7bKKLyquGa85lipMcOl1gxRH62Bor8-uCMRYw78Z8s9AhogHVxxQzmh-Lz1ppcnLyj7RkDMXiMgsdFubxTADe1f6AwE_ldZEIanKYgWTV_nbgv-yZcdF_VKiluN5dZLx2Gl6JIAmp7Ld1j4woljLyWUvcJOTk4QbsPv9X48-zQygiqp3gBwHJBAn9LJfmYisqWt0YnSwqjPYEVJsXHVXQanSB48Moc1n2mue1QBg';

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err) {
      console.warn('Cámara real no disponible o permiso denegado, utilizando simulador de gala:', err);
      setCameraActive(false);
      setCameraError('Permiso no concedido o no hay cámara disponible');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const triggerCapture = () => {
    // Flash animation
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && video && cameraActive && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, mirror
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapturePhoto(dataUrl, selectedFrame);
        return;
      }
    }

    // Fallback: capture from realistic gala scene
    const fallbackImage = new Image();
    fallbackImage.crossOrigin = 'anonymous';
    fallbackImage.src = fallbackBallroomImage;
    fallbackImage.onload = () => {
      if (canvas) {
        canvas.width = fallbackImage.naturalWidth || 800;
        canvas.height = fallbackImage.naturalHeight || 1066;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(fallbackImage, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onCapturePhoto(dataUrl, selectedFrame);
        }
      }
    };
    fallbackImage.onerror = () => {
      onCapturePhoto(fallbackBallroomImage, selectedFrame);
    };
  };

  const handleTimerClick = () => {
    if (timerCount !== null) return;
    let count = 3;
    setTimerCount(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setTimerCount(count);
      } else {
        clearInterval(interval);
        setTimerCount(null);
        triggerCapture();
      }
    }, 1000);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCapturePhoto(event.target.result as string, selectedFrame);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Frame border styles
  const getFrameOverlayClasses = () => {
    switch (selectedFrame) {
      case 'glitter':
        return 'border-4 border-[#7bd0ff]/70 shadow-[inset_0_0_35px_rgba(56,189,248,0.45)]';
      case 'polaroid':
        return 'border-[10px] border-b-[40px] border-white shadow-2xl';
      case 'retro':
        return 'border-2 border-amber-300/60 shadow-[inset_0_0_40px_rgba(245,158,11,0.3)] filter sepia-[0.2]';
      case 'elegante':
      default:
        return 'border border-white/20';
    }
  };

  return (
    <div className="relative w-full flex flex-col justify-between min-h-[calc(100vh-140px)] pb-24">
      {/* Hidden canvas for capture processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Full screen Flash Overlay */}
      {flashAnimation && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none opacity-90 transition-opacity duration-200" />
      )}

      {/* Top Camera Bar */}
      <header className="px-2 py-2 flex items-center justify-between z-40 bg-[#10131a]/80 backdrop-blur-md rounded-2xl mb-2 border border-white/10">
        {/* Flash Toggle */}
        <button
          type="button"
          onClick={() => setFlashActive(!flashActive)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            flashActive
              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
              : 'bg-[#1d1f27] text-[#7bd0ff] hover:text-white border border-white/10'
          }`}
          title="Flash"
        >
          <span className="material-symbols-outlined text-[19px]">
            {flashActive ? 'flash_on' : 'flash_off'}
          </span>
        </button>

        {/* Center Title Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191b23]/90 border border-white/10 shadow-inner">
          <span className="material-symbols-outlined text-[#7bd0ff] text-[16px]">auto_awesome</span>
          <span className="font-serif-gala text-sm font-bold text-[#b4c5ff] tracking-wide">
            {eventSettings.eventName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 ml-1 animate-pulse">
            EN VIVO
          </span>
        </div>

        {/* Right Controls: Timer & Close */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTimerClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/10 ${
              timerCount !== null
                ? 'bg-[#2563eb] text-white font-bold'
                : 'bg-[#1d1f27] text-[#7bd0ff] hover:text-white'
            }`}
            title="Temporizador 3 segundos"
          >
            {timerCount !== null ? (
              <span className="font-bold text-sm text-white">{timerCount}</span>
            ) : (
              <span className="material-symbols-outlined text-[19px]">timer</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('inicio')}
            className="w-9 h-9 rounded-full bg-[#1d1f27] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white active:scale-95"
            title="Cerrar y volver"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>
      </header>

      {/* Main Viewfinder Card Frame (Aspect Ratio 3:4) */}
      <div
        className={`relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.85)] bg-[#0b0e15] flex items-center justify-center group transition-all duration-300 ${getFrameOverlayClasses()}`}
      >
        {/* Real Video Stream or Fallback Atmosphere */}
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${fallbackBallroomImage})` }}
          />
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e15]/80 via-transparent to-[#0b0e15]/40 pointer-events-none" />

        {/* Rule of Thirds Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-b border-white"></div>
          <div className="border-r border-white"></div>
          <div className="border-r border-white"></div>
          <div></div>
        </div>

        {/* Corner Reticles */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#7bd0ff]/70 rounded-tl pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#7bd0ff]/70 rounded-tr pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#7bd0ff]/70 rounded-bl pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#7bd0ff]/70 rounded-br pointer-events-none"></div>

        {/* Live Sync Drive Badge (Top Center) */}
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b0e15]/75 backdrop-blur-md border border-white/15 text-[#7bd0ff] text-xs font-semibold shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-ping"></span>
            <span>Álbum Colaborativo • Nube Activa</span>
          </div>
        </div>

        {/* Decorative Gala Watermark Overlay: 'Mis 15 Valentina ✨' */}
        <div className="absolute bottom-4 inset-x-0 px-4 flex flex-col items-center pointer-events-none z-10">
          <div className="relative px-5 py-2 rounded-2xl bg-[#0b0e15]/80 backdrop-blur-xl border border-[#7bd0ff]/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">stars</span>
            <p className="font-serif-gala text-base font-bold tracking-wider text-[#b4c5ff] text-center">
              {eventSettings.eventName} ✨
            </p>
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">stars</span>
          </div>
          <span className="text-[10px] font-sans-ui text-[#8d90a0] tracking-widest mt-1 opacity-90 uppercase font-semibold">
            Recuerdo Oficial
          </span>
        </div>

        {/* Big Countdown Overlay */}
        {timerCount !== null && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
            <span className="text-7xl font-bold font-serif-gala text-white animate-bounce drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]">
              {timerCount}
            </span>
          </div>
        )}
      </div>

      {/* Orientational Micro-text */}
      <div className="mt-2 text-center px-4">
        <p className="text-xs text-[#c3c6d7] flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[#7bd0ff] text-[15px]">favorite</span>
          <span>Toca el botón para inmortalizar este momento en el álbum de Valentina</span>
        </p>
      </div>

      {/* Bottom Filter Selector & Shutter Console */}
      <div className="mt-3 bg-[#0b0e15]/85 backdrop-blur-xl pt-2 pb-3 rounded-2xl border border-white/10 shadow-2xl">
        {/* Filter Pills */}
        <div className="w-full mb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-1">
            <button
              type="button"
              onClick={() => setSelectedFrame('elegante')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                selectedFrame === 'elegante'
                  ? 'bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-[#7bd0ff]/50'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Elegante</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFrame('glitter')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                selectedFrame === 'glitter'
                  ? 'bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-[#7bd0ff]/50'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#7bd0ff]">sparkles</span>
              <span>Glitter Azul</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFrame('polaroid')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                selectedFrame === 'polaroid'
                  ? 'bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-[#7bd0ff]/50'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#b6c4ff]">filter_frames</span>
              <span>Polaroid XV</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFrame('retro')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                selectedFrame === 'retro'
                  ? 'bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-[#7bd0ff]/50'
                  : 'bg-[#272a32]/80 text-[#c3c6d7] hover:text-[#7bd0ff] border border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-amber-300">wb_sunny</span>
              <span>Retro Glow</span>
            </button>
          </div>
        </div>

        {/* Shutter Console */}
        <div className="flex items-center justify-around px-4">
          {/* Gallery Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-[#272a32] border border-[#7bd0ff]/30 text-[#7bd0ff] hover:text-white active:scale-90 transition-all flex items-center justify-center shadow-lg"
              title="Cargar foto existente"
            >
              <span className="material-symbols-outlined text-[22px]">photo_library</span>
            </button>
            <span className="text-[10px] text-[#8d90a0] mt-1 font-medium">Galería</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </div>

          {/* Central Sapphire Shutter Trigger */}
          <div className="relative flex items-center justify-center -mt-1">
            <div className="absolute -inset-2 rounded-full bg-[#00a6e0]/20 blur-md animate-pulse"></div>
            <button
              type="button"
              onClick={triggerCapture}
              className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#2563eb] via-[#00a6e0] to-[#7bd0ff] shadow-[0_0_28px_rgba(56,189,248,0.55)] active:scale-95 transition-transform duration-150 flex items-center justify-center border border-white/40 cursor-pointer"
              title="Tomar Fotografía"
            >
              <div className="w-full h-full rounded-full border-2 border-[#0b0e15]/80 flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#7bd0ff]">
                <div className="w-14 h-14 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2563eb] text-[24px]">photo_camera</span>
                </div>
              </div>
            </button>
          </div>

          {/* Flip Camera Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="w-12 h-12 rounded-full bg-[#272a32] border border-[#7bd0ff]/30 text-[#7bd0ff] hover:text-white active:scale-90 transition-all flex items-center justify-center shadow-lg"
              title="Voltear Cámara"
            >
              <span className="material-symbols-outlined text-[22px]">flip_camera_ios</span>
            </button>
            <span className="text-[10px] text-[#8d90a0] mt-1 font-medium">Voltear</span>
          </div>
        </div>
      </div>
    </div>
  );
};
