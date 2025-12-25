 "use client";
import { PostWithProfile } from "@/integrations/supabase/modules/social";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Post from "@/components/social/Post";
import PostCardForHomePage from "./PostCardForHomePage";

interface PostCardWrapperProps {
  post: PostWithProfile;
  type?: string;
  openEmojiPostId?: string | null;
  setOpenEmojiPostId?: (id: string | null) => void;
  onPostReported?: (postId: string) => void;
  openCollaboratorsPostId?: string | null;
  setOpenCollaboratorsPostId?: (id: string | null) => void;
  onOpenPost?: (id: string) => void;
}

// Helper function to format time ago
const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return seconds === 0 ? "now" : `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w`;
  }

  const months = Math.floor(days / 30);
  if (months < 1) {
    // If less than 1 month, show weeks
    return `${weeks}w`;
  } else if (months < 12) {
    return `${months}m`;
  }

  const years = Math.floor(days / 365);
  if (years < 1) {
    // If less than 1 year, show months
    return `${months}m`;
  }
  return `${years}y`;
};

const PostCardWrapper = ({
  post,
  type,
  openEmojiPostId,
  setOpenEmojiPostId,
  onPostReported,
  openCollaboratorsPostId,
  setOpenCollaboratorsPostId,
  onOpenPost,
}: PostCardWrapperProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const author = {
    id: post.profile.id,
    name: post.profile.full_name || post.profile.username || "Unknown",
    username: post.profile.username || "",
    full_name: post.profile.full_name || "",
    avatar_url:
      post.profile.avatar_url ||
      "https://avatars.dicebear.com/api/open-peeps/123.svg",
  };

  const handleViewDetails = () => {
    if (post.category === "Product" && post.reference_id) {
      router.push(`/product/${post.reference_id}` as any);
    } else if (post.category === "Vehicle" && post.reference_id) {
      router.push(`/vehicle/${post.reference_id}` as any);
    }
  };

  return (
    <div className="h-full animate-in fade-in duration-500">
      {pathname?.includes("post") ? (
        <Post
          id={post.id}
          content={post.content || ""}
          author={author}
          media={
            post.media_urls?.map((url) => {
              const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(url);
              return {
                type: isVideo ? "video" : "image",
                url,
              };
            }) || []
          }
          likes={post.likes_count || 0}
          comments={post.comments_count || 0}
          location={post.location || undefined}
          time={formatTimeAgo(post.created_at)}
          onPostReported={onPostReported || (() => {})}
          user_tag={post.user_tag || undefined}
        ></Post>
      ) : pathname === "/" ? (
        <PostCardForHomePage
          id={post.id}
          content={post.content || ""}
          author={author}
          media={
            post.media_urls?.map((url) => {
              const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(url);
              return {
                type: isVideo ? "video" : "image",
                url,
              };
            }) || []
          }
          likes={post.likes_count || 0}
          comments={post.comments_count || 0}
          openEmojiPostId={openEmojiPostId}
          setOpenEmojiPostId={setOpenEmojiPostId}
          location={post.location || undefined}
          time={formatTimeAgo(post.created_at)}
          onPostReported={onPostReported || (() => {})}
          user_tag={post.user_tag || undefined}
        />
      ) : (
        <PostCard
          id={post.id}
          content={post.content || ""}
          author={author}
          media={
            post.media_urls?.map((url) => {
              const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(url);
              return {
                type: isVideo ? "video" : "image",
                url,
              };
            }) || []
          }
          likes={post.likes_count || 0}
          comments={post.comments_count || 0}
          openEmojiPostId={openEmojiPostId}
          setOpenEmojiPostId={setOpenEmojiPostId}
          location={post.location || undefined}
          time={formatTimeAgo(post.created_at)}
          onPostReported={onPostReported || (() => {})}
          user_tag={post.user_tag || undefined}
          openCollaboratorsPostId={openCollaboratorsPostId}
          setOpenCollaboratorsPostId={setOpenCollaboratorsPostId}
          onOpenPost={onOpenPost}
        />
      )}
      {/* {(post.category === "Product" || post.category === "Vehicle") &&
        post.reference_id && (
          <Button
            onClick={handleViewDetails}
            className="w-full bg-sm-red hover:bg-sm-red-light"
          >
            View {post.category} Details
          </Button>
        )} */}
    </div>
  );
};

export default PostCardWrapper;
