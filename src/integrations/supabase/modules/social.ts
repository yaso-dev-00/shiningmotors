import { date } from "zod";
import { supabase } from "../client";
import type { Database, Json } from "../types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

type Like = Database["public"]["Tables"]["likes"]["Row"];
type LikeInsert = Database["public"]["Tables"]["likes"]["Insert"];

type Comment = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  caption?: string;
  created_at: string;
  expires_at?: Date | null;
  avatar_url: string;
  full_name: string;
  views_count?: number;
  story_type: "image" | "video" | "text";
  viewed?: boolean;
  viewers?: StoryViewer[];
  profile?: {
    username?: string;
    avatar_url?: string;
    full_name?: string;
    id?: string;
  };
  overlays?: {
    backgroundColor?: string;
    media?: {
      url: string;
      type: "image" | "video";
      position: { x: number; y: number };
      scale: number;
      rotation: number;
      size: { width: number; height: number };
    };
    texts?: Array<{
      text: string;
      color?: string;
      backgroundColor?: string;
      fontFamily?: string;
      fontSize?: number;
      position: { x: number; y: number };
      rotation?: number;
      scale?: number;
    }>;
    canvas?: {
      width: number;
      height: number;
    };
  };
}

type UserProfile = {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
};

export interface StoryViewer {
  viewers_id: string;
  viewed_at: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
}

export interface UserWithStories {
  user_id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  stories: Story[];
  hasUnseenStories: boolean;
}

export interface PostProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
}

export interface PostWithProfile {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number | null;
  comments_count: number | null;
  media_urls: string[] | null;
  tags: string[] | null;
  reference_id: string | null;
  category?: "Product" | "Vehicle" | "Service" | null;
  profile: PostProfile;
  location: string | null;
  user_tag: string[] | null;
}

export interface CommentWithProfile {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  updated_at: string;
  profile: PostProfile;
}

// Helper function to safely convert story_type to the correct type
const ensureValidStoryType = (
  type: string | null
): "image" | "video" | "text" => {
  if (type === "video") return "video";
  if (type === "text") return "text";
  return "image"; // Default to image for any other value
};

const ensureStringArray = (tags: string | string[]): string[] => {
  if (typeof tags === "string") {
    return [tags];
  }
  return tags;
};

