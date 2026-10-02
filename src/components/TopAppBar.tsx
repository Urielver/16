import React from 'react';
import { TabType, EventSettings } from '../types';

interface TopAppBarProps {
  currentTab: TabType;
  onNavigate: (tab: TabType) => void;
  eventSettings: EventSettings;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ currentTab, onNavigate, eventSettings }) => {
  // If in Projector or Full Camera mode, the header is handled customly inside those views
  if (currentTab === 'proyector') {
    return null;
  }

  return (
    <header className="bg-[#10131a]/85 backdrop-blur-md sticky top-0 z-40 w-full border-b border-white/5 shadow-sm">
      <div className="max-w-[480px] mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Left: Monogram and title */}
        <div 
          onClick={() => onNavigate('inicio')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white font-serif-gala font-bold text-xs shadow-md shadow-blue-500/25">
            V15
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#b4c5ff] text-[18px]">auto_awesome</span>
            <span className="font-serif-gala text-lg font-bold tracking-wide text-[#b4c5ff]">
              {eventSettings.eventName}
            </span>
          </div>
        </div>

        {/* Right: Live pill & quick actions */}
        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 bg-[#191b23]/90 border border-[#7bd0ff]/30 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-[#7bd0ff] pulsing-dot"></span>
            <span className="text-[10px] font-bold text-[#7bd0ff] tracking-wider uppercase font-sans-ui">EN VIVO</span>
          </div>

          {/* Quick TV / Proyector Mode Button */}
          <button
            onClick={() => onNavigate('proyector')}
            title="Abrir Pantalla Gigante para Proyector"
            className="w-8 h-8 rounded-full bg-[#272a32]/80 hover:bg-[#32353d] border border-white/10 flex items-center justify-center text-[#7bd0ff] hover:text-white transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">tv</span>
          </button>
        </div>
      </div>
    </header>
  );
};
