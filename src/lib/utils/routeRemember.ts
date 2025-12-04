/**
 * Utility functions for remembering and restoring routes after authentication
 */

const REDIRECT_KEY = 'auth_redirect_path';

/**
 * Store the current route that the user was trying to access
 * @param pathname - The pathname to store
 */
export const storeRedirectPath = (pathname: string): void => {
  if (typeof window !== 'undefined') {
    // Store in sessionStorage
    sessionStorage.setItem(REDIRECT_KEY, pathname);
  }
};

/**
 * Get the stored redirect path
 * @returns The stored pathname or null if not found
 */
export const getRedirectPath = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(REDIRECT_KEY);
  }
  return null;
};

/**
 * Clear the stored redirect path
 */
export const clearRedirectPath = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
};

/**
 * Get redirect path from URL search params or sessionStorage
 * @param searchParams - URL search params (from useSearchParams)
 * @returns The redirect path or null
 */
export const getRedirectFromUrlOrStorage = (searchParams?: URLSearchParams): string | null => {
  // First check URL params (for server-side redirects)
  if (searchParams?.get('redirect')) {
    return searchParams.get('redirect');
  }
  
  // Fallback to sessionStorage
  return getRedirectPath();
};


