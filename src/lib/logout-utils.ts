"use client";

// Utility functions for comprehensive logout cleanup

/**
 * Clear all authentication-related data from browser storage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('next-auth') ||
      key.includes('auth') ||
      key.includes('token') ||
      key.includes('session') ||
      key.startsWith('accounting-app-')
    );

    localStorageKeys.forEach(key => localStorage.removeItem(key));

    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage).filter(key =>
      key.startsWith('next-auth') ||
      key.includes('auth') ||
      key.includes('token') ||
      key.includes('session') ||
      key.startsWith('accounting-app-')
    );

    sessionStorageKeys.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing auth data:', error);
  }
}

/**
 * Clear all cookies related to authentication
 */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  try {
    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach((c) => {
      const cookie = c.trim();
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;

      // Clear cookie for all paths and domains
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });
  } catch (error) {
    console.warn('Error clearing auth cookies:', error);
  }
}

/**
 * Clear IndexedDB databases
 */
export async function clearIndexedDB(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;

  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(db => indexedDB.deleteDatabase(db.name))
    );
  } catch (error) {
    console.warn('Error clearing IndexedDB:', error);
  }
}

/**
 * Unregister service workers
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
  } catch (error) {
    console.warn('Error unregistering service workers:', error);
  }
}

/**
 * Comprehensive logout cleanup
 */
export async function performLogoutCleanup(): Promise<void> {
  try {
    // Clear authentication data
    clearAuthData();
    clearAuthCookies();

    // Clear browser storage (optional, for maximum cleanup)
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }

    // Clear IndexedDB and service workers
    await Promise.all([
      clearIndexedDB(),
      unregisterServiceWorkers()
    ]);

    // Force a garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  } catch (error) {
    console.error('Error during logout cleanup:', error);
  }
}

/**
 * Check if the session is still valid
 */
export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check for NextAuth session token
    const sessionToken = localStorage.getItem('next-auth.session-token') ||
                        document.cookie.split(';')
                          .find(c => c.trim().startsWith('next-auth.session-token='))
                          ?.split('=')[1];

    return !!sessionToken;
  } catch (error) {
    console.warn('Error checking session validity:', error);
    return false;
  }
}

/**
 * Force redirect to registration page (or specified URL)
 */
export function forceLoginRedirect(redirectUrl: string = '/register'): void {
  if (typeof window === 'undefined') return;

  // Clear current page from history to prevent back navigation
  window.history.replaceState(null, '', redirectUrl);

  // Force reload to ensure fresh state
  window.location.href = redirectUrl;
}