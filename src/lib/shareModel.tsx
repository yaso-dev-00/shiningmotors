import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Link, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { MdAttachEmail } from "react-icons/md";
import { useEffect, useState } from "react";
import { socialApi, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendMessage } from "@/integrations/supabase/modules/chat";
import { useToast } from "@/hooks/use-toast";
import { StoryDialog, StoryDialogContent } from "@/components/ui/storyDialog";

interface User {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

interface FollowResult {
  profiles: {
    id?: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
}

export const ShareModal = ({ open, onClose, postId }: ShareModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!currentUserId) return;
    
    setLoadingUsers(true);
    try {
      // Fetch followers
      const { data: followersData } = await socialApi.follows.getFollowers(
        currentUserId
      );
      // Fetch following
      const { data: followingData } = await socialApi.follows.getFollowing(
        currentUserId
      );

      // Map to user objects (from profiles), only if valid
      const followerUsers = ((followersData || []) as FollowResult[])
        .map((item: FollowResult): User | null => {
          if (item && item.profiles && item.profiles.id) {
            return {
              id: item.profiles.id,
              username: item.profiles.username || undefined,
              full_name: item.profiles.full_name || undefined,
              avatar_url: item.profiles.avatar_url || undefined,
            };
          }
          return null;
        })
        .filter((u): u is User => u !== null);

      const followingUsers = ((followingData || []) as FollowResult[])
        .map((item: FollowResult): User | null => {
          if (item && item.profiles && item.profiles.id) {
            return {
              id: item.profiles.id,
              username: item.profiles.username || undefined,
              full_name: item.profiles.full_name || undefined,
              avatar_url: item.profiles.avatar_url || undefined,
            };
          }
          return null;
        })
        .filter((u): u is User => u !== null);

      // Combine and deduplicate by id
      const allUsers = [...followerUsers, ...followingUsers];
      const uniqueUsers = Array.from(
        new Map(allUsers.map((u: User) => [u.id, u])).values()
      );

      setUsers(uniqueUsers.slice(0, 10));
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all profiles for search
  const fetchAllProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data } = await socialApi.profiles.getAll();
      if (data) {
        setAllProfiles((data as User[]).map((profile: User) => ({
          id: profile.id,
          username: profile.username || undefined,
          full_name: profile.full_name || undefined,
          avatar_url: profile.avatar_url || undefined,
        })));
      }
    } catch (error: unknown) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value && allProfiles.length === 0) {
      fetchAllProfiles();
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    if (!open || !currentUserId) return;
    fetchUsers();
    setSelectedUsers([]);
    setSearch("");
    setAllProfiles([]);
  }, [open, currentUserId]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/social/post/${postId}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    onClose();
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this link with anyone.",
    });
  };

  // Filter users based on search
  const filteredUsers = search
    ? allProfiles.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleShare = async () => {
    if (!user?.id || !postId) return;
    await Promise.all(
      selectedUsers.map((receiverId) =>
        sendMessage({
          sender_id: user.id,
          receiver_id: receiverId,
          content: postId,
          message_type: "post",
        })
      )
    );
    onClose();
    toast({
      description: "Post shared",
      variant: "destructive",
    });
  };

  return (
    <StoryDialog open={open} onOpenChange={onClose}>
      <StoryDialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full max-w-md sm:max-w-lg rounded-xl flex flex-col justify-between min-h-[400px] md:w-[500px] p-2 sm:p-4"
        style={{
          maxWidth: "95%",
        }}
      >
        <div>
          <DialogHeader>
            <div className="flex flex-col gap-2 w-full">
              <DialogTitle className="text-center w-full">
                Share to...
              </DialogTitle>
              {/* Search bar */}
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                style={{ marginTop: 8, marginBottom: 12 }}
              />
            </div>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto max-h-[60vh] mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 overflow-y-auto max-h-[45vh] scrollbar-none p-4 pt-3 scrollbar-hide">
              {loadingProfiles && search ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 mb-2" />
                      <div className="h-3 w-14 bg-gray-200 rounded" />
                    </div>
                  ))}
                </>
              ) : loadingUsers && !search ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 mb-2" />
                      <div className="h-3 w-14 bg-gray-200 rounded" />
                    </div>
                  ))}
                </>
              ) : filteredUsers.length === 0 && search ? (
                <div className="col-span-5 text-center text-gray-400">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  const displayLetter = (
                    user.full_name?.[0] ||
                    user.username?.[0] ||
                    "U"
                  ).toUpperCase();
                  return (
                    <button
                      key={user.id}
                      className={`flex flex-col items-center border-2 transition-colors transition-transform duration-200 ease-in-out ${
                        isSelected
                          ? "border-red-200 bg-red-50 scale-110"
                          : "border-transparent scale-100 hover:scale-105"
                      } rounded-lg p-1 focus:outline-none w-20`}
                      onClick={() => handleUserSelect(user.id)}
                      type="button"
                      style={{ willChange: "transform" }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.username || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                          {displayLetter}
                        </div>
                      )}
                      <span
                        className="text-xs mt-1 truncate w-full text-center"
                        title={user.full_name || user.username || "User"}
                      >
                        {user.full_name || user.username || "User"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* Bottom row: show Share button if users selected, else WhatsApp/Copy Link icons */}
        {selectedUsers.length > 0 ? (
          <button
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg mt-4 transition-colors hover:bg-red-700"
            onClick={handleShare}
            type="button"
          >
            Share
          </button>
        ) : (
          <div className="flex justify-center gap-8 mt-4 border-t pt-4">
            <button
              onClick={() => {
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    `Check out this post: ${shareUrl}`
                  )}`,
                  "_blank"
                );
                onClose();
              }}
              className="p-3 rounded-full hover:bg-green-100 transition-colors"
              title="Share on WhatsApp"
              type="button"
            >
              <FaWhatsapp className=" w-6 h-6" />
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent("Check out this post!");
                const body = encodeURIComponent(shareUrl);
                window.open(`mailto:?subject=${subject}&body=${body}`);
                onClose();
              }}
              className="p-3 rounded-full hover:bg-red-100 transition-colors"
              title="Share via Email"
              type="button"
            >
              <MdAttachEmail className=" w-6 h-6" />
            </button>
            <button
              onClick={handleCopy}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              title="Copy Link"
              type="button"
            >
              <Link className="w-6 h-6" />
            </button>
          </div>
        )}
      </StoryDialogContent>
    </StoryDialog>
  );
};
