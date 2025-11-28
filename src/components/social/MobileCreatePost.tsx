import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import "swiper/css";
import type { Swiper as SwiperType } from "swiper";
import Cropper from "react-easy-crop";
import { useMyContext } from "@/contexts/GlobalContext";

interface CollaboratorProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
}

interface MobileCreatePostProps {
  open: boolean;
  onClose: () => void;
  initialFiles: File[];
  postCreated?: (post: unknown) => void;
}

const MobileCreatePost = ({
  open,
  onClose,
  initialFiles,
  postCreated,
}: MobileCreatePostProps) => {
  const [mcCaption, setMcCaption] = useState("");
  const [mcFiles, setMcFiles] = useState<File[]>(initialFiles || []);
  const [mcFileUrls, setMcFileUrls] = useState<string[]>([]);
  const [mcIsPosting, setMcIsPosting] = useState(false);
  const [mcMediaIndex, setMcMediaIndex] = useState(0);
  const [mcTags, setMcTags] = useState<string[]>([]);
  const [mcTagInput, setMcTagInput] = useState("");
  const [mcLocation, setMcLocation] = useState("");
  const [mcLocationSuggestions, setMcLocationSuggestions] = useState<string[]>(
    []
  );
  const [mcShowLocationDropdown, setMcShowLocationDropdown] = useState(false);
  const [mcCollaborators, setMcCollaborators] = useState<CollaboratorProfile[]>(
    []
  );
  const [mcCollabInput, setMcCollabInput] = useState("");
  const [mcCollabSuggestions, setMcCollabSuggestions] = useState<
    CollaboratorProfile[]
  >([]);
  const [mcCollabLoading, setMcCollabLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [mcStep, setMcStep] = useState<"media" | "tag">("media");
  const [mcAddFileInputKey, setMcAddFileInputKey] = useState(0);
  const mcMaxFiles = 10;
  const mcFileInputRef = useRef<HTMLInputElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const [mcCropping, setMcCropping] = useState(false);
  const [mcCrop, setMcCrop] = useState({ x: 0, y: 0 });
  const [mcZoom, setMcZoom] = useState(1);
  const [mcCroppedAreaPixels, setMcCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [mcCropIndex, setMcCropIndex] = useState<number | null>(null);
  const [mcCropAspect, setMcCropAspect] = useState<number>(1);
  const [mcCropParams, setMcCropParams] = useState<{ [index: number]: any }>(
    {}
  );
  const [isCropping, setIsCropping] = useState(false);
  // Add state for post aspect ratio
  const [mcPostAspect, setMcPostAspect] = useState<number | null>(null);
  // Add state for video aspect ratio selection
  const [mcVideoAspectRatio, setMcVideoAspectRatio] = useState<
    "1:1" | "9:16" | "4:5"
  >("1:1");
  // Add state for image aspect ratio selection
  const [mcImageAspectRatio, setMcImageAspectRatio] = useState<
    "1:1" | "4:5" | "9:16"
  >("1:1");
  const context = useMyContext();
  const muted = context?.muted ?? false;
  const setMuted = context?.setMuted ?? (() => {});
  useEffect(() => {
    if (open) setMcStep("media");
    if (!muted) setMuted(true);
  }, [open, muted, setMuted]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setMcFiles(initialFiles);
      setMcFileUrls(initialFiles.map((file) => URL.createObjectURL(file)));
    } else {
      // Reset aspect ratios when no files
      setMcPostAspect(null);
      setMcVideoAspectRatio("1:1");
      setMcImageAspectRatio("1:1");
    }
    return () => {
      mcFileUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line
  }, [initialFiles]);

  useEffect(() => {
    if (mcLocation.length < 2) {
      setMcLocationSuggestions([]);
      setMcShowLocationDropdown(false);
      return;
    }
    const controller = new AbortController();
    const fetchLocations = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            mcLocation
          )}&addressdetails=1&limit=5`,
          { signal: controller.signal }
        );
        const data: { display_name: string }[] = await res.json();
        setMcLocationSuggestions(data.map((item) => item.display_name));
        setMcShowLocationDropdown(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError")
          setMcLocationSuggestions([]);
      }
    };
    fetchLocations();
    return () => controller.abort();
  }, [mcLocation]);

  // Tag input handlers
  const handleMcTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMcTagInput(e.target.value);
  };
  const handleMcTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if ((e.key === "Enter" || e.key === ",") && mcTagInput.trim()) {
      e.preventDefault();
      if (
        mcTagInput.length <= 30 &&
        mcTags.length < 20 &&
        !mcTags.includes(mcTagInput.trim())
      ) {
        setMcTags([...mcTags, mcTagInput.trim()]);
        setMcTagInput("");
      }
    }
  };
  const handleMcRemoveTag = (tag: string) => {
    setMcTags(mcTags.filter((t) => t !== tag));
  };

  // Collaborator search
  useEffect(() => {
    if (mcCollabInput.trim().length === 0) {
      setMcCollabSuggestions([]);
      return;
    }
    setMcCollabLoading(true);
    profilesApi.profiles
      .searchByQuery(mcCollabInput.trim())
      .then(({ data }) => {
        if (data) {
          setMcCollabSuggestions(
            data.filter(
              (u: CollaboratorProfile) =>
                !mcCollaborators.some((c) => c.id === u.id)
            )
          );
        } else {
          setMcCollabSuggestions([]);
        }
        setMcCollabLoading(false);
      });
  }, [mcCollabInput, mcCollaborators]);

  const handleMcRemoveFile = (index: number) => {
    URL.revokeObjectURL(mcFileUrls[index]);
    const newFiles = mcFiles.filter((_, i) => i !== index);
    const newUrls = mcFileUrls.filter((_, i) => i !== index);
    setMcFiles(newFiles);
    setMcFileUrls(newUrls);
    if (mcMediaIndex >= newUrls.length) {
      setMcMediaIndex(newUrls.length - 1);
    }
    if (newUrls.length === 0) {
      onClose();
    }
  };

  const handleMcSubmit = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to create posts",
        variant: "destructive",
      });
      return;
    }
    if (mcFiles.length === 0) {
      toast({
        description: "Please select at least one image or video to post.",
        variant: "destructive",
      });
      return;
    }
    setMcIsPosting(true);
    try {
      const uploadedUrls = await Promise.all(
        mcFiles.map(async (file, idx) => {
          if (mcCropParams[idx] && file.type.startsWith("video/")) {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("cropX", mcCropParams[idx].cropX);
            formData.append("cropY", mcCropParams[idx].cropY);
            formData.append("cropWidth", mcCropParams[idx].cropWidth);
            formData.append("cropHeight", mcCropParams[idx].cropHeight);
            formData.append("userId", user.id);
            const response = await fetch("/api/crop", {
              method: "POST",
              body: formData,
            });
            if (!response.ok) throw new Error("Failed to crop video");
            const croppedVideoUrl = await response.json();
            return croppedVideoUrl.url;
          } else if (mcCropParams[idx] && file.type.startsWith("image/")) {
            const croppedBlob = await getCroppedImg(
              mcFileUrls[idx],
              mcCropParams[idx]
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
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()
              .toString(36)
              .substring(2)}-${Date.now()}.${fileExt}`;
            const userId = user.id;
            const filePath = `${userId}/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from("posts")
              .upload(filePath, file);
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
        mcCaption.match(hashtagRegex)?.map((tag) => tag.substring(1)) || [];
      const postData = {
        user_id: user.id,
        content: mcCaption,
        media_urls: uploadedUrls,
        category: "Experience",
        tags: hashtags.concat(mcTags),
        location: mcLocation,
        user_tag: mcCollaborators.map((c) => c.id).join(","),
      };
      const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select("*, profile:user_id(id, avatar_url, username, full_name)")
        .single();
      if (error) throw error;
      setMcCaption("");
      setMcFiles([]);
      setMcFileUrls([]);
      setMcTags([]);
      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
      if (postCreated) postCreated(data);
      if (onClose) onClose();
    } catch (error: unknown) {
      console.error("Error creating post:", error);
      toast({
        title: "Post failed",
        description:
          error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setMcIsPosting(false);
    }
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onMcCropComplete = useCallback(
    (
      _: unknown,
      croppedPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setMcCroppedAreaPixels(croppedPixels);
    },
    []
  );

  useEffect(() => {
    if (mcImageAspectRatio === "1:1") {
      setMcVideoAspectRatio("1:1");
    } else if (mcImageAspectRatio === "4:5") {
      setMcVideoAspectRatio("4:5");
    } else if (mcImageAspectRatio === "9:16") {
      setMcVideoAspectRatio("9:16");
    }
  }, [mcImageAspectRatio]);

  useEffect(() => {
    if (mcVideoAspectRatio === "1:1") {
      setMcImageAspectRatio("1:1");
    } else if (mcVideoAspectRatio === "4:5") {
      setMcImageAspectRatio("4:5");
    } else if (mcVideoAspectRatio === "9:16") {
      setMcImageAspectRatio("9:16");
    }
  }, [mcVideoAspectRatio]);

  // Function to convert aspect ratio string to number
  const getMcAspectRatioNumber = (ratio: "1:1" | "9:16" | "4:5"): number => {
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
  const setMcAspectRatio = (ratio: "1:1" | "9:16" | "4:5" | "16:9") => {
    const isVideo = mcFiles[mcMediaIndex]?.type.startsWith("video/");
    if (isVideo) {
      if (ratio === "16:9") return;
      setMcVideoAspectRatio(ratio as "1:1" | "4:5" | "9:16");
    } else {
      if (ratio === "16:9") return; // 16:9 not available for images
      setMcImageAspectRatio(ratio as "1:1" | "4:5" | "9:16");
    }
    // Reset crop params for all files
    setMcCropParams({});
  };

  const getCroppedImg = (
    imageSrc: string,
    crop: {
      cropX: number;
      cropY: number;
      cropWidth: number;
      cropHeight: number;
    }
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const { naturalWidth, naturalHeight } = image;
        if (!naturalWidth || !naturalHeight) {
          reject(new Error("Image not loaded properly"));
          return;
        }
        // Clamp crop area to image bounds
        const cropX = Math.max(0, Math.min(crop.cropX, naturalWidth - 1));
        const cropY = Math.max(0, Math.min(crop.cropY, naturalHeight - 1));
        const cropWidth = Math.max(
          1,
          Math.min(crop.cropWidth, naturalWidth - cropX)
        );
        const cropHeight = Math.max(
          1,
          Math.min(crop.cropHeight, naturalHeight - cropY)
        );

        const scaleX = naturalWidth / image.width;
        const scaleY = naturalHeight / image.height;
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(
          image,
          cropX * scaleX,
          cropY * scaleY,
          cropWidth * scaleX,
          cropHeight * scaleY,
          0,
          0,
          cropWidth,
          cropHeight
        );
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        }, "image/png");
      };
      image.onerror = (err) => reject(err);
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-full  rounded-2xl md:rounded-2xl bg-white shadow-lg p-0 md:p-6 m-0 md:m-auto md:w-[500px] flex flex-col md:h-auto md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        style={{ width: "92%" }}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between px-4 pt-3  gap-2">
          {mcStep === "tag" && (
            <button
              className="text-2xl text-gray-400 hover:text-gray-700"
              onClick={() => setMcStep("media")}
              aria-label="Back"
            >
              <ChevronLeft />
            </button>
          )}
          <button
            className="p-2 rounded-full hover:bg-gray-100 ml-auto"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {mcStep === "media" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-2 relative">
            <div className="w-full flex flex-col items-center">
              {mcFileUrls.length > 0 && (
                <>
                  {/* Display only the selected media (mcMediaIndex) with the cropper: */}
                  <div
                    // onTouchStart={e => e.stopPropagation()}
                    // onTouchMove={e => e.stopPropagation()}
                    // onTouchEnd={e => e.stopPropagation()}
                    className="flex items-center justify-center w-full h-[50vh] relative"
                  >
                    {["image/", "video/"].some((type) =>
                      mcFiles[mcMediaIndex]?.type.startsWith(type)
                    ) ? (
                      <div
                        onPointerDown={() => setIsCropping(true)}
                        onPointerUp={() => setIsCropping(false)}
                        onPointerCancel={() => setIsCropping(false)}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <Cropper
                          {...(mcFiles[mcMediaIndex].type.startsWith("image/")
                            ? { image: mcFileUrls[mcMediaIndex] }
                            : { video: mcFileUrls[mcMediaIndex] })}
                          crop={mcCrop}
                          zoom={mcZoom}
                          aspect={
                            mcFiles[mcMediaIndex].type.startsWith("video/")
                              ? getMcAspectRatioNumber(mcVideoAspectRatio)
                              : getMcAspectRatioNumber(mcImageAspectRatio)
                          }
                          onCropChange={setMcCrop}
                          onZoomChange={setMcZoom}
                          onCropComplete={(_, croppedPixels) => {
                            setMcCropParams((prev) => ({
                              ...prev,
                              [mcMediaIndex]: {
                                cropX: croppedPixels.x,
                                cropY: croppedPixels.y,
                                cropWidth: croppedPixels.width,
                                cropHeight: croppedPixels.height,
                              },
                            }));
                          }}
                          mediaProps={{
                            muted: false,
                            autoPlay:
                              !mcFiles[mcMediaIndex].type.startsWith("image/"),
                            controls: false,
                            style: {
                              objectFit: "cover",
                            },
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {mcFileUrls.length > 1 && (
                    <div className="w-full flex items-center justify-center gap-2 mt-4 mb-2 overflow-x-auto scrollbar-hide p-2">
                      {mcFileUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className={`relative flex flex-col items-center cursor-pointer rounded-md transition-all duration-200 ${
                            idx === mcMediaIndex
                              ? "ring-4 ring-sm-red"
                              : "ring-1 ring-gray-200"
                          }`}
                          onClick={() => {
                            setMcMediaIndex(idx);
                            // swiperRef.current?.slideTo(idx); // No Swiper navigation
                          }}
                          tabIndex={0}
                          aria-label={`Select media ${idx + 1}`}
                          style={{ minWidth: "3.5rem", minHeight: "3.5rem" }}
                        >
                          {mcFiles[idx].type.startsWith("video/") ? (
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
                          )}{" "}
                          {/* Show delete button only for selected thumbnail */}
                          {idx === mcMediaIndex && (
                            <button
                              type="button"
                              className="absolute top-4 bg-white border border-gray-200 shadow-md rounded-full p-1 flex items-center justify-center z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remove the selected media
                                URL.revokeObjectURL(mcFileUrls[idx]);
                                const newFiles = mcFiles.filter(
                                  (_, i) => i !== idx
                                );
                                const newUrls = mcFileUrls.filter(
                                  (_, i) => i !== idx
                                );
                                setMcFiles(newFiles);
                                setMcFileUrls(newUrls);
                                // Adjust index if needed
                                if (mcMediaIndex >= newUrls.length) {
                                  setMcMediaIndex(newUrls.length - 1);
                                }
                                if (newUrls.length === 0) {
                                  onClose();
                                }
                              }}
                              aria-label="Delete this media"
                            >
                              <Trash className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Aspect Ratio Selector - show for both images and videos */}
            {mcFiles.length > 0 && mcFiles[mcMediaIndex] && (
              <div className="mb-4 mt-4">
                {/* <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {mcFiles[mcMediaIndex]?.type.startsWith('video/') ? 'Video' : 'Image'} Aspect Ratio
                </label> */}
                <div className="flex gap-2">
                  {(() => {
                    const isVideo =
                      mcFiles[mcMediaIndex]?.type.startsWith("video/");
                    const ratios = isVideo
                      ? (["1:1", "4:5", "9:16"] as const)
                      : (["1:1", "4:5", "9:16"] as const);
                    const currentRatio = isVideo
                      ? mcVideoAspectRatio
                      : mcImageAspectRatio;

                    return ratios.map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setMcAspectRatio(ratio)}
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
            <div className="w-full flex flex-row gap-2 mt-6">
              <Button
                className="flex-1 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 h-12 md:h-10"
                onClick={() => {
                  setMcAddFileInputKey((k) => k + 1);
                  mcFileInputRef.current?.click();
                }}
                disabled={mcFiles.length >= mcMaxFiles}
              >
                <Camera className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                Add Media
              </Button>
              <input
                // key={mcAddFileInputKey}
                type="file"
                accept="image/*,video/*"
                multiple
                ref={mcFileInputRef}
                className="hidden"
                disabled={mcFiles.length >= mcMaxFiles}
                onChange={async (e) => {
                  const files = e.target.files
                    ? Array.from(e.target.files)
                    : [];
                  if (!files.length) return;
                  const existing = new Set(mcFiles.map((f) => f.name + f.size));
                  const newFiles: File[] = [];
                  const rejected: string[] = [];
                  for (const file of files) {
                    if (existing.has(file.name + file.size)) continue;
                    if (file.type.startsWith("video/")) {
                      if (file.size > 30 * 1024 * 1024) {
                        rejected.push(
                          `Video '${file.name}' exceeds 30MB size limit.`
                        );
                        continue;
                      }
                      // Check video duration and log dimensions
                      const url = URL.createObjectURL(file);
                      const duration = await new Promise<number>((resolve) => {
                        const video = document.createElement("video");
                        video.preload = "metadata";
                        video.onloadedmetadata = () => {
                          resolve(video.duration);
                          URL.revokeObjectURL(url);
                        };
                        video.src = url;
                      });
                      if (duration > 60) {
                        rejected.push(
                          `Video '${file.name}' exceeds 1 minute duration limit.`
                        );
                        continue;
                      }
                    } else if (file.type.startsWith("image/")) {
                      if (file.size > 20 * 1024 * 1024) {
                        rejected.push(
                          `Image '${file.name}' exceeds 20MB size limit.`
                        );
                        continue;
                      }
                      // Log image dimensions
                      const imageUrl = URL.createObjectURL(file);
                      await new Promise<void>((resolve) => {
                        const img = new window.Image();
                        img.onload = () => {
                          resolve();
                        };
                        img.src = imageUrl;
                      });
                    }
                    newFiles.push(file);
                  }
                  // If any file is rejected, do not add any files
                  if (rejected.length > 0) {
                    setTimeout(() => {
                      toast({
                        description: rejected.join("\n"),
                        variant: "destructive",
                      });
                    }, 300);
                    return;
                  }
                  // All files are valid, add them
                  const allFiles = [...mcFiles, ...newFiles].slice(
                    0,
                    mcMaxFiles
                  );
                  setMcFiles(allFiles);
                  setMcFileUrls((prev) =>
                    [
                      ...prev,
                      ...newFiles.map((file) => URL.createObjectURL(file)),
                    ].slice(0, mcMaxFiles)
                  );
                }}
              />
              <Button
                className="flex-1 bg-sm-red hover:bg-sm-red-light h-12 md:h-10"
                onClick={() => {
                  // Check if all files have crop params
                  const missingIdx = mcFiles.findIndex(
                    (_, idx) => !mcCropParams[idx]
                  );
                  if (missingIdx !== -1) {
                    setMcMediaIndex(missingIdx);
                    // toast({
                    //   title: "Crop required",
                    //   description: "Please crop all images/videos before continuing.",
                    //   variant: "destructive",
                    // });
                    return;
                  }
                  setMcStep("tag");
                }}
                disabled={mcFiles.length === 0}
              >
                Next
              </Button>
            </div>
            {mcFiles.length >= mcMaxFiles && (
              <div className="text-xs text-gray-500 mt-2">
                Maximum {mcMaxFiles} files allowed.
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col  px-4 pb-4 pt-2 relative">
            {/* Tag/Caption/Location/Collaborators Step */}
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red focus:border-sm-red transition-all shadow-sm placeholder-gray-400 resize-none min-h-[80px] mb-2"
              placeholder="Write a caption..."
              value={mcCaption}
              onChange={(e) => setMcCaption(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <div className="text-xs text-gray-400 mb-2 ml-1">
              {mcCaption.length}/300 characters
            </div>
            {/* Location input */}
            <div className="mb-3 relative">
              <input
                type="text"
                value={mcLocation}
                onChange={(e) => {
                  setMcLocation(e.target.value);
                  setMcShowLocationDropdown(true);
                }}
                maxLength={100}
                placeholder="Add a location"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red  transition-all shadow-sm placeholder-gray-400"
                autoComplete="off"
                onBlur={() =>
                  setTimeout(() => setMcShowLocationDropdown(false), 100)
                }
                onFocus={() =>
                  mcLocationSuggestions.length > 0 &&
                  setMcShowLocationDropdown(true)
                }
              />
              {mcShowLocationDropdown && mcLocationSuggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-md shadow mt-1 max-h-48 overflow-y-auto">
                  {mcLocationSuggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                      onMouseDown={() => {
                        setMcLocation(suggestion);
                        setMcShowLocationDropdown(false);
                      }}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-xs text-gray-400 mt-1 ml-1">
                {mcLocation.length}/100 characters
              </div>
            </div>
            {/* Tags input */}
            <div className="mb-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {mcTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-200 px-2 py-1 rounded text-xs flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-gray-500 hover:text-red-500"
                      onClick={() => handleMcRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={mcTagInput}
                onChange={handleMcTagInputChange}
                onKeyDown={handleMcTagInputKeyDown}
                maxLength={100}
                placeholder="Add a tag and press Enter (max 20 tags)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red transition-all shadow-sm placeholder-gray-400"
                disabled={mcTags.length >= 20}
              />
              <div className="text-xs text-gray-400 mt-1 ml-1">
                {mcTagInput.length}/100 characters &bull; {mcTags.length}/20
                tags
              </div>
            </div>
            {/* Collaborators */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Collaborators
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {mcCollaborators.map((user) => (
                  <span
                    key={user.id}
                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full border border-gray-300 text-xs"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url || ''}
                        alt={user.username || ''}
                        className="w-5 h-5 rounded-full object-cover mr-1"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 mr-1">
                        {(
                          user.full_name?.[0] ||
                          user.username?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </div>
                    )}
                    {user.full_name || user.username}
                    <button
                      type="button"
                      className="ml-1 text-gray-500 hover:text-red-500"
                      onClick={() =>
                        setMcCollaborators(
                          mcCollaborators.filter((c) => c.id !== user.id)
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
                  value={mcCollabInput}
                  onChange={(e) => setMcCollabInput(e.target.value)}
                  placeholder="Search users to add as collaborators"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800  transition-all shadow-sm placeholder-gray-400"
                />
                {mcCollabLoading && (
                  <span className="absolute right-3 top-4 text-xs text-gray-400 flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  </span>
                )}
                {mcCollabSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow mt-1 max-h-48 overflow-y-auto z-50">
                    {mcCollabSuggestions.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                        onMouseDown={() => {
                          setMcCollaborators([...mcCollaborators, user]);
                          setMcCollabInput("");
                          setMcCollabSuggestions([]);
                        }}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || ''}
                            alt={user.username || ''}
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
            <Button
              onClick={handleMcSubmit}
              className="w-full bg-sm-red hover:bg-sm-red-light h-12 md:h-10"
              disabled={mcIsPosting}
            >
              {mcIsPosting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-spin" />{" "}
                  Posting...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
      {mcCropping && mcCropIndex !== null && (
        <Dialog open={mcCropping} onOpenChange={() => setMcCropping(false)}>
          <DialogContent
            className="max-w-md p-2 rounded-sm"
            style={{ width: "95%" }}
          >
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden ">
              <Cropper
                image={mcFileUrls[mcCropIndex]}
                crop={mcCrop}
                zoom={mcZoom}
                aspect={
                  mcFiles[mcCropIndex]?.type.startsWith("video/")
                    ? getMcAspectRatioNumber(mcVideoAspectRatio)
                    : getMcAspectRatioNumber(mcImageAspectRatio)
                }
                onCropChange={setMcCrop}
                onZoomChange={setMcZoom}
                onCropComplete={onMcCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={mcZoom}
              onChange={(e) => setMcZoom(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setMcCropping(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (mcCropIndex === null || !mcCroppedAreaPixels) return;
                  const croppedBlob = await getCroppedImg(
                    mcFileUrls[mcCropIndex],
                    {
                      cropX: mcCroppedAreaPixels.x,
                      cropY: mcCroppedAreaPixels.y,
                      cropWidth: mcCroppedAreaPixels.width,
                      cropHeight: mcCroppedAreaPixels.height,
                    }
                  );
                  const croppedFile = new File(
                    [croppedBlob],
                    mcFiles[mcCropIndex].name,
                    { type: mcFiles[mcCropIndex].type }
                  );
                  const croppedUrl = URL.createObjectURL(croppedFile);
                  // Replace file and url
                  setMcFiles((prev) =>
                    prev.map((f, i) => (i === mcCropIndex ? croppedFile : f))
                  );
                  setMcFileUrls((prev) =>
                    prev.map((u, i) => {
                      if (i === mcCropIndex) {
                        URL.revokeObjectURL(u);
                        return croppedUrl;
                      }
                      return u;
                    })
                  );
                  setMcCropping(false);
                  setMcCropIndex(null);
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
};

export default MobileCreatePost;
