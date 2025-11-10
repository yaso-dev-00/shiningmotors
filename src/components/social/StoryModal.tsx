 "use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { StoryDialog, StoryDialogContent } from "@/components/ui/storyDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Story,
  StoryViewer,
  socialApi,
} from "@/integrations/supabase/modules/social";
import { Progress } from "@/components/ui/progress";
import { X, Eye, Clock, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { GRADIENT_CSS } from "./StoryPreviewModal";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { markStoryAsSeen } from "@/utils/storySeen";
import Image from "next/image";

interface StoryModalProps {
  stories: Story[];
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryDeleted: () => void;
  onStorySeen?: () => void; // new prop
}

const StoryModal: React.FC<StoryModalProps> = ({
  stories,
  initialStoryIndex = 0,
  onClose,
  onStoryDeleted,
  onStorySeen,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const router = useRouter();

  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    Math.min(
      Math.max(0, initialStoryIndex),
      stories.length > 0 ? stories.length - 1 : 0
    )
  );

  const currentStory = useMemo(() => {
    if (
      stories.length === 0 ||
      currentStoryIndex < 0 ||
      currentStoryIndex >= stories.length
    ) {
      return null;
    }
    return stories[currentStoryIndex];
  }, [stories, currentStoryIndex]);

  const isOwnStory = currentStory?.user_id === user?.id;
  const isVideo = currentStory?.story_type === "video";

  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeRef = useRef(0);

  const storiesForCurrentUser = useMemo(() => {
    if (!currentStory) return [];
    return stories.filter((story) => story.user_id === currentStory.user_id);
  }, [stories, currentStory?.user_id]);

  const currentStoryIndexInUserGroup = useMemo(() => {
    if (!currentStory) return -1;
    return storiesForCurrentUser.findIndex(
      (story) => story.id === currentStory.id
    );
  }, [storiesForCurrentUser, currentStory?.id]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      onClose();
    }
    setProgress(0);
  };

  // Replace handlePreviousStory with animated progress logic
  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => {
        const newIndex = prev - 1;
        // After switching, set progress to 100% for the new story
        setTimeout(() => {
          setProgress(100);
          progressRef.current = 100;
          setPaused(true);
          setTimeout(() => {
            setProgress(0);
            progressRef.current = 0;
            setPaused(false);
          }, 200);
        }, 0);
        return newIndex;
      });
    }
  };

  useEffect(() => {
    if (
      !paused &&
      !showDeleteConfirm &&
      !isMediaLoading &&
      currentStory &&
      !isVideo
    ) {
      intervalRef.current = setInterval(() => {
        progressRef.current += 0.4;
        setProgress(progressRef.current);
        if (progressRef.current >= 100) {
          clearInterval(intervalRef.current!);
          progressRef.current = 0;
          setProgress(0);
          handleNext();
        }
      }, 20);
    }
    if (
      isVideo &&
      videoRef.current &&
      !isMediaLoading &&
      !paused &&
      !showDeleteConfirm &&
      currentStory
    ) {
      const video = videoRef.current;
      const updateProgress = () => {
        if (video.duration) {
          const percent = (video.currentTime / video.duration) * 100;
          setProgress(percent);
        }
      };
      video.addEventListener("timeupdate", updateProgress);
      const handleVideoEnd = () => {
        setProgress(100);
        handleNext();
      };
      video.addEventListener("ended", handleVideoEnd);
      return () => {
        video.removeEventListener("timeupdate", updateProgress);
        video.removeEventListener("ended", handleVideoEnd);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    currentStory?.id,
    currentStoryIndex,
    paused,
    isMediaLoading,
    isVideo,
    showDeleteConfirm,
    stories.length,
    handleNext,
  ]);

  useEffect(() => {
    // Only reset progress when the story changes, not when paused changes
    // setIsMediaLoading(true); // (if needed)
    if (isVideo && videoRef.current && !paused && !showDeleteConfirm) {
      videoRef.current
        .play()
        .catch((err) => console.error("Error playing video:", err));
    }
    setMuted(true);
  }, [currentStory?.id, isVideo, showDeleteConfirm]);

  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
  }, [currentStory?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (paused || showDeleteConfirm) {
        video.pause();
      } else {
        video
          .play()
          .catch((err) => console.error("Error playing video on resume:", err));
      }
    }
  }, [paused, showDeleteConfirm]);

  useEffect(() => {
    if (currentStory?.story_type === "text") {
      setIsMediaLoading(false);
    }
  }, [currentStory?.story_type]);

  const handleNavigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  useEffect(() => {
    const recordView = async () => {
      if (user && currentStory && !isOwnStory) {
        try {
          await socialApi.viewStory(currentStory.id, user.id);
        } catch (err) {
          console.error("Error viewing story:", err);
        }
        // Mark as seen in localStorage and trigger parent update
        markStoryAsSeen(currentStory.id);
        if (onStorySeen) onStorySeen();
      }
    };

    const fetchViewers = async () => {
      if (isOwnStory && currentStory) {
        try {
          const { data } = await socialApi.getStoryViewers(currentStory.id);
          if (data) setViewers(data);
          else setViewers([]);
        } catch (err) {
          console.error("Error fetching viewers:", err);
          setViewers([]);
        }
      } else {
        setViewers([]);
      }
    };

    if (currentStory) {
      recordView();
      fetchViewers();
    } else {
      setViewers([]);
    }

    setProgress(0);
    setShowViewers(false);
  }, [currentStory?.id, isOwnStory, user]);

  const toggleViewers = () => {
    setShowViewers((prev) => {
      const newState = !prev;
      setPaused(newState);
      return newState;
    });
  };

  const handleDeleteStory = async (storyId: string) => {
    if (isDeleting || !currentStory) return;
    setIsDeleting(true);
    try {
      const response = await socialApi.deleteStory(storyId);
      if (!response.error) {
        onStoryDeleted();
        onClose();
      } else if (response.error) {
        toast({
          variant: "destructive",
          description:
            response.error.message ||
            "Failed to delete story. Please try again.",
        });
      }
    } catch (err: unknown) {
      let message = "Failed to delete story. Please try again.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        message = err.message;
      }
      toast({
        variant: "destructive",
        description: message,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowDeleteOption(false);
      setPaused(false);
    }
  };

  const toggleDeleteOption = () => {
    setShowDeleteOption((prev) => {
      const newState = !prev;
      setPaused(newState);
      return newState;
    });
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setShowDeleteOption(false);
    setPaused(true);
  };

  return (
    <StoryDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <StoryDialogContent
        className="p-0 flex flex-col items-center w-full max-w-[calc(100dvh*9/16)] aspect-[9/16] h-full sm:max-h-[90dvh] sm:rounded-2xl shadow-lg overflow-hidden bg-black mx-auto"
        style={{
          background:
            GRADIENT_CSS[currentStory?.overlays?.backgroundColor || ""] ||
            "#000",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Aspect Ratio Container for Story Media and Overlays */}
        <div
          className="relative w-full flex-1 flex items-center justify-center"
          style={{
            aspectRatio: "9/16",
            maxHeight: "100vh",
            maxWidth: "100vw",
            minHeight: 320,
            minWidth: 180,
            position: "relative", // ensure overlays/media are absolutely positioned
            overflow: "hidden",
          }}
          onMouseDown={() =>
            !showViewers && !isDeleting && !showDeleteConfirm && setPaused(true)
          }
          onMouseUp={() =>
            !showViewers &&
            !isDeleting &&
            !showDeleteConfirm &&
            setPaused(false)
          }
          onMouseLeave={() =>
            !showViewers &&
            !isDeleting &&
            !showDeleteConfirm &&
            setPaused(false)
          }
          onTouchStart={() =>
            !showViewers && !isDeleting && !showDeleteConfirm && setPaused(true)
          }
          onTouchEnd={() =>
            !showViewers &&
            !isDeleting &&
            !showDeleteConfirm &&
            setPaused(false)
          }
          onTouchCancel={() =>
            !showViewers &&
            !isDeleting &&
            !showDeleteConfirm &&
            setPaused(false)
          }
        >
          {/* Progress Bar Overlay */}
          <div
            className="absolute left-0 right-0 flex space-x-1 z-40 p-2"
            style={{
              top: isMobile
                ? "calc(env(safe-area-inset-top, 0px) + 4px)"
                : "16px",
              paddingTop: isMobile ? "4px" : "0",
            }}
          >
            {storiesForCurrentUser.map((story, index) => (
              <Progress
                key={story.id}
                value={
                  index === currentStoryIndexInUserGroup
                    ? progress
                    : index < currentStoryIndexInUserGroup
                    ? 100
                    : 0
                }
                className="flex-1 h-1 bg-gray-200/50 transition-all duration-100 linear"
              />
            ))}
          </div>

          {/* Top Bar: Avatar, username, time, mute, menu, close (Instagram style) */}
          <div
            className="absolute left-0 right-0 flex items-center justify-between z-50 "
            style={{
              top: isMobile
                ? "calc(env(safe-area-inset-top, 0px) + 24px)"
                : "32px",
              height: "32px",
              paddingLeft: "0.5rem",
            }}
          >
            {/* Left: Avatar, Username, Time */}
            <div
              className="flex items-center gap-x-2 min-w-0 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() =>
                currentStory?.user_id &&
                handleNavigateToProfile(currentStory.user_id)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (currentStory?.user_id)
                    handleNavigateToProfile(currentStory.user_id);
                }
              }}
            >
              <Avatar className="border-2 border-white w-10 h-10">
                <AvatarImage src={currentStory?.avatar_url || ""} />
                <AvatarFallback>
                  {currentStory?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-s truncate max-w-[110px]">
                  {currentStory?.full_name || "Unknown"}
                </span>
                {currentStory?.created_at &&
                  currentStoryIndexInUserGroup !== -1 && (
                    <span className="text-white/80 text-[11px] truncate">
                      {formatDistanceToNow(new Date(currentStory.created_at), {
                        addSuffix: true,
                      }) === "less than a minute ago"
                        ? "just now"
                        : formatDistanceToNow(
                            new Date(currentStory.created_at),
                            { addSuffix: true }
                          )}
                    </span>
                  )}
              </div>
            </div>
            {/* Right: Mute, Three-dot, Close */}
            <div className="flex items-center gap-x-1 mr-1 relative">
              {isVideo && currentStory && (
                <button
                  className="p-1 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMuted((m) => !m);
                  }}
                  title={muted ? "Unmute" : "Mute"}
                  type="button"
                >
                  {muted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              )}
              {isOwnStory && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteOption((prev) => !prev);
                    }}
                    className="p-1 text-white"
                    aria-label="More"
                    type="button"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                  {showDeleteOption && (
                    <button
                      onClick={openDeleteConfirm}
                      className="absolute right-0 mt-2 w-32 text-red-500 text-sm text-center bg-white rounded-md px-2 py-1 z-50 shadow border border-gray-200"
                      style={{ top: "100%" }}
                    >
                      Delete Story
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1 text-white"
                aria-label="Close"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Media (image/video) with transform logic matching preview */}
          {(currentStory?.story_type === "image" ||
            currentStory?.story_type === "video") &&
            currentStory?.overlays?.media && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {currentStory.overlays.media.type === "image" ? (
                  <Image
                    src={currentStory.media_url}
                    alt="Story"
                    fill
                    className="object-contain pointer-events-none"
                    style={{
                      transform: `translate(${currentStory.overlays.media.position.x}px, ${currentStory.overlays.media.position.y}px) scale(${currentStory.overlays.media.scale}) rotate(${currentStory.overlays.media.rotation}deg)`,
                      transition: "transform 0.2s ease-out",
                    }}
                    sizes="100vw"
                    onLoad={() => setIsMediaLoading(false)}
                    onError={() => setIsMediaLoading(false)}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={currentStory.media_url}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "none",
                      transform: `translate(${currentStory.overlays.media.position.x}px, ${currentStory.overlays.media.position.y}px) scale(${currentStory.overlays.media.scale}) rotate(${currentStory.overlays.media.rotation}deg)`,
                      transition: "transform 0.2s ease-out",
                    }}
                    autoPlay
                    loop
                    playsInline
                    muted={muted}
                    onLoadedData={() => setIsMediaLoading(false)}
                    onError={() => setIsMediaLoading(false)}
                  />
                )}
              </div>
            )}

          {/* Text overlays with transform logic matching preview */}
          {currentStory?.story_type !== "text" &&
            Array.isArray(currentStory?.overlays?.texts) &&
            currentStory.overlays.texts.map((text, id) => (
              <div
                key={id}
                style={{
                  position: "absolute",
                  left: `${text?.position?.x}%`,
                  top: `${text?.position?.y}%`,
                  color: text.color,
                  background: text.backgroundColor,
                  fontFamily: text.fontFamily,
                  fontSize: text.fontSize ? `${text.fontSize}px` : undefined,
                  transform: `translate(-50%, -50%) scale(${
                    text.scale || 1
                  }) rotate(${text.rotation || 0}deg)`,
                  fontWeight: "bold",
                  borderRadius: 4,
                  pointerEvents: "none",
                  textAlign: "center",
                  minWidth: 40,
                  minHeight: 32,
                  width: "300px",
                  maxWidth: "90%",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  zIndex: 40,
                }}
              >
                {text.text}
              </div>
            ))}

          {/* Text story: render centered text overlay if story_type === 'text' */}
          {currentStory?.story_type === "text" &&
            Array.isArray(currentStory?.overlays?.texts) &&
            currentStory.overlays.texts[0] && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  color: currentStory.overlays.texts[0].color || "#fff",
                  fontFamily:
                    currentStory.overlays.texts[0].fontFamily || "inherit",
                  fontSize: currentStory.overlays.texts[0].fontSize
                    ? `${currentStory.overlays.texts[0].fontSize}px`
                    : "32px",
                  fontWeight: "bold",
                  textAlign: "center",
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                  userSelect: "none",
                  pointerEvents: "none",
                  width: "90%",
                  maxWidth: 500,
                  zIndex: 20,
                }}
              >
                {currentStory.overlays.texts[0].text}
              </div>
            )}

          {/* Caption Overlay */}
          {currentStory?.caption && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                color: "white",
                background: "rgba(0,0,0,0.5)",
              }}
            >
              {currentStory.caption}
            </div>
          )}
          {isMediaLoading && currentStory && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white" />
            </div>
          )}
          {!currentStory && !isMediaLoading && (
            <div className="text-white/60">No story available</div>
          )}

          {/* Navigation Hotspots (Prev/Next) */}
          {!showDeleteConfirm &&
            !showViewers &&
            !isDeleting &&
            currentStory &&
            stories.length > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousStory();
                  }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2/3 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                />
              </>
            )}

          {/* Viewers Button (Own Story) */}
          {isOwnStory && (
            <div
              className="absolute right-5 z-40 md:bottom-10"
              style={{
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 34px)",
              }}
            >
              <button
                className="flex items-center bg-black/30 text-white px-3 py-1 rounded-full"
                onClick={toggleViewers}
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-sm">{viewers.length}</span>
              </button>
            </div>
          )}

          {/* Viewers List Modal */}
          {isOwnStory && showViewers && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.3)" }}
              onClick={() => {
                setShowViewers(false);
                setPaused(false);
              }}
            >
              <div
                className="absolute bottom-16 right-4 w-64 bg-white rounded-lg shadow-lg p-3 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="font-medium mb-2 text-sm">Viewers</h4>
                <div className="max-h-40 overflow-y-auto">
                  {viewers.length > 0 ? (
                    viewers.map((viewer) => (
                      <div
                        key={viewer.viewers_id}
                        onClick={() =>
                          handleNavigateToProfile(viewer.viewers_id)
                        }
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={viewer.avatar_url} />
                            <AvatarFallback>
                              {viewer.full_name || viewer.username?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {viewer.username || viewer.full_name}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(viewer.viewed_at), "HH:mm")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No viewers yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirm Dialog */}
          <StoryDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
          >
            <StoryDialogContent className="max-w-xs mx-auto text-center p-3">
              <div className="mb-4 text-lg font-semibold">Delete Story?</div>
              <div className="mb-6 text-gray-600">
                Are you sure you want to delete this story? This action cannot
                be undone.
              </div>
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPaused(false);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  onClick={() =>
                    currentStory && handleDeleteStory(currentStory.id)
                  }
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </StoryDialogContent>
          </StoryDialog>
        </div>
      </StoryDialogContent>
    </StoryDialog>
  );
};

export default StoryModal;
