import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Send, X, Play, Pause } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { supabase } from "@/integrations/supabase/client";
import { debounce } from "lodash";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface MessageInputProps {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSendMessage: (text: string, media: File[]) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [videoPreview, setVideoPreview] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoPreviewContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();

  const handleSend = () => {
    if (message.trim() || selectedFiles.length > 0) {
      onSendMessage(message.trim(), selectedFiles);
      setMessage("");
      setSelectedFiles([]);
      setVideoPreview(null);
      setIsVideoPlaying(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendTypingEvent = useRef(
    debounce(() => {
      supabase.channel(`typing:${user?.id}:${userId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { senderId: user?.id, userId, isTyping: true },
      });
    }, 1000)
  ).current;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Create preview URLs for video files
      newFiles.forEach((file) => {
        if (file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          setVideoPreview({ file, url });
        }
      });

      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const removeSelectedFile = (index: number) => {
    if (videoPreview && selectedFiles[index].name === videoPreview.file.name) {
      URL.revokeObjectURL(videoPreview.url);
      setVideoPreview(null);
      setIsVideoPlaying(false);
    }

    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const closeVideoPreview = () => {
    if (videoPreview) {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.pause();
        setIsVideoPlaying(false);
      }

      URL.revokeObjectURL(videoPreview.url);
      setVideoPreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview.url);
      }
    };
  }, []);

  useEffect(() => {
    const videoElement = videoPreviewRef.current;
    if (videoElement) {
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleEnded = () => setIsVideoPlaying(false);

      videoElement.addEventListener("play", handlePlay);
      videoElement.addEventListener("pause", handlePause);
      videoElement.addEventListener("ended", handleEnded);

      return () => {
        videoElement.removeEventListener("play", handlePlay);
        videoElement.removeEventListener("pause", handlePause);
        videoElement.removeEventListener("ended", handleEnded);
      };
    }
  }, [videoPreview]);

  const handlePreviewVideo = (file: File) => {
    // Only preview videos
    if (file.type.startsWith("video/")) {
      // If there was a previous preview and it's a different file, revoke its URL
      if (videoPreview && videoPreview.file.name !== file.name) {
        URL.revokeObjectURL(videoPreview.url);
        setIsVideoPlaying(false);
      } else if (videoPreview && videoPreview.file.name === file.name) {
        // If it's the same file, just show the preview that we already have
        return;
      }

      const url = URL.createObjectURL(file);
      setVideoPreview({ file, url });
    }
  };

  const toggleVideoPlay = () => {
    const video = videoPreviewRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch((error) => {
          console.error("Error playing video preview:", error);
          // Try with muted option if autoplay was prevented
          if (error.name === "NotAllowedError") {
            video.muted = true;
            video
              .play()
              .then(() => {
                setIsVideoPlaying(true);
              })
              .catch((e) => {
                console.error("Still couldn't play even with mute:", e);
              });
          }
        });
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  // Clear selected files and video preview when userId (active conversation) changes
  useEffect(() => {
    setSelectedFiles([]);
    setVideoPreview(null);
    setIsVideoPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [userId]);

  return (
    <div className="relative">
      {/* Video Preview */}
      {videoPreview && (
        <div
          className={`mb-2 p-2 border border-gray-200 bg-gray-50 rounded-md`}
        >
          <div className="relative w-full h-48">
            <video
              ref={videoPreviewRef}
              src={videoPreview.url}
              className="max-h-[200px] w-full object-contain rounded"
              preload="metadata"
              playsInline
              onClick={toggleVideoPlay}
            />
            <button
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
              onClick={(e) => {
                e.stopPropagation();
                closeVideoPreview();
              }}
            >
              <X size={16} />
            </button>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        w-12 h-12 bg-black/30 rounded-full flex items-center justify-center 
                        cursor-pointer"
              onClick={toggleVideoPlay}
            >
              {isVideoPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </div>
          </div>
          <div className="text-sm mt-1 text-center">
            {videoPreview.file.name}
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 bg-gray-50 rounded-md`}
        >
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              {file.type.startsWith("image/") ? (
                <div className="w-16 h-16 rounded overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : file.type.startsWith("video/") ? (
                <div
                  className={`w-16 h-16 flex items-center justify-center ${"bg-gray-200"} rounded cursor-pointer`}
                  onClick={() => handlePreviewVideo(file)}
                >
                  <div className="flex flex-col items-center">
                    <Play className="h-6 w-6" />
                    <span
                      className={`text-xs text-center ${"text-gray-700"} px-1`}
                    >
                      Preview
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`w-16 h-16 flex items-center justify-center ${"bg-gray-200"} rounded`}
                >
                  <span
                    className={`text-xs text-center ${"text-gray-700"} px-1`}
                  >
                    {file.name.length > 10
                      ? `${file.name.substring(0, 10)}...`
                      : file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeSelectedFile(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 w-full pl-1 pr-1 pb-1  sm:pb-2">
        <div className="flex-1 relative scrollbar-hide ">
          <Textarea
  value={message}
  onChange={(e) => {
    setMessage(e.target.value);
    sendTypingEvent();

    // Auto-resize logic
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }

  }}
  onKeyDown={handleKeyPress}
  placeholder="Type a message..."
  className="w-[90%] min-h-[30px] h-[30px] md:min-h-[45px] max-h-[160px] text-[16px] overflow-hidden resize-none bg-gradient-to-b from-white to-gray-100 text-gray-800 border-none outline-none px-3 scrollbar-hide transition-all  pt-2  border-l-0 focus-visible:outline-none rounded-none focus-visible:ring-0 focus-visible:ring-gray-200"
  ref={textareaRef}
/>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,application/*"
          />
          <div className="absolute right-2 top-2 flex space-x-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="Add emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
             <Button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 h-auto w-auto shadow-md"
        >
          <Send className="h-5 w-5" />
        </Button>
          </div>
        </div>
       
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0 z-10">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
