'use client';

import { Plus, Settings } from 'lucide-react';
import type { FamilyMember } from '@/lib/types';

function avatarText(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '？';
  // 例: "自分" → "自", "長男" → "長", "Aki" → "A"
  return trimmed[0];
}

interface FamilyTabsProps {
  members: FamilyMember[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  onSettingsClick: () => void;
}

export default function FamilyTabs({ members, activeId, onSelect, onAddClick, onSettingsClick }: FamilyTabsProps) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2 px-2 bg-white border-b border-slate-200 sticky top-0 z-10 safe-area-inset-top items-center">
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => {
            triggerHaptic();
            onSelect(m.id);
          }}
          className={`flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[56px] py-2 px-2 rounded-xl transition-all ${
            activeId === m.id
              ? 'bg-slate-800 text-white ring-2 ring-slate-600'
              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
              activeId === m.id ? 'bg-white/15 text-white' : 'bg-white text-slate-700'
            }`}
            aria-hidden
          >
            {avatarText(m.name)}
          </div>
          <span className="text-xs font-medium truncate max-w-full">{m.name}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => { triggerHaptic(); onAddClick(); }}
        className="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[48px] py-2 px-2 rounded-xl bg-slate-100 text-slate-500 active:bg-slate-200"
        aria-label="家族を追加"
      >
        <Plus className="w-6 h-6" />
        <span className="text-xs">追加</span>
      </button>
      <button
        type="button"
        onClick={() => { triggerHaptic(); onSettingsClick(); }}
        className="flex-shrink-0 p-2 rounded-xl bg-slate-100 text-slate-500 active:bg-slate-200"
        aria-label="家族設定"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
