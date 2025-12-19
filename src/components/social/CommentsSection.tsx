"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  socialApi,
  CommentWithProfile,
  PostProfile,
} from "@/integrations/supabase/modules/social";
import { useAuth } from "@/contexts/AuthContext";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Smile, Send, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow, formatDistanceStrict } from "date-fns";
import Image from "next/image";

interface CommentsSectionProps {
  postId: string;
}

type RawCommentFromSupabase = Omit<CommentWithProfile, "profile"> & {
  profile: PostProfile | { error: boolean } | null;
  parent_id?: string | null;
};

type LocalCommentWithProfile = Omit<CommentWithProfile, "profile"> & {
  profile: PostProfile;
  parent_id?: string | null;
};

interface FlatComment extends LocalCommentWithProfile {
  isReply?: boolean;
  directParent?: LocalCommentWithProfile;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<LocalCommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const [commentsLimit, setCommentsLimit] = useState(10);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAndSetComments = async () => {
    setLoading(true);
    try {
      const { data: rawData, count } =
        await socialApi.comments.getThreadedByPostId(
          postId,
          commentsLimit,
          0 // Always fetch from the beginning to get the latest
        );

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

      setComments(validComments); // Replace the list, don't append
      setTotalCommentsCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetComments();
  }, [postId, commentsLimit]);

  const handleAddComment = async () => {
    if (!comment.trim() || !user) return;

    // Determine parent_id based on reply state and @mention
    let parentId: string | null = null;
    const originalComment = comment;

    if (replyingToCommentId) {
      const replyingToComment = comments.find(c => c.id === replyingToCommentId);
      if (replyingToComment) {
        const expectedMention = `@${replyingToComment.profile?.username || replyingToComment.profile?.full_name || ''} `;
        if (comment.startsWith(expectedMention) || comment.startsWith(`@${replyingToComment.profile?.username} `) || comment.startsWith(`@${replyingToComment.profile?.full_name} `)) {
          parentId = replyingToCommentId;
        }
      }
    }

    setComment("");
    setReplyingToCommentId(null);

    const optimisticComment: LocalCommentWithProfile = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      content: originalComment,
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

    try {
      const { error } = await socialApi.comments.insert({
        user_id: user.id,
        post_id: postId,
        content: originalComment,
        parent_id: parentId,
      });

      if (error) throw error;

      await fetchAndSetComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
      // Revert optimistic update on failure
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setTotalCommentsCount((prev) => prev - 1);
      setComment(originalComment); // Restore user's input
    }
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingToCommentId(commentId);
    setComment(`@${username} `);
    inputRef.current?.focus();
  };

  const handleShowMoreComments = () => {
    setCommentsLimit((prevLimit) => prevLimit + 10);
  };

