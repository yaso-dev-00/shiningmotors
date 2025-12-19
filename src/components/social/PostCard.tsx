 "use client";
import { useState, useEffect, useRef, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Heart,
  MessageSquare,
  Bookmark,
  Send,
  MoreHorizontal,
  Check,
  Volume2,
  VolumeX,
  User,
  X,
  Smile,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ShareModal } from "@/lib/shareModel";
import CommentsSection from "./CommentsSection";
import { CommentsBottomSheet } from "./CommentsBottomSheet";
import { ReportModal } from "./reportModel";
import { useMyContext, ContextTypes } from "@/contexts/GlobalContext";
import { socialApi } from "@/integrations/supabase/modules/social";
import type { Swiper as SwiperRef } from "swiper";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { profilesApi } from "@/integrations/supabase/modules/profiles";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CommentInput } from "./CommentsSection";
import { EmojiPicker } from "../messenger/EmojiPicker";
import Image from "next/image";

interface Media {
  type: "image" | "video";
  url: string;
}

interface Author {
  name?: string;
  avatar?: string;
  avatar_url?: string;
  isVerified?: boolean;
  id?: string;
  username?: string | null;
  full_name?: string | null;
}

interface PostCardProps {
  id: string;
  author: Author;
  time?: string;
  content: string;
  media?: Media[];
  likes: number;
  comments: number;
  openEmojiPostId?: string | null;
  setOpenEmojiPostId?: (id: string | null) => void;
  location?: string;
  onPostReported: (postId: string) => void;
  user_tag?: string[] | null;
  openCollaboratorsPostId?: string | null;
  setOpenCollaboratorsPostId?: (id: string | null) => void;
}

function PostCardCommentInput({ 
  value, 
  onChange, 
  onSend, 
  loading 
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: { native?: string; emoji?: string; unicode?: string; char?: string } | string) => {
    // console.log(emoji); // Removed for performance
    // Try the most likely properties:
    const emojiChar =
      (typeof emoji === 'object' && emoji !== null) 
        ? (emoji.native || emoji.emoji || emoji.unicode || emoji.char || '')
        : (typeof emoji === 'string' ? emoji : ''); // fallback to string
    onChange(value + emojiChar);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center w-full px-0 mb-1 relative">
      <button
        type="button"
        className="mr-1 text-xl"
        onClick={() => setShowEmojiPicker((v) => !v)}
        tabIndex={-1}
        aria-label="Add emoji"
      >
        <Smile size={18} />
      </button>
      {showEmojiPicker && (
        <div className="absolute bottom-8 left-0 z-50">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
      <input
        type="text"
        ref={inputRef}
        className="flex-1 w-full outline-none border-none bg-transparent placeholder-gray-400 text-xs py-1 h-7"
        placeholder="Add a comment..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) onSend();
        }}
        disabled={loading}
      />
      {value.trim() && !loading && (
        <button
          type="button"
          className="ml-1 px-2 py-1 text-xs font-semibold rounded text-red-800"
          onClick={onSend}
        >
          Send
        </button>
      )}
    </div>
  );
}

