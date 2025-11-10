import React, { useState, forwardRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Play,
  Download,
  Trash2,
  X,
  MessageSquare,
  File,
  ExternalLink,
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { confirmToast } from "@/utils/confirmToast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteMediaMessage,
  deleteMessage,
} from "@/integrations/supabase/modules/chat";
import {
  socialApi,
  PostWithProfile,
} from "@/integrations/supabase/modules/social";
import clsx from "clsx";
import Image from "next/image";
export interface Media {
  type?: string;
  url: string;
  name?: string;
}

interface Message {
  type?: string;
  id: string;
  text?: string;
  sender: "user" | "other";
  content: string;
  message_type: string;
  timestamp: Date;
  media?: Media[];
  read: boolean;
  sent?: boolean;
  delivered?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  onDeleteMedia?: (messageId: string, mediaIndex: number) => void;
  onUnsendMessage?: (messageId: string) => void;
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, onDeleteMedia, onUnsendMessage }, ref) => {
    const isUser = message.sender === "user";

    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<{
      url: string;
      index: number;
    } | null>(null);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
      url: string;
      index: number;
    } | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const isMobile = useIsMobile();

    // State for fetched post details
    const [postDetails, setPostDetails] = useState<PostWithProfile | null>(
      null
    );
    const [loadingPost, setLoadingPost] = useState(false);

    useEffect(() => {
      const fetchPost = async () => {
        if (message.message_type === "post" && message.content) {
          setLoadingPost(true);
          try {
            const { data, error } = await socialApi.posts.getById(
              message.content
            );
            if (error) {
              console.error("Error fetching post details:", error);
              setPostDetails(null);
            } else {
              setPostDetails(data as PostWithProfile);
            }
          } catch (e) {
            console.error("Unexpected error:", e);
            setPostDetails(null);
          } finally {
            setLoadingPost(false);
          }
        } else {
          setPostDetails(null);
        }
      };

      fetchPost();
    }, [message.message_type, message.content]);

    const handleOpenVideo = (url: string, index: number) => {
      setSelectedVideo({ url, index });
      setVideoDialogOpen(true);
    };

    const handleOpenImage = (url: string, index: number) => {
      setSelectedImage({ url, index });
      setCurrentImageIndex(index);
      setImageViewerOpen(true);
    };

    const handleOpenFile = (url: string, name?: string) => {
      // Open file in new tab
      window.open(url, "_blank");
      toast.success(`Opening ${name || "file"}`);
    };

    const handleNextImage = () => {
      if (!message.media) return;
      const imageMedias = message.media.filter((m) => m.type === "image");
      const nextIndex = (currentImageIndex + 1) % imageMedias.length;
      const nextMediaIndex = message.media.findIndex(
        (m) => m.type === "image" && m.url === imageMedias[nextIndex].url
      );
      setCurrentImageIndex(nextIndex);
      setSelectedImage({
        url: imageMedias[nextIndex].url,
        index: nextMediaIndex,
      });
    };

    const handlePrevImage = () => {
      if (!message.media) return;
      const imageMedias = message.media.filter((m) => m.type === "image");
      const prevIndex =
        (currentImageIndex - 1 + imageMedias.length) % imageMedias.length;
      const prevMediaIndex = message.media.findIndex(
        (m) => m.type === "image" && m.url === imageMedias[prevIndex].url
      );
      setCurrentImageIndex(prevIndex);
      setSelectedImage({
        url: imageMedias[prevIndex].url,
        index: prevMediaIndex,
      });
    };

    const handleDownload = async (media: Media) => {
      try {
        const response = await fetch(media.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", media.name || "file");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        toast.success("Download started");
      } catch (error) {
        toast.error("Failed to download file");
        console.error("Download error:", error);
      }
    };

    const handleUnsend = () => {
      if (onUnsendMessage) {
        confirmToast({
          title: "Unsend this message?",
          description: "This will remove the message for everyone.",
          confirmText: "Unsend",
          cancelText: "Cancel",
          onConfirm: async () => {
            let error = null;

            if (
              message.message_type === "post" ||
              message.message_type === "text"
            ) {
              const result = await deleteMessage(message.id);
              error = result.error;
            } else if (
              message.message_type === "image" ||
              message.message_type === "video"
            ) {
              const result = await deleteMediaMessage(message.id);
              error = result.error;
            }

            if (error) {
              console.error("Error unsending message:", error);
              toast.error("Failed to unsend message.");
            } else {
              onUnsendMessage(message.id);
            }
          },
        });
      }
    };

    // const renderStatusIndicator = () => {
    //   if (isUser) {
    //     if (message.read) {
    //       return <span className="text-xs text-blue-500">✓✓</span>;
    //     } else if (message.delivered) {
    //       return <span className="text-xs text-gray-500">✓✓</span>;
    //     } else if (message.sent) {
    //       return <span className="text-xs text-gray-500">✓</span>;
    //     }
    //   }
    //   return null;
    // };

    // Use a key for the VideoPlayer component to ensure it remounts when a new video is selected
    const videoPlayerKey = selectedVideo
      ? `video-${message.id}-${selectedVideo.index}`
      : "no-video";

    return (
      <div
        ref={ref}
        className={`flex ${
          isUser ? "justify-end" : "justify-start"
        } mb-1 group`}
      >
        {/* Wrap the message bubble in ContextMenu components (for desktop right-click) */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* The message bubble div */}
            <div
              className={clsx(
                "max-w-[75%] relative shadow-sm rounded-tl-lg flex min-w-[130px] rounded-tr-lg",
                isUser ? "rounded-lg" : "rounded-lg",
                {
                  "bg-blue-500 text-white p-0 pb-4":
                    isUser &&
                    message.message_type !== "image" &&
                    message.message_type !== "video",
                  "bg-gray-200 text-gray-800 p-0 pb-4":
                    !isUser && message.message_type === "text",
                  "p-0 pt-5": message.message_type !== "text",
                }
              )}
            >
              {/* Dropdown menu for message options (always visible trigger on hover/focus) */}

              {/* Media display or Post Preview */}
              {message && message.message_type && (
                <div className="mt-2">
                  {/* Image Preview */}
                  {message.message_type === "image" && message.content && (
                    <div
                      className="relative cursor-pointer max-w-[250px] aspect-[4/3]"
                      onClick={() => handleOpenImage(message.content, 0)}
                    >
                      <Image
                        src={message.content}
                        alt="Image preview"
                        fill
                        className="object-cover rounded"
                        sizes="(min-width: 768px) 250px, 90vw"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            // Position the three-dot icon inside the bubble, always visible
                            className={`absolute top-1 right-1 p-1  group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full text-gray-600 bg-gray-100`}
                            aria-label="Message options"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align={isUser ? "start" : "end"}
                          className="w-56 z-50"
                        >
                          {(((message.message_type as unknown as string) === "image") ||
                            ((message.message_type as unknown as string) === "video")) &&
                            message.content && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleDownload({
                                    url: message.content,
                                    type: message.message_type,
                                    name: `message.${message.message_type}`,
                                  });
                                }}
                                className="cursor-pointer"
                              >
                                Download {message.message_type}
                              </DropdownMenuItem>
                            )}

                          {/* Unsend option (only for user's messages, not for posts) */}
                          {isUser &&
                            onUnsendMessage &&
                            (message.message_type as unknown as string) !== "media" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleUnsend();
                                }}
                                className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-700"
                              >
                                Unsend message
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Video Preview */}
                  {message.message_type === "video" && message.content && (
                    <div
                      className="relative max-w-[250px] h-auto  mt-2 bg-black cursor-pointer overflow-hidden rounded"
                      onClick={() => handleOpenVideo(message.content, 0)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <Play className="h-6 w-6 text-gray-800 ml-1" />
                        </div>
                      </div>
                      <video
                        src={message.content}
                        className="w-full h-full md:w-[400px] md:h-[300px] object-cover"
                        preload="metadata"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            // Position the three-dot icon inside the bubble, always visible
                            className={`absolute top-1 right-1 p-1 z-20 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full bg-gray-100`}
                            aria-label="Message options"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align={isUser ? "start" : "end"}
                          className="w-56 z-50"
                        >
                          {(((message.message_type as unknown as string) === "image") ||
                            ((message.message_type as unknown as string) === "video")) &&
                            message.content && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleDownload({
                                    url: message.content,
                                    type: message.message_type,
                                    name: `message.${message.message_type}`,
                                  });
                                }}
                                className="cursor-pointer"
                              >
                                Download {message.message_type}
                              </DropdownMenuItem>
                            )}

                          {/* Unsend option (only for user's messages, not for posts) */}
                          {isUser &&
                            onUnsendMessage &&
                            (message.message_type as unknown as string) !== "media" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleUnsend();
                                }}
                                className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-700"
                              >
                                Unsend message
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Post Preview */}
                  {message.message_type === "post" && message.content && (
                    <div className="p-3 mt-2 rounded   dark:bg-gray-800 dark:border-gray-700">
                      {loadingPost ? (
                        <div className="text-sm text-gray-600">
                          Loading post preview...
                        </div>
                      ) : postDetails ? (
                        <>
                          {/* Display first media if available */}
                          {postDetails.media_urls &&
                            postDetails.media_urls.length > 0 && (
                              <div className="mb-2">
                                {postDetails.media_urls[0].endsWith(".mp4") ||
                                postDetails.media_urls[0].endsWith(".mov") ? (
                                  <div className="relative max-w-[250px] h-[150px] bg-black cursor-pointer overflow-hidden rounded">
                                    <video
                                      src={postDetails.media_urls[0]}
                                      className="w-full h-full object-cover"
                                      controls={false}
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                      <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                                        <Play className="h-4 w-4 text-gray-800" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative max-w-[250px] h-[150px]">
                                    <Image
                                      src={postDetails.media_urls[0]}
                                      alt="Post media preview"
                                      fill
                                      className="object-cover rounded"
                                      sizes="250px"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                          <a
                            href={`/social/post/${message.content}`}
                            className="text-xs text-white hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Post
                          </a>
                        </>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Could not load post preview.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Fallback: Show text only for text messages */}
              {message.message_type === "text" && message.text && (
                <div className="p-2 flex w-full relative">
                  <div className="w-full">
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        // Position the three-dot icon inside the bubble, always visible
                        className={`group-hover:opacity-100 h-[20px] focus:opacity-100 transition-opacity rounded-full text-gray-60`}
                        aria-label="Message options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={isUser ? "start" : "end"}
                      className="w-56 z-50"
                    >
                      {/* Conditional options based on message type */}
                      {message.message_type === "text" && message.text && (
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(message.text || "");
                            toast.success("Copied to clipboard");
                          }}
                          className="cursor-pointer"
                        >
                          Copy text
                        </DropdownMenuItem>
                      )}

                      {/* Unsend option (only for user's messages, not for posts) */}
                      {isUser &&
                        onUnsendMessage &&
                        (message.message_type as unknown as string) !== "media" && (
                          <DropdownMenuItem
                            onClick={() => {
                              handleUnsend();
                            }}
                            className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-700"
                          >
                            Unsend message
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div
                className={`flex items-center h-[20px] max-h-full justify-end absolute bottom-0 right-1 w-full  bg-gradient-to-t from-black to-gray-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] opacity-5  gap-1`}
              >
                <p></p>
                {/* {renderStatusIndicator()} */}
              </div>
              <span
                className={`text-xs whitespace-nowrap absolute bottom-1 right-2 ${
                  isUser ? "text-black-200" : "text-gray-500"
                } ${(message.message_type as unknown as string) === "video" ? "text-white " : ""}
                  ${(message.message_type as unknown as string) === "image" ? "text-white " : ""}
                  `}
              >
                {format(message.timestamp, "h:mm a")}
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            {message.message_type === "text" && message.text && (
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(message.text || "");
                  toast.success("Copied to clipboard");
                }}
                className="cursor-pointer"
              >
                Copy text
              </DropdownMenuItem>
            )}

            {(((message.message_type as unknown as string) === "image") ||
              ((message.message_type as unknown as string) === "video")) &&
              message.content && (
                <DropdownMenuItem
                  onClick={() => {
                    handleDownload({
                      url: message.content,
                      type: message.message_type,
                      name: `message.${message.message_type}`,
                    });
                  }}
                  className="cursor-pointer"
                >
                  Download {message.message_type}
                </DropdownMenuItem>
              )}

            {message.message_type === "post" && message.content && (
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to the post page
                  window.open(`/social/post/${message.content}`, "_blank");
                }}
                className="cursor-pointer"
              >
                View Post
              </DropdownMenuItem>
            )}

            {isUser && onUnsendMessage && message.message_type !== "post" && (
              <DropdownMenuItem
                onClick={() => {
                  handleUnsend();
                }}
                className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-700"
              >
                Unsend message
              </DropdownMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {/* Video Dialog */}
        {selectedVideo && (
          <VideoPlayer
            key={videoPlayerKey}
            url={selectedVideo.url}
            filename={message.media?.[selectedVideo.index]?.name}
            open={videoDialogOpen}
            onOpenChange={setVideoDialogOpen}
            onDelete={
              isUser && onUnsendMessage ? () => handleUnsend() : undefined
            }
          />
        )}

        {/* Image Viewer Dialog */}
        <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
          <DialogContent
            className={`p-0 bg-black border-none overflow-hidden ${
              isMobile
                ? "sm:max-w-screen max-h-screen"
                : "sm:max-w-[90vw] max-h-[90vh]"
            }`}
          >
            {selectedImage && (
              <div className="relative flex items-center justify-center h-full">
                <div className="relative w-full h-[80vh]">
                  <Image
                    src={selectedImage.url}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="90vw"
                  />
                </div>

                {/* Navigation controls for multiple images */}
                {message.media &&
                  message.media.filter((m) => m.type === "image").length >
                    1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={handlePrevImage}
                        className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white"
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white"
                      >
                        →
                      </button>
                    </div>
                  )}

                {/* Download and delete options */}
                <div className="absolute top-4 right-4 flex gap-3">
                  <button
                    onClick={() =>
                      handleDownload({
                        url: message.content,
                        type: message.message_type || "image",
                        name: `downloaded-${message.message_type || "file"}`,
                      })
                    }
                    className={`w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white ${
                      !(isUser && onDeleteMedia) ? "mr-6" : "mr-3"
                    }`}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  {isUser && onDeleteMedia && (
                    <button
                      onClick={() => {
                        handleUnsend();
                      }}
                      className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white mr-6"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default MessageBubble;