  // Flatten and order comments like CommentsBottomSheet
  const getFlatComments = (): FlatComment[] => {
    const commentMap = new Map<string, LocalCommentWithProfile>();
    comments.forEach((c) => commentMap.set(c.id, c));

    const getRootParent = (comment: LocalCommentWithProfile): LocalCommentWithProfile => {
      if (!comment.parent_id) return comment;
      const parent = commentMap.get(comment.parent_id);
      if (!parent) return comment;
      return getRootParent(parent);
    };

    const getDirectParent = (comment: LocalCommentWithProfile): LocalCommentWithProfile | undefined => {
      if (!comment.parent_id) return undefined;
      return commentMap.get(comment.parent_id);
    };

    const rootParents = comments.filter((c) => !c.parent_id);
    const allReplies = comments.filter((c) => c.parent_id);

    const repliesByRootParent = new Map<string, LocalCommentWithProfile[]>();
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

    const flatComments: FlatComment[] = [];
    
    sortedRootParents.forEach((rootParent) => {
      flatComments.push({ ...rootParent });
      
      const descendants = repliesByRootParent.get(rootParent.id) || [];
      const sortedDescendants = descendants.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      sortedDescendants.forEach((descendant) => {
        flatComments.push({ 
          ...descendant, 
          isReply: true,
          directParent: getDirectParent(descendant),
        });
      });
    });

    return flatComments;
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
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
      if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
      return `${Math.floor(diffInSeconds / 31536000)}y`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
      <h4 className="font-semibold mb-2">Comments</h4>
      
      {/* Reply indicator */}
      {replyingToCommentId && (
        <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Replying to{" "}
            <span className="text-blue-500 font-medium">
              @{comments.find(c => c.id === replyingToCommentId)?.profile?.username || 
                comments.find(c => c.id === replyingToCommentId)?.profile?.full_name}
            </span>
          </span>
          <button
            onClick={() => {
              setReplyingToCommentId(null);
              setComment("");
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="mb-2 flex gap-2 items-center">
        <CommentInput
          value={comment}
          onChange={(val) => {
            setComment(val);
            // Clear reply state if @mention is removed
            if (replyingToCommentId && !val.startsWith("@")) {
              setReplyingToCommentId(null);
            }
          }}
          onSend={handleAddComment}
          inputRef={inputRef}
          placeholder={replyingToCommentId ? "Write a reply..." : "Add a comment..."}
        />
      </div>
      
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {getFlatComments().map((c) => (
            <FlatCommentItem
              key={c.id}
              comment={c}
              user={user}
              formatTime={formatTime}
              router={router}
              onReplyClick={handleReplyClick}
              refreshComments={fetchAndSetComments}
              allComments={comments}
            />
          ))}
        </div>
      )}
      
      {!loading && comments.length < totalCommentsCount && (
        <button
          onClick={handleShowMoreComments}
          className="text-blue-500 hover:underline mt-2 text-sm"
        >
          Show more comments
        </button>
      )}
      {!loading && comments.length === 0 && totalCommentsCount === 0 && (
        <div className="text-gray-500">No comments yet.</div>
      )}
    </div>
  );
}

function FlatCommentItem({
  comment,
  user,
  formatTime,
  router,
  onReplyClick,
  refreshComments,
  allComments,
}: {
  comment: FlatComment;
  user: any;
  formatTime: (dateString: string) => string;
  router: ReturnType<typeof useRouter>;
  onReplyClick: (commentId: string, username: string) => void;
  refreshComments: () => void;
  allComments: LocalCommentWithProfile[];
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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
        (c) => c.profile?.username === username || c.profile?.full_name === username
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
        parts.push(
          <span key={startIndex} className="text-blue-500">
            {mention}
          </span>
        );
      }
      lastIndex = endIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className={`flex gap-3 ${comment.isReply ? 'pl-6' : ''}`}>
      <div 
        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border border-gray-200"
        onClick={() => router.push(`/profile/${comment.profile.id}` as any)}
      >
        <Image
          src={
            comment.profile?.avatar_url ||
            `https://avatars.dicebear.com/api/identicon/${comment.user_id}.svg`
          }
          alt={comment.profile?.full_name || ""}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        {/* Reply indicator */}
        {comment.isReply && comment.directParent && (
          <span className="text-gray-500 text-xs">
            Replying to{" "}
            <span className="text-blue-500">
              @{comment.directParent.profile?.username || comment.directParent.profile?.full_name}
            </span>
          </span>
        )}
        
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-medium cursor-pointer hover:underline"
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
        </div>
        
        {editingComment === comment.id ? (
          <div className="mt-1">
            <input
              type="text"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleEdit}
                className="text-xs text-blue-500"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent("");
                }}
                className="text-xs text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm">{renderContentWithMentions(comment.content)}</p>
        )}
        
        <div className="flex items-center gap-3 mt-1">
          <button
            className="text-xs text-gray-500 hover:text-blue-500"
            onClick={() => onReplyClick(comment.id, comment.profile?.username || comment.profile?.full_name || "User")}
          >
            Reply
          </button>
          
          {user && user.id === comment.user_id && (
            <div className="relative comment-menu">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === comment.id ? null : comment.id);
                }}
              >
                <MoreVertical size={14} />
              </button>
              {openMenuId === comment.id && (
                <div className="absolute left-0 top-5 w-28 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                      setOpenMenuId(null);
                    }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                      setOpenMenuId(null);
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentInput({
  value,
  onChange,
  onSend,
  inputRef: externalInputRef,
  placeholder = "Add a comment...",
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  placeholder?: string;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRefToUse = externalInputRef || internalInputRef;

  const handleEmojiSelect = (emoji: { native?: string }) => {
    onChange(value + (emoji.native || ""));
    setShowEmoji(false);
    if (inputRefToUse.current) {
      inputRefToUse.current.focus();
    }
  };

  return (
    <div className="w-full px-0 mb-4">
      <div className="relative flex items-center bg-white border rounded-full px-2 sm:px-3 py-2 shadow-sm min-h-[40px]">
        <button
          type="button"
          className="mr-1 sm:mr-2 text-gray-500 hover:text-sm-red p-2"
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
            />
          </div>
        )}
        <input
          type="text"
          ref={inputRefToUse}
          className="flex-1 w-full outline-none border-none bg-transparent placeholder-gray-400 text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
        />
        <button
          type="button"
          className={`ml-1 sm:ml-2 p-2 ${
            value.trim()
              ? "text-sm-red hover:text-red-700 font-bold"
              : "text-gray-400 cursor-default"
          }`}
          onClick={onSend}
          disabled={!value.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default CommentsSection;