const PostCard = ({
  id,
  author,
  time,
  content,
  media,
  likes,
  location,
  user_tag,
  onPostReported,
  openCollaboratorsPostId,
  setOpenCollaboratorsPostId,
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);
  const [commentsCount, setCommentsCount] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const [isShareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [likesAnim, setLikesAnim] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  // const [muted, setMuted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const context = useMyContext() as ContextTypes | undefined;
  const muted = context?.muted ?? false;
  const setMuted = context?.setMuted ?? (() => {});
  const [videoLoading, setVideoLoading] = useState<boolean[]>([]);
  const currentlyPlayingRef = useRef<HTMLVideoElement | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const swiperRef = useRef<SwiperRef | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [arrowIconSize, setArrowIconSize] = useState(30);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [lastTap, setLastTap] = useState<number | null>(null);

  const [collaboratorProfiles, setCollaboratorProfiles] = useState<
    { id: string; username: string | null; avatar_url: string | null; full_name: string | null }[]
  >([]);

  const [showCollaborators, setShowCollaborators] = useState(false);

  const [collabTooltipOpen, setCollabTooltipOpen] = useState(false);

  const showMediaTags = openCollaboratorsPostId === id;

  const commentsRef = useRef<HTMLDivElement | null>(null);

  const collabBtnRef = useRef<HTMLButtonElement | null>(null);
  const collabTooltipRef = useRef<HTMLDivElement | null>(null);

  const [mediaTagPositions, setMediaTagPositions] = useState<{ x: number; y: number }[]>([]);

  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;

          if (entry.intersectionRatio === 1) {
            if (
              currentlyPlayingRef.current &&
              currentlyPlayingRef.current !== video
            ) {
              currentlyPlayingRef.current.pause();
            }

            video.play().catch((e) => {
              // console.log("Autoplay blocked or failed:", e); // Removed for performance
            });

            currentlyPlayingRef.current = video;
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 1.0, // 100% visible only
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) {
        observer.observe(video);
        // video.muted = false; // This line should be managed by the global context
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, []);

  useEffect(() => {
    const fetchLikesCount = async () => {
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id);

      if (!error && typeof count === "number") {
        setLikesCount(count);
      }
    };

    fetchLikesCount();
  }, [id]);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch(
          `/api/comments?postId=${id}&limit=1&_t=${Date.now()}`,
          {
            cache: 'no-store',
            method: 'GET',
            headers: {
              ...(accessToken && {
                'Authorization': `Bearer ${accessToken}`,
              }),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );

        if (response.ok) {
          const { count } = await response.json();
          if (typeof count === "number") {
            setCommentsCount(count);
          }
        }
      } catch (error) {
        console.error("Error fetching comments count:", error);
      }
    };

    fetchCommentsCount();
  }, [id]);

  useEffect(() => {
    const fetchRecentComments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch(
          `/api/comments?postId=${id}&limit=1&orderBy=desc&_t=${Date.now()}`,
          {
            cache: 'no-store',
            method: 'GET',
            headers: {
              ...(accessToken && {
                'Authorization': `Bearer ${accessToken}`,
              }),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );

        if (response.ok) {
          const { data, count } = await response.json();
          if (data) {
            setRecentComments(data.reverse()); // oldest first
            setTotalComments(count || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching recent comments:", error);
      }
    };
    fetchRecentComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentInput.trim() || !user) return;
    setCommentLoading(true);
    const optimisticComment = {
      id: `optimistic-${Date.now()}`,
      post_id: id,
      user_id: user.id,
      content: commentInput,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: null,
      profile: {
        id: user.id,
        full_name: user.user_metadata?.full_name || "User",
        username: user.user_metadata?.username || "user",
        avatar_url: user.user_metadata?.avatar_url || "",
      },
    };
    setRecentComments((prev) => [...prev, optimisticComment].slice(-1));
    setTotalComments((prev) => prev + 1);
    setCommentInput("");
    try {
      // Get access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          post_id: id,
          user_id: user.id,
          content: optimisticComment.content,
          parent_id: null,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create comment');
      }
    } catch (e) {
      // Optionally show error toast
    } finally {
      // Wait a bit for database to update, then re-fetch to sync with fresh data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch(
          `/api/comments?postId=${id}&limit=2&orderBy=desc&_t=${Date.now()}`,
          {
            cache: 'no-store',
            method: 'GET',
            headers: {
              ...(accessToken && {
                'Authorization': `Bearer ${accessToken}`,
              }),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );

        if (response.ok) {
          const { data, count } = await response.json();
          setRecentComments(data ? data.reverse() : []);
          setTotalComments(count || 0);
        }
      } catch (error) {
        console.error("Error re-fetching comments:", error);
      }
      setCommentLoading(false);
    }
  };

  const isFullyVisible = (el: HTMLVideoElement) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    );
  };

  const handleVideoVisibility = () => {
    videoRefs.current.forEach((videoEl) => {
      if (!videoEl) return;
      const video = videoEl as HTMLVideoElement;
      if (isFullyVisible(video)) {
        if (
          currentlyPlayingRef.current &&
          currentlyPlayingRef.current !== video
        ) {
          currentlyPlayingRef.current.pause();
        }
        const promise = video.play();

        if (promise !== undefined) {
          promise.catch((e) => {
            // console.log("Play failed:", e); // Removed for performance
          });
        }
        currentlyPlayingRef.current = video;
      } else {
        video.pause();
      }
    });
  };

  useEffect(() => {
    const handleEvents = () => {
      requestAnimationFrame(handleVideoVisibility);
    };

    window.addEventListener("scroll", handleEvents);
    window.addEventListener("resize", handleEvents);
    window.addEventListener("touchmove", handleEvents);

    setTimeout(handleVideoVisibility, 500); // Initial check after Swiper renders

    return () => {
      window.removeEventListener("scroll", handleEvents);
      window.removeEventListener("resize", handleEvents);
      window.removeEventListener("touchmove", handleEvents);
    };
  }, []);

  const enableAutoplay = () => {
    videoRefs.current.forEach((videoEl) => {
      if (!videoEl) return;
      const video = videoEl as HTMLVideoElement;

      if (isFullyVisible(video)) {
        video.play().catch((e) => {
          console.warn("Autoplay failed even after user gesture", e);
        });
        currentlyPlayingRef.current = video;
      }
    });
  };
  useEffect(() => {
    window.addEventListener("touchstart", enableAutoplay, { once: true });
    window.addEventListener("click", enableAutoplay, { once: true });

    return () => {
      window.removeEventListener("touchstart", enableAutoplay);
      window.removeEventListener("click", enableAutoplay);
    };
  }, []);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const { data, error } = await supabase
          .from("likes")
          .select()
          .eq("post_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setIsLiked(true);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    const checkSaveStatus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Get access token for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch(
          `/api/saved-posts?postId=${id}&userId=${user.id}&_t=${Date.now()}`,
          {
            cache: 'no-store',
            method: 'GET',
            headers: {
              ...(accessToken && {
                'Authorization': `Bearer ${accessToken}`,
              }),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );

        if (response.ok) {
          const { isSaved } = await response.json();
          setIsSaved(isSaved);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    const checkFollowingStatus = async () => {
      if (!user || !author.id || user.id === author.id) return;

      try {
        const { data } = await socialApi.follows.checkIfFollowing(
          user.id,
          author.id
        );
        if (data) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Error checking following status:", error);
      }
    };

    checkSaveStatus();
    checkLikeStatus();
    checkFollowingStatus();
  }, [id, isAuthenticated, user, author.id]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);

        setLikesCount((prev) => prev - 1);
      } else {
        await supabase.from("likes").insert({
          post_id: id,
          user_id: user.id,
        });

        setLikesCount((prev) => prev + 1);
      }

      setIsLiked(!isLiked);
      setLikeAnim(true);
      setLikesAnim(true);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        description: isLiked ? "Failed to unlike post" : "Failed to like post",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!likeAnim) return;
    const timeout = setTimeout(() => setLikeAnim(false), 300);
    return () => clearTimeout(timeout);
  }, [likeAnim]);

  useEffect(() => {
    if (!likesAnim) return;
    const timeout = setTimeout(() => setLikesAnim(false), 300);
    return () => clearTimeout(timeout);
  }, [likesAnim]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    if (!user) return;

    const previousSavedState = isSaved;
    // Optimistic update
    setIsSaved(!isSaved);
    setSaveAnim(true);

    try {
      if (previousSavedState) {
        // Unsave the post
        const deleteResponse = await supabase
          .from("saved_post")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);

        if (deleteResponse.error) {
          throw deleteResponse.error;
        }

        toast({
          description: "Removed from saved items",
        });
      } else {
        // Get access token for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        // Save the post via API
        const response = await fetch('/api/saved-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({
            post_id: id,
            user_id: user.id,
          }),
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save post');
        }

        toast({
          description: "Added to saved items",
        });
      }

      // Wait a bit for database to update, then re-fetch saved status to ensure UI is in sync
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session: checkSession } } = await supabase.auth.getSession();
      const checkAccessToken = checkSession?.access_token;
      
      const checkResponse = await fetch(
        `/api/saved-posts?postId=${id}&userId=${user.id}&_t=${Date.now()}`,
        {
          cache: 'no-store',
          method: 'GET',
          headers: {
            ...(checkAccessToken && {
              'Authorization': `Bearer ${checkAccessToken}`,
            }),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );

      if (checkResponse.ok) {
        const { isSaved: currentSavedStatus } = await checkResponse.json();
        setIsSaved(currentSavedStatus);
      } else {
        // If re-fetch fails, revert to optimistic state (it's already set)
        console.warn('Failed to re-fetch saved status, using optimistic update');
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsSaved(previousSavedState);
      console.error("Error toggling save:", error);
      toast({
        description: previousSavedState
          ? "Failed to remove from saved items"
          : "Failed to save post",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!saveAnim) return;
    const timeout = setTimeout(() => setSaveAnim(false), 300);
    return () => clearTimeout(timeout);
  }, [saveAnim]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareOpen(true);
  };

  const handlePostClick = () => {
    // Store current URL and scroll position before navigating to modal
    sessionStorage.setItem('preModalUrl', window.location.pathname);
    sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
    router.push(`/social/post/${id}` as any);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    // console.log("hello", author); // Removed for performance
    e.stopPropagation();
    router.push(`/profile/${author.id}` as any);
  };

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsOverflowing(
        el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
      );
    }
  }, [content]);

  const avatarUrl =
    author.avatar_url ||
    author.avatar ||
    "https://avatars.dicebear.com/api/identicon/" + id + ".svg";
  const displayName =
    author.name || author.full_name || author.username || "User";

  const handleReportSubmit = async () => {
    if (!user) return;

    try {
      await supabase.from("report").insert({
        post_id: id,
        user_id: user.id,
        content: reportReason,
      });
      toast({
        description: "Post reported successfully",
        variant: "default",
      });
      onPostReported(id);
    } catch (error) {
      console.error("Error reporting post:", error);
      toast({
        description: "Failed to report post",
        variant: "destructive",
      });
    } finally {
      setIsReportOpen(false);
      setReportReason("");
    }
  };

  const handleMuteToggle = () => {
    setMuted((prevMuted: boolean) => {
      const newMuted = !prevMuted;
      videoRefs.current.forEach((video) => {
        if (video) {
          video.muted = newMuted;
        }
      });
      return newMuted;
    });
  };

  // Keep mute state synced
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = muted;
      }
    });
  }, [muted]);

  const [alignment, setAlignment] = useState("self-center");

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const isPortrait = video.videoHeight > video.videoWidth;
    setAlignment(isPortrait ? "self-start" : "self-center");
  };

  const [alignments, setAlignments] = useState<string[]>([]);

  const handleMetadataLoadedMultiple = (
    e: React.SyntheticEvent<HTMLVideoElement>,
    idx: number
  ) => {
    const video = e.currentTarget;
    const isPortrait = video.videoHeight > video.videoWidth;

    setAlignments((prev) => {
      const newAlignments = [...prev];
      newAlignments[idx] = isPortrait ? "self-start" : "self-center";
      return newAlignments;
    });
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    if (!user || !author.id) return;

    try {
      await socialApi.follows.followUser(user.id, author.id);
      setIsFollowing(true);
      toast({ description: `You're now following ${displayName}` });
    } catch (error) {
      console.error("Follow failed:", error);
      toast({
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    if (!user || !author.id) return;

    try {
      await socialApi.follows.unfollowUser(user.id, author.id);
      setIsFollowing(false);
      toast({ description: `You've unfollowed ${displayName}` });
    } catch (error) {
      console.error("Unfollow failed:", error);
      toast({
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    setDeleteLoading(true);
    try {
      const { error } = await socialApi.posts.deletePost(id, user.id);
      if (error) throw error;
      toast({ description: "Post deleted successfully", variant: "default" });
      onPostReported(id);
    } catch (error) {
      toast({ description: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Double-tap to like for mobile
  const handleMediaTap = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    // Prevent double-tap like if tapping mute/unmute button
    const target = e.target as HTMLElement;
    if (
      target.closest("button[aria-label='mute']") ||
      target.closest("button[aria-label='unmute']") ||
      target.closest(".mute-unmute-btn")
    ) {
      return;
    }
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      handleLikeToggle(e as unknown as React.MouseEvent);
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  useEffect(() => {
    if (typeof user_tag !== "undefined" && user_tag && user_tag.length > 0) {
      let parsedTags = [];

      try {
        // Clean the user_tag string before parsing
        const cleanedUserTag =
          typeof user_tag === "string"
            ? (user_tag as string).trim().replace(/^[^[\{]+|[^\]\}]+$/g, "") // Remove non-JSON characters from start/end
            : user_tag;

        parsedTags =
          typeof cleanedUserTag === "string"
            ? JSON.parse(cleanedUserTag)
            : cleanedUserTag;

        // Ensure parsedTags is an array
        if (!Array.isArray(parsedTags)) {
          parsedTags = [];
        }
      } catch (err) {
        // console.error("Invalid user_tag format:", user_tag, err);
        parsedTags = []; // Set empty array as fallback
      }

      if (Array.isArray(parsedTags) && parsedTags.length > 0) {
        profilesApi.profiles
          .select()
          .in("id", parsedTags)
          .then(({ data, error }) => {
            // console.log({ data, error }); // Removed for performance
            if (data) setCollaboratorProfiles(data as { id: string; username: string | null; avatar_url: string | null; full_name: string | null }[]);
          });
      } else {
        setCollaboratorProfiles([]);
      }
    } else {
      setCollaboratorProfiles([]);
    }
  }, [user_tag]);

  useEffect(() => {
    if (!collaboratorProfiles.length) {
      setMediaTagPositions([]);
      return;
    }
    const minDistance = 18; // percent, adjust for your tag size
    const maxAttempts = 50;
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < collaboratorProfiles.length; i++) {
      let attempts = 0;
      let pos: { x: number; y: number };
      do {
        pos = {
          x: Math.random() * 70 + 15, // 15% to 85%
          y: Math.random() * 60 + 20, // 20% to 80%
        };
        attempts++;
      } while (
        positions.some(
          (p: { x: number; y: number }) =>
            Math.abs(p.x - pos.x) < minDistance &&
            Math.abs(p.y - pos.y) < minDistance
        ) &&
        attempts < maxAttempts
      );
      positions.push(pos);
    }
    setMediaTagPositions(positions);
  }, [collaboratorProfiles, id]);

  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCommentsOpen(true); // Open bottom sheet instead of navigating
  };

  // Scroll to comments if state.scrollToComments is set
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#comments' && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);
    }
  }, []);

  // Add effect to close collaborator tooltip on mobile when clicking outside
  useEffect(() => {
    if (!isMobile || !collabTooltipOpen) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      const btn = collabBtnRef.current;
      const tooltip = collabTooltipRef.current;
      if (
        btn &&
        !btn.contains(e.target as Node) &&
        tooltip &&
        !tooltip.contains(e.target as Node)
      ) {
        setCollabTooltipOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [isMobile, collabTooltipOpen]);

  return (
    <TooltipProvider delayDuration={0}>
      <Card
        className="overflow-hidden relative shadow-sm hover:shadow-md transition-shadow cursor-pointer border-gray-200"
        // onClick={handlePostClick}
      >
        <div className="flex justify-between items-center p-3 border-b">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                {author.username
                  ? author.username[0].toUpperCase()
                  : author.full_name
                  ? author.full_name[0].toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-sm">
                {displayName}
                {author.isVerified && (
                  <Check
                    size={14}
                    className="ml-1 inline-block text-blue-500"
                  />
                )}
                {time && (
                  <span className="text-gray-500 font-normal ml-1">
                    • {time}
                  </span>
                )}
                {/* {!isFollowing && user?.id !== author.id && (
                  <span
                    onClick={handleFollow}
                    className="ml-2 text-sm font-semibold text-blue-600 cursor-pointer hover:underline"
                  >
                    Follow
                  </span>
                )} */}
              </span>
              {location && <p className="text-xs text-gray-500">{location}</p>}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="hover:bg-gray-100 p-1 rounded-full">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user &&
                user.id !== author.id &&
                (isFollowing ? (
                  <DropdownMenuItem onClick={handleUnfollow}>
                    Unfollow
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleFollow}>
                    Follow
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveToggle(e);
                }}
              >
                {isSaved ? "Unsave" : "Save"} post
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  sessionStorage.setItem('preModalUrl', window.location.pathname);
                  router.push(`/social/post/${id}` as any);
                }}
              >
                Post Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfileClick}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user && user.id === author.id ? (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  Delete post
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                  }}
                >
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media section */}
        {media && media.length > 0 && (
          <div
            className="relative bg-gray-100 overflow-hidden flex justify-center "
            onClick={() =>
              setOpenCollaboratorsPostId && setOpenCollaboratorsPostId(null)
            }
            onTouchEnd={handleMediaTap}
          >
            {media.length > 1 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation={
                  isMobile
                    ? false
                    : {
                        nextEl: ".my-swiper-button-next",
                        prevEl: ".my-swiper-button-prev",
                      }
                }
                pagination={{ el: paginationRef.current, clickable: true }}
                className="w-full h-full"
                onSlideChangeTransitionEnd={handleVideoVisibility}
                onClick={enableAutoplay}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  setIsBeginning(swiper.isBeginning);
                  setIsEnd(swiper.isEnd);
                }}
                onSlideChange={() => {
                  if (swiperRef.current) {
                    setIsBeginning(swiperRef.current.isBeginning);
                    setIsEnd(swiperRef.current.isEnd);
                  }
                }}
              >
                {media.map((item, idx) => (
                  <SwiperSlide key={idx} className="relative">
                    {item.type === "image" ? (
                      <div className="relative w-full min-h-[200px] md:h-[400px] flex items-center justify-center">
                        <Image
                          src={item.url}
                          alt=""
                         
                          width={1000}
                          height={1000}

                        
                          className="object-cover h-full w-full"
                          // sizes="(min-width: 768px) 80vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-full min-h-[200px] md:h-[400px] flex items-center">
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current[idx] = el;
                          }}
                          src={item.url}
                          autoPlay
                          muted={muted}
                          loop
                          playsInline
                          controls={false}
                          className="w-full h-full object-contain"
                          onLoadStart={() => {
                            setVideoLoading((prev) => {
                              const updated = [...prev];
                              updated[idx] = true;
                              return updated;
                            });
                          }}
                          onCanPlay={() => {
                            setVideoLoading((prev) => {
                              const updated = [...prev];
                              updated[idx] = false;
                              return updated;
                            });
                          }}
                        />
                        {videoLoading[idx] && (
                          <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/30">
                            <div className="loader border-t-4 border-white w-8 h-8 rounded-full animate-spin"></div>
                          </div>
                        )}

                        <button
                          className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                          aria-label={muted ? "unmute" : "mute"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMuteToggle();
                          }}
                        >
                          {muted ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                      </div>
                    )}
                  </SwiperSlide>
                ))}
                {!isMobile && (
                  <>
                    <div
                      className="my-swiper-button-prev"
                      style={{
                        display: isBeginning ? "none" : "flex",
                        opacity: isBeginning ? 0 : 1,
                        transition: "opacity 0.3s ease-in-out",
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        left: "10px",
                        zIndex: 10,
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(220,220,220,0.8)",
                        color: "rgb(50,50,50)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MdOutlineKeyboardArrowLeft size={arrowIconSize} />
                    </div>
                    <div
                      className="my-swiper-button-next"
                      style={{
                        display: isEnd ? "none" : "flex",
                        opacity: isEnd ? 0 : 1,
                        transition: "opacity 0.3s ease-in-out",
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        right: "10px",
                        zIndex: 10,
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(220,220,220,0.8)",
                        color: "rgb(50,50,50)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MdOutlineKeyboardArrowRight size={arrowIconSize} />
                    </div>
                  </>
                )}
                <div ref={paginationRef} className="swiper-pagination"></div>
              </Swiper>
            ) : media[0].type === "image" ? (
              <div className="relative w-full min-h-[200px] md:h-[400px] flex items-center justify-center">
                <Image
                  src={media[0].url}
                  alt="Post content"
                 
                 width={1000}
                 height={1000}
                  className="object-cover h-full w-full"
                  // sizes="(min-width: 768px) 80vw, 100vw"
                  onError={(e) => {
                    const el = e.currentTarget as unknown as HTMLImageElement;
                    if (el && el.style) el.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full  h-full min-h-[200px] md:h-[450px] flex items-center">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[0] = el;
                  }}
                  src={media[0].url}
                  autoPlay
                  muted={muted}
                  loop
                  playsInline
                  controls={false}
                  onLoadedMetadata={handleMetadataLoaded}
                  className={`w-full h-full object-contain ${alignment}`}
                  onLoadStart={() => {
                    setVideoLoading((prev) => {
                      const updated = [...prev];
                      updated[0] = true;
                      return updated;
                    });
                  }}
                  onCanPlay={() => {
                    setVideoLoading((prev) => {
                      const updated = [...prev];
                      updated[0] = false;
                      return updated;
                    });
                  }}
                />
                {videoLoading[0] && (
                  <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/30">
                    <div className="loader border-t-4 border-white w-8 h-8 rounded-full animate-spin"></div>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                  aria-label={muted ? "unmute" : "mute"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMuteToggle();
                  }}
                >
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            )}
            {/* Render collaborator tags over media if showMediaTags is true */}
            {showMediaTags &&
              collaboratorProfiles.map((user, idx) => (
                <div
                  key={user.id}
                  style={{
                    position: "absolute",
                    left: `${mediaTagPositions[idx]?.x || 50}%`,
                    top: `${mediaTagPositions[idx]?.y || 50}%`,
                    transform: "translate(-50%, -100%)",
                    zIndex: 20,
                    pointerEvents: "auto",
                  }}
                  className={`group transition-all duration-200 ${
                    showMediaTags
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${user.id}` as any);
                    if (setOpenCollaboratorsPostId)
                      setOpenCollaboratorsPostId(null);
                  }}
                >
                  <div className="bg-black bg-opacity-80 text-white px-3 pt-1 rounded text-xs font-semibold relative whitespace-nowrap">
                    {user.username || user.full_name}
                    <span className="absolute left-1/2 -bottom-1.5 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black opacity-80 transform -translate-x-1/2"></span>
                  </div>
                </div>
              ))}
            {/* Collaborator avatars overlay */}
            {collaboratorProfiles.length > 0 && (
              <div className="absolute left-2 bottom-2 z-30 flex flex-col items-start">
                <Tooltip
                  {...(isMobile
                    ? {
                        open: collabTooltipOpen,
                        onOpenChange: setCollabTooltipOpen,
                      }
                    : {})}
                >
                  <TooltipTrigger asChild>
                    <button
                      ref={collabBtnRef}
                      className="bg-white rounded-full p-2 shadow border border-gray-200 flex items-center justify-center hover:bg-gray-100 ml-1"
                      type="button"
                      id={`collab-btn-${id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setOpenCollaboratorsPostId)
                          setOpenCollaboratorsPostId(showMediaTags ? null : id);
                      }}
                    >
                      <User className="w-3 h-3 text-gray-700" />
                    </button>
                  </TooltipTrigger>
                </Tooltip>
              </div>
            )}
          </div>
        )}
        <div
          className={`pt-2 ml-4 flex flex-col  overflow-y-scroll scrollbar-hide ${
            media && media.length === 0
              ? "h-full min-h-[200px] md:h-[400px]"
              : ""
          }`}
        >
          <p
            ref={contentRef}
            onClick={handlePostClick}
            className={`whitespace-pre-line text-justify ${
              media && media.length == 0 ? "line-clamp-6" : "line-clamp-1"
            } text-ellipsis`}
          >
            {content}
          </p>

          {isOverflowing && (
            <p
              onClick={handlePostClick}
              className="text-blue-500 hover:underline  text-sm"
            >
              Read more
            </p>
          )}
        </div>
        {/* Action buttons */}
        <div className="px-4 py-2 flex justify-between">
          <div className="flex space-x-4">
            <button
              className={`flex items-center gap-1 ${
                isLiked ? "text-red-500" : ""
              } ${likeAnim ? "pop-animate" : ""}`}
              onClick={handleLikeToggle}
            >
              <Heart size={22} className={isLiked ? "fill-current" : ""} />
            </button>

            <button className="flex  gap-1" onClick={handleCommentClick}>
              <MessageSquare size={22} />
            </button>

            <button className="flex items-center gap-1" onClick={handleShare}>
              <Send size={22} />
            </button>
          </div>

          <button
            className={`flex items-center gap-1 ${
              isSaved ? "text-blue-500" : ""
            } ${saveAnim ? "pop-animate" : ""}`}
            onClick={handleSaveToggle}
          >
            <Bookmark size={22} className={isSaved ? "fill-current" : ""} />
          </button>
        </div>

        {/* Likes count */}
        <div className="px-4  pb-1">
          <p className="font-semibold text-sm">
            <span className={likesAnim ? "pop-up-animate" : ""}>
              {likesCount}
            </span>{" "}
            likes
          </p>
        </div>
        {/* Comments preview and input */}
        <div className="px-4 pb-2">
          {recentComments.length > 0 && (
            <ul className="mb-1">
              {recentComments.map((c) => (
                <li key={c.id} className="mb-1 flex items-start gap-2">
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/profile/${c.profile?.id}` as any)}
                    title="View profile"
                  >
                    <Avatar className="w-6 h-6 mt-0.5">
                      <AvatarImage
                        src={
                          c.profile?.avatar_url ||
                          `https://avatars.dicebear.com/api/identicon/${c.user_id}.svg`
                        }
                        alt={
                          c.profile?.full_name || c.profile?.username || "User"
                        }
                      />
                      <AvatarFallback>
                        {c.profile?.username
                          ? c.profile.username[0].toUpperCase()
                          : c.profile?.full_name
                          ? c.profile.full_name[0].toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <span
                      className="font-medium text-xs cursor-pointer hover:underline"
                      onClick={() => router.push(`/profile/${c.profile?.id}` as any)}
                      title="View profile"
                    >
                      {c.profile?.full_name || c.profile?.username || "User"}
                    </span>{" "}
                    <span className="text-xs text-gray-500">{c.content}</span>
                    <span className="text-[10px] text-gray-400 ml-1">
                      {c.created_at ? timeAgo(c.created_at) : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalComments > 2 && (
            <p
              className="cursor-pointer text-blue-500 hover:underline text-xs mt-1"
              onClick={handleCommentClick}
            >
              View all {totalComments} comments
            </p>
          )}
          <PostCardCommentInput
            value={commentInput}
            onChange={setCommentInput}
            onSend={handleAddComment}
            loading={commentLoading}
          />
        </div>
      </Card>

      <ShareModal
        open={isShareOpen}
        onClose={() => setShareOpen(false)}
        postId={id}
      />

      <ReportModal
        open={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setReportReason("");
        }}
        reason={reportReason}
        setReason={setReportReason}
        onSubmit={handleReportSubmit}
      />

      <DeleteConfirmModal
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeletePost}
        loading={deleteLoading}
      />

      <CommentsBottomSheet
        postId={id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postAuthor={{
          id: author.id || "",
          username: author.username || "",
          full_name: author.full_name || author.name || "",
          avatar_url: author.avatar_url || author.avatar || "",
        }}
        postContent={content}
        postMedia={media?.map((m) => m.url) || []}
      />
    </TooltipProvider>
  );
};

export default memo(PostCard);

function timeAgo(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Number(now) - Number(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}
