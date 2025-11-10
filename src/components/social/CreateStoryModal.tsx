import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image, X, Type, AtSign, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import StoryPreviewModal, { GRADIENTS } from "./StoryPreviewModal";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
} from "@/components/ui/dialog";
import { Json } from "@/integrations/supabase/types";
import { StoryDialog, StoryDialogContent } from "../ui/storyDialog";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onStoryCreated?: () => void;
}

// Overlay type for story elements
interface StoryOverlay {
  id: string;
  type: "text" | "tag" | "location";
  value: string;
  x: number;
  y: number;
  color?: string;
  fontFamily?: string;
  bgColor?: string;
  scale?: number;
  rotation?: number;
  fontSize?: number;
}

// Define a type for the overlays object structure that matches your schema
interface StoryOverlaysPayload {
  backgroundColor?: string | null;
  media?: {
    type: "image" | "video";
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    size: { width: number; height: number };
  };
  texts?: Array<{
    // Texts should be an array of objects
    text: string;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: number;
    position: { x: number; y: number };
    rotation?: number;
    scale?: number;
  }>;
  // Add other potential overlay types like tags, locations if needed
}

const CreateStoryModal = ({
  open,
  onClose,
  onSuccess,
  onStoryCreated,
}: CreateStoryModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [caption, setCaption] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    avatar_url: string;
    full_name: string;
  } | null>(null);
  const [storyType, setStoryType] = useState<"photo" | "text" | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [overlays, setOverlays] = useState<StoryOverlay[]>([]);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [background, setBackground] = useState<string>(GRADIENTS[0]);
  const [pendingStoryType, setPendingStoryType] = useState<
    null | "photo" | "text"
  >(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingCloseAll, setPendingCloseAll] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const isVideo = selectedFile?.type.startsWith("video/");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await socialApi.profiles.getById(user.id);
      if (error) {
        console.error("Failed to fetch user profile", error);
        return;
      }
      setProfile({
        avatar_url: data.avatar_url || '',
        full_name: data.full_name || '',
      });
    };

    if (open) fetchUserProfile();
  }, [open, user?.id]);

  useEffect(() => {
    if (open) {
      setStoryType(null);
      setSelectedFile(null);
      setPreview(null);
      setTags([]);
      setTagInput("");
    }
  }, [open]);

  // Open file picker when photo story is selected
  useEffect(() => {
    if (
      storyType === "photo" &&
      fileInputRef.current &&
      !selectedFile &&
      !fileDialogOpen
    ) {
      setFileDialogOpen(true);
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, [storyType, selectedFile, fileDialogOpen]);

  // If file dialog closes without selecting a file, reset storyType
  // const handleFileInputBlur = () => {
  //   setTimeout(() => {
  //     if (!selectedFile && fileDialogOpen) {
  //       setStoryType(null);
  //       setFileDialogOpen(false);
  //     }
  //   }, 200);
  // };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStoryType(null);
      setShowPhotoPreview(false);
      return;
    }
    // File size checks: 60MB for video, 30MB for image
    if (file.type.startsWith("video/")) {
      if (file.size > 60 * 1024 * 1024) {
        toast({
          variant: "destructive",
          description:
            "Video size exceeds 60MB. Please select a smaller video.",
        });
        setStoryType(null);
        setShowPhotoPreview(false);
        return;
      }
      // Video duration check
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > 120) {
          toast({
            variant: "destructive",
            description:
              "Video duration exceeds 2 minutes. Please select a shorter video.",
          });
          setStoryType(null);
          setShowPhotoPreview(false);
          return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          setShowPhotoPreview(true);
          setStoryType("photo");
        };
        reader.readAsDataURL(file);
      };
      return;
    } else if (file.type.startsWith("image/")) {
      if (file.size > 30 * 1024 * 1024) {
        toast({
          variant: "destructive",
          description:
            "Image size exceeds 30MB. Please select a smaller image.",
        });
        setStoryType(null);
        setShowPhotoPreview(false);
        return;
      }
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setShowPhotoPreview(true);
      setStoryType("photo");
    };
    reader.readAsDataURL(file);
  };

  const handleExportedImage = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const filePath = `${user.id}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("stories")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/png",
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("stories")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;
      const { error: createStoryError } = await socialApi.createStory({
        user_id: user.id,
        media_url: publicUrl,
        caption: caption || undefined,
        story_type: "image",
        overlays: {
          texts: overlays
            .filter((o) => o.type === "text")
            .map((o) => ({
              text: o.value,
              color: o.color,
              backgroundColor: o.bgColor,
              fontFamily: o.fontFamily,
              fontSize: o.fontSize,
              position: { x: o.x, y: o.y },
              rotation: o.rotation,
              scale: o.scale,
            })),
        } as StoryOverlaysPayload as Json,
      });
      if (createStoryError) throw createStoryError;
      setUploadProgress(100);
      toast({ description: "Story created successfully!" });
      await queryClient.invalidateQueries({
        queryKey: ["stories", user.id],
      });
      setShowPhotoPreview(false);
      setShowTextPreview(false);
      setShowDiscardConfirm(false);
      setSelectedFile(null);
      setPreview(null);
      setOverlays([]);
      setStoryType(null);
      setBackground(GRADIENTS[0]);
      if (typeof onSuccess === "function") onSuccess();
      if (typeof onClose === "function") onClose();
    } catch (error) {
      console.error("Error creating story:", error);
      toast({
        variant: "destructive",
        description: "Failed to create story. Please try again.",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  // const handleSubmit = async () => {
  //   if (!selectedFile || !user) return;
  //   setUploading(true);
  //   setUploadProgress(0);

  //   // Simulate upload progress
  //   const progressInterval = setInterval(() => {
  //     setUploadProgress((prev) => {
  //       if (prev >= 95) {
  //         clearInterval(progressInterval);
  //         return prev;
  //       }
  //       return prev + 5;
  //     });
  //   }, 200);

  //   try {
  //     const fileExt = selectedFile.name.split(".").pop();
  //     const filePath = `${user.id}/${Date.now()}.${fileExt}`;

  //     const { data: uploadData, error: uploadError } = await supabase.storage
  //       .from("stories")
  //       .upload(filePath, selectedFile, {
  //         cacheControl: "3600",
  //         upsert: false,
  //       });

  //     if (uploadError) throw uploadError;

  //     const { data: publicUrlData } = supabase.storage
  //       .from("stories")
  //       .getPublicUrl(filePath);

  //     const publicUrl = publicUrlData.publicUrl;
  //     const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
  //     const storyType = videoExtensions.includes(fileExt || "")
  //       ? "video"
  //       : "image";

  //     const { error: createStoryError } = await socialApi.createStory({
  //       user_id: user.id,
  //       media_url: publicUrl,
  //       caption: caption || undefined,
  //       story_type: storyType,
  //       overlays: {
  //         texts: overlays
  //           .filter((o) => o.type === "text")
  //           .map((o) => ({
  //             text: o.value,
  //             color: o.color,
  //             backgroundColor: o.bgColor,
  //             fontFamily: o.fontFamily,
  //             fontSize: o.fontSize,
  //             position: { x: o.x, y: o.y },
  //             rotation: o.rotation,
  //             scale: o.scale,
  //           })),
  //       } as StoryOverlaysPayload as Json,
  //     });

  //     if (createStoryError) throw createStoryError;

  //     setUploadProgress(100);
  //     toast({ description: "Story created successfully!" });
  //     await queryClient.invalidateQueries({
  //       queryKey: ["stories", user.id],
  //     });

  //     onSuccess?.();
  //     handleClose();
  //     onStoryCreated?.();
  //   } catch (error) {
  //     console.error("Error creating story:", error);
  //     toast({
  //       variant: "destructive",
  //       description: "Failed to create story. Please try again.",
  //     });
  //   } finally {
  //     setUploading(false);
  //     setTimeout(() => setUploadProgress(0), 500);
  //   }
  // };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setFileError(null);
    setUploadProgress(0);
    onClose();
  };

  // Open preview modal after main modal closes
  useEffect(() => {
    if (!open && pendingStoryType) {
      if (pendingStoryType === "photo") {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          fileInputRef.current.click();
        }
        setPendingStoryType(null);
      } else if (pendingStoryType === "text") {
        setStoryType("text");
        setShowTextPreview(true);
        setOverlays([]);
        setBackground(GRADIENTS[0]);
        setPendingStoryType(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingStoryType]);

  // Handle closing all modals after discard confirmation
  useEffect(() => {
    if (pendingCloseAll) {
      setShowPhotoPreview(false);
      setShowTextPreview(false);
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      setFileError(null);
      setUploadProgress(0);
      setStoryType(null);
      setOverlays([]);
      setBackground(GRADIENTS[0]);
      setPendingCloseAll(false);
      onClose();
    }
  }, [pendingCloseAll, onClose]);

  return (
    <>
      {/* Hidden file input at root */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        disabled={Image.length >= 10}
      />
      {open && !showPhotoPreview && !showTextPreview && (
        <StoryDialog
          open={open}
          onOpenChange={(val) => {
            if (!uploading) handleClose();
          }}
        >
          <StoryDialogContent
            className="w-full h-screen rounded-none p-0 m-0 bg-white shadow-lg flex flex-col md:max-w-md md:rounded-2xl md:h-auto md:p-6 md:m-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            {/* Only show main modal content if no preview modal is open */}
            {!storyType && (
              <div className="flex flex-1 items-center justify-center flex-col md:flex-row gap-6 md:gap-10 py-8 pt-[env(safe-area-inset-top,32px)] bg-gradient-to-br rounded-2xl mx-2 md:mx-0 md:min-h-[400px] md:justify-center md:items-center">
                <button
                  className="flex flex-col items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-white shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none cursor-pointer group"
                  style={{
                    boxShadow:
                      "0px -6px 24px 0px rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.06)",
                  }}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setShowPhotoPreview(false);
                    setFileDialogOpen(false);
                    setFileError(null);
                    setUploadProgress(0);
                    setCaption("");
                    setOverlays([]);
                    setBackground(GRADIENTS[0]);
                    setTimeout(() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                      }
                    }, 100);
                  }}
                  title="Create a photo or video story"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-200 mb-3 transition-all">
                    <Image className="w-10 h-10 text-blue-500" />
                  </div>
                  <span className="text-base font-semibold text-gray-800 mt-2">
                    Media Story
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Photo or Video
                  </span>
                </button>
                <button
                  className="flex flex-col items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-white shadow-md border-2 border-transparent hover:border-pink-400 hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none cursor-pointer group"
                  style={{
                    boxShadow:
                      "0px -6px 24px 0px rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.06)",
                  }}
                  onClick={() => {
                    setStoryType("text");
                    setShowTextPreview(true);
                    setOverlays([]);
                    setBackground(GRADIENTS[0]);
                  }}
                  title="Create a text story"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 group-hover:bg-pink-200 mb-3 transition-all">
                    <span className="text-4xl font-extrabold text-pink-500">
                      Aa
                    </span>
                  </div>
                  <span className="text-base font-semibold text-gray-800 mt-2">
                    Text Story
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Colorful text
                  </span>
                </button>
              </div>
            )}
            <button
              className="fixed right-6 z-50 p-2  md:top-4"
              style={{
                top: isMobile ? `max(env(safe-area-inset-top, 0px), 52px)` : "",
              }}
              aria-label="Close"
              onClick={handleClose}
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </StoryDialogContent>
        </StoryDialog>
      )}
      {/* Show StoryPreviewModal for photo story */}
      {showPhotoPreview && storyType === "photo" && selectedFile && preview && (
        <StoryPreviewModal
          open={showPhotoPreview}
          media={preview}
          isVideo={isVideo ?? false}
          overlays={
            overlays.filter(
              (o) => o.type === "text"
            ) as import("./StoryPreviewModal").StoryOverlay[]
          }
          setOverlays={(fn) => {
            setOverlays((prev) => {
              const filtered = prev.filter((o) => o.type === "text");
              const updated = fn(filtered as import("./StoryPreviewModal").StoryOverlay[]);
              return [...prev.filter((o) => o.type !== "text"), ...updated];
            });
          }}
          onClose={() => {
            setShowPhotoPreview(false);
            setShowTextPreview(false);
            setSelectedFile(null);
            setPreview(null);
            setCaption("");
            setFileError(null);
            setUploadProgress(0);
            setStoryType(null);
            setOverlays([]);
            setBackground(GRADIENTS[0]);
            if (typeof onClose === "function") onClose();
          }}
          mode="photo"
          background={background}
          onBackgroundChange={setBackground}
          onExportImage={handleExportedImage}
          onStoryCreated={() => {
            setShowPhotoPreview(false);
            setShowTextPreview(false);
            setShowDiscardConfirm(false);
            setSelectedFile(null);
            setPreview(null);
            setCaption("");
            setFileError(null);
            setUploadProgress(0);
            setStoryType(null);
            setOverlays([]);
            setBackground(GRADIENTS[0]);
            if (typeof onSuccess === "function") onSuccess();
            if (typeof onClose === "function") onClose();
          }}
        />
      )}
      {/* Show StoryPreviewModal for text story */}
      {showTextPreview && storyType === "text" && (
        <StoryPreviewModal
          open={showTextPreview}
          media={null}
          isVideo={false}
          overlays={
            overlays.filter(
              (o) => o.type === "text"
            ) as import("./StoryPreviewModal").StoryOverlay[]
          }
          setOverlays={(fn) => {
            setOverlays((prev) => {
              const filtered = prev.filter((o) => o.type === "text");
              const updated = fn(filtered as import("./StoryPreviewModal").StoryOverlay[]);
              return [...prev.filter((o) => o.type !== "text"), ...updated];
            });
          }}
          onClose={() => {
            setShowPhotoPreview(false);
            setShowTextPreview(false);
            setSelectedFile(null);
            setPreview(null);
            setCaption("");
            setFileError(null);
            setUploadProgress(0);
            setStoryType(null);
            setOverlays([]);
            setBackground(GRADIENTS[0]);
            if (typeof onClose === "function") onClose();
          }}
          mode="text"
          background={background}
          onBackgroundChange={setBackground}
          onExportImage={handleExportedImage}
          onStoryCreated={() => {
            setShowPhotoPreview(false);
            setShowTextPreview(false);
            setShowDiscardConfirm(false);
            setSelectedFile(null);
            setPreview(null);
            setCaption("");
            setFileError(null);
            setUploadProgress(0);
            setStoryType(null);
            setOverlays([]);
            setBackground(GRADIENTS[0]);
            if (typeof onSuccess === "function") onSuccess();
            if (typeof onClose === "function") onClose();
          }}
        />
      )}

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <ConfirmDialogContent className="max-w-xs mx-auto text-center p-3">
          <div className="mb-4 text-lg font-semibold">Discard Story?</div>
          <div className="mb-6 text-gray-600">
            Are you sure you want to discard this story? This action cannot be
            undone.
          </div>
          <div className="flex justify-center gap-4">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setShowDiscardConfirm(false);
                setShowPhotoPreview(false);
                setShowTextPreview(false);
                setSelectedFile(null);
                setPreview(null);
                setCaption("");
                setFileError(null);
                setUploadProgress(0);
                setStoryType(null);
                setOverlays([]);
                setBackground(GRADIENTS[0]);
                if (typeof onClose === "function") onClose();
              }}
            >
              Discard
            </button>
          </div>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </>
  );
};

export default CreateStoryModal;
