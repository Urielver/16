import React, { useState } from 'react';
import { Memory } from '../types';

interface ContributorsListProps {
  memories: Memory[];
  onSelectAuthor?: (author: string) => void;
  selectedAuthor?: string | null;
}

export const ContributorsList: React.FC<ContributorsListProps> = ({
  memories,
  onSelectAuthor,
  selectedAuthor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute authors and their photo counts
  const authorsStats = React.useMemo(() => {
    const map = new Map<string, { count: number; lastTable?: string; latestTimestamp: number }>();
    memories.forEach((m) => {
      const author = m.author?.trim() || 'Invitado Anónimo';
      const existing = map.get(author) || { count: 0, lastTable: m.table, latestTimestamp: m.timestamp };
      map.set(author, {
        count: existing.count + 1,
        lastTable: m.table || existing.lastTable,
        latestTimestamp: Math.max(existing.latestTimestamp, m.timestamp || 0),
      });
    });

    return Array.from(map.entries())
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.count - a.count);
  }, [memories]);

  if (authorsStats.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#10131a]/85 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-md space-y-2.5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <span className="material-symbols-outlined text-base">photo_camera_front</span>
          </span>
          <div>
            <h3 className="text-xs font-bold text-white font-sans-ui flex items-center gap-1.5">
              <span>Invitados que subieron fotos</span>
              <span className="text-amber-300 font-mono text-[10px] bg-amber-400/15 px-1.5 py-0.2 rounded border border-amber-400/30">
                {authorsStats.length} {authorsStats.length === 1 ? 'persona' : 'personas'}
              </span>
            </h3>
            <p className="text-[10px] text-[#8d90a0]">
              Lista de invitados que han compartido recuerdos en vivo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-bold text-[#7bd0ff] hover:text-white flex items-center gap-0.5 cursor-pointer"
        >
          <span>{isExpanded ? 'Ver menos' : 'Ver todos'}</span>
          <span className="material-symbols-outlined text-[14px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Selected author filter indicator */}
      {selectedAuthor && (
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#2563eb]/20 border border-[#7bd0ff]/40 text-xs text-[#7bd0ff]">
          <span>Mostrando solo fotos de: <strong>{selectedAuthor}</strong></span>
          <button
            type="button"
            onClick={() => onSelectAuthor && onSelectAuthor('')}
            className="text-[10px] underline font-bold hover:text-white cursor-pointer"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* Chips / Cards list */}
      <div className={`grid gap-1.5 ${isExpanded ? 'grid-cols-1 sm:grid-cols-2' : 'flex overflow-x-auto no-scrollbar py-0.5'}`}>
        {authorsStats.slice(0, isExpanded ? 50 : 8).map((item) => {
          const isSelected = selectedAuthor === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectAuthor && onSelectAuthor(isSelected ? '' : item.name)}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-[#191b23] border-white/10 text-white hover:border-[#7bd0ff]/40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-[#2563eb]/40 text-[#7bd0ff] font-bold text-[10px] flex items-center justify-center shrink-0">
                  {item.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-[130px] font-semibold">{item.name}</span>
              </div>
              <span className="text-[10px] font-mono text-[#8d90a0] bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                {item.count} {item.count === 1 ? 'foto' : 'fotos'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
