import React from 'react';
import { TabType } from '../types';

interface BottomNavBarProps {
  currentTab: TabType;
  onNavigate: (tab: TabType) => void;
  isAdminAuthenticated?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onNavigate,
  isAdminAuthenticated = false,
}) => {
  // Hide on proyector mode (which is full-screen TV view)
  if (currentTab === 'proyector') {
    return null;
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: 'celebration' },
    { id: 'camara', label: 'Cámara', icon: 'photo_camera' },
    { id: 'album', label: 'Álbum', icon: 'photo_library' },
    { id: 'envivo', label: 'En Vivo', icon: 'tv' },
  ];

  // La solapa de Administración aparece únicamente cuando se ha iniciado sesión
  if (isAdminAuthenticated) {
    tabs.push({ id: 'ajustes', label: 'Admin', icon: 'admin_panel_settings' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center max-w-[480px] mx-auto px-3 py-2 pb-5 bg-[#10131a]/90 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.65)] border-t border-white/5">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 px-3 py-1.5 rounded-xl ${
              isActive
                ? 'bg-[#2563eb]/25 text-[#7bd0ff] shadow-[0_0_12px_rgba(37,99,235,0.25)] border border-[#7bd0ff]/30 font-semibold'
                : 'text-[#8d90a0] hover:text-[#b4c5ff]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px] mb-0.5"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-sans-ui tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
