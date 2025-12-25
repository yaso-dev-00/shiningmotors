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
import { usePostModal } from "@/contexts/PostModalProvider";
import clsx from "clsx";
export interface Media {
  type?: string;
  url: string;
  name?: string;
}
import Image from "next/image";

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
    const { openPost } = usePostModal();

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
                  "text-gray-800 p-0 pb-4":
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
                <div className="mt-2 w-full">
                  {/* Image Preview */}
                  {message.message_type === "image" && message.content && (
                    <div
                      className="relative cursor-pointer max-w-[250px]"
                      onClick={() => handleOpenImage(message.content, 0)}
                    >
                      <Image
                        src={message.content}
                        alt="Image preview"
                        height={200}
                        width={200}
                        className="w-full h-auto max-h-[300px]  object-cover rounded"
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
                          {message.content && (
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
                            onUnsendMessage && (
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
                          {message.content && (
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
                            onUnsendMessage && (
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
                    <div className="mt-2 w-full">
                      {loadingPost ? (
                        <div className="p-4 flex items-center  justify-center">
                          <div className="relative h-14 w-14">
                            {/* Outer faint ring */}
                            <div className="absolute inset-0 rounded-full border border-black/30" />
                            {/* Rotating dot */}
                            <div className="absolute inset-0 animate-spin">
                              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-black" />
                            </div>
                          </div>
                        </div>
                      ) : postDetails ? (
                        <>
                          {/* Display first media if available - styled like regular image/video messages */}
                          {postDetails.media_urls &&
                            postDetails.media_urls.length > 0 && (
                              <>
                                {/* Video Preview - matches regular video message styling */}
                                {(() => {
                                  const firstMediaUrl = postDetails.media_urls[0];
                                  const isVideo = firstMediaUrl?.endsWith(".mp4") || firstMediaUrl?.endsWith(".mov");
                                  
                                  return isVideo ? (
                                    <div
                                      className="relative max-w-[250px] h-auto mt-2 bg-black cursor-pointer overflow-hidden rounded"
                                      onClick={() => handleOpenVideo(firstMediaUrl, 0)}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                                          <Play className="h-6 w-6 text-gray-800 ml-1" />
                                        </div>
                                      </div>
                                      <video
                                        src={firstMediaUrl}
                                        className="w-full h-full md:w-[400px] md:h-[300px] object-cover"
                                        preload="metadata"
                                      />
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
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
                                          <DropdownMenuItem
                                            onClick={() => {
                                              handleDownload({
                                                url: firstMediaUrl,
                                                type: "video",
                                                name: `post-video.mp4`,
                                              });
                                            }}
                                            className="cursor-pointer"
                                          >
                                            Download video
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (message.content) {
                                                openPost(message.content);
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            View Post
                                          </DropdownMenuItem>
                                          {isUser &&
                                            onUnsendMessage && (
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
                                  ) : (
                                    /* Image Preview - matches regular image message styling */
                                    <div
                                      className="relative cursor-pointer max-w-[250px]"
                                      onClick={() => handleOpenImage(firstMediaUrl, 0)}
                                    >
                                      <Image
                                        src={firstMediaUrl}
                                        alt="Post media preview"
                                        height={200}
                                        width={200}
                                        className="w-full h-auto max-h-[300px] object-cover rounded"
                                      />
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            className={`absolute top-1 right-1 p-1 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full text-gray-600 bg-gray-100`}
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
                                          <DropdownMenuItem
                                            onClick={() => {
                                              handleDownload({
                                                url: firstMediaUrl,
                                                type: "image",
                                                name: `post-image.jpg`,
                                              });
                                            }}
                                            className="cursor-pointer"
                                          >
                                            Download image
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (message.content) {
                                                openPost(message.content);
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            View Post
                                          </DropdownMenuItem>
                                          {isUser &&
                                            onUnsendMessage && (
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
                                  );
                                })()}
                              </>
                            )}

                          {/* View Post link - opens in global modal */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (message.content) {
                                openPost(message.content);
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline p-2 block text-left"
                          >
                            View Post
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-gray-600 p-2">
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
                        onUnsendMessage && (
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
                } ${message.message_type === "video" ? "text-white " : ""}
                  ${message.message_type === "image" ? "text-white " : ""}
                  ${
                    message.message_type === "post"
                      ? "text-gray-400"
                      : ""
                  }
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

            {(message.message_type === "image" ||
              message.message_type === "video") &&
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (message.content) {
                    openPost(message.content);
                  }
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
                <img
                  src={selectedImage.url}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] object-contain"
                />

                {/* Navigation controls for multiple images - only show for regular image messages, not posts */}
                {message.message_type !== "post" &&
                  message.media &&
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
                        url: selectedImage.url,
                        type: message.message_type === "post" ? "image" : (message.message_type || "image"),
                        name: message.message_type === "post" ? `post-image.jpg` : `downloaded-${message.message_type || "file"}`,
                      })
                    }
                    className={`w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white ${
                      !(isUser && onDeleteMedia) ? "mr-6" : "mr-3"
                    }`}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  {isUser && onDeleteMedia && message.message_type !== "post" && (
                    <button
                      onClick={() => {
                        handleUnsend();
                      }}
                      className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white mr-6"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  {isUser && onUnsendMessage && message.message_type === "post" && (
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
