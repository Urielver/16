import React, { useState, useRef, useEffect } from 'react';
import { EventSettings } from '../types';

interface MusicPlayerBarProps {
  eventSettings: EventSettings;
  onUpdateSong?: (songUrl: string, songTitle: string) => void;
  onOpenPlaylist?: () => void;
  playlistCount?: number;
}

export const MusicPlayerBar: React.FC<MusicPlayerBarProps> = ({
  eventSettings,
  onUpdateSong,
  onOpenPlaylist,
  playlistCount = 0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const songUrl = eventSettings.backgroundSongUrl || '';
  const songTitle = eventSettings.backgroundSongTitle || 'Canción de la Fiesta';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    // When song changes, pause or load new song
    if (audioRef.current && songUrl) {
      audioRef.current.src = songUrl;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [songUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Autoplay prevented or audio error:', err);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleUploadSong = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    // Set source and play immediately
    if (audioRef.current) {
      audioRef.current.src = fileUrl;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
    }

    if (onUpdateSong) {
      onUpdateSong(fileUrl, fileName);
    }

    // Convert to base64 if suitable size for long-term storage
    if (file.size <= 6 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && typeof ev.target.result === 'string') {
          if (onUpdateSong) {
            onUpdateSong(ev.target.result, fileName);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-3 py-1.5 z-30">
      <audio
        ref={audioRef}
        src={songUrl}
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="bg-[#10131a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 px-3 shadow-lg flex items-center justify-between gap-2.5">
        {/* Left: Animated Sound Icon & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 shadow-md ${
              isPlaying
                ? 'bg-gradient-to-tr from-[#2563eb] to-[#7bd0ff] text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] animate-pulse'
                : 'bg-[#1e212b] text-[#7bd0ff] hover:bg-[#282c39]'
            }`}
            title={isPlaying ? 'Pausar música' : 'Reproducir música'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7bd0ff] flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">music_note</span>
                <span>Música de la Fiesta</span>
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-1 h-2.5 bg-[#7bd0ff] rounded-full animate-bounce"></span>
                  <span className="w-1 h-3.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-white truncate max-w-[190px]">
              {songTitle}
            </p>
          </div>
        </div>

        {/* Right: Controls & Volume */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mute button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-[#191b23] text-[#c3c6d7] hover:text-white border border-white/10'
            }`}
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            <span className="material-symbols-outlined text-base">
              {isMuted || volume === 0 ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
            </span>
          </button>

          {/* Volume toggle expandable */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full bg-[#191b23] text-[#c3c6d7] hover:text-white border border-white/10 flex items-center justify-center"
            title="Ajustar volumen"
          >
            <span className="material-symbols-outlined text-base">tune</span>
          </button>

          {/* Playlist Colaborativa Button */}
          {onOpenPlaylist && (
            <button
              type="button"
              onClick={onOpenPlaylist}
              className="py-1 px-2.5 rounded-full bg-[#1e2230] hover:bg-[#2563eb]/30 border border-white/15 text-white hover:text-[#7bd0ff] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="Abrir Playlist Colaborativa de la Fiesta"
            >
              <span className="material-symbols-outlined text-sm text-[#7bd0ff]">queue_music</span>
              <span>Playlist</span>
              {playlistCount > 0 && (
                <span className="bg-[#2563eb] text-white px-1.5 py-0.2 rounded-full text-[9px] font-mono">
                  {playlistCount}
                </span>
              )}
            </button>
          )}

          {/* Subir Canción Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-1 px-2.5 rounded-full bg-[#2563eb]/25 hover:bg-[#2563eb]/40 border border-[#7bd0ff]/40 text-[#7bd0ff] hover:text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Subir un archivo de audio o canción MP3"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            <span className="hidden sm:inline">Subir</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleUploadSong}
          />
        </div>
      </div>

      {/* Expandable Volume Slider Panel */}
      {isExpanded && (
        <div className="mt-1.5 p-2 px-3.5 bg-[#141722] border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <span className="text-[#8d90a0] flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-sm">volume_down</span>
            <span>Volumen: {Math.round(volume * 100)}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-32 accent-[#7bd0ff] cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
