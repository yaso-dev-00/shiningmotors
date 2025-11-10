import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProfileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadProfilePicture = async (file: File) => {
    try {
      setUploading(true);

      if (!file) {
        throw new Error("You must select an image to upload.");
      }

      const fileExt = file.name.split(".").pop();
      if (!fileExt) {
        throw new Error("File must have an extension");
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const filePath = `/${userId}/${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from("avatar")
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      return publicUrlData.publicUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload profile picture";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadCoverImage = async (file: File) => {
    try {
      setUploading(true);

      if (!file) {
        throw new Error("You must select an image to upload.");
      }

      const fileExt = file.name.split(".").pop();
      if (!fileExt) {
        throw new Error("File must have an extension");
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const filePath = `/${userId}/${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      // Update user profile with new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cover_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Cover image updated successfully",
      });

      return publicUrlData.publicUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload cover image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadProfilePicture,
    uploadCoverImage,
    uploading,
  };
};
