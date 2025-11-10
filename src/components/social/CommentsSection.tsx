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

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<LocalCommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const [commentsLimit, setCommentsLimit] = useState(10);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);

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

    const originalComment = comment;
    setComment("");

    const optimisticComment: LocalCommentWithProfile = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      content: originalComment,
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

    setComments((prevComments) => [optimisticComment, ...prevComments]);
    setTotalCommentsCount((prev) => prev + 1);

    try {
      const { error } = await socialApi.comments.insert({
        user_id: user.id,
        post_id: postId,
        content: originalComment,
        parent_id: null,
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

  const handleShowMoreComments = () => {
    setCommentsLimit((prevLimit) => prevLimit + 10);
  };

  return (
    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
      <h4 className="font-semibold mb-2">Comments</h4>
      <div className="mb-2 flex gap-2 items-center">
        <CommentInput
          value={comment}
          onChange={setComment}
          onSend={handleAddComment}
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
        <CommentList
          comments={comments}
          allComments={comments}
          postId={postId}
          refreshComments={fetchAndSetComments}
          router={router}
          setComments={setComments}
          setTotalCommentsCount={setTotalCommentsCount}
        />
      )}
      {!loading && comments.length < totalCommentsCount && (
        <button
          onClick={handleShowMoreComments}
          className="text-blue-500 hover:underline mt-2 text-sm"
        >
          Show more comments
          {/* ({totalCommentsCount - comments.length} remaining) */}
        </button>
      )}
      {!loading && comments.length === 0 && totalCommentsCount === 0 && (
        <div className="text-gray-500">No comments yet.</div>
      )}
    </div>
  );
}

