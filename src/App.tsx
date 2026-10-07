import { useState, useEffect } from 'react';
import { EventSettings, FrameType, Memory, TabType, PlaylistItem } from './types';
import { initialEventSettings, initialMemories, initialPlaylist } from './data/initialData';
import { saveEventMemory, deleteEventMemory, fetchEventMemories } from './utils/api';
import {
  subscribeToCloudMemories,
  subscribeToCloudSettings,
  saveSettingsToCloud,
  seedMemoriesToCloud,
  fetchAllCloudMemories,
  toggleCloudLikeWithGuest,
  subscribeToCloudPlaylist,
  addSongToCloudPlaylist,
  voteSongInCloudPlaylist,
  deleteSongFromCloud,
  seedPlaylistToCloud,
} from './utils/firestoreService';
import { useOnlinePresence } from './utils/presence';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { CameraScreen } from './components/screens/CameraScreen';
import { PreviewScreen } from './components/screens/PreviewScreen';
import { WallScreen } from './components/screens/WallScreen';
import { ProjectorScreen } from './components/screens/ProjectorScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { QRCodeModal } from './components/QRCodeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PlaylistModal } from './components/PlaylistModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [guestName, setGuestName] = useState<string>('');
  const [guestTable, setGuestTable] = useState<string>('Mesa 4 - Primos & Amigos');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<{ url: string; duration: number } | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('elegante');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mis15_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Collaborative party playlist (YouTube & Spotify)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(() => {
    try {
      const saved = localStorage.getItem('mis15_playlist');
      return saved ? JSON.parse(saved) : initialPlaylist;
    } catch {
      return initialPlaylist;
    }
  });

  // Track online guests presence in real-time
  const { onlineGuests, guestId } = useOnlinePresence(guestName, guestTable);

  // Load and persist event settings
  const [eventSettings, setEventSettings] = useState<EventSettings>(() => {
    try {
      const saved = localStorage.getItem('mis15_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.driveWebhookUrl || parsed.driveWebhookUrl.includes('TU_EJECUTABLE_AQUI')) {
          parsed.driveWebhookUrl = initialEventSettings.driveWebhookUrl;
        }
        if (!parsed.driveAccount || parsed.driveAccount.includes('mendez@gmail.com')) {
          parsed.driveAccount = initialEventSettings.driveAccount;
        }
        if (!parsed.driveFolderId || parsed.driveFolderId.includes('1A2b3C4D5e') || parsed.driveFolderId.startsWith('AKfycb')) {
          parsed.driveFolderId = '1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt';
        }
        if (!parsed.driveDirectFolderUrl) {
          parsed.driveDirectFolderUrl = 'https://drive.google.com/drive/folders/1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt';
        }
        return parsed;
      }
      return initialEventSettings;
    } catch {
      return initialEventSettings;
    }
  });

  // Load and persist memories
  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const saved = localStorage.getItem('mis15_memories');
      return saved ? JSON.parse(saved) : initialMemories;
    } catch {
      return initialMemories;
    }
  });

  // Real-time synchronization with Cloud Firestore, Server, and IndexedDB
  useEffect(() => {
    let isMounted = true;

    // 1. Live subscription to Google Cloud Firestore (Primary Cloud Storage!)
    const unsubscribeCloudMemories = subscribeToCloudMemories((cloudMems) => {
      if (!isMounted) return;
      if (cloudMems && cloudMems.length > 0) {
        setMemories(cloudMems);
      } else {
        // First-time boot: seed initial photos to Google Cloud Firestore
        seedMemoriesToCloud(initialMemories).then(() => {
          fetchAllCloudMemories().then((seeded) => {
            if (seeded && seeded.length > 0 && isMounted) {
              setMemories(seeded);
            }
          });
        });
      }
    });

    const unsubscribeCloudSettings = subscribeToCloudSettings((cloudSettings) => {
      if (cloudSettings && isMounted) {
        setEventSettings((prev) => {
          // Si la configuración en la nube tiene una fecha de actualización anterior a la local, no sobrescribir
          if (
            prev.settingsUpdatedAt &&
            cloudSettings.settingsUpdatedAt &&
            cloudSettings.settingsUpdatedAt < prev.settingsUpdatedAt
          ) {
            return prev;
          }
          return { ...prev, ...cloudSettings };
        });
      }
    });

    // 2. Live subscription to Collaborative Party Playlist (YouTube & Spotify)
    const unsubscribeCloudPlaylist = subscribeToCloudPlaylist((cloudPlaylist) => {
      if (!isMounted) return;
      if (cloudPlaylist && cloudPlaylist.length > 0) {
        setPlaylist(cloudPlaylist);
      } else {
        seedPlaylistToCloud(initialPlaylist);
      }
    });

    // 3. Secondary fallback poll to server API / IndexedDB
    const syncData = async () => {
      try {
        const serverMems = await fetchEventMemories();
        if (serverMems && isMounted && serverMems.length > 0) {
          setMemories((current) => {
            if (current.length !== serverMems.length || current[0]?.id !== serverMems[0]?.id) {
              return serverMems;
            }
            return current;
          });
        }
      } catch (err) {
        console.warn('Sync error:', err);
      }
    };

    syncData();
    const interval = setInterval(syncData, 4000);

    return () => {
      isMounted = false;
      unsubscribeCloudMemories();
      unsubscribeCloudSettings();
      unsubscribeCloudPlaylist();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mis15_settings', JSON.stringify(eventSettings));
    } catch (e) {
      console.warn('Could not persist settings:', e);
    }
  }, [eventSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('mis15_memories', JSON.stringify(memories));
    } catch (e) {
      console.warn('Could not persist memories to localStorage (using IndexedDB/Server):', e);
    }
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem('mis15_playlist', JSON.stringify(playlist));
    } catch (e) {
      console.warn('Could not persist playlist:', e);
    }
  }, [playlist]);

  const handleNavigate = (tab: TabType) => {
    if (tab === 'ajustes' && !isAdminAuthenticated) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('mis15_admin_auth', 'true');
    } catch {
      // Ignored
    }
    setIsAdminLoginModalOpen(false);
    setCurrentTab('ajustes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('mis15_admin_auth');
    } catch {
      // Ignored
    }
    setCurrentTab('album');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCapturePhoto = (
    photoBase64: string,
    frame: FrameType,
    videoData?: { url: string; duration: number }
  ) => {
    setCapturedPhoto(photoBase64);
    setCapturedVideo(videoData || null);
    setSelectedFrame(frame);
    setCurrentTab('recuerdos');
  };

  const handleSelectPhotoForPreview = (
    photoBase64: string,
    videoData?: { url: string; duration: number }
  ) => {
    setCapturedPhoto(photoBase64);
    setCapturedVideo(videoData || null);
    setSelectedFrame('elegante');
  };

  const handleSaveMemory = (newMemory: Memory) => {
    // Assign sequential memory number: #1, #2, #3...
    if (!newMemory.memoryNumber) {
      const maxNum = memories.reduce((max, m) => Math.max(max, m.memoryNumber || 0), 0);
      newMemory.memoryNumber = maxNum + 1;
    }
    setMemories((prev) => [newMemory, ...prev]);
    saveEventMemory(newMemory);
  };

  const handleDeleteMemory = (id: string) => {
    if (!isAdminAuthenticated) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    setMemories((prev) => prev.filter((m) => m.id !== id));
    deleteEventMemory(id);
  };

  const handleToggleLike = (id: string) => {
    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.id === id) {
          const currentLikedBy = Array.isArray(mem.likedBy) ? mem.likedBy : [];
          const hasLiked = currentLikedBy.includes(guestId);
          const isLiked = !hasLiked;
          const newLikes = isLiked ? (mem.likes || 0) + 1 : Math.max(0, (mem.likes || 1) - 1);
          const updatedLikedBy = isLiked
            ? [...currentLikedBy, guestId]
            : currentLikedBy.filter((g) => g !== guestId);

          // Update in Cloud Firestore with guest identification
          toggleCloudLikeWithGuest(id, guestId, guestName).catch(() => {});

          // Update in local server with guest identification
          fetch(`/api/memories/${id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestId }),
          }).catch(() => {});

          return {
            ...mem,
            isLiked,
            likes: newLikes,
            likedBy: updatedLikedBy,
          };
        }
        return mem;
      })
    );
  };

  // Collaborative Playlist Actions (YouTube & Spotify)
  const handleAddSong = (newSong: PlaylistItem) => {
    setPlaylist((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
    addSongToCloudPlaylist(newSong).catch(() => {});
  };

  const handleVoteSong = (songId: string) => {
    setPlaylist((prev) =>
      prev.map((s) => {
        if (s.id === songId) {
          const currentLiked = Array.isArray(s.likedBy) ? s.likedBy : [];
          const hasVoted = currentLiked.includes(guestId);
          const newLikedBy = hasVoted ? currentLiked.filter((id) => id !== guestId) : [...currentLiked, guestId];
          const newLikes = hasVoted ? Math.max(0, s.likes - 1) : s.likes + 1;
          return { ...s, likes: newLikes, likedBy: newLikedBy };
        }
        return s;
      })
    );
    voteSongInCloudPlaylist(songId, guestId).catch(() => {});
  };

  const handleDeleteSong = (songId: string) => {
    setPlaylist((prev) => prev.filter((s) => s.id !== songId));
    deleteSongFromCloud(songId).catch(() => {});
  };

  // If in Projector / En Vivo Mode, show full-screen live view without mobile shell
  if (currentTab === 'proyector' || currentTab === 'envivo') {
    return (
      <ProjectorScreen
        eventSettings={eventSettings}
        memories={memories}
        onNavigate={handleNavigate}
        playlist={playlist}
        onAddSong={handleAddSong}
        onVoteSong={handleVoteSong}
        onDeleteSong={handleDeleteSong}
        guestName={guestName}
        guestTable={guestTable}
        guestId={guestId}
        isAdminAuthenticated={isAdminAuthenticated}
      />
    );
  }

  return (
    <div className="bg-[#10131a] text-[#e1e2ec] antialiased min-h-screen selection:bg-[#2563eb] selection:text-[#eeefff] flex flex-col justify-between items-center relative overflow-x-hidden">
      {/* Ambient Background Lighting Flares */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[440px] h-[380px] bg-[#2563eb]/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[10%] right-[-10%] w-[320px] h-[300px] bg-[#00a6e0]/15 rounded-full blur-[90px] pointer-events-none -z-10"></div>

      {/* Main Mobile Shell Container (Max 480px, responsive on wider screens) */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">
        {/* Sticky Top Bar */}
        <TopAppBar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          eventSettings={eventSettings}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
          onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
        />

        {/* Music Player Bar (Reproducir y Subir Canción para que se escuche) */}
        {currentTab !== 'camara' && (
          <MusicPlayerBar
            eventSettings={eventSettings}
            onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
            playlistCount={playlist.length}
            onUpdateSong={(songUrl, songTitle) => {
              const updated = {
                ...eventSettings,
                backgroundSongUrl: songUrl,
                backgroundSongTitle: songTitle,
                settingsUpdatedAt: Date.now(),
              };
              setEventSettings(updated);
              saveSettingsToCloud(updated).catch(() => {});
            }}
          />
        )}

        {/* Screen Content Views */}
        <main className="px-4 flex-1 flex flex-col">
          {currentTab === 'inicio' && (
            <HomeScreen
              eventSettings={eventSettings}
              guestName={guestName}
              guestTable={guestTable}
              onUpdateGuest={(name, table) => {
                setGuestName(name);
                setGuestTable(table);
              }}
              onNavigate={handleNavigate}
              onSelectPhotoForPreview={handleSelectPhotoForPreview}
              memories={memories}
              onlineGuests={onlineGuests}
              isAdminAuthenticated={isAdminAuthenticated}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
              playlistCount={playlist.length}
            />
          )}

          {currentTab === 'camara' && (
            <CameraScreen
              eventSettings={eventSettings}
              onNavigate={handleNavigate}
              onCapturePhoto={handleCapturePhoto}
            />
          )}

          {currentTab === 'recuerdos' && (
            <PreviewScreen
              eventSettings={eventSettings}
              capturedPhoto={capturedPhoto}
              capturedVideo={capturedVideo}
              guestName={guestName}
              guestTable={guestTable}
              selectedFrame={selectedFrame}
              onNavigate={handleNavigate}
              onSaveMemory={handleSaveMemory}
            />
          )}

          {currentTab === 'album' && (
            <WallScreen
              memories={memories}
              onToggleLike={handleToggleLike}
              onNavigate={handleNavigate}
              onDeleteMemory={handleDeleteMemory}
              isAdminAuthenticated={isAdminAuthenticated}
              eventSettings={eventSettings}
              onlineGuests={onlineGuests}
              currentGuestName={guestName}
            />
          )}

          {currentTab === 'ajustes' && (
            <SettingsScreen
              eventSettings={eventSettings}
              onUpdateSettings={setEventSettings}
              onNavigate={handleNavigate}
              onOpenQRModal={() => setIsQrModalOpen(true)}
              onLogout={handleAdminLogout}
              memories={memories}
              onDeleteMemory={handleDeleteMemory}
            />
          )}
        </main>

        {/* Bottom Floating Navigation */}
        <BottomNavBar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      </div>

      {/* QR Code Modal for Tables */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        eventSettings={eventSettings}
      />

      {/* Admin Login Modal (Protected with user: uriel / pass: 94909766) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        expectedUser={eventSettings.adminUser || 'uriel'}
        expectedPassword={eventSettings.adminPassword || '94909766'}
      />

      {/* Collaborative Playlist Modal for Guests */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlist={playlist}
        onAddSong={handleAddSong}
        onVoteSong={handleVoteSong}
        onDeleteSong={handleDeleteSong}
        currentGuestName={guestName}
        currentGuestTable={guestTable}
        guestId={guestId}
        isAdminAuthenticated={isAdminAuthenticated}
        eventSettings={eventSettings}
      />
    </div>
  );
}
