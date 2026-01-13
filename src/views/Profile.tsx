"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePostModal } from "@/contexts/PostModalProvider";
import { storeRedirectPath } from "@/lib/utils/routeRemember";
import {
  Settings,
  LogOut,
  Grid,
  Heart,
  Bookmark,
  MessageSquare,
  User,
  UserPlus,
  UserCheck,
  MapPin,
  Calendar,
  Link as LinkIcon,
  X,
  Phone,
  Shield,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/social/PostCard";
import UserListModal from "@/components/social/UserListModal";
import { socialApi } from "@/integrations/supabase/modules/social";
import { ProfileSkeleton } from "@/lib/profileSkeliton";
import type { PostWithProfile } from "@/integrations/supabase/modules/social";

interface ProfileProps {
  initialProfile?: Record<string, unknown> | null;
  initialStats?: { posts: number; followers: number; following: number };
  initialPosts?: (PostWithProfile & { likes?: number; comments?: number })[];
  profileId?: string;
}

const Profile = ({ 
  initialProfile = null, 
  initialStats = { posts: 0, followers: 0, following: 0 },
  initialPosts = [],
  profileId: propProfileId
}: ProfileProps) => {
  const params = useParams();
  const id = propProfileId ?? (params?.id as string) ?? "";
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { openPost } = usePostModal();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(initialProfile);
  const [stats, setStats] = useState(initialStats);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [profileInfoModalOpen, setProfileInfoModalOpen] = useState(false);
  const [avatarExpandedOpen, setAvatarExpandedOpen] = useState(false);
  const [loading, setLoading] = useState(!initialProfile);

  const [posts, setPosts] = useState<PostWithProfile[]>(initialPosts);
  interface LikedPostItem {
    post_id: string;
    posts: PostWithProfile;
    likes?: number;
    comments?: number;
  }
  interface SavedPostItem {
    post_id: string;
    posts: PostWithProfile;
    likes?: number;
    comments?: number;
  }
  const [likedPosts, setLikedPosts] = useState<LikedPostItem[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostItem[]>([]);

  const [showFullBio, setShowFullBio] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle authentication and redirects
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    // If viewing own profile (no id in params) and not authenticated, redirect to auth
    if (!id && !isAuthenticated) {
      if (typeof window !== 'undefined' && window.location.pathname !== "/auth") {
        storeRedirectPath(window.location.pathname);
      }
      router.replace("/auth");
      return;
    }

    // If no id provided and user is authenticated, redirect to own profile
    if (!id && isAuthenticated && user?.id) {
      router.replace(`/profile/${user.id}`);
      return;
    }
  }, [id, isAuthenticated, authLoading, user?.id, router]);

  // SWR fetcher for posts
  const fetchPostsWithStats = async (userId: string) => {
    const { data: postsData } = await socialApi.posts.getByUserId(userId);
    if (!postsData?.length) return [];

    const postsWithStats = await Promise.all(
      postsData.map(async (post: any) => {
        const stats = await socialApi.posts.getPostStats(post.id);
        return { ...post, ...stats } as PostWithProfile & { likes?: number; comments?: number };
      })
    );
    return postsWithStats;
  };

  // SWR hook for posts caching - use initialPosts as fallback data
  const {
    data: cachedPosts = initialPosts,
    isLoading: postsLoading,
    mutate: mutatePosts,
  } = useSWR(
    id && !authLoading ? ['profile-posts', id] : null,
    () => fetchPostsWithStats(id!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Cache for 5 seconds
      keepPreviousData: true,
      fallbackData: initialPosts, // Use server-rendered posts as initial data
    }
  );

  useEffect(() => {
    // If no id, don't fetch (will be handled by redirect above)
    if (!id) {
      setLoading(false);
      return;
    }

    // If we have initial data from server, skip fetching and only fetch client-specific data
    if (initialProfile && initialStats) {
      setLoading(false);
      
      // Still need to check follow status and fetch liked/saved posts on client
      if (authLoading) return;

      const fetchClientData = async () => {
        // Only check following status if user is authenticated and viewing someone else's profile
        let isFollowingUser = false;
        if (isAuthenticated && user?.id && user.id !== id) {
          try {
            const { data: followData } = await socialApi.follows.checkIfFollowing(
              user.id,
              id
            );
            isFollowingUser = !!followData;
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }

        // Only fetch liked and saved if viewing own profile and authenticated
        if (isAuthenticated && user?.id && user.id === id) {
          const { data: likedData } = await socialApi.posts.getLikedPostsByUser(
            user.id
          );
          const { data: savedData } = await socialApi.posts.getSavedPostsByUser(
            user.id
          );

          const likedWithStats = await Promise.all(
            (likedData || []).map(async (post: any) => {
              if (!post?.post_id) return null;
              const stats = await socialApi.posts.getPostStats(post.post_id);
              return { ...post, ...stats } as LikedPostItem;
            })
          ).then(results => results.filter((item): item is LikedPostItem => item !== null));

          const savedWithStats = await Promise.all(
            (savedData || []).map(async (post: any) => {
              if (!post?.post_id) return null;
              const stats = await socialApi.posts.getPostStats(post.post_id);
              return { ...post, ...stats } as SavedPostItem;
            })
          ).then(results => results.filter((item): item is SavedPostItem => item !== null));

          setLikedPosts(likedWithStats);
          setSavedPosts(savedWithStats);
        }

        setIsFollowing(isFollowingUser);
      };

      fetchClientData();
      return;
    }

    // Wait for auth to finish loading before fetching
    if (authLoading) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: profileData, error: profileError } =
        await socialApi.profiles.getById(id);
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setLoading(false);
        return;
      }

      const statsData = await socialApi.profiles.getStats(id);
      
      // Only check following status if user is authenticated and viewing someone else's profile
      let isFollowingUser = false;
      if (isAuthenticated && user?.id && user.id !== id) {
        try {
          const { data: followData } = await socialApi.follows.checkIfFollowing(
            user.id,
            id
          );
          isFollowingUser = !!followData;
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }

      // Only fetch liked and saved if viewing own profile and authenticated
      if (isAuthenticated && user?.id && user.id === id) {
        const { data: likedData } = await socialApi.posts.getLikedPostsByUser(
          user.id
        );
        const { data: savedData } = await socialApi.posts.getSavedPostsByUser(
          user.id
        );

        const likedWithStats = await Promise.all(
          (likedData || []).map(async (post: any) => {
            if (!post?.post_id) return null;
            const stats = await socialApi.posts.getPostStats(post.post_id);
            return { ...post, ...stats } as LikedPostItem;
          })
        ).then(results => results.filter((item): item is LikedPostItem => item !== null));

        const savedWithStats = await Promise.all(
          (savedData || []).map(async (post: any) => {
            if (!post?.post_id) return null;
            const stats = await socialApi.posts.getPostStats(post.post_id);
            return { ...post, ...stats } as SavedPostItem;
          })
        ).then(results => results.filter((item): item is SavedPostItem => item !== null));

        setLikedPosts(likedWithStats);
        setSavedPosts(savedWithStats);
      }

      setProfile(profileData);
      setStats(statsData);
      setIsFollowing(isFollowingUser);
      setLoading(false);
    };

    fetchData();
  }, [id, user?.id, isAuthenticated, authLoading, initialProfile, initialStats]);

  // Update posts from SWR cache (only if we have new data from SWR)
  useEffect(() => {
    if (cachedPosts && cachedPosts.length > 0) {
      setPosts(cachedPosts);
    } else if (initialPosts && initialPosts.length > 0 && posts.length === 0) {
      // Fallback to initialPosts if SWR hasn't loaded yet
      setPosts(initialPosts);
    }
  }, [cachedPosts, initialPosts, posts.length]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined' && window.location.pathname !== "/auth") {
        storeRedirectPath(window.location.pathname);
      }
      router.push("/auth");
      return;
    }
    if (!user?.id || !id) return;
    try {
      await socialApi.follows.followUser(user.id, id);
      setIsFollowing(true);
      setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined' && window.location.pathname !== "/auth") {
        storeRedirectPath(window.location.pathname);
      }
      router.push("/auth");
      return;
    }
    if (!user?.id || !id) return;
    try {
      await socialApi.follows.unfollowUser(user.id, id);
      setIsFollowing(false);
      setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

  const handleFollowersClick = async () => {
    try {
      const { data, error } = await socialApi.follows.getFollowers(id!);
      if (error) throw error;
      setFollowersModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
    }
  };

  const handleFollowingClick = async () => {
    try {
      const { data, error } = await socialApi.follows.getFollowing(id!);
      if (error) throw error;
      setFollowingModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch following:", err);
    }
  };

  // Show loading state while auth is loading or data is loading
  if (authLoading || (loading && !profile)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProfileSkeleton />
        <Footer />
      </div>
    );
  }

  // If not authenticated and viewing own profile, show nothing (redirect will happen)
  if (!id && !isAuthenticated) {
    return null;
  }

  // If no profile found after loading
  if (!loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6 text-center">User not found.</div>
        <Footer />
      </div>
    );
  }

  // If still loading profile
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProfileSkeleton />
        <Footer />
      </div>
    );
  }

  const handleImageError = (postId: string) => {
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });
  };

  // Helper to check if post has valid media
  const hasValidMedia = (post: PostWithProfile) => {
    const hasMedia = post.media_urls && post.media_urls.length > 0 && post.media_urls[0];
    const notFailed = !failedImages.has(post.id);
    return hasMedia && notFailed;
  };

  const renderPostGrid = (postsArray: (PostWithProfile & { likes?: number; comments?: number })[]) => {
    // Filter out posts without valid media URLs or failed images
    const validPosts = postsArray.filter((post) => hasValidMedia(post));

    if (validPosts.length === 0) {
      return <div className="text-center text-gray-500 py-8">No posts available yet.</div>;
    }

    return (
      <div 
        className="columns-2 sm:columns-3"
        style={{ columnGap: '2px' }}
      >
        {validPosts.map((post: PostWithProfile & { likes?: number; comments?: number }) => {
          const mediaUrl = post.media_urls?.[0];
          if (!mediaUrl) return null;
          
          const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
          return (
          <div
            key={post.id}
              className="relative cursor-pointer group overflow-hidden rounded-sm mb-0.5 sm:mb-1 break-inside-avoid"
              style={{ marginBottom: '2px', display: failedImages.has(post.id) ? 'none' : 'block' }}
             onClick={() => {
               sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
               openPost(post.id);
             }}
          >
              {isVideo ? (
                <>
                  <div className="relative w-full bg-gray-200" style={{ minHeight: '200px' }}>
              <video
                      src={mediaUrl}
                      className="w-full h-auto object-cover"
                controls={false}
                muted
                preload="metadata"
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        if (video.videoWidth && video.videoHeight) {
                          const aspectRatio = video.videoHeight / video.videoWidth;
                          video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
                        }
                      }}
                      onError={() => handleImageError(post.id)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/80">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative w-full" style={{ display: failedImages.has(post.id) ? 'none' : 'block' }}>
                  <Image
                    src={mediaUrl}
                alt="Post"
                    width={400}
                    height={400}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    onError={() => handleImageError(post.id)}
                    onLoadingComplete={() => {
                      // Image loaded successfully, ensure it's visible
                      if (failedImages.has(post.id)) {
                        setFailedImages((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(post.id);
                          return newSet;
                        });
                      }
                    }}
                    unoptimized={mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:')}
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-4 sm:gap-6 transition-opacity duration-200">
                <div className="flex items-center space-x-1.5">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                  <span className="text-sm sm:text-base font-semibold">{(post as any).likes ?? post.likes_count ?? 0}</span>
              </div>
                <div className="flex items-center space-x-1.5">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                  <span className="text-sm sm:text-base font-semibold">{(post as any).comments ?? post.comments_count ?? 0}</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    );
  };

  // @ts-ignore - TypeScript inference issue with complex conditional rendering in Dialog
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {(loading && <ProfileSkeleton />) || (
        <>
          <main className="pb-20">
            {/* Profile Header */}
            <div className="mb-6  bg-white shadow overflow-hidden">
              {/* Cover Image Section */}
              <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-gray-200 to-gray-300">
                {profile.cover_url ? (
                  <img
                    src={profile?.cover_url as string}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
                <button
                  type="button"
                  className="absolute left-1/2 md:left-16 -translate-x-1/2 md:-translate-x-0 md:translate-y-3/4 z-10 p-0 border-none bg-transparent cursor-pointer focus:outline-none rounded-full"
                  style={{ bottom: "-72px", width: "144px", height: "144px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setProfileInfoModalOpen(true);
                  }}
                  aria-label="View profile information"
                >
                  <div className="overflow-hidden rounded-full border-4 border-white shadow-2xl bg-white w-full h-full flex items-center justify-center md:mt-7 hover:border-blue-300 transition-colors">
                    <Avatar className="h-36 w-36 mx-auto md:mx-0 transition-transform duration-300 ease-in-out hover:scale-110 pointer-events-none">
                      <AvatarImage
                        src={profile.avatar_url as string}
                        alt={profile.name as string}
                        className="object-cover w-full h-full rounded-full pointer-events-none"
                      />
                      <AvatarFallback className="pointer-events-none">
                        {(profile.username as string | undefined)?.[0]?.toUpperCase() ||
                          (profile.full_name as string | undefined)?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </button>
              </div>

              {/* Profile Content */}
              <div className="relative px-6 pb-6 pt-24 md:pt-8 flex flex-col md:flex-row md:items-end">
                {/* Mobile Edit Profile Icon */}
                {/* {user?.id === profile.id && (
                  <button
                     onClick={() => router.push("/settings")}
                    className="absolute right-4 top-5 md:hidden bg-white rounded-full p-2 shadow z-20"
                    title="Edit Profile"
                    style={{ transform: "translateY(-10px)" }}
                  >
                    <Settings className="h-5 w-5 text-gray-700" />
                  </button>
                )} */}
                {/* Spacer for avatar on desktop */}
                <div className="hidden md:block md:w-48 lg:w-56 xl:w-64" />
                {/* Profile Info and Actions Container */}
                <div className="flex-1">
                  {/* Profile Info */}
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold">
                        {(profile.full_name as string | undefined) || "User"}
                      </h1>
                      {(profile.is_verified as boolean | undefined) && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-blue-500 text-white text-xs px-2  h-auto"
                        >
                          verified
                        </Badge>
                      )}
                    </div>
                    {(profile?.username as string | undefined) && (
                      <p className="text-gray-500 md:text-base ">
                        @{profile?.username as string}
                      </p>
                    )}
                    {(profile.tag as string[] | undefined) &&
                      Array.isArray(profile.tag) &&
                      profile.tag.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(profile.tag as string[]).map((tag: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-sm"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    {/* Bio with Show More */}
                    {(profile.bio as string | undefined) && (
                      <div className="mt-4 text-gray-700">
                        <span>
                          {showFullBio || (profile.bio as string).length <= 60
                            ? (profile.bio as string)
                            : (profile.bio as string).slice(0, 60) + "..."}
                        </span>
                        {(profile.bio as string).length > 60 && (
                          <div>
                            <button
                              className="mt-1 text-blue-500 hover:underline text-sm block"
                              onClick={() => setShowFullBio((prev) => !prev)}
                            >
                              {showFullBio ? "Show less" : "Show more"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}

                    {/* Location and Website: stack on mobile, inline on desktop */}
                    <div className="mt-4 flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3  text-sm text-gray-500">
                      {(profile.location as string | undefined) && (
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          <span>{profile.location as string}</span>
                        </div>
                      )}
                      {(profile.website as string | undefined) && (
                        <div className="flex items-center max-w-xs md:mr-2">
                          <LinkIcon className="mr-1 h-4 w-4 shrink-0" />
                          <a
                            href={`https://${profile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {profile.website as string}
                          </a>
                        </div>
                      )}
                      {(profile.joined_date as string | undefined) && (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          <span>Joined {profile.joined_date as string}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                      <button
                        onClick={handleFollowersClick}
                        className="flex cursor-pointer space-x-1 hover:underline"
                      >
                        <span className="font-bold">
                          {stats.followers.toLocaleString()}
                        </span>
                        <span className="text-gray-500">Followers</span>
                      </button>
                      <button
                        onClick={handleFollowingClick}
                        className="flex cursor-pointer space-x-1 hover:underline"
                      >
                        <span className="font-bold">
                          {stats.following.toLocaleString()}
                        </span>
                        <span className="text-gray-500">Following</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold">
                          {stats.posts.toLocaleString()}
                        </span>
                        <span className="text-gray-500">Posts</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="mt-4">
                    {user?.id !== (profile.id as string) ? (
                      <div className="flex gap-2 w-full md:w-auto">
                        {isFollowing ? (
                          <Button
                            variant="outline"
                            onClick={handleUnfollow}
                            className="flex-1 md:flex-none flex items-center justify-center"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Following</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={handleFollow}
                            className="flex-1 md:flex-none flex items-center justify-center"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Follow</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 md:flex-none flex items-center justify-center"
                           onClick={() => router.push(`/messenger/${profile.id as string}`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Message</span>
                        </Button>
                      </div>
                    ) : (
                       <NextLink href="/settings" className="w-full md:w-auto">
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Edit Profile</span>
                        </Button>
                      </NextLink>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs - Make more mobile friendly */}
            <Tabs
              defaultValue="posts"
              className="w-full mt-6"
              onValueChange={setActiveTab}
            >
              <TabsList
                className={`grid w-full ${
                  user?.id === id ? "grid-cols-3" : "grid-cols-1"
                } bg-white`}
              >
                <TabsTrigger
                  value="posts"
                  className="flex items-center justify-center w-full"
                >
                  <Grid className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Posts</span>
                </TabsTrigger>

                {user?.id === id && (
                  <>
                    <TabsTrigger
                      value="liked"
                      className="flex items-center justify-center w-full"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Liked</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="saved"
                      className="flex items-center justify-center w-full"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Saved</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="posts" className="mt-6 pr-2 pl-2">
                {renderPostGrid(posts)}
              </TabsContent>
              {user?.id === id && (
                <TabsContent value="liked" className="mt-6 pr-2 pl-2">
                  {likedPosts.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center ">
                      <Heart className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-xl font-medium">
                        No liked posts yet
                      </h3>
                      <p className="mt-2 text-gray-500">
                        When you like a post, it will appear here.
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="columns-2 sm:columns-3"
                      style={{ columnGap: '2px' }}
                    >
                      {likedPosts
                        .filter((item) => item.posts && hasValidMedia(item.posts))
                        .map((item: LikedPostItem) => {
                        const post = item.posts;
                        if (!post) return null;
                        const mediaUrl = post.media_urls?.[0];
                        if (!mediaUrl) return null;
                        
                        const likes = item.likes ?? 0;
                        const comments = item.comments ?? 0;
                        const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
                        return (
                          <div
                            key={post.id}
                            className="relative group cursor-pointer overflow-hidden rounded-sm mb-0.5 sm:mb-1 break-inside-avoid"
                            style={{ marginBottom: '2px', display: failedImages.has(post.id) ? 'none' : 'block' }}
                             onClick={() => {
               sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
               openPost(post.id);
             }}
                          >
                            {isVideo ? (
                              <>
                                <div className="relative w-full bg-gray-200" style={{ minHeight: '200px' }}>
                              <video
                                    src={mediaUrl}
                                    className="w-full h-auto object-cover"
                                controls={false}
                                muted
                                preload="metadata"
                                    onLoadedMetadata={(e) => {
                                      const video = e.currentTarget;
                                      if (video.videoWidth && video.videoHeight) {
                                        const aspectRatio = video.videoHeight / video.videoWidth;
                                        video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
                                      }
                                    }}
                                    onError={() => handleImageError(post.id)}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/80">
                                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="relative w-full" style={{ display: failedImages.has(post.id) ? 'none' : 'block' }}>
                                <Image
                                src={mediaUrl}
                                alt="Post"
                                  width={400}
                                  height={400}
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                  onError={() => handleImageError(post.id)}
                                  onLoadingComplete={() => {
                                    if (failedImages.has(post.id)) {
                                      setFailedImages((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.delete(post.id);
                                        return newSet;
                                      });
                                    }
                                  }}
                                  unoptimized={mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:')}
                                />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-4 sm:gap-6 transition-opacity duration-200">
                              <div className="flex items-center space-x-1.5">
                                <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                <span className="text-sm sm:text-base font-semibold">{likes}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                <span className="text-sm sm:text-base font-semibold">{comments}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              )}

              {user?.id === id && (
                <TabsContent value="saved" className="mt-6 pr-2 pl-2">
                  {savedPosts.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                      <Bookmark className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-xl font-medium">
                        No saved posts yet
                      </h3>
                      <p className="mt-2 text-gray-500">
                        When you save a post, it will appear here for easy
                        access.
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="columns-2 sm:columns-3"
                      style={{ columnGap: '2px' }}
                    >
                      {savedPosts
                        .filter((item) => item.posts && hasValidMedia(item.posts))
                        .map((item: SavedPostItem) => {
                        const post = item.posts;
                        if (!post) return null;
                        const mediaUrl = post.media_urls?.[0];
                        if (!mediaUrl) return null;
                        
                        const likes = item.likes ?? 0;
                        const comments = item.comments ?? 0;
                        const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
                        return (
                          <div
                            key={post.id}
                            className="relative group cursor-pointer overflow-hidden rounded-sm mb-0.5 sm:mb-1 break-inside-avoid"
                            style={{ marginBottom: '2px', display: failedImages.has(post.id) ? 'none' : 'block' }}
                            onClick={() =>
                               router.push(`/social/post/${post.id}`)
                            }
                          >
                            {isVideo ? (
                              <>
                                <div className="relative w-full bg-gray-200" style={{ minHeight: '200px' }}>
                                  <video
                                    src={mediaUrl}
                                    className="w-full h-auto object-cover"
                                    controls={false}
                                    muted
                                    preload="metadata"
                                    onLoadedMetadata={(e) => {
                                      const video = e.currentTarget;
                                      if (video.videoWidth && video.videoHeight) {
                                        const aspectRatio = video.videoHeight / video.videoWidth;
                                        video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
                                      }
                                    }}
                                    onError={() => handleImageError(post.id)}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/80">
                                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="relative w-full" style={{ display: failedImages.has(post.id) ? 'none' : 'block' }}>
                                <Image
                                  src={mediaUrl}
                                  alt="Post"
                                  width={400}
                                  height={400}
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                  onError={() => handleImageError(post.id)}
                                  onLoadingComplete={() => {
                                    if (failedImages.has(post.id)) {
                                      setFailedImages((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.delete(post.id);
                                        return newSet;
                                      });
                                    }
                                  }}
                                  unoptimized={mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:')}
                                />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-4 sm:gap-6 transition-opacity duration-200">
                              <div className="flex items-center space-x-1.5">
                                <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                <span className="text-sm sm:text-base font-semibold">{likes}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                <span className="text-sm sm:text-base font-semibold">{comments}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </main>

          <UserListModal
            open={followersModalOpen}
            onOpenChange={setFollowersModalOpen}
            userId={id!}
            type="followers"
            title="Followers"
          />

          <UserListModal
            open={followingModalOpen}
            onOpenChange={setFollowingModalOpen}
            userId={id!}
            type="following"
            title="Following"
          />
        </>
      )}

       <>
          <Dialog open={profileInfoModalOpen} onOpenChange={setProfileInfoModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 flex-shrink-0">
            <DialogTitle className="text-xl font-bold">
              Profile Information
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 scrollbar-hide">
            {profile !== null ? (
              <div className="space-y-4 px-4 pb-4">
                {/* Avatar - Clickable */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAvatarExpandedOpen(true)}
                    className="cursor-pointer focus:outline-none rounded-full transition-transform hover:scale-105"
                  >
                    <Avatar className="h-32 w-32 border-4 border-gray-200 shadow-lg">
                      <AvatarImage
                        src={profile?.avatar_url as string}
                        alt={profile?.full_name as string}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-3xl">
                        {(profile?.username as string | undefined)?.[0]?.toUpperCase() ||
                          (profile?.full_name as string | undefined)?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </div>

                {/* Name and Username */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">
                      {(profile?.full_name as string | undefined) || "User"}
                    </h2>
                    {(profile?.is_verified as boolean | undefined) ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-500 text-white text-xs px-2 h-auto"
                      >
                        verified
                      </Badge>
                    ) : null}
                  </div>
                  {(profile?.username as string | undefined) ? (
                    <p className="text-gray-500 text-base">@{profile.username as string}</p>
                  ) : null}
                </div>

                <Separator className="my-3" />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center py-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Posts</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Following</div>
                  </div>
                </div>

                {/* Bio */}
                {(profile?.bio as string | undefined) ? (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">Bio</h3>
                      <p className="text-gray-700 leading-relaxed">{profile.bio as string}</p>
                    </div>
                  </>
                ) : null}

                {/* Tags */}
                {(() => {
                  const tags = profile.tag;
                  if (Array.isArray(tags) && tags.length > 0) {
                    return (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {(tags as string[]).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}

                {/* Contact Information */}
                <Separator className="my-3" />
                <div className="space-y-3 text-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  {(profile?.location as string | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <span>{profile.location as string}</span>
                    </div>
                  ) : null}
                  {(profile?.mobile_phone as string | undefined) && (profile?.phone_verified as boolean | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <Phone className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <span>{profile.mobile_phone as string}</span>
                      <div title="Verified">
                        <CheckCircle2 className="ml-2 h-3 w-3 text-green-500" />
                      </div>
                    </div>
                  ) : null}
                  {(profile?.website as string | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <LinkIcon className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <a
                        href={`https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline break-all"
                      >
                        {profile.website as string}
                      </a>
                    </div>
                  ) : null}
                </div>

                {/* Account Information */}
                <Separator className="my-3" />
                <div className="space-y-3 text-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                  {(profile?.joined_date as string | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <span>Joined {profile.joined_date as string}</span>
                    </div>
                  ) : null}
                  {(profile?.last_seen as string | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <Clock className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <span>Last seen {new Date(profile.last_seen as string).toLocaleDateString()}</span>
                    </div>
                  ) : null}
                  {(profile?.role as string | undefined) ? (
                    <div className="flex items-center text-gray-600">
                      <Shield className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="capitalize">{profile.role as string}</span>
                    </div>
                  ) : null}
                </div>

                {/* Vendor Information */}
                {(profile?.is_vendor as boolean | undefined) ? (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-3 text-sm">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        Vendor Information
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Verified Vendor
                        </Badge>
                      </div>
                      {(() => {
                        const categories = profile.vendor_categories;
                        if (Array.isArray(categories) && categories.length > 0) {
                          return (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Categories:</p>
                              <div className="flex flex-wrap gap-1">
                                {(categories as string[]).map((category: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {category}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Loading profile information...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog> 
       
       </>
        
<>
      
      {profile?.avatar_url && (
        <Dialog open={avatarExpandedOpen} onOpenChange={setAvatarExpandedOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
            <div className="relative flex items-center justify-center min-h-[60vh] max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setAvatarExpandedOpen(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={profile.avatar_url as string}
                alt={profile?.full_name as string || "Profile picture"}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}</>
      <Footer />
    </div>
  );
};

export default Profile;
