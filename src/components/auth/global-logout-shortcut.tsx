"use client";

import { useEffect } from 'react';
import { useLogout } from '@/hooks/use-logout';

interface GlobalLogoutShortcutProps {
  enabled?: boolean;
  shortcut?: string[];
}

export function GlobalLogoutShortcut({
  enabled = true,
  shortcut = ['Shift', 'Control', 'Q']
}: GlobalLogoutShortcutProps) {
  const { logout, isLoggingOut } = useLogout();

  useEffect(() => {
    if (!enabled || isLoggingOut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if all modifier keys are pressed
      const modifiers = ['Shift', 'Control', 'Alt', 'Meta'];
      const pressedModifiers = modifiers.filter(mod =>
        mod in event && (event as any)[mod]
      );

      const isModifierPressed = shortcut.some(key => modifiers.includes(key));
      const requiredModifiers = shortcut.filter(key => modifiers.includes(key));
      const hasAllModifiers = requiredModifiers.every(mod =>
        mod in event && (event as any)[mod]
      );

      // Check for non-modifier keys
      const nonModifierKeys = shortcut.filter(key => !modifiers.includes(key));
      const hasAllKeys = nonModifierKeys.every(key =>
        event.key.toLowerCase() === key.toLowerCase()
      );

      if (hasAllModifiers && hasAllKeys) {
        event.preventDefault();
        event.stopPropagation();

        // Show confirmation for keyboard logout
        const confirmed = window.confirm(
          'Are you sure you want to log out?\n\nThis will clear all your session data.'
        );

        if (confirmed) {
          logout({ redirectUrl: '/register', clearAllData: true, showLoading: true, forceSessionClear: true });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, shortcut, logout, isLoggingOut]);

  // This component doesn't render anything visible
  return null;
}