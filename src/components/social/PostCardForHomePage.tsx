 "use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
import { ReportModal } from "./reportModel";
import { useMyContext } from "@/contexts/GlobalContext";
import { socialApi } from "@/integrations/supabase/modules/social";
import DeleteConfirmModal from "./DeleteConfirmModal";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import type { Swiper as SwiperRef } from "swiper";
import { profilesApi } from "@/integrations/supabase/modules/profiles";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
  user_tag?: string[] | string | null;
}

const VideoPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      loop
      controls={false}
      className="w-full object-cover max-h-[500px]"
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => videoRef.current?.pause()}
    />
  );
};

const PostCardForHomePage = ({
  id,
  author,
  time,
  content,
  media,
  likes,
  location,
  user_tag,
  onPostReported,
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
  const context = useMyContext();
  const muted = context?.homeVideoMute ?? false;
  const setMuted = context?.setHomeVideoMute ?? (() => {});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const currentlyPlayingRef = useRef<HTMLVideoElement | null>(null);
  const scrollRef = context?.scrollRef ?? null;
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDesktopMuted, setIsDesktopMuted] = useState(true);
  const [arrowIconSize, setArrowIconSize] = useState(30);
  const swiperRef = useRef<SwiperRef | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<
    { id: string; username: string | null; avatar_url: string | null; full_name: string | null }[]
  >([]);
  const [collabTooltipOpen, setCollabTooltipOpen] = useState(false);
  const [mediaTagPositions, setMediaTagPositions] = useState<{ x: number; y: number }[]>([]);
  const [showMediaTags, setShowMediaTags] = useState(false);
  interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_id?: string;
    updated_at?: string;
    parent_id?: string | null;
    profile?: {
      id?: string;
      full_name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    };
  }
  
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setArrowIconSize(window.innerWidth <= 767 ? 20 : 30);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
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

    checkFollowingStatus();
  }, [user, author.id]);

  const enableAutoplay = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    videoRefs.current.forEach((video) => {
      if (!video) return;

      if (isFullyVisible(video)) {
        video.play().catch((e) => {
          console.warn("Autoplay failed even after user gesture", e);
        });
        currentlyPlayingRef.current = video as HTMLVideoElement;
      }
    });

    window.removeEventListener("touchstart", enableAutoplay);
    window.removeEventListener("click", enableAutoplay);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener("touchstart", enableAutoplay, { once: true });
    window.addEventListener("click", enableAutoplay, { once: true });

    return () => {
      window.removeEventListener("touchstart", enableAutoplay);
      window.removeEventListener("click", enableAutoplay);
    };
  }, [enableAutoplay]);
  useEffect(() => {
    const videos = videoRefs.current;

    if (isMobile) {
      // ✅ Mobile: play only one visible video at a time
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;

            if (entry.intersectionRatio === 1) {
              // Fully in viewport
              if (
                currentlyPlayingRef.current &&
                currentlyPlayingRef.current !== video
              ) {
                (currentlyPlayingRef.current as HTMLVideoElement).pause();
              }

              video.play().catch((e) => {
                // Some mobile devices may block autoplay
                // console.log("Autoplay blocked or failed:", e); // Removed for performance
              });

              currentlyPlayingRef.current = video as HTMLVideoElement;
            } else {
              // Touching top/bottom or out of view
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

      const currentVideos = videoRefs.current;
      currentVideos.forEach((video) => {
        if (video) {
          observer.observe(video);
          video.muted = false;
        }
      });

      return () => {
        currentVideos.forEach((video) => {
          if (video) observer.unobserve(video);
        });
      };
    } else {
      videos.forEach((video) => {
        if (video) {
          if (video?.muted) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                // console.log("Desktop autoplay failed:", error); // Removed for performance
              });
            }
          }
        }
      });
    }
  }, [isMobile]);

  const isFullyVisible = (el: HTMLVideoElement) => {
    if (!el || typeof window === 'undefined') return false;
    const rect = el.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const isCompletelyInView =
      rect.top >= 0 &&
      rect.bottom <= windowHeight &&
      rect.left >= 0 &&
      rect.right <= windowWidth;

    return isCompletelyInView;
  };

  const handleVideoVisibility = useCallback(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (isFullyVisible(video)) {
        if (
          currentlyPlayingRef.current &&
          currentlyPlayingRef.current !== video
        ) {
          currentlyPlayingRef.current?.pause();
        }
        const promise = video.play();

        if (promise !== undefined) {
          promise.catch((e) => {
            // console.log("Play failed:", e); // Removed for performance
          });
        }
        currentlyPlayingRef.current = video as HTMLVideoElement;
      } else {
        video.pause();
      }
    });
  }, []);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;
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
  }, [isMobile, handleVideoVisibility]);

  const [videoLoading, setVideoLoading] = useState<boolean[]>([]);

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

    const fetchCommentsCount = async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id);

      if (!error && typeof count === "number") {
        setCommentsCount(count);
      }
    };

    fetchLikesCount();
    fetchCommentsCount();
  }, [id]);

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
        const { data, error } = await supabase
          .from("saved_post")
          .select()
          .eq("post_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setIsSaved(true);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    checkSaveStatus();
    checkLikeStatus();
  }, [id, isAuthenticated, user]);

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
    setIsSaved(!isSaved);
    setSaveAnim(true);

    toast({
      description: isSaved
        ? "Removed from saved items"
        : "Added to saved items",
    });

    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    if (!user) return;

    try {
      if (isSaved) {
        await supabase
          .from("saved_post")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);
      } else {
        await supabase.from("saved_post").insert({
          post_id: id,
          user_id: user.id,
        });
      }

      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        description: isSaved
          ? "Removed from saved items"
          : "Added to saved items",
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
    router.push(`/social/post/${id}` as any);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
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

  const handleMuteToggle = (idx?: number) => {
    setMuted((prev: boolean) => !prev);
  };

  const [alignment, setAlignment] = useState("self-center");

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const isPortrait = video.videoHeight > video.videoWidth;
    setAlignment(isPortrait ? "self-start" : "self-center");
  };

  const [alignments, setAlignments] = useState<string[]>([]);
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    try {
      if (user?.id && author.id) {
        await socialApi.follows.followUser(user.id, author.id);
      }
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

    try {
      if (user?.id && author.id) {
        await socialApi.follows.unfollowUser(user.id, author.id);
      }
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
  const playVideoOnHover = (idx?: number) => {
    if (typeof idx === "number" && videoRefs.current[idx]) {
      videoRefs.current[idx]!.muted = false;
    }
  };
  const pauseVideoOnLeave = (idx?: number) => {
    if (typeof idx === "number" && videoRefs.current[idx]) {
      videoRefs.current[idx]!.muted = true;
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
      if (typeof onPostReported === "function") {
        onPostReported(id);
      }
    } catch (error) {
      toast({ description: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Listen for global mute events (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const handler = (e: Event) => {
        const custom = e as CustomEvent<{ postId: string }>;
        if (custom.detail.postId !== id) {
          setIsDesktopMuted(true);
          videoRefs.current.forEach((video) => {
            if (video) video.muted = true;
          });
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener("postcard-mute-all", handler as EventListener);
        return () =>
          window.removeEventListener(
            "postcard-mute-all",
            handler as EventListener
          );
      }
    }
  }, [id, isMobile]);

  // When mute state changes, update video elements (desktop only)
  useEffect(() => {
    if (!isMobile) {
      videoRefs.current.forEach((video) => {
        if (video) video.muted = isDesktopMuted;
      });
    }
  }, [isDesktopMuted, isMobile]);

  const handleMuteToggleDesktop = (idx: number) => {
    setIsDesktopMuted((prev) => !prev);
    videoRefs.current.forEach((video) => {
      if (video) video.muted = !isDesktopMuted;
    });
  };

  // Double-tap to like for mobile
  const handleMediaTap = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
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
            ? user_tag.trim().replace(/^[^[{]+|[^\]}]+$/g, "") // Remove non-JSON characters from start/end
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
    router.push(`/social/post/${id}` as any);
  };

  // Use React Query for better caching and performance
  const { data: commentsData } = useQuery({
    queryKey: ["postComments", id],
    queryFn: async () => {
      const { data, count, error } = await supabase
        .from("comments")
        .select("*, profile:profiles(*)", { count: "exact" })
        .eq("post_id", id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return { comments: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (commentsData) {
      interface CommentsData {
        comments: Array<{
          id: string;
          content: string;
          created_at: string;
          user_id: string;
          profile: {
            full_name: string;
            avatar_url: string;
          };
        }>;
        count: number;
      }

      const typedCommentsData = commentsData as CommentsData;
      setRecentComments(typedCommentsData.comments.reverse()); // oldest first
      setTotalComments(typedCommentsData.count);
    }
  }, [commentsData]);

  const handleAddComment = async () => {
    if (!commentInput.trim() || !user) return;
    setCommentLoading(true);
    const optimisticComment: Comment = {
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
    setRecentComments((prev) => [...prev, optimisticComment].slice(-2));
    setTotalComments((prev) => prev + 1);
    setCommentInput("");
    try {
      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        post_id: id,
        content: optimisticComment.content,
        parent_id: null,
      });
      if (error) throw error;
    } catch (e) {
      // Optionally show error toast
    } finally {
      // Always re-fetch to sync
      const { data, count } = await supabase
        .from("comments")
        .select("*, profile:profiles(*)", { count: "exact" })
        .eq("post_id", id)
        .order("created_at", { ascending: false })
        .limit(1);
      setRecentComments(data ? (data as Comment[]).reverse() : []);
      setTotalComments(count || 0);
      setCommentLoading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setCommentInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <Card
        className="overflow-hidden h-full max-h-[630px] relative shadow-sm hover:shadow-md transition-shadow cursor-pointer border-gray-200"
        onClick={handlePostClick}
      >
        {/* Instagram-like header */}
        <div className="flex justify-between items-center p-3 border-b">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                {(displayName[0] || "U").toUpperCase()}
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
                  setIsSaved(!isSaved);
                  toast({
                    description: isSaved
                      ? "Removed from saved items"
                      : "Added to saved items",
                  });
                }}
              >
                {isSaved ? "Unsave" : "Save post"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
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
            className="relative bg-gray-100 overflow-hidden flex justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowMediaTags(false);
            }}
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
                      <div className="relative w-full h-[400px] md:h-[300px]">
                        <Image
                          src={item.url}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="(min-width: 768px) 80vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-[400px] md:h-[300px]  flex items-center">
                        <video
                          ref={(el) => { videoRefs.current[idx] = el; }}
                          src={item.url}
                          autoPlay
                          onMouseEnter={() => playVideoOnHover(idx)}
                          onMouseLeave={() => pauseVideoOnLeave(idx)}
                          muted={isMobile ? muted : isDesktopMuted}
                          loop
                          playsInline
                          controls={false}
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
                          className="w-full h-full object-contain"
                        />
                        {/* Desktop mute/unmute button */}
                        {!isMobile && (
                          <button
                            className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                            aria-label={
                              isMobile
                                ? muted
                                  ? "unmute"
                                  : "mute"
                                : isDesktopMuted
                                ? "unmute"
                                : "mute"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMobile) {
                                handleMuteToggle(idx);
                              } else {
                                handleMuteToggleDesktop(idx);
                              }
                            }}
                          >
                            {isMobile ? (
                              muted ? (
                                <VolumeX size={20} />
                              ) : (
                                <Volume2 size={20} />
                              )
                            ) : isDesktopMuted ? (
                              <VolumeX size={20} />
                            ) : (
                              <Volume2 size={20} />
                            )}
                          </button>
                        )}
                        {/* Mobile mute/unmute button (existing logic) */}
                        {isMobile && (
                          <button
                            className="block absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                            aria-label={muted ? "unmute" : "mute"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMuteToggle(idx);
                            }}
                          >
                            {muted ? (
                              <VolumeX size={20} />
                            ) : (
                              <Volume2 size={20} />
                            )}
                          </button>
                        )}
                        {videoLoading[idx] && (
                          <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/30">
                            <div className="loader border-t-4 border-white w-8 h-8 rounded-full animate-spin"></div>
                          </div>
                        )}
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
              <div className="relative w-full h-[400px] md:h-[300px]">
                <Image
                  src={media[0].url}
                  alt="Post content"
                  fill
                  className="object-contain"
                  sizes="(min-width: 768px) 80vw, 100vw"
                />
              </div>
            ) : (
              <div className="relative w-full  h-[400px] md:h-[300px] flex items-center">
                <video
                  ref={(el) => { videoRefs.current[0] = el; }}
                  src={media[0].url}
                  autoPlay
                  onMouseEnter={() => playVideoOnHover(0)}
                  onMouseLeave={() => pauseVideoOnLeave(0)}
                  muted={isMobile ? muted : isDesktopMuted}
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
                {/* Desktop mute/unmute button */}
                {!isMobile && (
                  <button
                    className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                    aria-label={
                      isMobile
                        ? muted
                          ? "unmute"
                          : "mute"
                        : isDesktopMuted
                        ? "unmute"
                        : "mute"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) {
                        handleMuteToggle(0);
                      } else {
                        handleMuteToggleDesktop(0);
                      }
                    }}
                  >
                    {isMobile ? (
                      muted ? (
                        <VolumeX size={20} />
                      ) : (
                        <Volume2 size={20} />
                      )
                    ) : isDesktopMuted ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                )}
                {/* Mobile mute/unmute button (existing logic) */}
                {isMobile && (
                  <button
                    className="block absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white z-10 mute-unmute-btn"
                    aria-label={muted ? "unmute" : "mute"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMuteToggle(0);
                    }}
                  >
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                )}
                {videoLoading[0] && (
                  <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/30">
                    <div className="loader border-t-4 border-white w-8 h-8 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
            {/* Collaborator tags over media */}
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
                    setShowMediaTags(false);
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
                <button
                  className="bg-white rounded-full p-2 shadow border border-gray-200 flex items-center justify-center hover:bg-gray-100 ml-1"
                  type="button"
                  id={`collab-btn-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediaTags((prev) => !prev);
                  }}
                >
                  <User className="w-3 h-3 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        )}
        <div
          className={`pt-2 ml-4 flex flex-col  overflow-y-scroll scrollbar-hide ${
            media && media.length === 0 ? "h-[300px] md:h-[400px]" : ""
          }`}
        >
          <p
            ref={contentRef}
            className={`whitespace-pre-line text-justify ${
              media && media.length == 0 ? "line-clamp-6" : "line-clamp-1"
            } text-ellipsis`}
          >
            {content}
          </p>

          {isOverflowing && (
            <p
              onClick={handlePostClick}
              className="text-blue-500 hover:underline mt-1 text-sm"
            >
              Read more
            </p>
          )}
        </div>
        {/* Action buttons */}
        <div className="px-4 pt-1 flex justify-between">
          <div className="flex space-x-4">
            <button
              className={`flex items-center gap-1 ${
                isLiked ? "text-red-500" : ""
              } ${likeAnim ? "pop-animate" : ""}`}
              onClick={handleLikeToggle}
            >
              <Heart size={22} className={isLiked ? "fill-current" : ""} />
            </button>

            <button
              className="flex items-center gap-1"
              onClick={handleCommentClick}
            >
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
        <div className="px-4 pt-1 pb-2">
          <p className="font-semibold text-xs">
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
              className="cursor-pointer text-blue-500 hover:underline text-xs mt-1 mb-1"
              onClick={handleCommentClick}
            >
              View all {totalComments} comments
            </p>
          )}
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
              className="flex-1 w-full outline-none border-none bg-transparent placeholder-gray-400 text-xs py-1 h-7"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !commentLoading) handleAddComment();
              }}
              disabled={commentLoading}
            />
            {commentInput.trim() && !commentLoading && (
              <button
                type="button"
                className="ml-1 px-2 py-1 text-xs font-semibold rounded text-red-800"
                onClick={handleAddComment}
              >
                Send
              </button>
            )}
          </div>
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
    </>
  );
};

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

export default memo(PostCardForHomePage);
