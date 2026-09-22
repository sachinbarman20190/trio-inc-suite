'use client';

import { useState, useCallback } from 'react';
import { useKeyboardShortcut } from './use-keyboard-shortcut';
import { DashboardModuleId, DASHBOARD_MODULES } from '@/components/QuickNavigationCommandPalette';

export function useDashboardNavigation(
  currentTab: DashboardModuleId,
  onTabChange: (tab: DashboardModuleId) => void
) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMac] = useState(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    }
    return false;
  });

  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen((prev) => !prev);
  }, []);

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  // Global shortcut: Ctrl+K or Cmd+K toggles the palette
  useKeyboardShortcut(
    () => {
      toggleCommandPalette();
    },
    {
      key: 'k',
      ctrlOrMeta: true,
      preventDefault: true,
      enableInInputs: true,
    }
  );

  // Global shortcut: Escape closes the palette
  useKeyboardShortcut(
    () => {
      if (isCommandPaletteOpen) {
        closeCommandPalette();
      }
    },
    {
      key: 'Escape',
      preventDefault: true,
      enableInInputs: true,
    }
  );

  // Optional: Quick cycle through modules with Alt + ArrowRight / Alt + ArrowLeft
  useKeyboardShortcut(
    () => {
      const currentIndex = DASHBOARD_MODULES.findIndex((m) => m.id === currentTab);
      const nextIndex = (currentIndex + 1) % DASHBOARD_MODULES.length;
      onTabChange(DASHBOARD_MODULES[nextIndex].id);
    },
    {
      key: 'ArrowRight',
      altKey: true,
      preventDefault: true,
      enableInInputs: false,
    }
  );

  useKeyboardShortcut(
    () => {
      const currentIndex = DASHBOARD_MODULES.findIndex((m) => m.id === currentTab);
      const prevIndex = (currentIndex - 1 + DASHBOARD_MODULES.length) % DASHBOARD_MODULES.length;
      onTabChange(DASHBOARD_MODULES[prevIndex].id);
    },
    {
      key: 'ArrowLeft',
      altKey: true,
      preventDefault: true,
      enableInInputs: false,
    }
  );

  return {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    toggleCommandPalette,
    openCommandPalette,
    closeCommandPalette,
    isMac,
    shortcutLabel: isMac ? '⌘K' : 'Ctrl+K',
  };
}
