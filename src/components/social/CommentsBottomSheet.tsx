"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  socialApi,
  CommentWithProfile,
  PostProfile,
} from "@/integrations/supabase/modules/social";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Smile, Send, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentsBottomSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postAuthor?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  postContent?: string;
  postMedia?: string[];
}

type RawCommentFromSupabase = Omit<CommentWithProfile, "profile"> & {
  profile: PostProfile | { error: boolean } | null;
  parent_id?: string | null;
};

type LocalCommentWithProfile = Omit<CommentWithProfile, "profile"> & {
  profile: PostProfile;
  parent_id?: string | null;
};

export function CommentsBottomSheet({
  postId,
  open,
  onOpenChange,
  postAuthor,
  postContent,
  postMedia,
}: CommentsBottomSheetProps) {
  const [comments, setComments] = useState<LocalCommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const [commentsLimit, setCommentsLimit] = useState(20);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop/mobile
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const fetchAndSetComments = async () => {
    setLoading(true);
    try {
      // Get access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Use API route with cache-busting for fresh data
      const response = await fetch(
        `/api/comments?postId=${postId}&limit=${commentsLimit}&orderBy=desc&_t=${Date.now()}`,
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

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const { data: rawData, count } = await response.json();

      const rawComments: RawCommentFromSupabase[] = (rawData ||
        []) as RawCommentFromSupabase[];

      const validComments = rawComments.filter(
        (c): c is LocalCommentWithProfile =>
          c.profile !== null &&
          typeof c.profile === "object" &&
          !("error" in c.profile) &&
          "id" in c.profile &&
          "username" in c.profile
      );

      setComments(validComments);
      setTotalCommentsCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAndSetComments();
      // Focus input when drawer opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [postId, commentsLimit, open]);

  const handleAddComment = async () => {
    if (!comment.trim() || !user) return;

    const originalComment = comment;
    setComment("");
    
    // Determine if it's a reply based on replyingToCommentId
    let parentId: string | null = null;
    let finalContent = originalComment;
    
    if (replyingToCommentId) {
      // It's a reply - use the tracked comment ID
      parentId = replyingToCommentId;
      // Keep the @mention in the content
    } else {
      // Check if comment starts with @mention - try to find the comment
      const mentionMatch = originalComment.trim().match(/^@(\w+)\s+/);
      if (mentionMatch) {
        const mentionedUsername = mentionMatch[1];
        const mentionedComment = comments.find(
          (c) => 
            c.profile.username === mentionedUsername || 
            c.profile.full_name === mentionedUsername
        );
        if (mentionedComment) {
          parentId = mentionedComment.id;
          // Keep the @mention in the content
        } else {
          // Mention not found, remove it and make it a top-level comment
          finalContent = originalComment.replace(/^@\w+\s+/, "");
        }
      }
      // If no @mention, it's already a top-level comment (parentId stays null)
    }

    const optimisticComment: LocalCommentWithProfile = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      content: finalContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: parentId,
      profile: {
        id: user.id,
        full_name: user.user_metadata?.full_name || "User",
        username: user.user_metadata?.username || "user",
        avatar_url: user.user_metadata?.avatar_url || "",
      },
    };

    setComments((prevComments) => [optimisticComment, ...prevComments]);
    setTotalCommentsCount((prev) => prev + 1);
    setReplyingToCommentId(null); // Clear reply state

    try {
      // Get full session for authentication (includes both access_token and refresh_token)
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const refreshToken = session?.refresh_token;

      // Use API route to create comment
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          ...(refreshToken && { 'X-Refresh-Token': refreshToken }),
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
      const newCommentId = createdComment?.id || optimisticComment.id;

      // Wait a bit for database to update, then re-fetch with fresh data
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchAndSetComments();

      // Scroll to the newly created comment after re-fetch and DOM update
      setTimeout(() => {
        const commentElement = document.querySelector(`[data-comment-id="${newCommentId}"]`);
        if (commentElement) {
          // Scroll the element into view
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          // Highlight the comment briefly
          const commentDiv = commentElement as HTMLElement;
          commentDiv.style.transition = 'background-color 0.3s ease';
          commentDiv.style.backgroundColor = '#eff6ff'; // bg-blue-50
          setTimeout(() => {
            commentDiv.style.backgroundColor = '';
          }, 2000);
        } else {
          // Fallback: scroll to top if comment not found (might be still loading)
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }, 300);
    } catch (error) {
      console.error("Failed to post comment:", error);
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setTotalCommentsCount((prev) => prev - 1);
      setComment(originalComment);
      if (parentId) setReplyingToCommentId(parentId);
    }
  };

  const handleShowMoreComments = () => {
    setCommentsLimit((prevLimit) => prevLimit + 20);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
      if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 604800)}w`;
      if (diffInSeconds < 31536000)
        return `${Math.floor(diffInSeconds / 2592000)}mo`;
      return `${Math.floor(diffInSeconds / 31536000)}y`;
    } catch {
      return dateString;
    }
  };

  const handleEmojiSelect = (emoji: { native?: string }) => {
    setComment((prev) => prev + (emoji.native || ""));
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // Shared content component
  const commentsContent = (
    <>
      {/* Header - Instagram style */}
      <div className="border-b px-4 py-3 flex flex-row items-center justify-between bg-white">
        <h2 className="text-base font-semibold">Comments</h2>
        {isDesktop ? (
          <SheetClose className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </SheetClose>
        ) : (
          <DrawerClose className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </DrawerClose>
        )}
      </div>

      {/* Post Preview - Instagram style */}
      {postAuthor && (
        <div className="border-b px-4 py-3 bg-gray-50">
          <div className="flex items-start gap-3">
            <Image
              src={
                postAuthor.avatar_url ||
                `https://avatars.dicebear.com/api/identicon/${postAuthor.id}.svg`
              }
              alt={postAuthor.full_name || postAuthor.username}
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {postAuthor.full_name || postAuthor.username}
                </span>
              </div>
              {postContent && (
                <p className="text-sm text-gray-900 line-clamp-2">
                  {postContent}
                </p>
              )}
              {postMedia && postMedia.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {postMedia.length} {postMedia.length === 1 ? "photo" : "photos"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments List - Scrollable */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 px-4 py-2"
      >
        {loading && comments.length === 0 ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2">
            {(() => {
              // Build a map to quickly find parent comments
              const commentMap = new Map<string, LocalCommentWithProfile>();
              comments.forEach((c) => commentMap.set(c.id, c));

              // Helper function to get the root parent (top-level comment)
              const getRootParent = (comment: LocalCommentWithProfile): LocalCommentWithProfile => {
                if (!comment.parent_id) return comment;
                const parent = commentMap.get(comment.parent_id);
                if (!parent) return comment;
                return getRootParent(parent);
              };

              // Helper function to get direct parent
              const getDirectParent = (comment: LocalCommentWithProfile): LocalCommentWithProfile | undefined => {
                if (!comment.parent_id) return undefined;
                return commentMap.get(comment.parent_id);
              };

              // Separate all comments into root parents and their descendants
              const rootParents = comments.filter((c) => !c.parent_id);
              const allReplies = comments.filter((c) => c.parent_id);

              // Group replies by their root parent
              const repliesByRootParent = new Map<string, LocalCommentWithProfile[]>();
              allReplies.forEach((reply) => {
                const rootParent = getRootParent(reply);
                if (!repliesByRootParent.has(rootParent.id)) {
                  repliesByRootParent.set(rootParent.id, []);
                }
                repliesByRootParent.get(rootParent.id)!.push(reply);
              });

              // Sort root parents chronologically (newest first)
              const sortedRootParents = [...rootParents].sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
              });

              // Create flat list: root parent followed by all its descendants in chronological order
              const flatComments: (LocalCommentWithProfile & { 
                isReply?: boolean; 
                directParent?: LocalCommentWithProfile;
                rootParentId?: string;
              })[] = [];
              
              sortedRootParents.forEach((rootParent) => {
                // Add root parent
                flatComments.push({ 
                  ...rootParent, 
                  rootParentId: rootParent.id 
                });
                
                // Get all replies to this root parent (including nested replies)
                const allDescendants = repliesByRootParent.get(rootParent.id) || [];
                
                // Sort all descendants chronologically (newest first)
                const sortedDescendants = allDescendants.sort((a, b) => {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateB - dateA;
                });
                
                // Add each descendant with its direct parent info
                sortedDescendants.forEach((descendant) => {
                  const directParent = getDirectParent(descendant);
                  flatComments.push({ 
                    ...descendant, 
                    isReply: true,
                    directParent,
                    rootParentId: rootParent.id
                  });
                });
              });

              return flatComments.map((comment) => (
                <div key={comment.id} data-comment-id={comment.id}>
                  <CommentItem
                    comment={comment}
                    allComments={comments}
                    postId={postId}
                    formatTime={formatTime}
                    router={router}
                    refreshComments={fetchAndSetComments}
                    user={user}
                    isReply={comment.isReply}
                    directParent={comment.directParent}
                    onReplyClick={(commentId, username) => {
                      setReplyingToCommentId(commentId);
                      setComment(`@${username} `);
                      inputRef.current?.focus();
                    }}
                  />
                </div>
              ));
            })()}
            {!loading && comments.length < totalCommentsCount && (
              <button
                onClick={handleShowMoreComments}
                className="text-blue-500 hover:underline text-sm mt-4 mb-2 w-full text-center"
              >
                View more comments
              </button>
            )}
            {!loading && comments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No comments yet.</p>
                <p className="text-xs mt-1">Be the first to comment!</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Fixed Input at Bottom - Instagram style */}
      <div className="border-t bg-white px-4 py-3">
        {replyingToCommentId && (
          <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
            <span>Replying to a comment</span>
            <button
              type="button"
              onClick={() => {
                setComment("");
                setReplyingToCommentId(null);
                inputRef.current?.focus();
              }}
              className="text-blue-500 hover:text-blue-600"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 p-1"
            onClick={() => setShowEmoji((v) => !v)}
          >
            <Smile size={20} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
              />
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 outline-none border-none bg-transparent placeholder-gray-400 text-sm py-1"
            placeholder={replyingToCommentId ? "Add a reply..." : "Add a comment..."}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              // If user erases the @mention, clear the reply state
              const value = e.target.value.trim();
              if (replyingToCommentId && !value.match(/^@\w+/)) {
                setReplyingToCommentId(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && comment.trim()) {
                handleAddComment();
              }
              if (e.key === "Escape") {
                setComment("");
                setReplyingToCommentId(null);
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!comment.trim()}
            className={`text-sm font-semibold ${
              comment.trim()
                ? "text-blue-500 hover:text-blue-600"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </>
  );

  // Render based on screen size
  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] md:w-[500px] flex flex-col p-0 h-full [&>button]:hidden"
        >
          {commentsContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-h-[85vh] flex flex-col p-0">
        {commentsContent}
      </DrawerContent>
    </Drawer>
  );
}

function CommentItem({
  comment,
  allComments,
  postId,
  formatTime,
  router,
  refreshComments,
  user,
  isReply = false,
  directParent,
  onReplyClick,
}: {
  comment: LocalCommentWithProfile;
  allComments: LocalCommentWithProfile[];
  postId: string;
  formatTime: (date: string) => string;
  router: ReturnType<typeof useRouter>;
  refreshComments: () => void;
  user: any;
  isReply?: boolean;
  directParent?: LocalCommentWithProfile;
  onReplyClick: (commentId: string, username: string) => void;
}) {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const replies = allComments.filter((c) => c.parent_id === comment.id);


  const handleEdit = async () => {
    if (!editContent.trim() || !user) return;
    await socialApi.comments.updateIfAuthor(comment.id, user.id, {
      content: editContent,
      updated_at: new Date().toISOString(),
    });
    setEditingComment(null);
    setEditContent("");
    await refreshComments();
  };

  const handleDelete = async () => {
    if (!user) return;
    await socialApi.comments.deleteIfAuthor(comment.id, user.id);
    await refreshComments();
  };

  const renderContentWithMentions = (content: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /@([a-zA-Z0-9_]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const mention = match[0];
      const username = match[1];
      const startIndex = match.index;
      const endIndex = regex.lastIndex;

      if (startIndex > lastIndex) {
        parts.push(content.substring(lastIndex, startIndex));
      }

      const mentionedUser = allComments.find(
        (c) => c.profile.username === username || c.profile.full_name === username
      )?.profile;

      if (mentionedUser) {
        parts.push(
          <span
            key={startIndex}
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${mentionedUser.id}` as any);
            }}
          >
            {mention}
          </span>
        );
      } else {
        parts.push(mention);
      }
      lastIndex = endIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className={`py-3 border-b border-gray-100 last:border-0 ${isReply ? 'pl-4' : ''}`}>
      <div className="flex items-start gap-3">
        <Image
          src={
            comment.profile?.avatar_url ||
            `https://avatars.dicebear.com/api/identicon/${comment.user_id}.svg`
          }
          alt={comment.profile?.full_name || ""}
          width={32}
          height={32}
          className="rounded-full flex-shrink-0 cursor-pointer"
          onClick={() => router.push(`/profile/${comment.profile.id}` as any)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isReply && directParent && (
              <span className="text-gray-500 text-xs">
                Replying to{" "}
                <span
                  className="text-blue-500 cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${directParent.profile.id}` as any)}
                >
                  @{directParent.profile?.username || directParent.profile?.full_name || "user"}
                </span>
              </span>
            )}
            <span
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={() => router.push(`/profile/${comment.profile.id}` as any)}
            >
              {comment.profile?.full_name || comment.profile?.username || "User"}
            </span>
            <span className="text-gray-500 text-xs">
              {formatTime(
                comment.updated_at !== comment.created_at
                  ? comment.updated_at
                  : comment.created_at
              )}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-gray-400 text-xs italic">(edited)</span>
            )}
            {user && user.id === comment.user_id && (
              <div className="relative ml-auto">
                <button
                  className="text-gray-500 hover:text-gray-700 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === comment.id ? null : comment.id);
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                {openMenuId === comment.id && (
                  <div className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                        setOpenMenuId(null);
                      }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                        setOpenMenuId(null);
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {editingComment === comment.id ? (
            <div className="mt-1">
              <input
                type="text"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                  if (e.key === "Escape") {
                    setEditingComment(null);
                    setEditContent("");
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button
                  className="text-xs text-blue-500"
                  onClick={handleEdit}
                >
                  Save
                </button>
                <button
                  className="text-xs text-gray-500"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-900">
              {renderContentWithMentions(comment.content)}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                const username = comment.profile?.username || comment.profile?.full_name || "user";
                onReplyClick(comment.id, username);
              }}
            >
              Reply
            </button>
            {replies.length > 0 && !isReply && (
              <span className="text-xs text-gray-500">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