function CommentList({
  comments,
  allComments,
  postId,
  refreshComments,
  router,
  setComments,
  setTotalCommentsCount,
  parentId = null,
}: {
  comments: LocalCommentWithProfile[];
  allComments: LocalCommentWithProfile[];
  postId: string;
  refreshComments: () => void;
  router: ReturnType<typeof useRouter>;
  setComments: React.Dispatch<React.SetStateAction<LocalCommentWithProfile[]>>;
  setTotalCommentsCount: React.Dispatch<React.SetStateAction<number>>;
  parentId?: string | null;
}) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [repliesShownMap, setRepliesShownMap] = useState<{
    [key: string]: number;
  }>({});
  const DEFAULT_REPLIES_SHOWN = 0; // Show 0 replies by default

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "just now";
      }

      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m`;
      }

      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
      }

      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d`;
      }

      if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}w`;
      }

      if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo`;
      }

      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}y`;
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".comment-menu")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleReply = async (parentId: string) => {
    if (!reply.trim() || !user) return;

    const originalReply = reply;
    setReply("");
    setReplyingTo(null);

    const optimisticReply: LocalCommentWithProfile = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      content: originalReply,
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

    setComments((prev) => [optimisticReply, ...prev]);
    setTotalCommentsCount((prev) => prev + 1);

    try {
      const { error } = await socialApi.comments.insert({
        user_id: user.id,
        post_id: postId,
        content: originalReply,
        parent_id: parentId,
      });

      if (error) throw error;
      await refreshComments();
    } catch (error) {
      console.error("Failed to post reply:", error);
      // Revert optimistic update on failure
      setComments((prev) => prev.filter((c) => c.id !== optimisticReply.id));
      setTotalCommentsCount((prev) => prev - 1);
      setReply(originalReply);
      setReplyingTo(parentId); // Re-open reply input
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || !user) return;
    await socialApi.comments.updateIfAuthor(commentId, user.id, {
      content: editContent,
      updated_at: new Date().toISOString(),
    });
    setEditingComment(null);
    setEditContent("");
    await refreshComments();
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    await socialApi.comments.deleteIfAuthor(commentId, user.id);
    await refreshComments();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleMenu = (commentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === commentId ? null : commentId);
  };

  const getReplies = (commentId: string) => {
    return allComments.filter((c) => c.parent_id === commentId);
  };

  const displayComments = comments.filter(
    (comment) => comment.parent_id === parentId
  );

  // if (!displayComments.length)
  //   return <div className="text-gray-500">No comments yet.</div>;

  return (
    <ul>
      {displayComments.map((comment) => {
        const replies = getReplies(comment.id);
        const shownCount = repliesShownMap[comment.id] ?? DEFAULT_REPLIES_SHOWN;
        const shownReplies = replies.slice(0, shownCount);
        const hasMoreReplies = replies.length > shownCount;
        return (
          <li key={comment.id} className="mb-2">
            <CommentItem
              comment={comment}
              user={user}
              formatTime={formatTime}
              setReplyingTo={setReplyingTo}
              setReply={setReply}
              toggleMenu={toggleMenu}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              setEditingComment={setEditingComment}
              setEditContent={setEditContent}
              handleDelete={handleDelete}
              router={router}
              allUsers={allComments.map((c) => c.profile)}
              editingComment={editingComment}
              editContent={editContent}
              handleEdit={handleEdit}
            />
            {replyingTo === comment.id && (
              <div className="ml-8 flex gap-2 mt-1">
                <CommentInput
                  value={reply}
                  onChange={setReply}
                  onSend={() => handleReply(comment.id)}
                />
                <button
                  onClick={() => {
                    setReply("");
                    setReplyingTo(null);
                  }}
                  className="text-xs text-gray-500 mb-3"
                >
                  Cancel
                </button>
              </div>
            )}
            {replies.length > 0 && shownCount === 0 && (
              <button
                className="text-xs text-blue-500 mt-1 ml-8"
                onClick={() =>
                  setRepliesShownMap((prev) => ({
                    ...prev,
                    [comment.id]: 2,
                  }))
                }
              >
                Show {replies.length}{" "}
                {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
            {shownCount > 0 && (
              <div className="ml-5">
                <CommentList
                  comments={shownReplies}
                  allComments={allComments}
                  postId={postId}
                  refreshComments={refreshComments}
                  router={router}
                  setComments={setComments}
                  setTotalCommentsCount={setTotalCommentsCount}
                  parentId={comment.id}
                />
                {hasMoreReplies && (
                  <button
                    className="text-xs text-blue-500 mt-1"
                    onClick={() =>
                      setRepliesShownMap((prev) => ({
                        ...prev,
                        [comment.id]: shownCount + 2,
                      }))
                    }
                  >
                    Show more replies
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CommentItem({
  comment,
  user,
  formatTime,
  setReplyingTo,
  setReply,
  toggleMenu,
  openMenuId,
  setOpenMenuId,
  setEditingComment,
  setEditContent,
  handleDelete,
  router,
  allUsers,
  editingComment,
  editContent,
  handleEdit,
}: {
  comment: any;
  user: any;
  formatTime: any;
  setReplyingTo: any;
  setReply: any;
  toggleMenu: any;
  openMenuId: any;
  setOpenMenuId: any;
  setEditingComment: any;
  setEditContent: any;
  handleDelete: any;
  router: any;
  allUsers: PostProfile[];
  editingComment: any;
  editContent: any;
  handleEdit: any;
}) {
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

      const mentionedUser = allUsers.find(
        (u: any) => u.username === username || u.full_name === username
      );

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
    <>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${comment.profile.id}` as any);
          }}
        >
          <Image
            src={
              comment.profile?.avatar_url ||
              "https://avatars.dicebear.com/api/identicon/" +
                comment.user_id +
                ".svg"
            }
            alt={comment.profile?.full_name || ""}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="font-medium">
            {comment.profile?.full_name || comment.profile?.username || "User"}
          </span>
        </div>
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
        <button
          className="ml-2 text-xs text-blue-500"
          onClick={() => {
            setReplyingTo(comment.id);
            setReply(
              `@${
                comment.profile?.username ||
                comment.profile?.full_name ||
                "user"
              } `
            );
          }}
        >
          Reply
        </button>
        {user && user.id === comment.user_id && (
          <div className="relative group comment-menu">
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={(e) => toggleMenu(comment.id, e)}
            >
              <MoreVertical size={16} />
            </button>
            {openMenuId === comment.id && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
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
                    handleDelete(comment.id);
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
        <div className="ml-8 mt-1">
          <CommentInput
            value={editContent}
            onChange={setEditContent}
            onSend={() => handleEdit(comment.id)}
          />
          <button
            onClick={() => {
              setEditingComment(null);
              setEditContent("");
            }}
            className="text-xs text-gray-500 mt-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="ml-8">
          {renderContentWithMentions(comment.content)}
          {/* {comment.updated_at !== comment.created_at && (
            <span className="text-gray-400 text-xs italic ml-2">(edited)</span>
          )} */}
        </div>
      )}
    </>
  );
}

export function CommentInput({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: { native?: string }) => {
    onChange(value + (emoji.native || ""));
    setShowEmoji(false);
    if (inputRef.current) {
      inputRef.current.focus();
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
          ref={inputRef}
          className="flex-1 w-full outline-none border-none bg-transparent placeholder-gray-400 text-sm"
          placeholder="Add a comment..."
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
          {/* <Send size={20} /> */}
          Send
        </button>
      </div>
    </div>
  );
}

export default CommentsSection;
