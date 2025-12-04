
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getRedirectPath, clearRedirectPath } from "@/lib/utils/routeRemember";

const AuthCallback = () => {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) throw error;

        toast({
          title: "Authentication successful",
          description: "You've successfully signed in with Google.",
        });
        
        // Get redirect path from sessionStorage (stored before OAuth)
        const redirectPath = typeof window !== 'undefined' 
          ? sessionStorage.getItem('oauth_redirect_path') || getRedirectPath()
          : null;
        
        if (redirectPath && typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_redirect_path');
        }
        clearRedirectPath();
        
        // Close the popup and notify the parent window
        if (window.opener) {
          window.opener.postMessage('signin_success', window.location.origin);
          window.close();
        } else {
          // Fallback for cases where it's not a popup
          router.replace((redirectPath || "/") as Route);
        }
      } catch (error: any) {
        console.error("Error during OAuth callback:", error);
        toast({
          title: "Authentication failed",
          description: error.message || "Failed to complete authentication process.",
          variant: "destructive",
        });
        if (window.opener) {
          window.opener.postMessage('signin_error', window.location.origin);
          window.close();
        } else {
          router.replace("/auth");
        }
      }
    };

    handleAuthCallback();
  }, [router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sm-red mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
