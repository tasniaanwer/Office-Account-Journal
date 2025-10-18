"use client";

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { performLogoutCleanup, forceLoginRedirect } from '@/lib/logout-utils';

interface LogoutOptions {
  redirectUrl?: string;
  clearAllData?: boolean;
  showLoading?: boolean;
  forceSessionClear?: boolean;
}

export function useLogout() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async (options: LogoutOptions = {}) => {
    const {
      redirectUrl = '/login', // Default to login page
      clearAllData = true,
      showLoading = true,
      forceSessionClear = true
    } = options;

    if (isLoggingOut) return false;

    setIsLoggingOut(showLoading);

    try {
      // Force session invalidation if requested
      if (forceSessionClear) {
        // Immediately clear session data to prevent any race conditions
        if (typeof window !== 'undefined') {
          // Clear NextAuth specific storage immediately
          const nextAuthKeys = Object.keys(localStorage).filter(key =>
            key.startsWith('next-auth') || key.includes('session') || key.includes('token')
          );
          nextAuthKeys.forEach(key => localStorage.removeItem(key));

          // Clear session storage
          const sessionAuthKeys = Object.keys(sessionStorage).filter(key =>
            key.startsWith('next-auth') || key.includes('session') || key.includes('token')
          );
          sessionAuthKeys.forEach(key => sessionStorage.removeItem(key));

          // Clear cookies immediately
          document.cookie.split(";").forEach((c) => {
            const cookie = c.trim();
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;

            // Clear all variations of the cookie
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            if (window.location.hostname !== 'localhost') {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            }
          });
        }
      }

      // Clear client-side data if requested
      if (clearAllData) {
        await performLogoutCleanup();
      }

      // Perform NextAuth sign out with forced session termination
      await signOut({
        callbackUrl: redirectUrl,
        redirect: true
      });

      return true;
    } catch (error) {
      console.error('Logout error:', error);

      // Enhanced error recovery with comprehensive cleanup
      try {
        // Force complete session removal
        await performLogoutCleanup();

        // Additional session invalidation
        if (typeof window !== 'undefined') {
          // Force reload to ensure no cached session data
          window.sessionStorage.clear();
          window.localStorage.clear();
        }

        forceLoginRedirect(redirectUrl);
        return true;
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);

        // Final fallback - force redirect with cache busting
        if (typeof window !== 'undefined') {
          const timestamp = new Date().getTime();
          const url = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}t=${timestamp}&logout=1`;
          window.location.href = url;
        }
        return true;
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return {
    logout,
    isLoggingOut,
    isAuthenticated: !!session
  };
}