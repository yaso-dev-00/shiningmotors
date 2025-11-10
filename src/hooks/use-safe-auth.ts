import { useAuth } from "@/contexts/AuthContext";

/**
 * Safe wrapper for useAuth that returns null if AuthProvider is not available
 * Useful during SSR or when component is rendered outside AuthProvider
 */
export function useSafeAuth() {
  try {
    return useAuth();
  } catch (e) {
    // AuthProvider not available - return null values
    return {
      session: null,
      user: null,
      profile: null,
      userRole: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      isVendor: false,
      signUp: async () => null,
      signIn: async () => null,
      signInWithGoogle: async () => null,
      signOut: async () => false,
      adminLogin: async () => false,
    };
  }
}




