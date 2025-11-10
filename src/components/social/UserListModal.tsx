import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { socialApi } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NextLink from "next/link";
import { StoryDialog, StoryDialogContent, StoryDialogHeader, StoryDialogTitle } from "../ui/storyDialog";

interface UserListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userId: string;
  type: "followers" | "following";
  onFollowChange?: () => void;
}

interface UserItemProps {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  isFollowing: boolean;
  onFollowChange: () => void;
  onClose: () => void;
}

interface UserData {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  isFollowing: boolean;
}

interface FollowerItem {
  follower_id: string;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

interface FollowingItem {
  following_id: string;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

const UserItem = ({
  userId,
  username,
  avatarUrl,
  fullName,
  isFollowing,
  onFollowChange,
  onClose,
}: UserItemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState(isFollowing);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
      });
      return;
    }

    setLoading(true);

    try {
      if (followed) {
        await socialApi.follows.unfollowUser(user.id, userId);
        toast({
          title: "Success",
          description: `You have unfollowed`,
        });
      } else {
        await socialApi.follows.followUser(user.id, userId);
        toast({
          title: "Success",
          description: `You are now following`,
        });
      }

      setFollowed(!followed);
      onFollowChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <NextLink
        href={`/profile/${userId}`}
        onClick={onClose}
        className="flex items-center gap-3 flex-1"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback>
            {(username?.[0] || fullName?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{username || "User"}</span>
          {fullName && (
            <span className="text-sm text-gray-500">{fullName}</span>
          )}
        </div>
      </NextLink>
      {user && (
        <Button
          variant={followed ? "outline" : "default"}
          size="sm"
          disabled={loading}
          onClick={handleFollowToggle}
        >
          {followed ? "Unfollow" : "Follow"}
        </Button>
      )}
    </div>
  );
};

// Skeleton component for user list
const UserListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

export const UserListModal = ({
  open,
  onOpenChange,
  title,
  userId,
  type,
  onFollowChange,
}: UserListModalProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    if (!open || !userId) return;
    setLoading(true);
    try {
      let userList: UserData[] = [];
      
      if (type === "followers") {
        const { data: followersData } = await socialApi.follows.getFollowers(
          userId
        );
        const data = (followersData || []) as unknown as FollowerItem[];
        
        userList = await Promise.all(
          data
            .filter((item) => {
              const profileId = item.follower_id;
              // Exclude the current user from the list
              return profileId !== user?.id;
            })
            .map(async (item) => {
              const profileId = item.follower_id;
              const profile = item.profiles;
              let isFollowing = false;
              if (user) {
                const { data: followCheck } =
                  await socialApi.follows.checkIfFollowing(user.id, profileId);
                isFollowing = !!followCheck;
              }
              return {
                id: profileId,
                username: profile?.username ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                fullName: profile?.full_name ?? null,
                isFollowing,
              };
            })
        );
      } else {
        const { data: followingData } = await socialApi.follows.getFollowing(
          userId
        );
        const data = (followingData || []) as unknown as FollowingItem[];
        
        userList = await Promise.all(
          data
            .filter((item) => {
              const profileId = item.following_id;
              // Exclude the current user from the list
              return profileId !== user?.id;
            })
            .map(async (item) => {
              const profileId = item.following_id;
              const profile = item.profiles;
              let isFollowing = false;
              if (user) {
                const { data: followCheck } =
                  await socialApi.follows.checkIfFollowing(user.id, profileId);
                isFollowing = !!followCheck;
              }
              return {
                id: profileId,
                username: profile?.username ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                fullName: profile?.full_name ?? null,
                isFollowing,
              };
            })
        );
      }
      
      setUsers(userList);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [open, userId, type, user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  return (
    <StoryDialog open={open}  >
      <StoryDialogContent className="sm:max-w-md px-3 py-3 md:w-[400px]"     style={{
          maxWidth: "95%",
borderRadius:"8px"

        }}>
        <StoryDialogHeader>
          <div className="flex items-center justify-between">
            <StoryDialogTitle>{title}</StoryDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </Button>
          </div>
        </StoryDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <UserListSkeleton count={users.length > 0 ? users.length : 5} />
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No {type === "followers" ? "followers" : "following"} yet
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((userData) => (
                <UserItem
                  key={userData.id}
                  userId={userData.id}
                  username={userData.username}
                  avatarUrl={userData.avatarUrl}
                  fullName={userData.fullName}
                  isFollowing={userData.isFollowing}
                  onFollowChange={loadUsers}
                  onClose={() => onOpenChange(false)}
                />
              ))}
            </div>
          )}
        </div>
      </StoryDialogContent>
    </StoryDialog>
  );
};

export default UserListModal;
