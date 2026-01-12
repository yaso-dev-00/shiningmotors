"use client";

import { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2, Volume2, VolumeX, ChevronUp, ChevronDown } from "lucide-react";
import { socialApi, supabase } from "@/integrations/supabase/client";
import { PostWithProfile, PostProfile } from "@/integrations/supabase/modules/social";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareModal } from "@/lib/shareModel";
import { ReportModal } from "@/components/social/reportModel";
import { useToast } from "@/hooks/use-toast";

interface PostModalProps {
  postId: string;
  onClose?: () => void;
  commentId?: string;
}

interface CommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface FlatComment extends CommentWithProfile {
  isReply?: boolean;
  directParent?: CommentWithProfile;
}

export default function PostModal({ postId, onClose, commentId: commentIdProp }: PostModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [isLiking, setIsLiking] = useState(false); // Track if we're in the middle of a like action
  
  // Check if coming from notification with comment ID - use prop if provided, otherwise searchParams
  const commentId = commentIdProp || searchParams.get('commentId');
  const [commentsExpanded, setCommentsExpanded] = useState(!!commentId);
  const [isClosing, setIsClosing] = useState(false);

  // Reset state when postId changes (navigating to a different post)
  useEffect(() => {
    // Reset all state when postId changes
    setIsClosing(false);
    setPost(null);
    setComments([]);
    setCurrentMediaIndex(0);
    setComment("");
    setIsLiked(false);
    setLikesCount(0);
    setIsSaved(false);
    setIsMuted(false);
    setReplyingToCommentId(null);
    setShareOpen(false);
    setIsReportOpen(false);
    setReportReason("");
    setIsFollowing(false);
    setIsDeleteConfirmOpen(false);
    setDeleteLoading(false);
      setLoading(true);
    setCommentsLoading(true);
  }, [postId]); // Only reset when postId changes, not when searchParams changes

  // Handle commentId separately to avoid resetting post data
  useEffect(() => {
    const newCommentId = searchParams.get('commentId');
    setCommentsExpanded(!!newCommentId);
  }, [searchParams]);


  // SWR fetchers
  const fetchPost = async () => {
    const { data, error } = await socialApi.posts.getById(postId);
    if (error) throw error;
    return data as PostWithProfile;
  };

  const fetchComments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    const response = await fetch(
      `/api/comments?postId=${postId}&orderBy=asc&_t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch comments");
    const { data } = await response.json();
    return data || [];
  };

  const {
    data: swrPost,
    isLoading: swrPostLoading,
    error: swrPostError,
    mutate: mutatePost,
  } = useSWR(postId && !isClosing ? ['post', postId] : null, fetchPost, {
    revalidateOnFocus: false,
    dedupingInterval: 2000, // Cache for 2 seconds to prevent rapid refetches
  });

  const {
    data: swrComments,
    isLoading: swrCommentsLoading,
    error: swrCommentsError,
    mutate: mutateComments,
  } = useSWR(postId && !isClosing ? ['comments', postId] : null, fetchComments, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  // Function to fetch likes count from the likes table
  const fetchLikesCount = useCallback(async () => {
    if (!postId) return;
    try {
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      
      if (!error && typeof count === "number") {
        setLikesCount(count);
      }
    } catch (error) {
      console.error("Error fetching likes count:", error);
    }
  }, [postId]);

  // Sync SWR state to local state
  useEffect(() => {
    // Only update loading state based on SWR state
    // Keep loading true until we have data OR there's a definitive error
    if (swrPost) {
      setPost(swrPost);
      setLoading(false); // Only stop loading when we have the post
      // Fetch likes count separately since it's not in the post data
      // Only fetch if we're not in the middle of a like action (to avoid overwriting optimistic update)
      if (!isLiking) {
        fetchLikesCount();
      }
    } else if (swrPostError) {
      // If there's an error, stop loading to show error state
      setLoading(false);
    } else {
      // If no data yet, use SWR's loading state
      // This ensures we show loader while fetching
      setLoading(swrPostLoading);
    }
  }, [swrPost, swrPostLoading, swrPostError, fetchLikesCount, isLiking]);

  useEffect(() => {
    setCommentsLoading(swrCommentsLoading);
    if (swrComments) {
      setComments(swrComments);
    }
  }, [swrComments, swrCommentsLoading]);


  // Scroll to specific comment if coming from notification
  useEffect(() => {
    if (commentId && !commentsLoading && comments.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the comment briefly
          commentElement.classList.add('bg-blue-500/20', 'rounded-lg');
          setTimeout(() => {
            commentElement.classList.remove('bg-blue-500/20', 'rounded-lg');
          }, 3000);
        }
      }, 300);
    }
  }, [commentId, commentsLoading, comments]);

  // Ensure comments container is scrollable on desktop after content loads
  useEffect(() => {
    if (!commentsLoading && commentsContainerRef.current) {
      // Force a reflow to ensure scrolling works
      const container = commentsContainerRef.current;
      if (container.scrollHeight > container.clientHeight) {
        // Content is scrollable, ensure it's enabled
        container.style.overflowY = 'auto';
      }
    }
  }, [commentsLoading, comments]);

  // Check like and save status
  useEffect(() => {
    if (!user || !postId) return;

    const checkStatus = async () => {
      try {
        const { data: likeData } = await supabase
          .from("likes")
          .select()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();
        setIsLiked(!!likeData);

        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const saveResponse = await fetch(
          `/api/saved-posts?postId=${postId}&userId=${user.id}&_t=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {
              ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            },
          }
        );
        if (saveResponse.ok) {
          const { isSaved: savedStatus } = await saveResponse.json();
          setIsSaved(savedStatus);
        }

      } catch (error) {
        console.error("Error checking status:", error);
      }
    };
    checkStatus();
  }, [user, postId]);

  // Check follow status when post is loaded
  useEffect(() => {
    if (!user || !post?.profile?.id || user.id === post.profile.id) {
      setIsFollowing(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const { data } = await socialApi.follows.checkIfFollowing(user.id, post.profile.id);
        setIsFollowing(!!data);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    checkFollowStatus();
  }, [user, post?.profile?.id]);

  // Store scroll position on mount - capture immediately
  const scrollPositionRef = useRef<number>(0);
  const originalBodyStyleRef = useRef<{
    overflow: string;
    position: string;
    top: string;
    width: string;
    left: string;
    height: string;
  } | null>(null);
  
  // Capture scroll position immediately when component mounts (before any rendering)
  // Use useLayoutEffect to run synchronously before browser paint to prevent any scrolling
  useLayoutEffect(() => {
    // Capture scroll position synchronously - MUST be first thing we do
    // Get the actual current scroll position immediately
    const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    
    // Get stored scroll position from sessionStorage (set by PostCard before navigation)
    // Use stored value if available, otherwise use current scroll position
    const savedScroll = sessionStorage.getItem('modalScrollPosition');
    const scrollY = savedScroll && parseInt(savedScroll, 10) >= 0 
      ? parseInt(savedScroll, 10) 
      : currentScrollY;
    
    // Store in ref for later use
    scrollPositionRef.current = scrollY;
    
    // Capture the actual document height BEFORE making body fixed
    // This prevents layout shifts in background content
    const actualDocumentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    // Save original body styles before modifying
    originalBodyStyleRef.current = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      left: document.body.style.left,
      height: document.body.style.height,
    };
    
    // Prevent any scroll events during initialization with a temporary listener
    // This catches any scroll that might happen between route change and style application
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      // Force scroll position back if anything tries to scroll
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
      }
    };
    
    // Add scroll prevention listeners immediately (before applying styles)
    // Use capture phase to catch events early
    const options = { passive: false, capture: true };
    window.addEventListener('scroll', preventScroll, options);
    window.addEventListener('wheel', preventScroll, options);
    window.addEventListener('touchmove', preventScroll, options);
    
    // Now apply body styles to lock scroll position
    // Use actual document height instead of 100% to prevent layout shifts
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.style.height = `${actualDocumentHeight}px`;
    document.body.style.touchAction = 'none';
    
    // Remove scroll prevention listeners after styles are applied (they're no longer needed)
    // Use a microtask to ensure it happens after current execution
    Promise.resolve().then(() => {
      window.removeEventListener('scroll', preventScroll, options);
      window.removeEventListener('wheel', preventScroll, options);
      window.removeEventListener('touchmove', preventScroll, options);
    });
    
    return () => {
      // Remove scroll prevention listeners (in case they're still attached)
      const options = { passive: false, capture: true };
      window.removeEventListener('scroll', preventScroll, options);
      window.removeEventListener('wheel', preventScroll, options);
      window.removeEventListener('touchmove', preventScroll, options);
      
      // Restore body styles first - ensure all are reset
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      
      // Restore from ref if available
      if (originalBodyStyleRef.current) {
        document.body.style.overflow = originalBodyStyleRef.current.overflow || '';
        document.body.style.position = originalBodyStyleRef.current.position || '';
        document.body.style.top = originalBodyStyleRef.current.top || '';
        document.body.style.left = originalBodyStyleRef.current.left || '';
        document.body.style.width = originalBodyStyleRef.current.width || '';
        document.body.style.height = originalBodyStyleRef.current.height || '';
      }
      
      // Restore scroll position after body styles are restored
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        // Clear the stored position
        sessionStorage.removeItem('modalScrollPosition');
      });
    };
  }, []);

  // Store the previous URL when modal opens
  // previousUrlRef no longer needed (intercept routing removed)

  // Restore body styles when modal is closing
  useEffect(() => {
    if (isClosing) {
      // Immediately restore body styles to allow scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      
      // Restore from ref if available
      if (originalBodyStyleRef.current) {
        document.body.style.overflow = originalBodyStyleRef.current.overflow || '';
        document.body.style.position = originalBodyStyleRef.current.position || '';
        document.body.style.top = originalBodyStyleRef.current.top || '';
        document.body.style.left = originalBodyStyleRef.current.left || '';
        document.body.style.width = originalBodyStyleRef.current.width || '';
        document.body.style.height = originalBodyStyleRef.current.height || '';
      }
      
      // Restore scroll position
      const savedScroll = sessionStorage.getItem('modalScrollPosition');
      const scrollY = savedScroll ? parseInt(savedScroll, 10) : scrollPositionRef.current;
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [isClosing]);

  // Pathname-driven logic removed (using global provider instead)

  // Close modal and go back
  const closeModal = (e?: React.MouseEvent) => {
    // Prevent event propagation
    if (e) {
      e.stopPropagation();
    }
    
    // Set closing state to hide modal immediately
    setIsClosing(true);
    
    // Get the stored scroll position
    const savedScroll = sessionStorage.getItem('modalScrollPosition');
    const scrollY = savedScroll ? parseInt(savedScroll, 10) : 0;
    
    // Restore body styles first - ensure all styles are reset
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.height = '';
    document.body.style.touchAction = '';
    
    // Also restore from ref if available
    if (originalBodyStyleRef.current) {
      document.body.style.overflow = originalBodyStyleRef.current.overflow || '';
      document.body.style.position = originalBodyStyleRef.current.position || '';
      document.body.style.top = originalBodyStyleRef.current.top || '';
      document.body.style.width = originalBodyStyleRef.current.width || '';
      document.body.style.left = originalBodyStyleRef.current.left || '';
      document.body.style.height = originalBodyStyleRef.current.height || '';
    }
    
    // If a caller-provided onClose exists (client-side modal), just close without routing
    if (onClose) {
      sessionStorage.removeItem('preModalUrl');
      sessionStorage.removeItem('modalScrollPosition');
      onClose();
      // Restore scroll position for feed
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
      return;
    }
    
    // Get target URL
    const targetUrl = '/social';
    
    // Clear stored data
    sessionStorage.removeItem('preModalUrl');
    sessionStorage.removeItem('modalScrollPosition');
    
    router.replace(targetUrl as any);
    
    // Restore scroll position after navigation
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 100);
    });
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close modal if delete dialog is open
    if (isDeleteConfirmOpen || isReportOpen || isShareOpen) {
      return;
    }
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      // Set flag to prevent fetching likes count during action
      setIsLiking(true);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => newIsLiked ? prev + 1 : prev - 1);
      
      // Perform the actual like/unlike action
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });
      }
      
      // Fetch the actual likes count from the database
      await fetchLikesCount();
      
      // Clear flag
      setIsLiking(false);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikesCount((prev) => isLiked ? prev + 1 : prev - 1);
      setIsLiking(false);
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (isSaved) {
        await supabase.from("saved_post").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await fetch('/api/saved-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({ post_id: postId, user_id: user.id }),
        });
      }
      setIsSaved(!isSaved);
      await mutatePost();
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !user) return;

    const originalComment = comment;
    setComment("");
    
    // Determine parent_id based on reply state and @mention
    let parentId: string | null = null;
    let finalContent = originalComment.trim();

    if (replyingToCommentId) {
      const replyingToComment = comments.find(c => c.id === replyingToCommentId);
      if (replyingToComment) {
        const expectedMention = `@${replyingToComment.profile?.username || replyingToComment.profile?.full_name || ''} `;
        if (originalComment.startsWith(expectedMention) || originalComment.startsWith(`@${replyingToComment.profile?.username} `) || originalComment.startsWith(`@${replyingToComment.profile?.full_name} `)) {
          parentId = replyingToCommentId;
        }
      }
    } else {
      // Check if comment starts with @mention - try to find the comment
      const mentionMatch = originalComment.trim().match(/^@(\w+)\s+/);
      if (mentionMatch) {
        const mentionedUsername = mentionMatch[1];
        const mentionedComment = comments.find(
          (c) => 
            c.profile?.username === mentionedUsername || 
            c.profile?.full_name === mentionedUsername
        );
        if (mentionedComment) {
          parentId = mentionedComment.id;
        } else {
          // Mention not found, remove it and make it a top-level comment
          finalContent = originalComment.replace(/^@\w+\s+/, "");
        }
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          content: finalContent,
          parent_id: parentId,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create comment');
      }

      const { data: createdComment } = await response.json();
      const newCommentId = createdComment?.id;

      // Clear reply state
      setReplyingToCommentId(null);

      // Revalidate comments via SWR
      await mutateComments();

      // Scroll to the newly created comment after re-fetch and DOM update
      setTimeout(() => {
        const commentElement = document.querySelector(`[data-comment-id="${newCommentId}"]`);
        if (commentElement) {
          // Scroll the element into view
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          // Highlight the comment briefly with blue color visible on dark background
          const commentDiv = commentElement as HTMLElement;
          commentDiv.style.transition = 'background-color 0.3s ease';
          commentDiv.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'; // blue-500 with 30% opacity
          setTimeout(() => {
            commentDiv.style.backgroundColor = '';
          }, 2000);
    } else {
          // Fallback: scroll to top if comment not found
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }, 300);
    } catch (error) {
      console.error("Error adding comment:", error);
      setComment(originalComment);
      if (parentId) setReplyingToCommentId(parentId);
    }
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingToCommentId(commentId);
    setComment(`@${username} `);
    inputRef.current?.focus();
  };

  const handleShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShareOpen(true);
  };

  const handleFollow = async () => {
    if (!user || !post?.profile?.id || user.id === post.profile.id) return;
    try {
      await socialApi.follows.followUser(user.id, post.profile.id);
      setIsFollowing(true);
      toast({ description: `You're now following ${profile?.full_name || profile?.username || "User"}` });
    } catch (error) {
      console.error("Follow failed:", error);
      toast({
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async () => {
    if (!user || !post?.profile?.id || user.id === post.profile.id) return;
    try {
      await socialApi.follows.unfollowUser(user.id, post.profile.id);
      setIsFollowing(false);
      toast({ description: `You've unfollowed ${profile?.full_name || profile?.username || "User"}` });
    } catch (error) {
      console.error("Unfollow failed:", error);
      toast({
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post) return;
    setDeleteLoading(true);
    try {
      const { error } = await socialApi.posts.deletePost(post.id, user.id);
      if (error) throw error;
      toast({ description: "Post deleted successfully", variant: "default" });
      closeModal();
    } catch (error) {
      toast({ description: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleProfileClick = () => {
    if (profile?.id) {
      router.push(`/profile/${profile.id}` as any);
    }
  };

  const handleReportSubmit = async () => {
    if (!user || !post) return;

    try {
      await supabase.from("report").insert({
        post_id: post.id,
        user_id: user.id,
        content: reportReason,
      });
      toast({
        description: "Post reported successfully",
        variant: "default",
      });
      setIsReportOpen(false);
      setReportReason("");
    } catch (error) {
      console.error("Error reporting post:", error);
      toast({
        description: "Failed to report post",
        variant: "destructive",
      });
    }
  };

  // Flatten and order comments like CommentsBottomSheet - memoized for performance
  const flatComments = useMemo((): FlatComment[] => {
    if (!comments.length) return [];
    
    const commentMap = new Map<string, CommentWithProfile>();
    comments.forEach((c) => commentMap.set(c.id, c));

    const getRootParent = (comment: CommentWithProfile): CommentWithProfile => {
      if (!comment.parent_id) return comment;
      const parent = commentMap.get(comment.parent_id);
      if (!parent) return comment;
      return getRootParent(parent);
    };

    const getDirectParent = (comment: CommentWithProfile): CommentWithProfile | undefined => {
      if (!comment.parent_id) return undefined;
      return commentMap.get(comment.parent_id);
    };

    const rootParents = comments.filter((c) => !c.parent_id);
    const allReplies = comments.filter((c) => c.parent_id);

    const repliesByRootParent = new Map<string, CommentWithProfile[]>();
    allReplies.forEach((reply) => {
      const rootParent = getRootParent(reply);
      if (!repliesByRootParent.has(rootParent.id)) {
        repliesByRootParent.set(rootParent.id, []);
      }
      repliesByRootParent.get(rootParent.id)!.push(reply);
    });

    const sortedRootParents = [...rootParents].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const result: FlatComment[] = [];
    
    sortedRootParents.forEach((rootParent) => {
      result.push({ ...rootParent });
      
      const descendants = repliesByRootParent.get(rootParent.id) || [];
      const sortedDescendants = descendants.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      sortedDescendants.forEach((descendant) => {
        result.push({ 
          ...descendant, 
          isReply: true,
          directParent: getDirectParent(descendant),
        });
      });
    });

    return result;
  }, [comments]);

  const formatTime = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }, []);

  // Handle both media_urls (string[]) and media (object[]) formats - memoized for performance
  const media = useMemo((): { url: string; type: string }[] | undefined => {
    if (post?.media_urls && Array.isArray(post.media_urls)) {
      return post.media_urls.map((url: string) => {
        const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(url);
        return { url, type: isVideo ? "video" : "image" };
      });
    }
    if ((post as any)?.media && Array.isArray((post as any).media)) {
      return (post as any).media as { url: string; type: string }[];
    }
    return undefined;
  }, [post?.media_urls, (post as any)?.media]);
  const profile = post?.profile as PostProfile | undefined;

  // Return null if modal is closing
  if (isClosing) {
    return null;
  }

  // Add timeout for loading state to prevent infinite loader (only if there's an error)
  useEffect(() => {
    if (loading && !post && swrPostError) {
      // If there's an error, stop loading after a short delay to show error state
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [loading, post, swrPostError]);

  if (loading && !post) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show error state if SWR fetch failed
  if (swrPostError && !post) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <p className="text-gray-600 mb-4">Failed to load post. Please try again.</p>
          <Button onClick={closeModal} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  if (!post && !loading) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600">Post not found</p>
          <Button onClick={closeModal} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  // Type guard: post must be defined at this point after all early returns
  if (!post) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-start md:items-center justify-center p-0 md:p-4 pb-16 md:pb-4"
      onClick={handleBackdropClick}
    >
      {/* Loading progress bar at top - shows immediately */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-[60] animate-pulse" />
      )}
      
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          closeModal(e);
        }}
        className="absolute top-2 right-2 md:top-4 md:right-4 z-50 bg-black/70 hover:bg-black/90 rounded-full p-1.5 md:p-2 text-white transition"
      >
        <X className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Modal content */}
      <div
        ref={modalRef}
        className="bg-white md:rounded-lg overflow-hidden flex flex-col lg:flex-row w-full h-[calc(100vh-4rem)] md:h-[95vh] md:max-w-6xl md:max-h-[95vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side - Media - expands when comments collapsed on mobile */}
        <div className={cn(
          "w-full lg:w-[55%] bg-black flex items-center justify-center relative lg:h-full transition-all duration-300",
          // Mobile: 200px when comments expanded, 400px when hidden
          commentsExpanded ? "h-[200px] lg:h-full" : "h-[600px] lg:flex-1"
        )}>
          {media && media.length > 0 ? (
            <>
              {media[currentMediaIndex]?.type?.startsWith("video") ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={media[currentMediaIndex].url}
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    controls={false}
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Mute/Unmute button - left side on mobile, right side on desktop */}
          <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                      }
                    }}
                    className="absolute top-3 left-3 md:left-auto md:right-3 bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition z-10"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
          </button>
        </div>
              ) : (
                <div className="relative w-full h-full min-h-[200px]">
                  <Image
                    src={media[currentMediaIndex].url}
                    alt="Post media"
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, 55vw"
                    unoptimized={false}
                  />
                </div>
              )}

              {/* Media navigation */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentMediaIndex((prev) => Math.max(0, prev - 1))}
                    className={cn(
                      "absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 hover:bg-white transition",
                      currentMediaIndex === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={currentMediaIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMediaIndex((prev) => Math.min(media.length - 1, prev + 1))}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 hover:bg-white transition",
                      currentMediaIndex === media.length - 1 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={currentMediaIndex === media.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentMediaIndex(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition",
                          idx === currentMediaIndex ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-center p-8">
              <p>No media</p>
            </div>
          )}
        </div>

        {/* Right side - Details & Comments (Dark Theme) */}
        <div className={cn(
          "w-full lg:w-[45%] flex flex-col min-h-0 h-full overflow-hidden bg-zinc-900 text-white transition-all duration-300 ease-in-out",
          commentsExpanded ? "flex-1" : "lg:flex-1"
        )}>
          {/* Header - always visible */}
          <div className="flex items-center gap-3 p-3 lg:p-4 border-b border-zinc-700 flex-shrink-0">
            <Avatar className="h-10 w-10 border border-zinc-600">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-zinc-700 text-white">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">
                {profile?.full_name || profile?.username || "User"}
              </p>
              {post.location && (
                <p className="text-xs text-zinc-400">{post.location}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-300">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-white">
                {user &&
                  user.id !== post?.profile?.id &&
                  (isFollowing ? (
                    <DropdownMenuItem onClick={handleUnfollow} className="text-white focus:bg-zinc-700">
                      Unfollow
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleFollow} className="text-white focus:bg-zinc-700">
                      Follow
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="text-white focus:bg-zinc-700"
                >
                  {isSaved ? "Unsave" : "Save"} post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfileClick} className="text-white focus:bg-zinc-700">
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                {user && user.id === post?.profile?.id ? (
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 focus:bg-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    Delete post
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 focus:bg-zinc-700"
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

          {/* Comments section - collapsible on mobile */}
          <div 
            ref={commentsContainerRef}
            className={cn(
              "overflow-y-auto overscroll-contain p-4 transition-all duration-300 ease-in-out min-h-0 lg:flex-1",
              commentsExpanded ? "flex-1" : "max-h-0 p-0 overflow-hidden lg:max-h-none lg:p-4 scrollbar-hide"
            )}
            style={{ 
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Post caption */}
            {post.content && (
              <div className="flex gap-3 mb-4 pb-4 border-b border-zinc-700">
                <Avatar className="h-8 w-8 flex-shrink-0 border border-zinc-600">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-zinc-700 text-white">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-zinc-100">
                    <span className="font-semibold mr-2 text-white">
                      {profile?.username || profile?.full_name || "User"}
                    </span>
                    {post.content}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatTime(post.created_at)}
                  </p>
                </div>
            </div>
          )}
          
            {/* Comments list */}
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p className="font-semibold">No comments yet</p>
                <p className="text-sm">Start the conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flatComments.map((c) => (
                  <div key={c.id} data-comment-id={c.id} className={cn("flex gap-3 p-2 -mx-2 transition-colors", c.isReply && "pl-6")}>
                    <Avatar 
                      className="h-8 w-8 flex-shrink-0 border border-zinc-600 cursor-pointer"
                      onClick={() => router.push(`/profile/${c.profile?.id}` as any)}
                    >
                      <AvatarImage src={c.profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-zinc-700 text-white">
                        {c.profile?.full_name?.charAt(0) || c.profile?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.isReply && c.directParent && (
                          <span className="text-zinc-500 text-xs">
                            Replying to{" "}
                            <span className="text-blue-400">
                              @{c.directParent.profile?.username || c.directParent.profile?.full_name}
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-100">
                        <span 
                          className="font-semibold mr-2 text-white cursor-pointer hover:underline"
                          onClick={() => router.push(`/profile/${c.profile?.id}` as any)}
                        >
                          {c.profile?.username || c.profile?.full_name || "User"}
                        </span>
                        {c.content}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500">
                          {formatTime(c.created_at)}
                        </span>
                        <button
                          className="text-xs text-zinc-400 hover:text-zinc-300 font-medium"
                          onClick={() => handleReplyClick(c.id, c.profile?.username || c.profile?.full_name || "User")}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile expand/collapse toggle - above actions */}
          <button
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className="lg:hidden flex items-center justify-center gap-2 py-2 border-t border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition flex-shrink-0"
          >
            {commentsExpanded ? (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="text-sm">Hide Comments</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="text-sm">Show Comments ({comments.length})</span>
              </>
            )}
          </button>

          {/* Actions - always visible */}
          <div className="border-t border-zinc-700 p-3 flex-shrink-0">
            <div className="flex justify-between mb-2">
              <div className="flex gap-4">
                <button onClick={handleLike} className="hover:opacity-70 transition text-white">
                  <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
                </button>
                <button onClick={() => { setCommentsExpanded(true); inputRef.current?.focus(); }} className="hover:opacity-70 transition text-white">
                  <MessageCircle className="h-6 w-6" />
                </button>
                <button onClick={handleShare} className="hover:opacity-70 transition text-white">
                  <Send className="h-6 w-6" />
                </button>
              </div>
              <button onClick={handleSave} className="hover:opacity-70 transition text-white">
                <Bookmark className={cn("h-6 w-6", isSaved && "fill-white")} />
              </button>
            </div>
            <p className="font-semibold text-sm mb-1 text-white">{likesCount} likes</p>
            <p className="text-xs text-zinc-500">{formatTime(post.created_at)}</p>
          </div>

          {/* Comment input - always visible */}
          {isAuthenticated && (
            <div className="border-t border-zinc-700 flex-shrink-0">
              {/* Reply indicator */}
              {replyingToCommentId && (
                <div className="px-3 py-2 bg-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Replying to{" "}
                    <span className="text-blue-400">
                      @{comments.find(c => c.id === replyingToCommentId)?.profile?.username || 
                        comments.find(c => c.id === replyingToCommentId)?.profile?.full_name}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setReplyingToCommentId(null);
                      setComment("");
                    }}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="p-3 flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={replyingToCommentId ? "Write a reply..." : "Add a comment..."}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    // Clear reply state if @mention is removed
                    if (replyingToCommentId && !e.target.value.startsWith("@")) {
                      setReplyingToCommentId(null);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 text-sm outline-none bg-transparent text-white placeholder-zinc-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className={cn(
                    "text-blue-400 font-semibold text-sm",
                    !comment.trim() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={isShareOpen}
        onClose={() => setShareOpen(false)}
        postId={postId}
      />

      {/* Report Modal */}
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

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            // Close dialog when clicking backdrop
            setIsDeleteConfirmOpen(false);
          }}
        >
          <div 
            className="bg-zinc-800 rounded-lg p-6 max-w-md w-full text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Delete Post</h3>
            <p className="text-zinc-300 mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteConfirmOpen(false);
                }}
                className="border-zinc-600 text-black hover:bg-zinc-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost();
                }}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

