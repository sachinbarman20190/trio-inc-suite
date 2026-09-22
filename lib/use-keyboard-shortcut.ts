'use client';

import { useEffect, useRef } from 'react';

interface KeyboardShortcutOptions {
  /**
   * Keys to listen for. Case-insensitive string like 'k', 'Escape', etc.
   */
  key: string;
  /**
   * Require Control key on Windows/Linux or Command key on macOS.
   */
  ctrlOrMeta?: boolean;
  /**
   * Require Shift key.
   */
  shiftKey?: boolean;
  /**
   * Require Alt/Option key.
   */
  altKey?: boolean;
  /**
   * Prevent default browser action (e.g., prevent browser search on Ctrl+K).
   */
  preventDefault?: boolean;
  /**
   * If true, trigger even if an input, textarea, or contentEditable element is focused.
   * By default, Ctrl+K or Cmd+K should trigger globally even inside inputs.
   */
  enableInInputs?: boolean;
}

/**
 * Custom React hook to bind global keyboard shortcuts.
 */
export function useKeyboardShortcut(
  callback: (e: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const {
    key,
    ctrlOrMeta = false,
    shiftKey = false,
    altKey = false,
    preventDefault = true,
    enableInInputs = true,
  } = options;

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check target element
      const target = event.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput && !enableInInputs) {
        return;
      }

      // Check modifier keys
      const matchesMetaOrCtrl = ctrlOrMeta ? event.ctrlKey || event.metaKey : true;
      const matchesShift = shiftKey ? event.shiftKey : !event.shiftKey || ctrlOrMeta;
      const matchesAlt = altKey ? event.altKey : !event.altKey;

      // Check main key (case-insensitive)
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();

      if (matchesKey && matchesMetaOrCtrl && matchesShift && matchesAlt) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, ctrlOrMeta, shiftKey, altKey, preventDefault, enableInInputs]);
}
