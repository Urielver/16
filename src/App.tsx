import { useState, useEffect } from 'react';
import { EventSettings, FrameType, Memory, TabType } from './types';
import { initialEventSettings, initialMemories } from './data/initialData';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { CameraScreen } from './components/screens/CameraScreen';
import { PreviewScreen } from './components/screens/PreviewScreen';
import { WallScreen } from './components/screens/WallScreen';
import { ProjectorScreen } from './components/screens/ProjectorScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { QRCodeModal } from './components/QRCodeModal';
import { AdminLoginModal } from './components/AdminLoginModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [guestName, setGuestName] = useState<string>('');
  const [guestTable, setGuestTable] = useState<string>('Mesa 4 - Primos & Amigos');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('elegante');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mis15_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

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
        if (!parsed.driveFolderId || parsed.driveFolderId.includes('1A2b3C4D5e')) {
          parsed.driveFolderId = initialEventSettings.driveFolderId;
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
      console.warn('Could not persist memories:', e);
    }
  }, [memories]);

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

  const handleCapturePhoto = (photoBase64: string, frame: FrameType) => {
    setCapturedPhoto(photoBase64);
    setSelectedFrame(frame);
    setCurrentTab('recuerdos');
  };

  const handleSelectPhotoForPreview = (photoBase64: string) => {
    setCapturedPhoto(photoBase64);
    setSelectedFrame('elegante');
  };

  const handleSaveMemory = (newMemory: Memory) => {
    setMemories((prev) => [newMemory, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleLike = (id: string) => {
    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.id === id) {
          const isLiked = !mem.isLiked;
          return {
            ...mem,
            isLiked,
            likes: isLiked ? mem.likes + 1 : Math.max(0, mem.likes - 1),
          };
        }
        return mem;
      })
    );
  };

  // If in Projector Mode, show full-screen view without mobile shell
  if (currentTab === 'proyector') {
    return (
      <ProjectorScreen
        eventSettings={eventSettings}
        memories={memories}
        onNavigate={handleNavigate}
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
        />

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
        <BottomNavBar currentTab={currentTab} onNavigate={handleNavigate} />
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
    </div>
  );
}
