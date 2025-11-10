import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Trash2, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { confirmToast } from "@/utils/confirmToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Media } from "./MessageBubble";

interface VideoPlayerProps {
  url: string;
  filename?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  filename,
  open,
  onOpenChange,
  onDelete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  useEffect(() => {
    if (open) {
      setIsPlaying(true);
    }
  }, [open]);
  useEffect(() => {
    if (open && videoRef.current) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 100);
    } else if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open]);

  useEffect(() => {
    setTimeout(() => {
      setProgress(-1);
    }, 10);
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const duration = video.duration || 1;
      setProgress((current / duration) * 100);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    handleTimeUpdate();

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isPlaying, open, progress]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    console.log(e);
    setProgress(newProgress);

    if (videoRef.current) {
      const duration = videoRef.current.duration || 0;
      videoRef.current.currentTime = (newProgress / 100) * duration;
    }
  };
  const handleDownload = async (media: Media) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const blobUrl = typeof window !== 'undefined' ? window.URL.createObjectURL(blob) : '';

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", media.name || "file");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof window !== 'undefined') {
        window.URL.revokeObjectURL(blobUrl);
      }

      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      confirmToast({
        title: "Delete this video?",
        description: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: () => {
          onDelete();
          toast.success("Video deleted");
          onOpenChange(false);
        },
      });
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
          toast.error("Couldn't play video. Try again.");
        });
        setIsPlaying(true);
      }
    }
  };
  const [showControls, setShowControls] = useState(true);
  useEffect(() => {
    if (isPlaying) {
      setShowControls(true);

      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 100);

      return () => clearTimeout(timeout);
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);
  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        setIsPlaying(false);
        onOpenChange(e);
      }}
    >
      <DialogContent
        className={`p-0 bg-black border-none overflow-hidden flex items-center justify-center ${
          isMobile
            ? "sm:max-w-[100vw] w-screen max-h-[50vh] rounded-lg"
            : "sm:max-w-[80vw]"
        }`}
      >
        <DialogTitle className="hidden"></DialogTitle>
        <div className="relative h-full flex items-center justify-center">
          <div className="absolute top-4 right-4 flex gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload({ url, name: filename || "file" });
              }}
              className={`w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white cursor-pointer ${
                !onDelete ? "mr-7" : ""
              }`}
              aria-label="Download video"
            >
              <Download className="h-5 w-5" />
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white cursor-pointer mr-5"
                aria-label="Delete video"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="">
            <button
              onClick={togglePlayPause}
              className={cn(
                "absolute inset-x-[45%] md:inset-x-1/2 m-auto z-10 text-white transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
              )}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12" />
              )}
            </button>
          </div>
          <video
            ref={videoRef}
            src={url}
            className={`pointer-events-none mx-auto my-0 ${
              isMobile
                ? "w-auto max-w-full max-h-[40vh] rounded-lg"
                : "w-full h-auto max-h-[80vh]"
            }`}
            controls={false}
            autoPlay
            onClick={togglePlayPause}
            playsInline
            // controlsList="nodownload"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSeek}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              handleSeek({ target } as React.ChangeEvent<HTMLInputElement>);
            }}
            className="absolute bottom-2 left-0 w-full h-1 z-[10] appearance-none bg-neutral-600 rounded-full
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:h-2.5
    [&::-webkit-slider-thumb]:w-2.5
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-white
    [&::-moz-range-thumb]:appearance-none
    [&::-moz-range-thumb]:h-2.5
    [&::-moz-range-thumb]:w-2.5
    [&::-moz-range-thumb]:rounded-full
    [&::-moz-range-thumb]:bg-white"
          />

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center">
            <div className="flex gap-4 justify-end  items-end w-full">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
