import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import CreatePost from "@/components/social/CreatePost";
import Stories from "@/components/social/Stories";
import TrendingPosts from "@/components/social/TrendingPosts";
import LeftSidebar from "@/components/social/LeftSidebar";
import RightSidebar from "@/components/social/RightSidebar";
import MobileSuggestedUsers from "@/components/social/MobileSuggestedUsers";

const Social = () => {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scroll(0, 0);
  }, []);

  // Add loading state for better UX
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000); // Show loading for 1 second minimum

    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Sidebar - Left */}
          <LeftSidebar
            onCreatePost={() => {
              setCreatePostOpen(false);
              setTimeout(() => setCreatePostOpen(true), 0);
            }}
          />

          {/* Main Content - Middle */}
          <div className="space-y-6 lg:col-span-2">
            {/* Stories Section */}
            <div className="overflow-hidden rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 ml-1 text-lg font-semibold">Stories</h2>
              <Stories />
            </div>

            {/* Mobile Suggested Users (only on mobile) */}
            {/* <div className="block lg:hidden">
              <MobileSuggestedUsers />
            </div> */}

            {/* Posts Feed */}
            <TrendingPosts
              renderAfterIndex={15}
              AfterComponent={
                <div className="block lg:hidden">
                  <MobileSuggestedUsers />
                </div>
              }
            />
          </div>

          <RightSidebar />
        </div>
      </div>

      <CreatePost
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        userAvatar={user?.user_metadata.avatar_url}
        onPostCreated={(newPost) => {
          // Invalidate and refetch posts queries to show the new post immediately
          queryClient.invalidateQueries({ queryKey: ["posts", "trending"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
          queryClient.invalidateQueries({ queryKey: ["trendingPosts"] });

          // The query invalidation above will automatically refetch and show the new post
        }}
      />
    </Layout>
  );
};

export default Social;