export const socialApi = {
  posts: {
    select: () => supabase.from("posts"),
    getById: (id: string) =>
      supabase
        .from("posts")
        .select(
          `
      *,
      profile:user_id (
        id,
        username,
        avatar_url,
        full_name
      )
    `
        )
        .eq("id", id)
        .single(),
    getByUserId: (userId: string) =>
      supabase.from("posts").select().eq("user_id", userId),

    getPostStats: async (postId: string) => {
      const [{ count: likesCount }, { count: commentsCount }] =
        await Promise.all([
          supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId),
          supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId),
        ]);

      return {
        likes: likesCount || 0,
        comments: commentsCount || 0,
      };
    },
    getFeed: (
      userId: string,
      limit: number,
      offset: number,
      category?: string
    ) => {
      let query = supabase
        .from("posts")
        .select(
          `
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq("category", category);
      }

      return query;
    },
    getTrending: (userId: string, limit: number, offset: number) =>
      supabase
        .from("posts")
        .select(
          `
          *,
          profile:user_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
    getFollowing: (userId: string, limit: number, offset: number) =>
      supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId)
        .then(async (data) => {
          const followingIds = (data.data || []).map((follow) => follow.following_id);

          if (followingIds.length > 0) {
            return supabase
              .from("posts")
              .select(
                `
                    *,
                    profile:user_id (
                      id,
                      username,
                      avatar_url,
                      full_name
                    )
                  `
              )
              .in("user_id", followingIds)
              .order("created_at", { ascending: false })
              .range(offset, offset + limit - 1);
          } else {
            return { data: [], error: null };
          }
        }),
    getByTag: (tag: string) =>
      supabase
        .from("posts")
        .select(
          `
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      `
        )
        .contains("tags", [tag])
        .order("created_at", { ascending: false }),

    getSavedPostsByUser: (userId: string) =>
      supabase
        .from("saved_post")
        .select(
          `
      post_id,
      posts (
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      )
    `
        )
        .eq("user_id", userId),

    getLikedPostsByUser: (userId: string) =>
      supabase
        .from("likes")
        .select(
          `
              post_id,
              posts (
                *,
                profile:user_id (
                  id,
                  username,
                  avatar_url,
                  full_name
                )
              )
            `
        )
        .eq("user_id", userId),

    deletePost: async (postId: string, userId: string) => {
      // Only allow deleting if the user is the author
      // First verify the user owns the post
      const { data: post, error: checkError } = await supabase
        .from("posts")
        .select("id")
        .eq("id", postId)
        .eq("user_id", userId)
        .single();

      if (checkError || !post) {
        return { data: null, error: checkError || new Error("Post not found or unauthorized") };
      }

      // Delete related records first to avoid foreign key constraint violations
      // 1. Delete saved_post records
      await supabase
        .from("saved_post")
        .delete()
        .eq("post_id", postId);

      // 2. Delete likes
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId);

      // 3. Delete comments (this will cascade to replies if there's a foreign key)
      // First delete all replies (comments with parent_id pointing to comments of this post)
      const { data: comments } = await supabase
        .from("comments")
        .select("id")
        .eq("post_id", postId);

      if (comments && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        // Delete replies to these comments
        await supabase
          .from("comments")
          .delete()
          .in("parent_id", commentIds);
        // Delete the comments themselves
        await supabase
          .from("comments")
          .delete()
          .eq("post_id", postId);
      }

      // 4. Now delete the post itself
      return supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);
    },

    createPostReport: (data: {
      user_id: string;
      post_id: string;
      content?: string;
    }) => supabase.from("report").insert(data),
    getAllPostReport: () => supabase.from("report"),
  },

  profiles: {
    getStats: async (userId: string) => {
      const [postsCount, followersCount, followingCount] = await Promise.all([
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),

        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),

        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      return {
        posts: postsCount.count || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
      };
    },
    getById: (id: string) =>
      supabase.from("profiles").select().eq("id", id).single(),

    getByUsername: (username: string) =>
      supabase.from("profiles").select().eq("username", username).single(),

    getAll: () => supabase.from("profiles").select(),

    update: (
      id: string,
      updates: Partial<Database["public"]["Tables"]["profiles"]["Update"]>
    ) => supabase.from("profiles").update(updates).eq("id", id),
  },

  follows: {
    getFollowers: (userId: string) =>
      supabase
        .from("user_follows")
        .select(
          `
          follower_id,
          profiles:follower_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `
        )
        .eq("following_id", userId),

    getFollowing: (userId: string) =>
      supabase
        .from("user_follows")
        .select(
          `
          following_id,
          profiles:following_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `
        )
        .eq("follower_id", userId),

    followUser: async (followerId: string, followingId: string) => {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) throw error;

      return { success: true };
    },

    unfollowUser: async (followerId: string, followingId: string) => {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);

      if (error) throw error;

      return { success: true };
    },

    checkIfFollowing: (followerId: string, followingId: string) =>
      supabase
        .from("user_follows")
        .select()
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle(),
  },

  comments: {
    select: () => supabase.from("comments"),
    getByPostId: (postId: string) =>
      supabase
        .from("comments")
        .select(
          `
      *,
      profile:user_id (
        id,
        username,
        avatar_url,
        full_name
      )
    `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
    getById: (id: string) =>
      supabase.from("comments").select().eq("id", id).single(),

    getThreadedByPostId: async (
      postId: string,
      limit?: number,
      offset?: number
    ) => {
      let query = supabase
        .from("comments")
        .select(
          `
          *,
          profile:user_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `,
          { count: "exact" } // Request exact count
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error, count } = await query;
      return { data, error, count }; // Return count as well
    },

    insert: (values: CommentInsert & { parent_id?: string | null }) =>
      supabase.from("comments").insert(values),

    updateIfAuthor: async (
      commentId: string,
      userId: string,
      values: Partial<CommentUpdate>
    ) => {
      const { data: comment, error } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();
      if (error) return { error };
      if (!comment || comment.user_id !== userId) {
        return { error: { message: "Unauthorized: not the comment author" } };
      }
      return supabase.from("comments").update(values).eq("id", commentId);
    },

    deleteIfAuthor: async (commentId: string, userId: string) => {
      const { data: comment, error } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();
      if (error) return { error };
      if (!comment || comment.user_id !== userId) {
        return { error: { message: "Unauthorized: not the comment author" } };
      }
      return supabase.from("comments").delete().eq("id", commentId);
    },

    reply: (values: CommentInsert & { parent_id: string }) =>
      supabase.from("comments").insert(values),
  },

  likes: {
    select: () => supabase.from("likes"),
    getByPostId: (postId: string) =>
      supabase.from("likes").select().eq("post_id", postId),
    checkIfLiked: (postId: string, userId: string) =>
      supabase
        .from("likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single(),
    insert: (values: LikeInsert) => supabase.from("likes").insert(values),
    delete: (postId: string, userId: string) =>
      supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId),
  },

  stories: {
    getFollowedUserStories: async (userId: string) => {
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) return { data: null, error: followsError };

      const followedIds = follows?.map((row) => row.following_id) || [];
      const userIds = [...followedIds, userId];
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
      *,
      profile:user_id (
        id,
        full_name,
        avatar_url
      )
      `
        )
        .in("user_id", userIds)
        .gt("expires_at", new Date().toISOString());

      if (error) return { data: null, error };

      const sortedData = data.sort((a, b) => {
        if (a.user_id === userId && b.user_id !== userId) return -1;
        if (a.user_id !== userId && b.user_id === userId) return 1;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      return { data: sortedData, error: null };
    },

    getStoriesGroupedByUser: async (userId: string) => {
      // 1. Get followers and following user IDs
      const { data: followRelations, error: followError } = await supabase
        .from("user_follows")
        .select("follower_id, following_id")
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

      if (followError) {
        return { data: [], error: followError };
      }

      // 2. Collect unique related user IDs (followers + following + self)
      const relatedUserIds = new Set<string>();
      relatedUserIds.add(userId); // include self

      followRelations?.forEach((rel) => {
        if (rel.follower_id === userId) relatedUserIds.add(rel.following_id);
        if (rel.following_id === userId) relatedUserIds.add(rel.follower_id);
      });

      // 3. Get all valid stories from related users
      const { data: rawStories, error: storiesError } = await supabase
        .from("stories")
        .select(
          `
          *,
          profile:user_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `
        )
        .in("user_id", Array.from(relatedUserIds))
        .gt("expires_at", new Date().toISOString());

      if (storiesError || !rawStories) {
        return { data: [], error: storiesError };
      }

      // 4. Get which stories this user has already viewed
      const { data: viewedStories } = await supabase
        .from("story_viewer_details")
        .select("story_id")
        .eq("viewers_id", userId);

      const viewedStoryIds = new Set(
        viewedStories?.map((view) => view.story_id) || []
      );

      // 5. Group stories by user
      const userStoriesMap = new Map<string, UserWithStories>();

      rawStories.forEach((story) => {
        if (!story.user_id || !story.id) return;

        const viewed = viewedStoryIds.has(story.id);

        const storyWithViewed: Story = {
          id: story.id,
          user_id: story.user_id,
          media_url: story.media_url || "",
          caption: story.caption || undefined,
          created_at: story.created_at || "",
          expires_at: story.expires_at ? new Date(story.expires_at) : null,
          views_count: story.views_count ?? undefined,
          story_type: ensureValidStoryType(story.story_type),
          viewed: viewed,
          overlays: (story.overlays as Story["overlays"]) || undefined,
          avatar_url: story.profile?.avatar_url || "",
          full_name: story.profile?.full_name || "",
        };

        if (userStoriesMap.has(story.user_id)) {
          const userStories = userStoriesMap.get(story.user_id)!;
          userStories.stories.push(storyWithViewed);
          if (!viewed) userStories.hasUnseenStories = true;
        } else {
          const profile = story.profile || ({} as UserProfile);
          userStoriesMap.set(story.user_id, {
            user_id: story.user_id,
            username: profile?.username || "",
            avatar_url: profile?.avatar_url || "",
            full_name: profile?.full_name || "",
            stories: [storyWithViewed],
            hasUnseenStories: !viewed,
          });
        }
      });

      const groupedStories = Array.from(userStoriesMap.values());

      // Sort current user's story first
      groupedStories.sort((a, b) => {
        if (a.user_id === userId) return -1;
        if (b.user_id === userId) return 1;
        return 0;
      });

      return { data: groupedStories, error: null };
    },
  },

  createStory: (storyData: {
    user_id: string;
    media_url: string;
    caption?: string;
    story_type?: "image" | "video" | "text";
    overlays: Json | null;
  }) => supabase.from("stories").insert(storyData),

  viewStory: async (storyId: string, viewerId: string) => {
    const { data, error } = await supabase
      .from("story_viewer_details")
      .select("id")
      .eq("story_id", storyId)
      .eq("viewers_id", viewerId)
      .maybeSingle();

    if (!data) {
      const { error: insertError } = await supabase
        .from("story_viewer_details")
        .insert({
          story_id: storyId,
          viewers_id: viewerId,
          viewed_at: new Date().toISOString(),
        });

      if (insertError && insertError.code !== "23505") {
        return { error: insertError };
      }
      const { error: updateError } = await supabase.rpc("add_to_viewed_by", {
        story_id_input: storyId,
        viewer_id_input: viewerId,
      });

      if (updateError) return { error: updateError };
    }

    return { error: null };
  },

  deleteStory: async (storyId: string) => {
    const { error } = await supabase.from("stories").delete().eq("id", storyId);

    if (error) {
      return { error };
    }
    const { error: deleteViewerError } = await supabase
      .from("story_viewer_details")
      .delete()
      .eq("story_id", storyId);
    if (deleteViewerError) {
      return { error: deleteViewerError };
    }
    const { error: deleteStoryError } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId);
    if (deleteStoryError) {
      return { error: deleteStoryError };
    }
    return { error: null };
  },

  getStoryViewers: async (storyId: string) => {
    const { data: viewerData, error } = await supabase
      .from("story_viewer_details")
      .select("viewers_id, viewed_at")
      .eq("story_id", storyId);

    if (error || !viewerData || viewerData.length === 0) {
      return { data: [], error };
    }

    const viewerIds = viewerData
      .map((v) => v.viewers_id)
      .filter((id): id is string => id !== null);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, full_name")
      .in("id", viewerIds);

    if (profilesError) return { data: [], error: profilesError };

    const viewers: StoryViewer[] = viewerData
      .filter((v): v is typeof v & { viewers_id: string } => v.viewers_id !== null)
      .map((v) => {
        const profile = profiles?.find((p) => p.id === v.viewers_id);
        return {
          viewers_id: v.viewers_id,
          viewed_at: v.viewed_at || "",
          username: profile?.username || "",
          avatar_url: profile?.avatar_url || "",
          full_name: profile?.full_name || "",
        };
      });

    return { data: viewers, error: null };
  },
};
