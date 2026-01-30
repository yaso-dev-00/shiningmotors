"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { profilesApi } from "@/integrations/supabase/modules/profiles";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: SupabaseUser | null;
  profile: any | null;
  userRole: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
};

type UserRole = "USER" | "ADMIN" | "VENDOR";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = userRole === "ADMIN";
  const isVendor = userRole === "VENDOR";
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        // If there's an error or no session, ensure we're logged out
        if (error || !session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        // Verify the session is still valid by checking the user
        if (session?.user) {
          // Verify the session hasn't expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            // Session expired, clear it
            setSession(null);
            setUser(null);
            setProfile(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          setSession(session);
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle SIGNED_OUT event explicitly
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setLoading(false);
        
        // Clear any remaining storage
        if (typeof window !== 'undefined') {
          const supabaseKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') || key.startsWith('supabase.')
          );
          supabaseKeys.forEach(key => localStorage.removeItem(key));
        }
        return;
      }

      // Verify session is valid
      if (session?.user) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          // Session expired
          setSession(null);
          setUser(null);
          setProfile(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session.user);
        // Use setTimeout to avoid recursive calls
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await profilesApi.profiles.getById(userId);
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      if (data) {
        setProfile(data);
        setUserRole((data.role as UserRole) || "USER");
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      return { data };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      return { data };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      return { data };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { error: err };
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Check if user has admin role
      if (data.user) {
        const { data: profileData, error: profileError } =
          await profilesApi.profiles.getById(data.user.id);
        if (profileError || !profileData || profileData.role !== "ADMIN") {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          return false;
        }
      }

      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      });
      return false;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setSession(null);
      
      // Sign out from Supabase (this clears cookies and session)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        // Even if there's an error, clear local storage
      }
      
      // Clear any remaining session data from localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        // Clear Supabase session storage
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.startsWith('supabase.')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear any auth-related cookies manually (as a fallback)
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.trim().split("=")[0];
          if (cookieName.includes('supabase') || cookieName.includes('sb-') || cookieName.includes('access_token')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          }
        });
      }
      
      // Force a session refresh to ensure state is cleared
      await supabase.auth.getSession();
      
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      // Even on error, clear local state
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setSession(null);
      return false;
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    userRole,
    loading,
    isAuthenticated,
    isAdmin,
    isVendor,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    adminLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During Next.js build/SSR, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        session: null,
        user: null,
        profile: null,
        userRole: null,
        loading: true,
        isAuthenticated: false,
        isAdmin: false,
        isVendor: false,
        signUp: async () => ({ error: new Error('Not available during build') }),
        signIn: async () => ({ error: new Error('Not available during build') }),
        signInWithGoogle: async () => ({ error: new Error('Not available during build') }),
        signOut: async () => false,
        adminLogin: async () => false,
      } as AuthContextType;
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
