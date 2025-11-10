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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid recursive calls
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
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
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setSession(null);
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
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
