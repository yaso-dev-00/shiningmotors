import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useVendorLogoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadBusinessLogo = async (file: File, vendorId: string) => {
    try {
      setUploading(true);

      if (!file) {
        throw new Error("You must select an image to upload.");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file.");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${vendorId}/${Math.random()
        .toString(36)
        .slice(2)}-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage in vendor bucket
      const { error: uploadError } = await supabase.storage
        .from("vendor")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from("vendor")
        .getPublicUrl(fileName);

      // Update vendor registration with new business logo URL
      const { error: updateError } = await supabase
        .from("vendor_registrations")
        .update({
          business_logo_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Business logo updated successfully",
      });

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading business logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload business logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteBusinessLogo = async (vendorId: string) => {
    try {
      setUploading(true);

      // Update vendor registration to remove business logo URL
      const { error: updateError } = await supabase
        .from("vendor_registrations")
        .update({
          business_logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Business logo removed successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting business logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove business logo",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadBusinessLogo,
    deleteBusinessLogo,
    uploading,
  };
};
