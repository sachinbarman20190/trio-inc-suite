'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Video, 
  HelpCircle, 
  Calculator, 
  Film, 
  Instagram, 
  BarChart3, 
  Shield, 
  Search, 
  CornerDownLeft, 
  Command, 
  X,
  Sparkles
} from 'lucide-react';

export type DashboardModuleId = 
  | 'chat' 
  | 'meetings' 
  | 'doubts' 
  | 'pod-calc' 
  | 'creatives' 
  | 'media-hub'
  | 'instagram' 
  | 'analytics' 
  | 'admin';

export interface ModuleItem {
  id: DashboardModuleId;
  name: string;
  description: string;
  icon: React.ElementType;
  shortcut: string;
  badge?: string;
  color: string;
  bgLight: string;
  keywords: string[];
}

export const DASHBOARD_MODULES: ModuleItem[] = [
  {
    id: 'chat',
    name: 'Team Chat & Voice Notes',
    description: 'Instant 3-member messaging with 60-second voice note recorder',
    icon: MessageSquare,
    shortcut: '1',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    keywords: ['chat', 'voice', 'audio', 'notes', 'messages', 'communication', 'team'],
  },
  {
    id: 'meetings',
    name: 'Google Meet Hub',
    description: 'One-click meeting scheduler and Google Meet link generator',
    icon: Video,
    shortcut: '2',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    keywords: ['meet', 'meeting', 'video', 'call', 'google meet', 'sync', 'standup'],
  },
  {
    id: 'doubts',
    name: 'Doubts & Updates',
    description: 'Collaborative query tracker with voice notes and resolution tags',
    icon: HelpCircle,
    shortcut: '3',
    color: 'text-indigo-400',
    bgLight: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    keywords: ['doubts', 'updates', 'questions', 'support', 'issues', 'tasks', 'tickets'],
  },
  {
    id: 'pod-calc',
    name: 'POD Profit Engine',
    description: 'Print-on-demand net margin, ad spend and DTF printing ROI calculator',
    icon: Calculator,
    shortcut: '4',
    badge: 'ROI Tools',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    keywords: ['calculator', 'profit', 'pod', 'margin', 'pricing', 'dtf', 'tshirt', 'cost', 'roi'],
  },
  {
    id: 'creatives',
    name: 'Ad Video & Creatives',
    description: '5 TB Google Drive direct streaming repository for video ads',
    icon: Film,
    shortcut: '5',
    badge: '5 TB Host',
    color: 'text-rose-400',
    bgLight: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    keywords: ['video', 'ads', 'creatives', 'drive', 'google drive', 'media', 'upload', 'reels', 'storage'],
  },
  {
    id: 'media-hub',
    name: 'Media Asset Hub & Gallery',
    description: 'Pinterest-style POD design library, DTF master files and 3D mockups',
    icon: Sparkles,
    shortcut: '6',
    badge: 'Pinterest Grid',
    color: 'text-indigo-400',
    bgLight: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    keywords: ['media', 'asset', 'hub', 'gallery', 'designs', 'mockups', 'tshirt', 'hoodie', 'dtf', 'pinterest', 'print', 'vector'],
  },
  {
    id: 'instagram',
    name: 'Instagram Tracker',
    description: 'Organic and paid reel growth analytics with viral benchmark indicators',
    icon: Instagram,
    shortcut: '7',
    color: 'text-pink-400',
    bgLight: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    keywords: ['instagram', 'reels', 'views', 'viral', 'social', 'followers', 'metrics'],
  },
  {
    id: 'analytics',
    name: 'POD Sales Analytics',
    description: 'E-commerce conversion breakdown, revenue milestones and weekly trends',
    icon: BarChart3,
    shortcut: '8',
    color: 'text-sky-400',
    bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    keywords: ['analytics', 'sales', 'revenue', 'orders', 'charts', 'performance', 'summary', 'tasks', 'checklist', 'daily tasks', 'todos'],
  },
  {
    id: 'admin',
    name: 'Admin & Whitelist',
    description: '3-member access management, 5 TB Drive host status and security rules',
    icon: Shield,
    shortcut: '9',
    badge: 'Root Access',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    keywords: ['admin', 'whitelist', 'security', 'storage', 'members', 'sachin', 'quota'],
  },
];

interface QuickNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DashboardModuleId;
  onSelectModule: (id: DashboardModuleId) => void;
}

export function QuickNavigationCommandPalette({
  isOpen,
  onClose,
  activeTab,
  onSelectModule,
}: QuickNavigationProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync state when modal open state changes during render
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearch('');
      const currentIdx = DASHBOARD_MODULES.findIndex((m) => m.id === activeTab);
      setSelectedIndex(currentIdx >= 0 ? currentIdx : 0);
    }
  }

  // Filter modules based on search query
  const filteredModules = DASHBOARD_MODULES.filter((module) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      module.name.toLowerCase().includes(q) ||
      module.description.toLowerCase().includes(q) ||
      module.keywords.some((k) => k.toLowerCase().includes(q)) ||
      module.shortcut === q
    );
  });

  // Calculate safe selected index to prevent out-of-bounds without an effect
  const safeSelectedIndex = Math.min(
    selectedIndex,
    Math.max(0, filteredModules.length - 1)
  );

  // Auto-focus input after modal renders
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Ensure selected item stays scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.children[safeSelectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [safeSelectedIndex]);

  // Handle keyboard events when modal is open
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredModules.length));
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredModules.length) % Math.max(1, filteredModules.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredModules[safeSelectedIndex];
      if (target) {
        onSelectModule(target.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (/^[1-8]$/.test(e.key) && (!search || search.length === 0)) {
      // Direct numeric shortcut (1-8) when search bar is empty
      const target = DASHBOARD_MODULES.find((m) => m.shortcut === e.key);
      if (target) {
        e.preventDefault();
        onSelectModule(target.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Module Navigation"
    >
      <div 
        className="w-full max-w-xl bg-[#090d16] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-slate-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#0d1322]">
          <Search className="w-5 h-5 text-sky-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a module name or press 1-8..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
            title="Press Esc to close"
          >
            ESC
          </button>
        </div>

        {/* Modules List */}
        <div 
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40"
        >
          {filteredModules.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No matching dashboard modules found for &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filteredModules.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === safeSelectedIndex;
              const isCurrentlyActive = item.id === activeTab;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`cursor-pointer min-h-[52px] flex items-center justify-between p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 text-white shadow-md border border-sky-500/40'
                      : 'hover:bg-slate-900/80 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${item.bgLight}`}>
                            {item.badge}
                          </span>
                        )}
                        {isCurrentlyActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <kbd className="hidden sm:inline-flex items-center justify-center text-[10px] font-mono font-bold w-5 h-5 rounded bg-slate-950 border border-slate-700 text-slate-400">
                      {item.shortcut}
                    </kbd>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-semibold">
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-[#070a12] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">↑↓</kbd>
              <span className="hidden sm:inline">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">↵</kbd>
              <span className="hidden sm:inline">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">1-8</kbd>
              <span className="hidden sm:inline">Quick Jump</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Command className="w-3 h-3 text-sky-400" />
            <span>Trio INC. Switcher</span>
          </div>
        </div>
      </div>
    </div>
  );
}
