import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { socialApi } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import NextLink from "next/link";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserCheck } from "lucide-react";

interface ProfileCardProps {
  profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
  isFollowing?: boolean;
  stats?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
  showFollow?: boolean;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const ProfileCard = ({
  profile,
  isFollowing: initialIsFollowing = false,
  stats,
  showFollow = true,
  onFollowersClick,
  onFollowingClick,
}: ProfileCardProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(stats?.followers || 0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !profile.id) return;

      try {
        const { data, error } = await supabase
          .from("user_follows")
          .select()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle();

        if (!error && data) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [user, profile.id]);

  const handleFollowToggle = async () => {
    if (!user || !profile.id) return;

    try {
      if (isFollowing) {
        // Unfollow user
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);

        // Remove from followers/following arrays
        await socialApi.follows.unfollowUser(user.id, profile.id);

        setFollowersCount((prev) => Math.max(0, prev - 1));
        setIsFollowing(false);
        toast({
          description: `Unfollowed ${
            profile.username || profile.full_name || "user"
          }`,
        });
      } else {
        // Follow user
        await supabase.from("user_follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        });

        // Add to followers/following arrays
        await socialApi.follows.followUser(user.id, profile.id);

        setFollowersCount((prev) => prev + 1);
        setIsFollowing(true);
        toast({
          description: `Following ${
            profile.username || profile.full_name || "user"
          }`,
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        variant: "destructive",
        description: "Failed to update follow status",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm">
      <div className="flex flex-col space-y-2">
        <NextLink
          href={`/profile/${profile.username || profile.id}`}
          className="flex items-center space-x-3"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={profile.avatar_url || ""}
              alt={profile.username || "User"}
            />
            <AvatarFallback>
              {(
                profile.username?.[0] ||
                profile.full_name?.[0] ||
                "U"
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {profile.full_name || profile.username || "User"}
            </h3>
            {profile.username && (
              <p className="text-sm text-gray-500">@{profile.username}</p>
            )}
          </div>
        </NextLink>

        {stats && (
          <div className="flex space-x-4 mt-1 text-sm text-gray-600">
            {stats.posts !== undefined && <span>{stats.posts} posts</span>}

            {stats.followers !== undefined || followersCount > 0 ? (
              <button
                className="hover:underline focus:outline-none"
                onClick={onFollowersClick}
              >
                <span>
                  {isFollowing
                    ? followersCount
                    : stats?.followers || followersCount}{" "}
                  followers
                </span>
              </button>
            ) : null}

            {stats.following !== undefined && (
              <button
                className="hover:underline focus:outline-none"
                onClick={onFollowingClick}
              >
                <span>{stats.following} following</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showFollow && user && user.id !== profile.id && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          onClick={handleFollowToggle}
          className="ml-4"
        >
          {isFollowing ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" /> Following
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ProfileCard;
