 "use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageSquare,
  Send,
  Bookmark,
  MoreHorizontal,
  Check,
  Volume2,
  VolumeX,
  User,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareModal } from "@/lib/shareModel";
import CommentsSection from "./CommentsSection";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ReportModal } from "./reportModel";
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
import { useCallback } from "react";
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
  location?: string;
}

interface PostProps {
  id: string;
  author: Author;
  time?: string;
  content: string;
  media?: Media[];
  likes: number;
  comments: number;
  location?: string;
  onPostReported: (postId: string) => void;
  user_tag?: string[] | string | null;
}

const Post = ({
  id,
  author,
  time,
  content,
  media,
  likes,
  location,
  onPostReported,
  user_tag,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isShareOpen, setShareOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [likesAnim, setLikesAnim] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const currentlyPlayingRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoading, setVideoLoading] = useState<boolean[]>([]);

  const swiperRef = useRef<SwiperRef | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [arrowIconSize, setArrowIconSize] = useState(30);
  const [isMobile, setIsMobile] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lastTap, setLastTap] = useState<number | null>(null);

  const [isDesktopMuted, setIsDesktopMuted] = useState(true);

  const [collaboratorProfiles, setCollaboratorProfiles] = useState<
    { id: string; username: string | null; avatar_url: string | null; full_name: string | null }[]
  >([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [mediaTagPositions, setMediaTagPositions] = useState<{ x: number; y: number }[]>([]);
  const [showMediaTags, setShowMediaTags] = useState(false);

  const commentsRef = useRef<HTMLDivElement | null>(null);

  const [collabTooltipOpen, setCollabTooltipOpen] = useState(false);

  // const pathname = usePathname();

  const [videoAspects, setVideoAspects] = useState<string[]>([]);

  const handleVideoMetadata = (
    e: React.SyntheticEvent<HTMLVideoElement>,
    idx: number
  ) => {
    const video = e.currentTarget;
    setVideoAspects((prev) => {
      const next = [...prev];
      next[idx] =
        video.videoHeight > video.videoWidth ? "portrait" : "landscape";
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 767) {
        setArrowIconSize(20);
        setIsMobile(true);
      } else {
        setArrowIconSize(30);
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

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
              console.log("Autoplay blocked or failed:", e);
            });

            currentlyPlayingRef.current = video;
          } else {
            if (!(video as HTMLVideoElement).paused) {
              (video as HTMLVideoElement).pause();
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
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, []);

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
            console.log("Play failed:", e);
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

    window.removeEventListener("touchstart", enableAutoplay);
    window.removeEventListener("click", enableAutoplay);
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
      if (typeof onPostReported === "function") {
        onPostReported(id);
      }
      const from = "/social";
      router.push(from as any);
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

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    setSaveAnim(true);
    toast({
      description: isSaved
        ? "Removed from saved items"
        : "Added to saved items",
    });
  };

  useEffect(() => {
    if (!saveAnim) return;
    const timeout = setTimeout(() => setSaveAnim(false), 300);
    return () => clearTimeout(timeout);
  }, [saveAnim]);

  const handlePostClick = () => {
    router.push(`/social/post/${id}` as any);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${author.id}` as any);
  };

  const avatarUrl =
    author.avatar_url ||
    author.avatar ||
    "https://avatars.dicebear.com/api/identicon/" + id + ".svg";
  const displayName =
    author.name || author.full_name || author.username || "User";
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

  const handleMuteToggle = (idx: number) => {
    setMuted((prev) => !prev);
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = !muted;
      }
    });
  };

  const handleMuteToggleDesktop = (idx: number) => {
    setIsDesktopMuted((prev) => !prev);
    videoRefs.current.forEach((video) => {
      if (video) video.muted = !isDesktopMuted;
    });
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth" as any);
      return;
    }

    try {
      if (!user || !author.id) return;
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

    try {
      if (!user || !author.id) return;
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
      if (typeof onPostReported === "function") {
        onPostReported(id);
      }
      router.push("/social" as any);
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
    if (typeof user_tag !== "undefined" && user_tag && user_tag.length > 0) {
      let parsedTags = [];
      try {
        parsedTags =
          typeof user_tag === "string" ? JSON.parse(user_tag) : user_tag;
      } catch (err) {
        console.error("Invalid user_tag format", err);
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

  // Scroll to comments - Next.js doesn't have location.state, use URL hash or searchParams
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

  return (
    <TooltipProvider delayDuration={0}>
      <Card
        className="overflow-hidden relative shadow-sm  h-full hover:shadow-md transition-shadow cursor-pointer border-gray-200"
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
              {(author.location || location) && (
                <div className="text-xs text-gray-500">
                  {author.location || location}
                </div>
              )}
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
                {isSaved ? "Unsave" : "Save"} post
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleProfileClick}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user && user.id === author.id ? (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setIsDeleteConfirmOpen(true)}
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
            {media.length === 1 ? (
              media[0].type === "image" ? (
                <div className="relative w-full h-[300px] md:h-[400px]">
                  <Image
                    src={media[0].url}
                    alt="Post content"
                    fill
                    className="object-contain"
                    sizes="(min-width: 768px) 80vw, 100vw"
                  />
                </div>
              ) : (
                <div
                  onClick={enableAutoplay}
                  className={
                    videoAspects[0] === "portrait"
                      ? "relative w-full max-w-[360px] aspect-[9/16] bg-black mx-auto"
                      : "relative w-full h-[300px] md:h-[400px] bg-black"
                  }
                >
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
                    onLoadedMetadata={(e) => handleVideoMetadata(e, 0)}
                    onLoadStart={() => {
                      setVideoLoading((prev: boolean[]) => {
                        const updated = [...prev];
                        updated[0] = true;
                        return updated;
                      });
                    }}
                    onCanPlay={() => {
                      setVideoLoading((prev: boolean[]) => {
                        const updated = [...prev];
                        updated[0] = false;
                        return updated;
                      });
                    }}
                    className={
                      videoAspects[0] === "portrait"
                        ? "w-full h-full object-cover bg-black"
                        : "w-full object-contain h-[300px] md:h-[400px] bg-black"
                    }
                  />
                  {videoLoading[0] && (
                    <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/30">
                      <div className="loader border-t-4 border-white w-8 h-8 rounded-full animate-spin"></div>
                    </div>
                  )}
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
                </div>
              )
            ) : (
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
                className="h-full"
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
                      <div className="relative w-full h-[300px] md:h-[400px]">
                        <Image
                          src={item.url}
                          alt={`Post media ${idx + 1}`}
                          fill
                          className="object-contain"
                          sizes="(min-width: 768px) 80vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div
                        className={
                          videoAspects[idx] === "portrait"
                            ? "relative w-full max-w-[360px] aspect-[9/16] bg-black mx-auto"
                            : "relative w-full h-[300px] md:h-[400px] bg-black"
                        }
                      >
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
                          onLoadedMetadata={(e) => handleVideoMetadata(e, idx)}
                          className={
                            videoAspects[idx] === "portrait"
                              ? "w-full h-full object-cover bg-black"
                              : "w-full object-contain h-[300px] md:h-[400px] bg-black"
                          }
                          onLoadStart={() => {
                            setVideoLoading((prev: boolean[]) => {
                              const updated = [...prev];
                              updated[idx] = true;
                              return updated;
                            });
                          }}
                          onCanPlay={() => {
                            setVideoLoading((prev: boolean[]) => {
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
        <div className={`p-2 ml-1 flex flex-col w-full ml-2`}>
          <p className={`whitespace-pre-line`}>{content}</p>
        </div>
        {/* Action buttons */}
        <div className="px-4  flex justify-between">
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
              onClick={(e) => {
                e.stopPropagation();
                if (commentsRef.current) {
                  commentsRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <MessageSquare size={22} />
            </button>
            <button
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(true);
              }}
            >
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
          <p className="font-semibold text-sm">
            <span className={likesAnim ? "pop-up-animate" : ""}>
              {likesCount}
            </span>{" "}
            likes
          </p>
        </div>
        <div className="px-4 pb-3" ref={commentsRef}>
          <CommentsSection postId={id} />
        </div>
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
      </Card>
    </TooltipProvider>
  );
};

export default Post;
