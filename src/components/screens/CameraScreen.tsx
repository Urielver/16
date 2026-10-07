import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EventSettings, FrameType, TabType } from '../../types';

interface CameraScreenProps {
  eventSettings: EventSettings;
  onNavigate: (tab: TabType) => void;
  onCapturePhoto: (
    photoBase64: string,
    frame: FrameType,
    videoData?: { url: string; duration: number }
  ) => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  eventSettings,
  onNavigate,
  onCapturePhoto,
}) => {
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  const [selectedFrame, setSelectedFrame] = useState<FrameType>('elegante');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);
  const [timerCount, setTimerCount] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' hs';
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);
  const recordedDurationRef = useRef<number>(15);

  // Draws an elegant, legible gala timestamp watermark directly on the captured photo
  const drawTimestampOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs';
    const stampText = `⏰ ${timeStr} • ${eventSettings.eventName}`;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset mirroring for watermark text

    const fontSize = Math.max(14, Math.round(width * 0.032));
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    const textMetrics = ctx.measureText(stampText);
    const padX = fontSize * 0.75;
    const padY = fontSize * 0.4;
    const boxW = textMetrics.width + padX * 2;
    const boxH = fontSize + padY * 2;
    const boxX = width - boxW - width * 0.035;
    const boxY = height - boxH - height * 0.035;

    // Dark pill container
    ctx.fillStyle = 'rgba(11, 14, 21, 0.85)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, boxH / 2);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();

    // Cyan gala border
    ctx.strokeStyle = 'rgba(123, 208, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#7bd0ff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stampText, boxX + padX, boxY + boxH / 2);

    ctx.restore();
  };

  // Fallback ballroom party image if device camera is inaccessible or permission denied
  const fallbackBallroomImage =
    'https://i.pinimg.com/736x/0d/98/03/0d9803e22c32681563d3df833304ab2a.jpg';

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

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: captureMode === 'video' ? { echoCancellation: true, noiseSuppression: true } : false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Prevent audio feedback during live preview
        videoRef.current.play().catch(() => {});
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
        drawTimestampOnCanvas(ctx, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapturePhoto(dataUrl, selectedFrame);
        return;
      }
    }

    // Fallback: capture from realistic gala scene
    try {
      const fallbackImage = new Image();
      fallbackImage.crossOrigin = 'anonymous';
      fallbackImage.src = fallbackBallroomImage;
      fallbackImage.onload = () => {
        try {
          if (canvas) {
            canvas.width = fallbackImage.naturalWidth || 800;
            canvas.height = fallbackImage.naturalHeight || 1066;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(fallbackImage, 0, 0, canvas.width, canvas.height);
              drawTimestampOnCanvas(ctx, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              onCapturePhoto(dataUrl, selectedFrame);
              return;
            }
          }
        } catch {
          // If canvas tainted, pass image url directly
        }
        onCapturePhoto(fallbackBallroomImage, selectedFrame);
      };
      fallbackImage.onerror = () => {
        onCapturePhoto(fallbackBallroomImage, selectedFrame);
      };
    } catch {
      onCapturePhoto(fallbackBallroomImage, selectedFrame);
    }
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

  // Start Video Recording (15s to 30s) with Audio Capture
  const startVideoRecording = async () => {
    if (!streamRef.current || !cameraActive) {
      setRecordError('Activa primero la cámara para grabar video');
      return;
    }
    setRecordError(null);
    recordedChunksRef.current = [];
    setRecordSeconds(0);
    recordedDurationRef.current = 15;
    setIsRecording(true);

    try {
      // Gather video track and ensure microphone audio track is included
      const tracks: MediaStreamTrack[] = [];
      if (streamRef.current) {
        tracks.push(...streamRef.current.getVideoTracks());
        tracks.push(...streamRef.current.getAudioTracks());
      }

      // If no audio track present, explicitly request microphone for video sound
      if (tracks.filter((t) => t.kind === 'audio').length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
            },
          });
          const aTrack = audioStream.getAudioTracks()[0];
          if (aTrack) {
            tracks.push(aTrack);
          }
        } catch (audioErr) {
          console.warn('Microphone permission not granted, recording video track only:', audioErr);
        }
      }

      const streamToRecord = new MediaStream(tracks);

      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a',
        'video/mp4',
      ];
      const supportedMime = mimeTypes.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(streamToRecord, supportedMime ? { mimeType: supportedMime } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);

        // Snapshot current canvas frame as thumbnail
        const video = videoRef.current;
        const canvas = canvasRef.current;
        let thumbUrl = fallbackBallroomImage;

        if (canvas && video && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facingMode === 'user') {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            drawTimestampOnCanvas(ctx, canvas.width, canvas.height);
            try {
              thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
            } catch {
              thumbUrl = fallbackBallroomImage;
            }
          }
        }

        const duration = Math.max(recordedDurationRef.current || 15, 15);
        onCapturePhoto(thumbUrl, selectedFrame, { url: videoUrl, duration });
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);

      let sec = 0;
      recordIntervalRef.current = setInterval(() => {
        sec += 1;
        recordedDurationRef.current = sec;
        setRecordSeconds(sec);
        if (sec >= 30) {
          stopVideoRecording(true);
        }
      }, 1000);
    } catch (err) {
      console.warn('Error starting recorder:', err);
      setIsRecording(false);
      setRecordError('Tu navegador no permite grabar video en directo.');
    }
  };

  const stopVideoRecording = (forced = false) => {
    if (!forced && recordSeconds < 15) {
      setRecordError(`El video debe durar al menos 15 segundos (llevas ${recordSeconds}s)`);
      setTimeout(() => setRecordError(null), 3000);
      return;
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          onCapturePhoto(thumb, selectedFrame, { url, duration: Math.min(duration, 30) });
        };
      };
    } else {
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
          {eventSettings.customLogoUrl ? (
            <img
              src={eventSettings.customLogoUrl}
              alt="Logo"
              className="w-4 h-4 rounded-full object-cover ml-1 border border-[#7bd0ff]/40"
            />
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#2563eb]/30 text-[#7bd0ff] border border-[#7bd0ff]/40 ml-1">
              B15
            </span>
          )}
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

        {/* Decorative Gala Watermark Overlay: 'Mis 15 Bianca ✨' con Logo */}
        <div className="absolute bottom-4 inset-x-0 px-4 flex flex-col items-center pointer-events-none z-10">
          <div className="relative px-5 py-2 rounded-2xl bg-[#0b0e15]/80 backdrop-blur-xl border border-[#7bd0ff]/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
            {eventSettings.customLogoUrl ? (
              <img
                src={eventSettings.customLogoUrl}
                alt="Logo"
                className="w-6 h-6 rounded-full object-cover border border-[#7bd0ff]/40 shadow-sm"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#7bd0ff] flex items-center justify-center text-white font-serif-gala font-bold text-[10px] shadow-sm">
                B15
              </div>
            )}
            <p className="font-serif-gala text-base font-bold tracking-wider text-[#b4c5ff] text-center">
              {eventSettings.eventName} ✨
            </p>
            <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">stars</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 bg-[#0b0e15]/90 px-3 py-0.5 rounded-full border border-[#7bd0ff]/30 text-[11px] font-mono font-bold text-[#7bd0ff] shadow-md">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            <span>Hora: {currentTime}</span>
          </div>
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
        {recordError ? (
          <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 py-1 px-3 rounded-full border border-rose-500/20 inline-block animate-bounce">
            {recordError}
          </p>
        ) : (
          <p className="text-xs text-[#c3c6d7] flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[15px]">favorite</span>
            <span>
              {captureMode === 'video'
                ? 'Graba un video corto especial (15s a 30s) para Bianca'
                : 'Toca el botón para inmortalizar este momento en el álbum de Bianca'}
            </span>
          </p>
        )}
      </div>

      {/* Bottom Filter Selector & Shutter Console */}
      <div className="mt-3 bg-[#0b0e15]/85 backdrop-blur-xl pt-2 pb-3 rounded-2xl border border-white/10 shadow-2xl">
        {/* Mode Selector: Foto vs Video Corto (15s - 30s) */}
        <div className="flex items-center justify-center gap-2 mb-2 px-3">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopVideoRecording(true);
              setCaptureMode('photo');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              captureMode === 'photo'
                ? 'bg-[#2563eb] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-[#7bd0ff]/50'
                : 'bg-white/5 text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">photo_camera</span>
            <span>📸 Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setCaptureMode('video')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              captureMode === 'video'
                ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400'
                : 'bg-white/5 text-[#8d90a0] hover:text-white border border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-rose-300">videocam</span>
            <span>🎥 Video Corto (15s - 30s)</span>
          </button>
        </div>

        {/* Video recording progress banner */}
        {isRecording && (
          <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 flex flex-col gap-1.5 text-center">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>GRABANDO VIDEO EN VIVO</span>
              </span>
              <span>00:{recordSeconds < 10 ? '0' + recordSeconds : recordSeconds} / 00:30</span>
            </div>
            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (recordSeconds / 30) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-rose-200">
              {recordSeconds < 15
                ? `Mínimo 15 segundos (grabando: faltan ${15 - recordSeconds}s)...`
                : '¡Listo! Puedes pulsar el botón rojo para finalizar o se guardará a los 30s'}
            </p>
          </div>
        )}

        {/* Filter Pills (for photo mode) */}
        {captureMode === 'photo' && (
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
        )}

        {/* Shutter Console */}
        <div className="flex items-center justify-around px-4">
          {/* Gallery Button (photos or short videos) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-[#272a32] border border-[#7bd0ff]/30 text-[#7bd0ff] hover:text-white active:scale-90 transition-all flex items-center justify-center shadow-lg"
              title="Cargar foto o video desde galería"
            >
              <span className="material-symbols-outlined text-[22px]">video_library</span>
            </button>
            <span className="text-[10px] text-[#8d90a0] mt-1 font-medium">Galería</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </div>

          {/* Central Trigger: Photo Shutter OR Video Record Button */}
          <div className="relative flex items-center justify-center -mt-1">
            {captureMode === 'photo' ? (
              <>
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
              </>
            ) : (
              <>
                <div className={`absolute -inset-2 rounded-full ${isRecording ? 'bg-rose-600/40 animate-ping' : 'bg-rose-500/20'} blur-md`}></div>
                <button
                  type="button"
                  onClick={isRecording ? () => stopVideoRecording(false) : startVideoRecording}
                  className={`relative w-20 h-20 rounded-full p-1.5 transition-transform duration-150 flex items-center justify-center border cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 border-white shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-105'
                      : 'bg-gradient-to-tr from-rose-700 to-rose-500 border-rose-300 shadow-[0_0_20px_rgba(225,29,72,0.5)] active:scale-95'
                  }`}
                  title={isRecording ? 'Detener Video' : 'Iniciar Grabación de Video'}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 rounded-md bg-white shadow-lg flex items-center justify-center">
                      <span className="w-4 h-4 bg-rose-600 rounded-sm"></span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                      <span className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center">
                        <span className="w-4 h-4 rounded-full bg-rose-600"></span>
                      </span>
                    </div>
                  )}
                </button>
              </>
            )}
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
