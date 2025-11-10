import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi, supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchConversations } from "@/integrations/supabase/modules/chat";
import { Conversation } from "../messenger/MessengerUI";

// Define Profile type inline
type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
};

const RightSidebar = () => {
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationsUserList, setConversationsUserList] = useState<
    Conversation[]
  >([]);
  const debouncedQuery = useDebounce(query, 300);

  const { data: suggestedUsers, isLoading } = useQuery({
    queryKey: ["profiles", "suggested"],
    queryFn: async () => {
      if (!user || !myProfile) return [];
      const { data: profiles } = await socialApi.profiles.getAll();
      if (!profiles) return [];
      const { data: following } = await socialApi.follows.getFollowing(user.id);
      const followingIds = new Set(following?.map((f) => f.following_id) || []);
      const { data: followers } = await socialApi.follows.getFollowers(user.id);
      const followerIds = new Set(followers?.map((f) => f.follower_id) || []);
      return profiles
        .filter(
          (profile) =>
            profile.id !== user.id &&
            !followingIds.has(profile.id) &&
            !followerIds.has(profile.id)
        )
        .filter((profile) => {
          const theirLocation = profile.location;
          const theirTags = Array.isArray(profile.tag) ? profile.tag : [];
          const myLocation = myProfile.location;
          const myTags = Array.isArray(myProfile.tag) ? myProfile.tag : [];

          const locationMatch =
            myLocation && theirLocation && myLocation === theirLocation;

          const tagMatch =
            myTags.length > 0 &&
            theirTags.length > 0 &&
            myTags.some((tag: string) => theirTags.includes(tag));

          return locationMatch || tagMatch;
        })
        .slice(0, 8);
    },
    enabled: !!user && !!myProfile,
  });

  const [followingStatus, setFollowingStatus] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!user) return;
      const { data: following } = await socialApi.follows.getFollowing(user.id);
      const followingIds = new Set(following?.map((f) => f.following_id) || []);
      const allUsers = query ? searchResults : suggestedUsers;
      if (!allUsers) return;
      const status: Record<string, boolean> = {};
      for (const profile of allUsers) {
        status[profile.id] = followingIds.has(profile.id);
      }
      setFollowingStatus(status);
    };
    fetchFollowingStatus();
  }, [user, suggestedUsers, searchResults, query]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select('id, username, full_name, avatar_url')
          .or(
            `username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`
          )
          .limit(5);
        if (error) throw error;
        // Convert Supabase results to Profile type, handling nulls
        const profiles: Profile[] = (data || []).map((item) => ({
          id: item.id,
          username: item.username || "",
          full_name: item.full_name || "",
          avatar_url: item.avatar_url || undefined,
        }));
        setSearchResults(profiles);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    searchUsers();
  }, [debouncedQuery]);

  const handleFollow = async (userId: string) => {
    if (!user) return;
    try {
      await socialApi.follows.followUser(user.id, userId);
      setFollowingStatus((prev) => ({ ...prev, [userId]: true }));
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  useEffect(() => {
    const fetchConvos = async () => {
      if (!user) {
        setConversationsUserList([]);
        return;
      }

      setLoadingConversation(true);

      try {
        const { data, error } = await fetchConversations(user.id);
        if (error) throw error;

        const localConversations: Conversation[] = (data as any[]).map(
          (conv: any) => ({
            id: conv.user_id,
            user_id: conv.user_id,
            name: conv.full_name || conv.username || "Unknown User",
            avatar: conv.avatar_url || "/default-avatar.png",
            avatar_url: conv.avatar_url,
            lastMessage: conv.last_message || "",
            lastMessageType: conv.last_message_type || "",
            timestamp: conv.last_message_time
              ? new Date(conv.last_message_time)
              : new Date(),
            unread: conv.unread_count || 0,
            full_name: conv.full_name,
            username: conv.username,
          })
        );

        const uniqueUserIds = Array.from(
          new Set(localConversations.map((c) => c.user_id))
        );

        const profiles = await Promise.all(
          uniqueUserIds.map(async (id) => {
            try {
              const { data } = await socialApi.profiles.getById(id);
              return data;
            } catch (error) {
              console.error(`Error fetching profile for user ${id}:`, error);
              return null;
            }
          })
        );

        const conversationsWithProfiles = localConversations.map((conv) => {
          const profile = profiles.find((p) => p?.id === conv.user_id);
          return {
            ...conv,
            avatar: profile?.avatar_url || conv.avatar || "/default-avatar.png",
            name: profile?.full_name || profile?.username || "Unknown User",
            full_name: profile?.full_name || conv.full_name || conv.username,
            username: profile?.username || conv.username || "Unknown User",
          };
        });

        setConversationsUserList(conversationsWithProfiles);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchConvos();
  }, [user]);

  if (!user) return null;
  // Only hide the suggested users section, not the entire sidebar
  const showSuggestedUsers =
    !!query || (suggestedUsers && suggestedUsers.length > 0);

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000
    );

    if (diffInSeconds < 10) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const userList = query ? searchResults : suggestedUsers;
  const loading = query ? searchLoading : isLoading;

  return (
    <div className="hidden xl:flex flex-col gap-3">
      {showSuggestedUsers && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            {query ? "Search Results" : "Suggested for you"}
          </h2>
          <div className="rounded-lg border shadow-md mb-4">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="ml-3">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {userList && userList.length > 0 ? (
                userList.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between"
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => router.push(`/profile/${profile.id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {profile.username?.[0]?.toUpperCase() ||
                            profile.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium">
                          {profile.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profile.full_name}
                        </p>
                      </div>
                    </div>
                    {followingStatus[profile.id] ? (
                      <span className="text-xs font-medium text-gray-500">
                        Following
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm-red hover:bg-sm-red/10 hover:text-sm-red"
                        onClick={() => handleFollow(profile.id)}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500">
                  {query ? "No results found." : "No suggestions available"}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Recent Conversations Section */}
      <div className="rounded-lg bg-white p-4 shadow mt-3">
        <h2 className="mb-4 text-lg font-semibold">Recent Conversations</h2>
        <ScrollArea className="h-60">
          <div className="p-0">
            {loadingConversation ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 rounded-lg mb-2 animate-pulse"
                >
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200 mr-3" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />
                    <Skeleton className="h-3 w-1/2 bg-gray-200" />
                  </div>
                </div>
              ))
            ) : conversationsUserList && conversationsUserList.length > 0 ? (
              conversationsUserList
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((conversation) => (
                  <div
                    key={conversation.user_id}
                    className="flex items-center p-3 rounded-lg cursor-pointer mb-2 transition-colors hover:bg-gray-50"
                    onClick={() => {
                      router.push(`/messenger/${conversation.user_id}`);
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={conversation.avatar} alt="avatar" />
                        <AvatarFallback>
                          {conversation.username?.[0]?.toUpperCase() ||
                            conversation.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <span className="absolute bottom-0 right-2 w-2.5 h-2.5 bg-racing-green rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-800 truncate text-sm">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const diffInSeconds = differenceInSeconds(
                              new Date(),
                              conversation.timestamp
                            );
                            if (diffInSeconds < 10) {
                              return "just now";
                            } else if (diffInSeconds < 60) {
                              return `${diffInSeconds}s ago`;
                            } else {
                              return formatDistanceToNow(
                                conversation.timestamp,
                                {
                                  addSuffix: true,
                                }
                              ).replace(/^about /, "");
                            }
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {conversation.lastMessageType === "image"
                          ? "📷 Photo"
                          : conversation.lastMessageType === "video"
                          ? "🎥 Video"
                          : conversation.lastMessageType === "post"
                          ? "📢 Post"
                          : conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="ml-2 bg-racing-red rounded-full w-4 h-4 flex items-center justify-center text-xs text-white">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-center text-sm text-gray-500">
                No recent conversations.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <p className="mt-4">© 2023 SuperMoto Social</p>
      </div>
    </div>
  );
};

export default RightSidebar;
