import { useState, useEffect, useRef, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostWithProfile } from "@/integrations/supabase/modules/social";
import { socialApi } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import PostCardWrapper from "./PostCardWrapper";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import PostSkeleton from "../../lib/PostSkeleton";

interface PostTabsProps {
  renderAfterIndex?: number;
  AfterComponent?: ReactNode;
  onOpenPost?: (id: string) => void;
}

const POSTS_PER_PAGE = 10;

const PostTabs = ({ renderAfterIndex, AfterComponent, onOpenPost }: PostTabsProps) => {
  const [activeTab, setActiveTab] = useState("trending");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openEmojiPostId, setOpenEmojiPostId] = useState<string | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [openCollaboratorsPostId, setOpenCollaboratorsPostId] = useState<
    string | null
  >(null);

  const {
    data: trendingPostsData,
    fetchNextPage: fetchNextTrendingPage,
    hasNextPage: hasNextTrendingPage,
    isFetchingNextPage: isFetchingNextTrendingPage,
    isLoading: trendingIsLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", "trending"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await socialApi.posts.getTrending(
        user?.id || "",
        POSTS_PER_PAGE,
        pageParam as number
      );
      if (error) throw error;
      return data as unknown as PostWithProfile[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length * POSTS_PER_PAGE;
      return (lastPage as unknown as PostWithProfile[]).length ===
        POSTS_PER_PAGE
        ? nextPage
        : undefined;
    },
    initialPageParam: 0,
    enabled: activeTab === "trending",
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const trendingPosts = trendingPostsData?.pages.flatMap((page) => page) || [];

  const {
    data: feedPostsData,
    fetchNextPage: fetchNextFeedPage,
    hasNextPage: hasNextFeedPage,
    isFetchingNextPage: isFetchingNextFeedPage,
    isLoading: feedIsLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", "feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await socialApi.posts.getFeed(
        user?.id || "",
        POSTS_PER_PAGE,
        pageParam as number
      );
      if (error) throw error;
      return data as unknown as PostWithProfile[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length * POSTS_PER_PAGE;
      return (lastPage as unknown as PostWithProfile[]).length ===
        POSTS_PER_PAGE
        ? nextPage
        : undefined;
    },
    initialPageParam: 0,
    enabled: activeTab === "feed",
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const feedPosts = feedPostsData?.pages.flatMap((page) => page) || [];

  const {
    data: followingPostsData,
    fetchNextPage: fetchNextFollowingPage,
    hasNextPage: hasNextFollowingPage,
    isFetchingNextPage: isFetchingNextFollowingPage,
    isLoading: followingIsLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", "following"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await socialApi.posts.getFollowing(
        user?.id || "",
        POSTS_PER_PAGE,
        pageParam as number
      );
      if (error) throw error;
      return data as unknown as PostWithProfile[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length * POSTS_PER_PAGE;
      return (lastPage as unknown as PostWithProfile[]).length ===
        POSTS_PER_PAGE
        ? nextPage
        : undefined;
    },
    initialPageParam: 0,
    enabled: activeTab === "following" && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const followingPosts =
    followingPostsData?.pages.flatMap((page) => page) || [];

  const tagQuery = useQuery({
    queryKey: ["posts", "tag", selectedTag],
    queryFn: async () => {
      if (!selectedTag) return [];
      const { data, error } = await socialApi.posts.getByTag(selectedTag);
      if (error) throw error;
      return data as unknown as PostWithProfile[];
    },
    enabled: !!selectedTag,
  });

  const loaderRef = useRef(null);

  // Real-time subscription for new posts from followed users
  useEffect(() => {
    if (!user) return;

    // Get list of users being followed
    const setupRealtimeSubscription = async () => {
      const { data: followingData } = await socialApi.follows.getFollowing(user.id);
      if (!followingData || followingData.length === 0) return;

      const followingIds = followingData.map((f: any) => f.following_id);

      // Subscribe to new posts from followed users
      const channel = supabase
        .channel("following-posts")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "posts",
            filter: `user_id=in.(${followingIds.join(",")})`,
          },
          (payload) => {
            const newPost = payload.new;
            // Invalidate and refetch following posts to show new post
            queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
            queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
            
            // If on following tab, show a visual indicator
            if (activeTab === "following") {
              // Optionally show a toast or badge for new post
              console.log("New post from followed user:", newPost);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, [user, activeTab, queryClient]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (
            activeTab === "trending" &&
            hasNextTrendingPage &&
            !isFetchingNextTrendingPage
          ) {
            fetchNextTrendingPage();
          } else if (
            activeTab === "feed" &&
            hasNextFeedPage &&
            !isFetchingNextFeedPage
          ) {
            fetchNextFeedPage();
          } else if (
            activeTab === "following" &&
            hasNextFollowingPage &&
            !isFetchingNextFollowingPage
          ) {
            fetchNextFollowingPage();
          }
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [
    activeTab,
    hasNextTrendingPage,
    isFetchingNextTrendingPage,
    fetchNextTrendingPage,
    hasNextFeedPage,
    isFetchingNextFeedPage,
    fetchNextFeedPage,
    hasNextFollowingPage,
    isFetchingNextFollowingPage,
    fetchNextFollowingPage,
  ]);

  const handlePostReported = (postId: string) => {
    setReportedPostIds((prev) => [...prev, postId]);
  };

  const renderPosts = (
    posts: PostWithProfile[] | undefined,
    isLoading: boolean,
    hasNextPage: boolean,
    isFetchingNextPage: boolean
  ) => {
    const filteredPosts = posts?.filter(
      (post) => !reportedPostIds.includes(post.id)
    );

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 py-8">
          {Array(POSTS_PER_PAGE)
            .fill(0)
            .map((_, index) => (
              <PostSkeleton key={index} />
            ))}
        </div>
      );
    }

    if (!filteredPosts || filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Follow more accounts or create your first post
          </p>
        </div>
      );
    }

    const postElements: React.ReactNode[] = [];
    filteredPosts.forEach((post, idx) => {
      postElements.push(
        <PostCardWrapper
          key={post.id}
          post={post}
          openEmojiPostId={openEmojiPostId}
          setOpenEmojiPostId={setOpenEmojiPostId}
          onPostReported={handlePostReported}
          openCollaboratorsPostId={openCollaboratorsPostId}
          setOpenCollaboratorsPostId={setOpenCollaboratorsPostId}
          onOpenPost={onOpenPost}
        />
      );
      if (
        activeTab === "trending" &&
        renderAfterIndex !== undefined &&
        AfterComponent &&
        idx === renderAfterIndex - 1
      ) {
        postElements.push(<div key="after-component">{AfterComponent}</div>);
      }
    });
    return (
      <div className="grid grid-cols-1 gap-2">
        {postElements}
        {hasNextPage && (
          <div ref={loaderRef} className="flex justify-center p-4">
            {isFetchingNextPage && (
              <div className="loader border-t-4 border-blue-500 w-8 h-8 rounded-full animate-spin"></div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleTagSelect = (tag: string) => {
    setActiveTab("tags");
    setSelectedTag(tag);
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="trending"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
          <TabsTrigger
            value="trending"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-sm-red rounded-none"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger
            value="feed"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-sm-red rounded-none"
          >
            Feed
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-sm-red rounded-none"
          >
            Following
          </TabsTrigger>
          {selectedTag && (
            <TabsTrigger
              value="tags"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-sm-red rounded-none"
            >
              #{selectedTag}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          {renderPosts(
            trendingPosts as unknown as PostWithProfile[],
            trendingIsLoading,
            hasNextTrendingPage,
            isFetchingNextTrendingPage
          )}
        </TabsContent>

        <TabsContent value="feed" className="mt-6">
          {renderPosts(
            feedPosts as unknown as PostWithProfile[],
            feedIsLoading,
            hasNextFeedPage,
            isFetchingNextFeedPage
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          {renderPosts(
            followingPosts as unknown as PostWithProfile[],
            followingIsLoading,
            hasNextFollowingPage,
            isFetchingNextFollowingPage
          )}
        </TabsContent>

        {selectedTag && (
          <TabsContent value="tags" className="mt-6">
            {renderPosts(tagQuery.data, tagQuery.isLoading, false, false)}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PostTabs;
