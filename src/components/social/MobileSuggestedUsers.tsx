import { useEffect, useState, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  location?: string | null;
  tag?: string[] | null;
}

const MobileSuggestedUsers = () => {
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<
    Record<string, boolean>
  >({});
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [allFollowingIds, setAllFollowingIds] = useState<Set<string>>(
    new Set()
  );
  const [allFollowerIds, setAllFollowerIds] = useState<Set<string>>(new Set());
  const [modalVisibleCount, setModalVisibleCount] = useState(10);
  const modalListRef = useRef<HTMLDivElement | null>(null);
  const [modalLoadingMore, setModalLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchSuggested = async () => {
      if (!user || !myProfile) return;
      setLoading(true);
      const { data: profiles } = await socialApi.profiles.getAll();
      if (!profiles) {
        setSuggestedUsers([]);
        setLoading(false);
        return;
      }
      const { data: following } = await socialApi.follows.getFollowing(user.id);
      const followingIds = new Set(
        following?.map((f: { following_id: string }) => f.following_id) || []
      );
      const { data: followers } = await socialApi.follows.getFollowers(user.id);
      const followerIds = new Set(
        followers?.map((f: { follower_id: string }) => f.follower_id) || []
      );
      const myLocation = myProfile.location;
      const myTags = Array.isArray(myProfile.tag) ? myProfile.tag : [];
      const filtered = profiles
        .filter((profile: Profile) => {
          if (
            profile.id === user.id ||
            followingIds.has(profile.id) ||
            followerIds.has(profile.id)
          ) {
            return false;
          }
          const theirLocation = profile.location;
          const theirTags = Array.isArray(profile.tag) ? profile.tag : [];
          const locationMatch =
            myLocation && theirLocation && myLocation === theirLocation;
          const tagMatch =
            myTags.length > 0 &&
            theirTags.length > 0 &&
            myTags.some((tag: string) => theirTags.includes(tag));
          return locationMatch || tagMatch;
        })
        .slice(0, 10) as Profile[];
      setSuggestedUsers(filtered);
      setLoading(false);
    };
    fetchSuggested();
  }, [user, myProfile]);

  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!user || !suggestedUsers.length) return;
      const { data: following } = await socialApi.follows.getFollowing(user.id);
      const followingIds = new Set(
        following?.map((f: { following_id: string }) => f.following_id) || []
      );
      const status: Record<string, boolean> = {};
      for (const profile of suggestedUsers) {
        status[profile.id] = followingIds.has(profile.id);
      }
      setFollowingStatus(status);
    };
    fetchFollowingStatus();
  }, [user, suggestedUsers]);

  const handleFollow = async (userId: string) => {
    if (!user) return;
    try {
      await socialApi.follows.followUser(user.id, userId);
      setFollowingStatus((prev) => ({ ...prev, [userId]: true }));
    } catch (error) {
      // handle error
    }
  };

  // Fetch all users for modal
  useEffect(() => {
    if (!seeAllOpen || !user || !myProfile) return;
    const fetchAll = async () => {
      setAllLoading(true);
      const { data: profiles } = await socialApi.profiles.getAll();
      const { data: following } = await socialApi.follows.getFollowing(user.id);
      const followingIds = new Set(
        (following || []).map((f: { following_id: string }) => f.following_id)
      );
      const { data: followers } = await socialApi.follows.getFollowers(user.id);
      const followerIds = new Set(
        (followers || []).map((f: { follower_id: string }) => f.follower_id)
      );
      setAllFollowingIds(followingIds);
      setAllFollowerIds(followerIds);
      const myLocation = myProfile.location;
      const myTags = Array.isArray(myProfile.tag) ? myProfile.tag : [];
      // Filter out current user, following, and followers, and apply location/tag filter
      const filtered = (profiles || []).filter((u: Profile) => {
        if (
          u.id === user.id ||
          followingIds.has(u.id) ||
          followerIds.has(u.id)
        ) {
          return false;
        }
        const theirLocation = u.location;
        const theirTags = Array.isArray(u.tag) ? u.tag : [];
        const locationMatch =
          myLocation && theirLocation && myLocation === theirLocation;
        const tagMatch =
          myTags.length > 0 &&
          theirTags.length > 0 &&
          myTags
            .map((tag: string) => tag.toLowerCase())
            .some((tag: string) => theirTags.map((t: string) => t.toLowerCase()).includes(tag));
        return locationMatch || tagMatch;
      }) as Profile[];
      setAllUsers(filtered);
      setFilteredUsers(filtered);
      setAllLoading(false);
      setModalVisibleCount(10);
    };
    fetchAll();
  }, [seeAllOpen, user, myProfile]);

  // Modal search logic: query Supabase directly when searching
  useEffect(() => {
    if (!seeAllOpen || !debouncedSearch) return;
    setSearchLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select()
          .or(
            `username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`
          )
          .limit(20);
        if (error) throw error;
        setFilteredUsers(data || []);
      } catch {
        setFilteredUsers([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedSearch, seeAllOpen]);

  // Filter users in modal (search and default) with location/tag logic
  useEffect(() => {
    if (search) return; // skip this effect if searching
    const myLocation = myProfile?.location;
    const myTags = Array.isArray(myProfile?.tag) ? myProfile.tag : [];
    const filterFn = (u: Profile) => {
      if (
        u.id === user?.id && user?.id !== undefined ||
        allFollowingIds.has(u.id) ||
        allFollowerIds.has(u.id)
      ) {
        return false;
      }
      const theirLocation = u.location;
      const theirTags = Array.isArray(u.tag) ? u.tag : [];
      const locationMatch =
        myLocation && theirLocation && myLocation === theirLocation;
      const tagMatch =
        myTags.length > 0 &&
        theirTags.length > 0 &&
        myTags
          .map((tag: string) => tag.toLowerCase())
          .some((tag: string) => theirTags.map((t: string) => t.toLowerCase()).includes(tag));

      return locationMatch || tagMatch;
    };
    setFilteredUsers(allUsers.filter(filterFn));
    setModalVisibleCount(10);
  }, [search, allUsers, allFollowingIds, allFollowerIds, myProfile, user?.id]);

  // Infinite scroll for modal user list
  const handleModalScroll = useCallback(() => {
    if (!modalListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = modalListRef.current;
    if (
      scrollTop + clientHeight >= scrollHeight - 40 &&
      modalVisibleCount < filteredUsers.length
    ) {
      setModalLoadingMore(true);
      setTimeout(() => {
        setModalVisibleCount((prev) =>
          Math.min(prev + 10, filteredUsers.length)
        );
        setModalLoadingMore(false);
      }, 400);
    }
  }, [modalVisibleCount, filteredUsers.length]);

  useEffect(() => {
    if (!seeAllOpen) return;
    const ref = modalListRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleModalScroll);
      return () => ref.removeEventListener("scroll", handleModalScroll);
    }
  }, [seeAllOpen, handleModalScroll]);

  // suggested user component hide
  if (!user || suggestedUsers.length === 0) return null;

  // For suggestions, show only 6 users
  const suggestedToShow = suggestedUsers.slice(0, 6);

  return (
    <div className="bg-white rounded-lg shadow p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className=" font-medium">Suggested for you</span>
        {suggestedToShow.length > 0 && (
          <button
            className="text-sm-red text-xs font-medium hover:underline"
            onClick={() => setSeeAllOpen(true)}
          >
            See all
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(suggestedToShow.length | 5)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col min-w-[80px] max-w-[80px] bg-gray-50 rounded-lg p-1 animate-pulse h-[120px] justify-between shadow-sm"
            >
              <div className="flex flex-col items-center flex-grow mt-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 mb-1" />
                <div className="h-2 w-12 bg-gray-200 rounded mb-0.5" />
                <div className="h-2 w-10 bg-gray-200 rounded mb-1" />
              </div>
              <div className="h-5 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : suggestedToShow.length === 0 ? (
        <div className="text-center text-sm text-gray-500">
          No suggestions available
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {suggestedToShow.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-col min-w-[80px] max-w-[80px] bg-gray-50 rounded-lg p-1 relative h-[120px] justify-between shadow-sm"
            >
              <div
                className="flex flex-col items-center flex-grow cursor-pointer"
                onClick={() => router.push(`/profile/${profile.id}`)}
              >
                <Avatar className="h-8 w-8 mt-4">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback>
                    {profile.username?.[0]?.toUpperCase() ||
                      profile.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-0.5 text-[10px] font-medium truncate w-full text-center">
                  {profile.full_name}
                  {profile.username && (
                    <p className="text-gray-500 text-[9px]">
                      @{profile.username}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="w-full text-[9px] px-0.5 py-0.5 rounded bg-sm-red text-white mt-1 h-5"
                variant={followingStatus[profile.id] ? "outline" : "default"}
                disabled={followingStatus[profile.id]}
                onClick={() => handleFollow(profile.id)}
              >
                {followingStatus[profile.id] ? "Following" : "Follow"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* See All Modal */}
      <Dialog open={seeAllOpen} onOpenChange={setSeeAllOpen}>
        <DialogContent
          className="w-full max-w-md mx-auto max-h-[70vh] rounded-2xl p-0 bg-white shadow-lg flex flex-col justify-center md:max-w-md md:rounded-2xl md:h-auto md:p-6 md:m-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 fixed inset-0"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "auto",
            maxHeight: "70vh",
            width: "90%",
            borderRadius: "1.25rem",
            background: "white",
            boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {/* Sticky header with close button only */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-end px-4 py-3 border-b">
            <button
              className="text-2xl text-gray-400 hover:text-gray-700 px-2"
              onClick={() => setSeeAllOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          {/* Sticky search bar */}
          <div className="sticky top-[56px] z-10 bg-white px-4 pt-2 pb-2 border-b">
            <input
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sm-red"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* User list with skeleton */}
          <div
            ref={modalListRef}
            className="flex-1 overflow-y-auto space-y-3 px-4 pb-4 pt-2"
          >
            {allLoading ? (
              <>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded p-2 animate-pulse"
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
              </>
            ) : searchLoading ? (
              <div className="text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-sm text-gray-500">
                No users found
              </div>
            ) : (
              filteredUsers.slice(0, modalVisibleCount).map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between bg-gray-50 rounded p-2"
                >
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      setSeeAllOpen(false);
                      router.push(`/profile/${profile.id}`);
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>
                        {profile.username?.[0]?.toUpperCase() ||
                          profile.full_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      {profile.username && (
                        <p className="text-xs text-gray-500">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-20 text-xs px-2 py-1 rounded bg-sm-red text-white"
                    variant={
                      followingStatus[profile.id] ? "outline" : "default"
                    }
                    disabled={followingStatus[profile.id]}
                    onClick={() => handleFollow(profile.id)}
                  >
                    {followingStatus[profile.id] ? "Following" : "Follow"}
                  </Button>
                </div>
              ))
            )}
            {modalLoadingMore && (
              <div className="flex flex-col gap-2 mt-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded p-2 animate-pulse"
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileSuggestedUsers;
