import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, Story, UserWithStories } from "@/integrations/supabase/modules/social";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, ChevronRight, ChevronLeft } from "lucide-react";
import CreateStoryModal from "./CreateStoryModal";
import StoryModal from "./StoryModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { isStorySeen } from "@/utils/storySeen";
import Image from "next/image";

interface StoryItemProps {
  username: string;
  avatar: string;
  hasUnseenStories: boolean;
  onClick: () => void;
  isCreateStory?: boolean;
  storyBg?: string | null;
  storyCount?: number;
}

const StoryRing: React.FC<{
  seenStatuses: boolean[];
  size?: number;
  color?: string;
  children: React.ReactNode;
}> = ({ seenStatuses, size = 40, color = "#3b82f6", children }) => {
  const ringSize = size;
  const innerSize = size - 6; // 3px gap on all sides
  const deg = 360 / seenStatuses.length;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: ringSize, height: ringSize }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${seenStatuses
            .map(
              (seen, i) =>
                `${seen ? "#bbb" : color} ${deg * i}deg ${
                  deg * (i + 1) - 4
                }deg, transparent ${deg * (i + 1) - 4}deg ${deg * (i + 1)}deg`
            )
            .join(", ")})`,
        }}
      />
      <div
        style={{ width: innerSize, height: innerSize }}
        className="rounded-full bg-white flex items-center justify-center overflow-hidden z-10"
      >
        {children}
      </div>
    </div>
  );
};

const StoryItem: React.FC<StoryItemProps & { seenStatuses: boolean[] }> = ({
  username,
  avatar,
  hasUnseenStories,
  onClick,
  isCreateStory = false,
  storyBg = null,
  storyCount = 1,
  seenStatuses = [false],
}) => (
  <div
    className="flex flex-col items-center space-y-1 cursor-pointer"
    onClick={onClick}
  >
    <div
      className={`relative rounded-xl w-24 h-40 overflow-hidden group shadow ${
        isCreateStory
          ? "bg-gray-200"
          : storyBg
          ? ""
          : "bg-gradient-to-tr from-sm-red to-yellow-500"
      }`}
    >
      {/* Blurred background for user story */}
      {storyBg && !isCreateStory && (
        <div className="absolute inset-0">
          <Image
            src={storyBg}
            alt="story background"
            fill
            className="object-cover blur-sm scale-110"
            sizes="200px"
          />
        </div>
      )}
      {/* Overlay for gradient if not create story and no bg */}
      {!isCreateStory && !storyBg && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      )}
      {/* Avatar at the top center (not for create story) */}
      {!isCreateStory && (
        <div className="relative z-10 flex justify-center mt-2">
          <StoryRing seenStatuses={seenStatuses} size={48} color="#ef4444">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage src={avatar} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </StoryRing>
        </div>
      )}
      {/* Plus icon and label at the bottom for create story */}
      {isCreateStory ? (
        <div className="absolute bottom-2 left-0 w-full flex flex-col items-center z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md mb-1">
            <Plus className="h-6 w-6 text-red-500" />
          </div>
          <span className="text-xs font-medium text-gray-700 mt-1 relative z-20 truncate w-full text-center">
            Create story
          </span>
        </div>
      ) : (
        <>
          {/* Inner shadow for label readability */}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-b-xl z-10" />
          <div className="absolute bottom-2 left-0 w-full text-center z-20">
            <span className="text-xs font-medium text-white truncate w-full inline-block align-bottom">
              {username}
            </span>
          </div>
        </>
      )}
    </div>
  </div>
);

const Stories = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const storiesContainerRef = useRef<HTMLDivElement>(null);
  const [seenUpdate, setSeenUpdate] = useState(0); // force re-render on seen

  const {
    data: storiesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["stories", user?.id],
    queryFn: async () => {
      if (!user) return { data: [] };
      return await socialApi.stories.getStoriesGroupedByUser(user.id);
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const stories: UserWithStories[] = storiesData?.data || [];

  const flattenedStories = useMemo(
    () =>
      stories.flatMap((user: UserWithStories) =>
        user.stories.map((story: Story) => ({
          ...story,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        }))
      ),
    [stories, seenUpdate]
  );

  useEffect(() => {
    if (!createOpen) {
      refetch();
    }
  }, [createOpen, refetch]);

  useEffect(() => {
    const container = storiesContainerRef.current;
    if (!container) return;
    const updateButtons = () => {
      setShowLeft(container.scrollLeft > 0);
      setShowRight(
        container.scrollWidth > container.clientWidth &&
          container.scrollLeft + container.clientWidth <
            container.scrollWidth - 1
      );
    };
    updateButtons();
    container.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);
    return () => {
      container.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [stories, user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleOpenCreateStory = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a story",
        variant: "destructive",
      });
      return;
    }
    setCreateOpen(true);
  };

  const handleStoryClick = (userId: string) => {
    const index = flattenedStories.findIndex((s) => s.user_id === userId);
    setCurrentStoryIndex(index >= 0 ? index : 0);
    setStoryOpen(true);
  };

  const handleCloseStories = () => {
    setStoryOpen(false);
  };

  const handleStoryCreated = async () => {
    setCreateOpen(false);
    const { data } = await refetch();
    const stories: UserWithStories[] = data?.data || [];
    // Flatten the stories from the fresh data
    const flattenedStories = stories.flatMap((user: UserWithStories) =>
      user.stories.map((story: Story) => ({
        ...story,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      }))
    );
    // Find the index of the user's latest story
    const myStories = stories.find(
      (userStory: UserWithStories) => userStory.user_id === user?.id
    );
    if (myStories && myStories.stories.length > 0) {
      const lastStory = myStories.stories[myStories.stories.length - 1];
      const index = flattenedStories.findIndex((s) => s.id === lastStory.id);
      if (index >= 0) {
        setCurrentStoryIndex(index);
        setStoryOpen(true);
      }
    }
  };

  const scrollRight = () => {
    const container = storiesContainerRef.current;
    if (container) {
      const newPosition = container.scrollLeft + 200;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
    }
  };

  const scrollLeft = () => {
    const container = storiesContainerRef.current;
    if (container) {
      const newPosition = container.scrollLeft - 200;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
    }
  };

  // Add a type guard for avatar_url
  function hasAvatarUrl(u: unknown): u is { avatar_url: string } {
    return (
      typeof u === "object" &&
      u !== null &&
      "avatar_url" in u &&
      typeof (u as Record<string, unknown>).avatar_url === "string"
    );
  }

  const skeletonCount = isMobile ? 3 : 5;

  // Add a callback to trigger re-render when a story is seen
  const handleStorySeen = () => setSeenUpdate((v) => v + 1);

  return (
    <>
      <div className="relative">
        {/* Left scroll button */}
        {showLeft && !isLoading && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white flex items-center justify-center md:left-2"
            onClick={scrollLeft}
            style={{ display: showLeft ? "flex" : "none" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {/* Right scroll button */}
        {showRight && !isLoading && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white flex items-center justify-center md:right-2"
            onClick={scrollRight}
            style={{ display: showRight ? "flex" : "none" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div
          id="stories-container"
          ref={storiesContainerRef}
          className="flex space-x-3 p-4 overflow-x-auto scrollbar-hide"
        >
          {/* Create Story Card */}
          <StoryItem
            username="Create story"
            avatar={user && hasAvatarUrl(user) ? user.avatar_url : ""}
            hasUnseenStories={false}
            onClick={handleOpenCreateStory}
            isCreateStory
            seenStatuses={[false]}
          />

          {/* User's own story card, if exists */}
          {stories.map((userStory) => {
            const isCurrentUser = userStory.user_id === user?.id;
            if (isCurrentUser) {
              return (
                <StoryItem
                  key={userStory.user_id}
                  username="Your story"
                  avatar={userStory.avatar_url || ""}
                  hasUnseenStories={userStory.hasUnseenStories}
                  onClick={() => handleStoryClick(userStory.user_id)}
                  storyBg={userStory.stories[0]?.media_url || null}
                  storyCount={userStory.stories.length}
                  seenStatuses={userStory.stories.map((story) =>
                    isStorySeen(story.id)
                  )}
                />
              );
            }
            return null;
          })}

          {/* Other users' stories */}
          {stories.map((userStory) => {
            const isCurrentUser = userStory.user_id === user?.id;
            if (!isCurrentUser) {
              return (
                <StoryItem
                  key={userStory.user_id}
                  username={userStory.username || userStory.full_name || ""}
                  avatar={userStory.avatar_url || ""}
                  hasUnseenStories={userStory.hasUnseenStories}
                  onClick={() => handleStoryClick(userStory.user_id)}
                  storyBg={userStory.stories[0]?.media_url || null}
                  storyCount={userStory.stories.length}
                  seenStatuses={userStory.stories.map((story) =>
                    isStorySeen(story.id)
                  )}
                />
              );
            }
            return null;
          })}

          {isLoading &&
            Array(skeletonCount)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <Skeleton className="h-40 w-24 rounded-xl" />
                </div>
              ))}
        </div>
      </div>

      <CreateStoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
        <DialogContent className="p-0 max-w-2xl max-h-[90vh] overflow-hidden">
          <StoryModal
            stories={flattenedStories}
            initialStoryIndex={currentStoryIndex}
            onClose={handleCloseStories}
            onStoryDeleted={refetch}
            onStorySeen={handleStorySeen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Stories;
