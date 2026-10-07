import React, { useState } from 'react';
import { PlaylistItem, EventSettings } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistItem[];
  onAddSong: (song: PlaylistItem) => void;
  onVoteSong: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
  currentGuestName?: string;
  currentGuestTable?: string;
  guestId?: string;
  isAdminAuthenticated?: boolean;
  currentPlayingSongId?: string | null;
  eventSettings: EventSettings;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  onAddSong,
  onVoteSong,
  onDeleteSong,
  currentGuestName = '',
  currentGuestTable = '',
  guestId = '',
  isAdminAuthenticated = false,
  currentPlayingSongId,
  eventSettings,
}) => {
  const [songInput, setSongInput] = useState<string>('');
  const [artistInput, setArtistInput] = useState<string>('');
  const [platform, setPlatform] = useState<'youtube' | 'spotify'>('youtube');
  const [addedByName, setAddedByName] = useState<string>(currentGuestName || 'Invitado');
  const [addedByTable, setAddedByTable] = useState<string>(currentGuestTable || 'Familia');
  const [songNote, setSongNote] = useState<string>('');
  const [filter, setFilter] = useState<'todas' | 'youtube' | 'spotify' | 'mas_votadas'>('todas');
  const [isSuccessMessage, setIsSuccessMessage] = useState<boolean>(false);

  if (!isOpen) return null;

  // Quick suggestions for party hits
  const quickSuggestions = [
    { title: 'Vals de las Flores', artist: 'Piotr Ilich Chaikovski', platform: 'youtube' as const, url: 'https://www.youtube.com/watch?v=GC7Py6fFhF8', videoId: 'GC7Py6fFhF8' },
    { title: 'Danza Kuduro', artist: 'Don Omar ft. Lucenzo', platform: 'spotify' as const, url: 'https://open.spotify.com/track/2a1P1JvT0hO5z5jRkY76k3', spotifyId: '2a1P1JvT0hO5z5jRkY76k3' },
    { title: 'Pepas', artist: 'Farruko', platform: 'youtube' as const, url: 'https://www.youtube.com/watch?v=y83x7Wg420k', videoId: 'y83x7Wg420k' },
    { title: 'De Música Ligera', artist: 'Soda Stereo', platform: 'spotify' as const, url: 'https://open.spotify.com/track/1TfqLAPs4KJeawfqND45nh', spotifyId: '1TfqLAPs4KJeawfqND45nh' },
    { title: 'Mil Horas', artist: 'Los Abuelos de la Nada', platform: 'youtube' as const, url: 'https://www.youtube.com/watch?v=o04F18c-Pks', videoId: 'o04F18c-Pks' },
    { title: 'Provenza', artist: 'Karol G', platform: 'spotify' as const, url: 'https://open.spotify.com/track/7dSZqP9i0xN95P0hI5qjC7', spotifyId: '7dSZqP9i0xN95P0hI5qjC7' },
  ];

  const parseInput = (val: string) => {
    setSongInput(val);
    const trimmed = val.trim();
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (trimmed.includes('spotify.com') || trimmed.startsWith('spotify:')) {
      setPlatform('spotify');
    }
  };

  const extractYouTubeId = (url: string): string | undefined => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    // If it's already an 11-char ID
    if (url.trim().length === 11 && !url.includes(' ')) {
      return url.trim();
    }
    return undefined;
  };

  const extractSpotifyId = (url: string): string | undefined => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const uriMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
    if (uriMatch && uriMatch[1]) {
      return uriMatch[1];
    }
    return undefined;
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = songInput.trim();
    if (!cleanInput) return;

    let detectedPlatform: 'youtube' | 'spotify' = platform;
    let videoId: string | undefined = undefined;
    let spotifyId: string | undefined = undefined;
    let songTitle = cleanInput;
    let songArtist = artistInput.trim();

    if (cleanInput.includes('youtube.com') || cleanInput.includes('youtu.be')) {
      detectedPlatform = 'youtube';
      videoId = extractYouTubeId(cleanInput);
      if (!songArtist) {
        songTitle = cleanInput.split('v=')[1]?.slice(0, 11) ? `Canción YouTube (#${videoId?.slice(0, 5)})` : cleanInput;
      }
    } else if (cleanInput.includes('spotify.com') || cleanInput.startsWith('spotify:')) {
      detectedPlatform = 'spotify';
      spotifyId = extractSpotifyId(cleanInput);
      if (!songArtist) {
        songTitle = `Pista Spotify (#${spotifyId?.slice(0, 5)})`;
      }
    }

    const newSong: PlaylistItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: songTitle,
      artist: songArtist || undefined,
      addedBy: addedByName.trim() || 'Invitado',
      table: addedByTable.trim() || 'Familia',
      platform: detectedPlatform,
      url: cleanInput,
      videoId,
      spotifyId,
      likes: 1,
      likedBy: guestId ? [guestId] : [],
      status: 'pending',
      timestamp: Date.now(),
      note: songNote.trim() || undefined,
    };

    onAddSong(newSong);
    setSongInput('');
    setArtistInput('');
    setSongNote('');
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  const handleAddQuickSuggestion = (item: typeof quickSuggestions[0]) => {
    const newSong: PlaylistItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      artist: item.artist,
      addedBy: addedByName.trim() || 'Invitado',
      table: addedByTable.trim() || 'Familia',
      platform: item.platform,
      url: item.url,
      videoId: item.videoId,
      spotifyId: item.spotifyId,
      likes: 1,
      likedBy: guestId ? [guestId] : [],
      status: 'pending',
      timestamp: Date.now(),
      note: `¡Pedida por ${addedByName.trim() || 'un invitado'}!`,
    };
    onAddSong(newSong);
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  // Sort and filter playlist
  const getFilteredPlaylist = () => {
    let list = [...playlist];
    if (filter === 'youtube') {
      list = list.filter((s) => s.platform === 'youtube');
    } else if (filter === 'spotify') {
      list = list.filter((s) => s.platform === 'spotify');
    } else if (filter === 'mas_votadas') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      return list;
    }
    // Default: Sort by likes descending, then by timestamp descending
    list.sort((a, b) => {
      if ((b.likes || 0) !== (a.likes || 0)) {
        return (b.likes || 0) - (a.likes || 0);
      }
      return b.timestamp - a.timestamp;
    });
    return list;
  };

  const filteredList = getFilteredPlaylist();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="relative max-w-lg w-full bg-[#10131a] rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#141722] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-2xl">queue_music</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-gala text-base font-bold text-white">
                  Playlist Colaborativa de la Fiesta
                </h3>
                <span className="bg-[#2563eb]/20 text-[#7bd0ff] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#7bd0ff]/30 font-mono">
                  {playlist.length}
                </span>
              </div>
              <p className="text-[11px] text-[#8d90a0]">
                Canciones pedidas por los invitados en YouTube & Spotify
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Success Banner */}
          {isSuccessMessage && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-lg text-emerald-400">check_circle</span>
              <span className="font-semibold">¡Canción agregada con éxito a la lista de la fiesta!</span>
            </div>
          )}

          {/* Form to Add New Song */}
          <form onSubmit={handleAddSong} className="p-4 rounded-2xl bg-[#0b0e15] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#7bd0ff]">add_circle</span>
                <span>Pedir una Canción</span>
              </span>

              {/* Platform Toggle */}
              <div className="flex items-center gap-1 bg-[#191b23] p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPlatform('youtube')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    platform === 'youtube'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-[#8d90a0] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">smart_display</span>
                  <span>YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('spotify')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    platform === 'spotify'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-[#8d90a0] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">music_note</span>
                  <span>Spotify</span>
                </button>
              </div>
            </div>

            {/* Song title or URL input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#c3c6d7] block">
                Nombre de la canción o enlace ({platform === 'youtube' ? 'YouTube' : 'Spotify'})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8d90a0]">
                  <span className="material-symbols-outlined text-[18px]">
                    {platform === 'youtube' ? 'smart_display' : 'music_note'}
                  </span>
                </div>
                <input
                  type="text"
                  value={songInput}
                  onChange={(e) => parseInput(e.target.value)}
                  placeholder={
                    platform === 'youtube'
                      ? 'Ej. Danza Kuduro o https://youtube.com/watch?v=...'
                      : 'Ej. Pepas o https://open.spotify.com/track/...'
                  }
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#141722] border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
                />
              </div>
            </div>

            {/* Artist Input (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8d90a0] block">Artista (opcional)</label>
                <input
                  type="text"
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  placeholder="Ej. Don Omar / Chaikovski"
                  className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8d90a0] block">Tu nombre / Mesa</label>
                <input
                  type="text"
                  value={addedByName}
                  onChange={(e) => setAddedByName(e.target.value)}
                  placeholder="Ej. Tía Carmen • Mesa 2"
                  className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
                />
              </div>
            </div>

            {/* Note / Dedication */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8d90a0] block">Dedicatoria para la canción (opcional)</label>
              <input
                type="text"
                value={songNote}
                maxLength={90}
                onChange={(e) => setSongNote(e.target.value)}
                placeholder="Ej. ¡Para bailar con la quinceañera! 💖"
                className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">playlist_add</span>
              <span>Agregar a la Playlist de la Fiesta</span>
            </button>
          </form>

          {/* Quick suggestions pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#8d90a0] block">Temas populares para agregar rápido:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {quickSuggestions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleAddQuickSuggestion(item)}
                  className="border px-2.5 py-1 rounded-full text-[11px] shrink-0 transition-all cursor-pointer bg-[#141722] hover:bg-[#2563eb]/20 border-white/10 text-white flex items-center gap-1 active:scale-95"
                >
                  <span
                    className={`material-symbols-outlined text-[13px] ${
                      item.platform === 'youtube' ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.platform === 'youtube' ? 'smart_display' : 'music_note'}
                  </span>
                  <span>{item.title}</span>
                  <span className="text-[#7bd0ff] font-bold text-[10px]">+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFilter('todas')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  filter === 'todas'
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-[#191b23] text-[#8d90a0] hover:text-white'
                }`}
              >
                Todas ({playlist.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('mas_votadas')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  filter === 'mas_votadas'
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-[#191b23] text-[#8d90a0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">favorite</span>
                <span>Más Votadas</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('youtube')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  filter === 'youtube'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-[#191b23] text-[#8d90a0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">smart_display</span>
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('spotify')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  filter === 'spotify'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#191b23] text-[#8d90a0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">music_note</span>
                <span>Spotify</span>
              </button>
            </div>
          </div>

          {/* Songs List Queue */}
          <div className="space-y-2">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center bg-[#0b0e15] rounded-2xl border border-white/10 space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#7bd0ff]">music_off</span>
                <p className="text-xs text-[#8d90a0]">No hay canciones en esta categoría.</p>
                <p className="text-[11px] text-[#7bd0ff]">¡Sé el primero en pedir tu tema favorito!</p>
              </div>
            ) : (
              filteredList.map((song, idx) => {
                const hasVoted = guestId && song.likedBy?.includes(guestId);
                const isCurrentPlaying = song.id === currentPlayingSongId;

                return (
                  <div
                    key={song.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-left ${
                      isCurrentPlaying
                        ? 'bg-[#2563eb]/20 border-[#7bd0ff] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                        : 'bg-[#141722]/90 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Position & Platform Icon */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-[#8d90a0] w-5 text-center">
                        #{idx + 1}
                      </span>

                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          song.platform === 'youtube'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {song.platform === 'youtube' ? 'smart_display' : 'music_note'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                            {song.title}
                          </h4>
                          {isCurrentPlaying && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-bold animate-pulse">
                              EN VIVO AHORA
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8d90a0] truncate">
                          {song.artist ? `${song.artist} • ` : ''}Pedida por <strong className="text-[#c3c6d7]">{song.addedBy}</strong>
                          {song.table ? ` (${song.table})` : ''}
                        </p>
                        {song.note && (
                          <p className="text-[10px] text-[#7bd0ff] italic mt-0.5 truncate">
                            "{song.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Vote button & Delete (Admin) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onVoteSong(song.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-125 cursor-pointer ${
                          hasVoted
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-sm'
                            : 'bg-white/5 text-[#8d90a0] hover:text-white border border-white/10'
                        }`}
                        title={hasVoted ? 'Ya votaste por esta canción' : 'Votar por esta canción'}
                      >
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: hasVoted ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                        <span className="font-mono">{song.likes || 1}</span>
                      </button>

                      {isAdminAuthenticated && onDeleteSong && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${song.title}" de la lista?`)) {
                              onDeleteSong(song.id);
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar de la lista (Admin)"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141722] border-t border-white/10 flex items-center justify-between text-xs text-[#8d90a0]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#7bd0ff]">speaker</span>
            <span>Se reproduce en la Pantalla En Vivo</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
