import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOnlineStatus = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const updateLastSeen = async () => {
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", userId);
    };

    updateLastSeen();

    // Update every 30 seconds
    const interval = setInterval(updateLastSeen, 30000);

    // Update on tab close
    const handleBeforeUnload = () => updateLastSeen();
    window.addEventListener("beforeunload", handleBeforeUnload);

    // On visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateLastSeen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]);
};
