import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  supabase,
  socialApi,
  profilesApi,
} from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Camera,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Trash,
  RotateCw,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import VideoCropper from "@/components/VideoCropper";
import { useMyContext, ContextTypes } from "@/contexts/GlobalContext";

interface CreatePostProps {
  userAvatar?: string;
  onPostCreated?: (post: any) => void;
  open?: boolean;
  onClose?: () => void;
}

const CreatePost = ({
  userAvatar,
  onPostCreated,
  open,
  onClose,
}: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const context = useMyContext() as ContextTypes | undefined;
  const muted = context?.muted ?? false;
  const setMuted = context?.setMuted ?? (() => {});
  const [category, setCategory] = useState<
    "Experience" | "Product" | "Vehicle"
  >("Experience");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<{
    avatar_url: string;
    full_name: string;
  } | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState<{ [idx: number]: boolean }>(
    {}
  );
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collaborators, setCollaborators] = useState<
    { id: string; username: string; avatar_url: string; full_name: string }[]
  >([]);
  const [collabInput, setCollabInput] = useState("");
  const [collabSuggestions, setCollabSuggestions] = useState<
    { id: string; username: string; avatar_url: string; full_name: string }[]
  >([]);
  const [collabLoading, setCollabLoading] = useState(false);
  // Add cropping state
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropAspect, setCropAspect] = useState(900 / 350);
  // Add state to store crop params for each video
  const [videoCropParams, setVideoCropParams] = useState<{
    [index: number]: any;
  }>({});
  // Add state for post aspect ratio
  const [postAspect, setPostAspect] = useState<number | null>(null);
  // Add state for video aspect ratio selection
  const [videoAspectRatio, setVideoAspectRatio] = useState<
    "1:1" | "9:16" | "4:5"
  >("1:1");
  // Add state for image aspect ratio selection
  const [imageAspectRatio, setImageAspectRatio] = useState<
    "1:1" | "4:5" | "9:16"
  >("1:1");
  // Add state for image rotation (in degrees, per image index)
  const [imageRotations, setImageRotations] = useState<{ [index: number]: number }>({});

  const onCropComplete = (croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Function to rotate an image file
  const rotateImageFile = async (file: File, rotation: number): Promise<File> => {
    if (rotation === 0 || !file.type.startsWith("image/")) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      img.onload = () => {
        // Swap width and height for 90/270 degree rotations
        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const rotatedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(rotatedFile);
            } else {
              reject(new Error("Failed to create rotated image"));
            }
          },
          file.type,
          0.95
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (imageAspectRatio === "1:1") {
      setVideoAspectRatio("1:1");
    } else if (imageAspectRatio === "4:5") {
      setVideoAspectRatio("4:5");
    } else if (imageAspectRatio === "9:16") {
      setVideoAspectRatio("9:16");
    }
  }, [imageAspectRatio]);

  useEffect(() => {
    if (videoAspectRatio === "1:1") {
      setImageAspectRatio("1:1");
    } else if (videoAspectRatio === "4:5") {
      setImageAspectRatio("4:5");
    } else if (videoAspectRatio === "9:16") {
      setImageAspectRatio("9:16");
    }
  }, [videoAspectRatio]);

  useEffect(() => {
    if (!muted) setMuted(true);
  }, [open]);

  // Function to convert aspect ratio string to number
  const getAspectRatioNumber = (ratio: "1:1" | "9:16" | "4:5"): number => {
    switch (ratio) {
      case "1:1":
        return 1;

      case "9:16":
        return 9 / 16;
      case "4:5":
        return 4 / 5;
      default:
        return 1;
    }
  };

  // Helper function to safely set aspect ratio based on media type
  const setAspectRatio = (ratio: "1:1" | "9:16" | "4:5" | "16:9") => {
    const isVideo = images[mediaIndex]?.type.startsWith("video/");
    if (isVideo) {
      if (ratio === "16:9") return;
      setVideoAspectRatio(ratio as "1:1" | "4:5" | "9:16");
    } else {
      if (ratio === "16:9") return; // 16:9 not available for images
      setImageAspectRatio(ratio as "1:1" | "4:5" | "9:16");
    }
    setVideoCropParams({});
  };

  const getCroppedImg = (imageSrc: string, crop: any, rotation: number = 0): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // react-easy-crop provides crop coordinates relative to the displayed (rotated) image
        // We need to transform these coordinates to the original image space
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to crop dimensions
        canvas.width = crop.cropWidth;
        canvas.height = crop.cropHeight;

        // For rotation, we need to transform coordinates
        // The crop coordinates from react-easy-crop are already in the rotated space
        // So we can use them directly, but we need to account for rotation when drawing
        
        if (rotation === 0) {
          // No rotation - simple crop
          ctx.drawImage(
            image,
            crop.cropX * scaleX,
            crop.cropY * scaleY,
            crop.cropWidth * scaleX,
            crop.cropHeight * scaleY,
            0,
            0,
            crop.cropWidth,
            crop.cropHeight
          );
        } else {
          // For rotated images, we need to:
          // 1. Rotate the entire image first
          // 2. Then crop from the rotated image
          
          // Create a temporary canvas for the rotated image
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          if (!tempCtx) {
            reject(new Error("Could not get temp canvas context"));
            return;
          }

          // Calculate dimensions after rotation
          let rotatedWidth = image.naturalWidth;
          let rotatedHeight = image.naturalHeight;
          
          if (rotation === 90 || rotation === 270) {
            rotatedWidth = image.naturalHeight;
            rotatedHeight = image.naturalWidth;
          }

          tempCanvas.width = rotatedWidth;
          tempCanvas.height = rotatedHeight;

          // Draw and rotate the image
          tempCtx.save();
          tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
          tempCtx.rotate((rotation * Math.PI) / 180);
          tempCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
          tempCtx.restore();

          // Now crop from the rotated image
          // The crop coordinates are relative to the rotated display, so we can use them directly
          ctx.drawImage(
            tempCanvas,
            crop.cropX * scaleX,
            crop.cropY * scaleY,
            crop.cropWidth * scaleX,
            crop.cropHeight * scaleY,
            0,
            0,
            crop.cropWidth,
            crop.cropHeight
          );
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        }, "image/png");
      };
      image.onerror = (err) => reject(err as any);
    });
  };

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await socialApi.profiles.getById(user.id);
      if (error) {
        if (error instanceof Error) {
          console.error("Failed to fetch user profile", error.message);
        } else {
          console.error("Failed to fetch user profile", error);
        }
        return;
      }
      setProfileImage({
        avatar_url: data.avatar_url || '',
        full_name: data.full_name || '',
      });
    };

    if (open) fetchUserProfile();
  }, [open, user?.id]);

  useEffect(() => {
    if (location.length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }
    const controller = new AbortController();
    const fetchLocations = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            location
          )}&addressdetails=1&limit=5`,
          { signal: controller.signal }
        );
        const data: { display_name: string }[] = await res.json();
        setLocationSuggestions(data.map((item) => item.display_name));
        setShowLocationDropdown(true);
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") setLocationSuggestions([]);
      }
    };
    fetchLocations();
    return () => controller.abort();
  }, [location]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Tag input handlers
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (
        tagInput.length <= 30 &&
        tags.length < 20 &&
        !tags.includes(tagInput.trim())
      ) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const maxFiles = 10;
      const remainingSlots = maxFiles - images.length;
      const validFiles: File[] = [];
      const rejected: string[] = [];
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm"];

      const processFiles = async () => {
        for (const file of newFiles) {
          if (validFiles.length >= remainingSlots) break;

          const isVideo = file.type.startsWith("video/");
          const isImage = file.type.startsWith("image/");

          if (isVideo && file.size > 30 * 1024 * 1024) {
            rejected.push(`Video '${file.name}' exceeds 30MB size limit.`);
            continue;
          }
          if (isImage && file.size > 20 * 1024 * 1024) {
            rejected.push(`Image '${file.name}' exceeds 20MB size limit.`);
            continue;
          }

          if (isVideo) {
            if (!allowedVideoTypes.includes(file.type)) {
              rejected.push(
                `Video '${file.name}' is not a supported video type.`
              );
              continue;
            }
            const videoURL = URL.createObjectURL(file);
            const video = document.createElement("video");
            video.preload = "metadata";
            video.src = videoURL;
            await new Promise<void>((resolve) => {
              video.onloadedmetadata = () => {
                const aspect = video.videoWidth / video.videoHeight;
                if (video.duration > 60) {
                  rejected.push(
                    `Video '${file.name}' exceeds 1 minute duration limit.`
                  );
                  URL.revokeObjectURL(videoURL);
                } else {
                  validFiles.push(file);
                  setImageUrls((prev) => [...prev, videoURL]);
                }
                resolve();
              };
            });
          } else if (isImage) {
            if (!allowedImageTypes.includes(file.type)) {
              rejected.push(
                `Image '${file.name}' is not a supported image type.`
              );
              continue;
            }
            const imageUrl = URL.createObjectURL(file);
            validFiles.push(file);
            setImageUrls((prev) => [...prev, imageUrl]);
            // Log image dimensions for debugging
            await new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                resolve();
              };
              img.src = imageUrl;
            });
          }
        }

        if (rejected.length > 0) {
          toast({
            title: "File upload error",
            description: rejected.join("\n"),
            variant: "destructive",
          });
          setShowMediaModal(false);
          return;
        }

        if (images.length + validFiles.length > maxFiles) {
          toast({
            description: `You can only upload up to ${maxFiles} files.`,
          });
        }

        setImages((prev) => [...prev, ...validFiles]);
        setShowMediaModal(true);
        setShowTagModal(false);
      };

      processFiles();
    }
  };

  const handleClose = () => {
    setShowMediaModal(false);
    setShowTagModal(false);
    setImages([]);
    setImageUrls([]);
    setMediaIndex(0);
    setTags([]);
    setTagInput("");
    setContent("");
    setLocation("");
    setCollaborators([]);
    setCollabInput("");
    setCollabSuggestions([]);
    setPostAspect(null); // Reset post aspect ratio
    setVideoAspectRatio("1:1"); // Reset video aspect ratio
    setImageAspectRatio("1:1"); // Reset image aspect ratio
    setImageRotations({}); // Reset image rotations
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onClose) onClose();
  };

  useEffect(() => {
    if (open && fileInputRef.current) {
      fileInputRef.current.value = "";
      setTimeout(() => {
        if (fileInputRef.current) fileInputRef.current.click();
      }, 0);
    }
    if (!open) {
      handleClose();
    }
  }, [open]);

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImageUrls(newImageUrls);
    if (newImageUrls.length === 0) {
      setShowMediaModal(false);
      setShowTagModal(false);
      setMediaIndex(0);
      setTags([]);
      setTagInput("");
      setContent("");
    } else if (mediaIndex >= newImageUrls.length) {
      setMediaIndex(newImageUrls.length - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to create posts",
        variant: "destructive",
      });
      return;
    }
    if (images.length === 0) {
      toast({
        description: "Please select at least one image or video to post.",
        variant: "destructive",
      });
      return;
    }
    setIsPosting(true);
    try {
      const uploadedMediaUrls = await Promise.all(
        images.map(async (file, idx) => {
          // If this is a video with crop params, call backend crop API
          if (videoCropParams[idx] && file.type.startsWith("video/")) {
            // For large videos, upload to Supabase first to avoid Vercel request size limits
            const fileSizeMB = file.size / (1024 * 1024);
            const useDirectUpload = fileSizeMB < 3; // Use direct upload for files < 3MB
            
            let videoUrl: string | null = null;
            
            if (!useDirectUpload) {
              // Upload to Supabase storage first for large files
              const fileExt = file.name.split(".").pop();
              const tempFileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
              const tempFilePath = `${user.id}/temp/${tempFileName}`;
              
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from("posts")
                .upload(tempFilePath, file, {
                  contentType: file.type,
                  upsert: false,
                });
              
              if (uploadError) {
                throw new Error(`Failed to upload video: ${uploadError.message}`);
              }
              
              const { data: publicUrlData } = supabase.storage
                .from("posts")
                .getPublicUrl(tempFilePath);
              
              videoUrl = publicUrlData.publicUrl;
              console.log("[CreatePost] Uploaded large video to Supabase:", videoUrl);
            }
            
            const formData = new FormData();
            if (useDirectUpload) {
              formData.append("video", file);
            } else if (videoUrl) {
              formData.append("videoUrl", videoUrl);
            }
            formData.append("cropX", videoCropParams[idx].cropX);
            formData.append("cropY", videoCropParams[idx].cropY);
            formData.append("cropWidth", videoCropParams[idx].cropWidth);
            formData.append("cropHeight", videoCropParams[idx].cropHeight);
            formData.append("userId", user.id);
            
            const response = await fetch("/api/crop", {
              method: "POST",
              body: formData,
            });
            
            if (!response.ok) {
              // Clean up temp file if it was uploaded
              if (videoUrl) {
                try {
                  const filePath = videoUrl.split("/posts/")[1];
                  if (filePath) {
                    await supabase.storage.from("posts").remove([filePath]);
                  }
                } catch {
                  // Ignore cleanup errors
                }
              }
              const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
              throw new Error(
                errorData.error || "Failed to crop video. Please try a smaller video or check your connection."
              );
            }
            
            const croppedVideoUrl = await response.json();
            
            // Clean up temp file after successful crop
            if (videoUrl) {
              try {
                const filePath = videoUrl.split("/posts/")[1];
                if (filePath) {
                  await supabase.storage.from("posts").remove([filePath]);
                }
              } catch {
                // Ignore cleanup errors
              }
            }
            
            return croppedVideoUrl.url;
          } else if (videoCropParams[idx] && file.type.startsWith("image/")) {
            // For images, crop in browser using stored crop params with rotation
            // getCroppedImg now handles rotation internally
            const croppedBlob = await getCroppedImg(
              imageUrls[idx],
              videoCropParams[idx],
              imageRotations[idx] || 0
            );
            const croppedFile = new File([croppedBlob], file.name, {
              type: file.type,
            });
            const fileExt = croppedFile.name.split(".").pop();
            const fileName = `${Math.random()
              .toString(36)
              .substring(2)}-${Date.now()}.${fileExt}`;
            const userId = user.id;
            const filePath = `${userId}/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from("posts")
              .upload(filePath, croppedFile);
            if (uploadError) throw uploadError;
            const { data: publicURL } = supabase.storage
              .from("posts")
              .getPublicUrl(filePath);
            return publicURL.publicUrl;
          } else {
            // For images or videos without crop params, apply rotation if needed then upload
            let fileToUpload = file;
            // Apply rotation to images if rotation is set
            if (file.type.startsWith("image/") && imageRotations[idx]) {
              fileToUpload = await rotateImageFile(file, imageRotations[idx]);
            }
            const fileExt = fileToUpload.name.split(".").pop();
            const fileName = `${Math.random()
              .toString(36)
              .substring(2)}-${Date.now()}.${fileExt}`;
            const userId = user.id;
            const filePath = `${userId}/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from("posts")
              .upload(filePath, fileToUpload);
            if (uploadError) throw uploadError;
            const { data: publicURL } = supabase.storage
              .from("posts")
              .getPublicUrl(filePath);
            return publicURL.publicUrl;
          }
        })
      );

      const hashtagRegex = /#(\w+)/g;
      const hashtags =
        content.match(hashtagRegex)?.map((tag) => tag.substring(1)) || [];

      const postData = {
        user_id: user.id,
        content,
        media_urls: uploadedMediaUrls,
        category,
        tags: hashtags.concat(tags),
        location,
        user_tag: collaborators.map((c) => c.id).join(","),
      };

      const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select("*, profile:user_id(id, avatar_url, username, full_name)")
        .single();

      if (error) throw error;

      setContent("");
      setImages([]);
      setImageUrls([]);
      setCategory("Experience");
      setTags([]);
      setShowMediaModal(false);
      setShowTagModal(false);

      if (onPostCreated) onPostCreated(data);
      if (onClose) onClose();

      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
    } catch (error: unknown) {
      console.error("Error creating post:", error);
      toast({
        title: "Post failed",
        description:
          error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      setTimeout(() => fileInputRef.current && fileInputRef.current.click(), 0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 40) {
      setMediaIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    }
    if (dx < -40) {
      setMediaIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
    }
    setTouchStartX(null);
  };

  // Fetch user suggestions as user types
  useEffect(() => {
    if (collabInput.trim().length === 0) {
      setCollabSuggestions([]);
      return;
    }
    setCollabLoading(true);
    profilesApi.profiles.searchByQuery(collabInput.trim()).then(({ data }) => {
      if (data) {
        // Exclude already selected collaborators
        const list = (data as any[]) ?? [];
        setCollabSuggestions(
          list.filter(
            (u: {
              id: string;
              username: string;
              avatar_url: string;
              full_name: string;
            }) => !collaborators.some((c) => c.id === u.id)
          )
        );
      } else {
        setCollabSuggestions([]);
      }
      setCollabLoading(false);
    });
  }, [collabInput, collaborators]);

  const renderMediaModal = () => (
    <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
      <DialogContent
        className="w-full max-w-xs rounded-none md:rounded-3xl bg-gray-200 shadow-lg p-0 md:p-6 m-0 md:m-auto md:w-[500px] flex flex-col  md:h-auto md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        style={{
          maxWidth: "95%",
          margin: "0",
          padding: "0",
          borderRadius: "5px",
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="sticky top-0 z-10 bg-gray-200 rounded-t-2xl flex items-center justify-between px-4 py-3 border-b gap-2">
          {/* Rotate button for images only - positioned in header */}
          {images.length > 0 && images[mediaIndex] && !images[mediaIndex].type.startsWith("video/") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setImageRotations((prev) => ({
                  ...prev,
                  [mediaIndex]: ((prev[mediaIndex] || 0) + 90) % 360,
                }));
              }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Rotate image"
            >
              <RotateCw className="w-5 h-5 text-gray-600" />
            </Button>
          )}
          <div className="flex-1"></div>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-2 relative">
          <div className="w-full flex flex-col items-center">
            {imageUrls.length > 0 && (
              <div className="relative w-full flex flex-col items-center select-none">
                <div
                  className="w-full flex justify-center items-center relative"
                  style={{ minHeight: "50vh" }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Left navigation button (desktop only, not first media) */}
                  {!isMobile && imageUrls.length > 1 && mediaIndex !== 0 && (
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 z-10 md:p-1"
                      onClick={() =>
                        setMediaIndex((prev) =>
                          prev === 0 ? imageUrls.length - 1 : prev - 1
                        )
                      }
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                  )}
                  {images[mediaIndex] &&
                  ["image/", "video/"].some((type) =>
                    images[mediaIndex].type.startsWith(type)
                  ) ? (
                    <VideoCropper
                      videoFile={images[mediaIndex]}
                      videoUrl={imageUrls[mediaIndex]}
                      aspect={
                        images[mediaIndex].type.startsWith("video/")
                          ? getAspectRatioNumber(videoAspectRatio)
                          : getAspectRatioNumber(imageAspectRatio)
                      }
                      rotation={images[mediaIndex].type.startsWith("image/") ? (imageRotations[mediaIndex] || 0) : 0}
                      onCropChange={(params: any) => {
                        setVideoCropParams((prev) => ({
                          ...prev,
                          [mediaIndex]: params,
                        }));
                      }}
                    />
                  ) : (
                    <img
                      src={imageUrls[mediaIndex]}
                      alt={`Preview ${mediaIndex + 1}`}
                      className="max-h-[50vh] w-full object-contain rounded-md"
                      style={{
                        transform: `rotate(${imageRotations[mediaIndex] || 0}deg)`,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  )}
                  {/* Right navigation button (desktop only, not last media) */}
                  {!isMobile &&
                    imageUrls.length > 1 &&
                    mediaIndex !== imageUrls.length - 1 && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 z-10 md:p-1"
                        onClick={() =>
                          setMediaIndex((prev) =>
                            prev === imageUrls.length - 1 ? 0 : prev + 1
                          )
                        }
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                      </button>
                    )}
                </div>
                {/* Media Preview Bar - only selected media shows delete button as overlay */}

                {imageUrls.length > 1 && (
                  <div
                    // ref={mediaScrollContainerRef}
                    className="w-full flex items-center justify-center gap-2 mt-6 mb-2 overflow-x-auto scrollbar-hide p-2"
                  >
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className={`relative flex flex-col items-center cursor-pointer rounded-md transition-all duration-200 ${
                          idx === mediaIndex
                            ? "ring-4 ring-sm-red"
                            : "ring-1 ring-gray-200"
                        }`}
                        onClick={() => setMediaIndex(idx)}
                        tabIndex={0}
                        aria-label={`Select media ${idx + 1}`}
                        style={{ minWidth: "3.5rem", minHeight: "3.5rem" }}
                      >
                        {images[idx]?.type.startsWith("video/") ? (
                          <video
                            src={url}
                            className="w-14 h-14 object-cover rounded-md border border-gray-200 bg-black"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Media ${idx + 1}`}
                            className="w-14 h-14 object-cover rounded-md border border-gray-200"
                          />
                        )}
                        {/* Only show delete button for selected media as overlay */}
                        {idx === mediaIndex && (
                          <button
                            type="button"
                            className="absolute top-3 right-3 bg-white border border-gray-200 shadow-md rounded-full p-2 flex items-center justify-center z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(idx);
                            }}
                            aria-label="Delete this media"
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-2">
          {/* Aspect Ratio Selector - show for both images and videos */}
          {images.length > 0 && images[mediaIndex] && (
            <div className="mb-4">
              {/* <label className="block text-sm font-semibold text-gray-700 mb-2">
                 {images[mediaIndex]?.type.startsWith('video/') ? 'Video' : 'Image'} Aspect Ratio
               </label> */}
              <div className="flex gap-2">
                {(() => {
                  const isVideo = images[mediaIndex]?.type.startsWith("video/");
                  const ratios = isVideo
                    ? (["1:1", "4:5", "9:16"] as const)
                    : (["1:1", "4:5", "9:16"] as const);
                  const currentRatio = isVideo
                    ? videoAspectRatio
                    : imageAspectRatio;

                  return ratios.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentRatio === ratio
                          ? "bg-sm-red text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {ratio}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleAddMediaClick}
              className="flex-1 bg-transparent border bg-zinc-50 border-gray-300 text-black hover:bg-gray-50 h-12 md:h-10 mb-4"
              disabled={images.length >= 10 || isPosting}
            >
              <Camera className="w-5 h-5 md:w-4 md:h-4 mr-2" />
              Add Media
            </Button>
            <Button
              className="flex-1 bg-sm-red hover:bg-sm-red-light h-12 md:h-10 mb-4"
              onClick={() => {
                // Check if all files have crop params
                const missingIdx = images.findIndex(
                  (_, idx) => !videoCropParams[idx]
                );
                if (missingIdx !== -1) {
                  setMediaIndex(missingIdx);
                  // Optionally show a toast here if you want
                  return;
                }
                setShowMediaModal(false);
                setShowTagModal(true);
              }}
              disabled={images.length >= 10 || isPosting}
            >
              Next
            </Button>
          </div>
          {images.length >= 10 && (
            <div className="w-full flex justify-center mt-2">
              <span className="text-sm text-gray-600 font-medium  px-4 ">
                Maximum 10 media files allowed
              </span>
            </div>
          )}
        </div>
      </DialogContent>
      {/* Crop Dialog */}
      {cropping && cropIndex !== null && (
        <Dialog open={cropping} onOpenChange={() => setCropping(false)}>
          <DialogContent
            className="max-w-md p-2 rounded-sm"
            style={{ width: "95%" }}
          >
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden ">
              <Cropper
                image={imageUrls[cropIndex]}
                crop={crop}
                zoom={zoom}
                aspect={
                  images[cropIndex]?.type.startsWith("video/")
                    ? getAspectRatioNumber(videoAspectRatio)
                    : getAspectRatioNumber(imageAspectRatio)
                }
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCropping(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (cropIndex === null || !croppedAreaPixels) return;
                  const croppedBlob = await getCroppedImg(
                    imageUrls[cropIndex],
                    croppedAreaPixels
                  );
                  const croppedFile = new File(
                    [croppedBlob as Blob],
                    images[cropIndex].name,
                    { type: images[cropIndex].type }
                  );
                  const croppedUrl = URL.createObjectURL(croppedFile);
                  setImages((prev) =>
                    prev.map((f, i) => (i === cropIndex ? croppedFile : f))
                  );
                  setImageUrls((prev) =>
                    prev.map((u, i) => {
                      if (i === cropIndex) {
                        URL.revokeObjectURL(u);
                        return croppedUrl;
                      }
                      return u;
                    })
                  );
                  setCropping(false);
                  setCropIndex(null);
                }}
              >
                Crop & Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );

  const renderTagModal = () => (
    <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
      <DialogContent
        className="w-full max-w-sm rounded-none md:rounded-2xl bg-white shadow-lg p-0 md:p-6 m-0 md:m-auto flex flex-col md:w-[500px] md:max-w-md md:h-auto md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-h-[80vh] overflow-y-auto"
        style={{
          maxWidth: "95%",
          margin: "0",
          padding: "0",
          borderRadius: "5px",
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="sticky top-0 z-10 bg-gray-50 rounded-t-2xl flex items-center justify-between px-4 py-3 border-b">
          <button
            className="text-2xl text-gray-400 hover:text-gray-700 "
            onClick={() => {
              setShowTagModal(false);
              setShowMediaModal(true);
            }}
            aria-label="Back"
          >
            <ChevronLeft />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleClose}
            aria-label="Close"
          >
            {/* &times; */}
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 flex flex-col gap-2 bg-gray-50 rounded-b-2xl scrollbar-hide">
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Caption
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red focus:border-sm-red transition-all shadow-sm placeholder-gray-400 resize-none min-h-[80px]"
              placeholder="Write a caption..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <div className="text-xs text-gray-400  ml-1">
              {content.length}/300 characters
            </div>
          </div>
          <div className="mb-3 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowLocationDropdown(true);
              }}
              maxLength={100}
              placeholder="Add a location"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red  transition-all shadow-sm placeholder-gray-400"
              autoComplete="off"
              onBlur={() =>
                setTimeout(() => setShowLocationDropdown(false), 100)
              }
              onFocus={() =>
                locationSuggestions.length > 0 && setShowLocationDropdown(true)
              }
            />
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-md shadow mt-1 max-h-48 overflow-y-auto">
                {locationSuggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                    onMouseDown={() => {
                      setLocation(suggestion);
                      setShowLocationDropdown(false);
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            <div className="text-xs text-gray-400 mt-1 ml-1">
              {location.length}/100 characters
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-200 px-2 py-1 rounded text-xs flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-gray-500 hover:text-red-500"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              maxLength={100}
              placeholder="Add a tag and press Enter (max 20 tags)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red transition-all shadow-sm placeholder-gray-400"
              disabled={tags.length >= 20}
            />
            <div className="text-xs text-gray-400 mt-1 ml-1">
              {tagInput.length}/100 characters &bull; {tags.length}/20 tags
            </div>
          </div>
          <div className="">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Collaborators
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {collaborators.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full border border-gray-300 text-xs"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-5 h-5 rounded-full object-cover mr-1"
                  />
                  {user.full_name || user.username}
                  <button
                    type="button"
                    className="ml-1 text-gray-500 hover:text-red-500"
                    onClick={() =>
                      setCollaborators(
                        collaborators.filter((c) => c.id !== user.id)
                      )
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={collabInput}
                onChange={(e) => setCollabInput(e.target.value)}
                placeholder="Search users to add as collaborators"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800  transition-all shadow-sm placeholder-gray-400"
              />
              {collabLoading && (
                <span className="absolute right-3 top-4 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                </span>
              )}
              {collabSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow mt-1 max-h-48 overflow-y-auto z-50 scrollbar-hide">
                  {collabSuggestions.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                      onMouseDown={() => {
                        setCollaborators([...collaborators, user]);
                        setCollabInput("");
                        setCollabSuggestions([]);
                      }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                          {(
                            user.full_name?.[0] ||
                            user.username?.[0] ||
                            "U"
                          ).toUpperCase()}
                        </div>
                      )}
                      <span>{user.full_name || user.username}</span>
                      <span className="text-xs text-gray-400">
                        @{user.username}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col  bg-gray-50">
          <Button
            onClick={handleSubmit}
            className="w-full bg-sm-red hover:bg-sm-red-light h-12 md:h-10  mt-2"
            disabled={isPosting}
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-spin" />{" "}
                Posting...
              </>
            ) : (
              "Create Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Only render the file input and media modal, no regular form
  if (open !== undefined) {
    return (
      <>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
          ref={fileInputRef}
          disabled={images.length >= 10 || isPosting}
        />
        {showMediaModal && renderMediaModal()}
        {showTagModal && renderTagModal()}
      </>
    );
  }

  // For non-modal usage, fallback to nothing or a button
  return null;
};

export default CreatePost;
