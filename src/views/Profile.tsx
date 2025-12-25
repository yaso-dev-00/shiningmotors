"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { usePostModal } from "@/contexts/PostModalProvider";
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
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/social/PostCard";
import UserListModal from "@/components/social/UserListModal";
import { socialApi } from "@/integrations/supabase/modules/social";
import { ProfileSkeleton } from "@/lib/profileSkeliton";
import type { PostWithProfile } from "@/integrations/supabase/modules/social";

const Profile = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { user } = useAuth();
  const router = useRouter();
  const { openPost } = usePostModal();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<PostWithProfile[]>([]);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id || !user?.id) return;

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
      const followingCheck = await socialApi.follows.checkIfFollowing(
        user.id,
        id
      );

      const { data: postsData } = await socialApi.posts.getByUserId(id);
      let postsWithStats: (PostWithProfile & { likes?: number; comments?: number })[] = [];

      if (postsData?.length) {
        postsWithStats = await Promise.all(
          postsData.map(async (post: any) => {
            const stats = await socialApi.posts.getPostStats(post.id);
            return { ...post, ...stats } as PostWithProfile & { likes?: number; comments?: number };
          })
        );
      }

      // Only fetch liked and saved if viewing own profile
      if (user.id === id) {
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
      setIsFollowing(!!followingCheck.data);
      setPosts(postsWithStats);
      setLoading(false);
    };

    fetchData();
  }, [id, user?.id]);

  const handleFollow = async () => {
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

  if (!loading && !profile)
    return <div className="p-6 text-center">User not found.</div>;

  if (!profile) return null;

  const renderPostGrid = (postsArray: (PostWithProfile & { likes?: number; comments?: number })[]) =>
    postsArray.length === 0 ? (
      <div className="text-center text-gray-500">No posts available yet.</div>
    ) : (
      <div className="grid grid-cols-3 gap-4">
        {postsArray.map((post: PostWithProfile & { likes?: number; comments?: number }) => (
          <div
            key={post.id}
            className="relative cursor-pointer group"
             onClick={() => {
               sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
               openPost(post.id);
             }}
          >
            {post.media_urls?.[0] &&
            post.media_urls[0].match(/\.(mp4|mov|webm)$/i) ? (
              <video
                src={post.media_urls[0]}
                className="w-full h-full object-cover rounded-md"
                controls={false}
                muted
                preload="metadata"
              />
            ) : (
              <img
                src={post.media_urls?.[0]}
                alt="Post"
                className="aspect-square w-full object-cover rounded-md"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-4 transition">
              <div className="flex items-center space-x-1">
                <Heart className="w-5 h-5" />
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-5 h-5" />
                <span>{post.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );

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
                <div
                  className="absolute left-1/2 md:left-16 -translate-x-1/2 md:-translate-x-0 md:translate-y-3/4"
                  style={{ bottom: "-72px", width: "144px", height: "144px" }}
                >
                  <div className="overflow-hidden rounded-full border-4 border-white shadow-2xl bg-white w-full h-full flex items-center justify-center md:mt-7">
                    <Avatar className="h-36 w-36 mx-auto md:mx-0 ">
                      <AvatarImage
                        src={profile.avatar_url as string}
                        alt={profile.name as string}
                        className="object-cover w-full h-full rounded-full transition-transform duration-300 ease-in-out hover:scale-110"
                      />
                      <AvatarFallback>
                        {(profile.username as string | undefined)?.[0]?.toUpperCase() ||
                          (profile.full_name as string | undefined)?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
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

              <TabsContent value="posts" className="mt-6">
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No posts available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 pr-2 pl-2">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="relative cursor-pointer group aspect-square"
                         onClick={() => {
               sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
               openPost(post.id);
             }}
                      >
                        {post.media_urls?.[0] &&
                        post.media_urls[0].match(/\.(mp4|mov|webm)$/i) ? (
                          <video
                            src={post.media_urls[0]}
                            className="w-full h-full object-cover rounded-md"
                            controls={false}
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={post.media_urls?.[0]}
                            alt="Post"
                            className="w-full h-full object-cover rounded-md"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-4 transition">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-5 h-5" />
                            <span>{(post as any).likes ?? post.likes_count ?? 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-5 h-5" />
                            <span>{(post as any).comments ?? post.comments_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                      {likedPosts.map((item: LikedPostItem) => {
                        const post = item.posts;
                        if (!post) return null;
                        const likes = item.likes ?? 0;
                        const comments = item.comments ?? 0;
                        return (
                          <div
                            key={post.id}
                            className="relative group cursor-pointer min-h-[200px] md:min-h-[400px]"
                             onClick={() => {
               sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
               openPost(post.id);
             }}
                          >
                            {post.media_urls?.[0] &&
                            post.media_urls[0].match(/\.(mp4|mov|webm)$/i) ? (
                              <video
                                src={post.media_urls[0]}
                                className="w-full h-full object-cover aspect-square rounded-md"
                                controls={false}
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={post.media_urls?.[0] || ""}
                                alt="Post"
                                className="w-full h-full object-cover aspect-square rounded-md"
                              />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white space-x-4 transition">
                              <div className="flex items-center space-x-1">
                                <Heart size={18} />
                                <span>{likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare size={18} />
                                <span>{comments}</span>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                      {savedPosts.map((item: SavedPostItem) => {
                        const post = item.posts;
                        if (!post) return null;
                        const likes = item.likes ?? 0;
                        const comments = item.comments ?? 0;
                        return (
                          <div
                            key={post.id}
                            className="relative group cursor-pointer min-h-[200px] md:min-h-[400px]"
                            onClick={() =>
                               router.push(`/social/post/${post.id}`)
                            }
                          >
                            {post.media_urls?.[0] &&
                            post.media_urls[0].match(
                              /\.(mp4|mov|webm)$/i
                            ) ? (
                              <video
                                src={post.media_urls[0]}
                                className="w-full h-full object-cover aspect-square rounded-md"
                                controls={false}
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={post.media_urls?.[0] || ""}
                                alt="Post"
                                className="w-full h-full object-cover aspect-square rounded-md"
                              />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white space-x-4 transition">
                              <div className="flex items-center space-x-1">
                                <Heart size={18} />
                                <span>{likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare size={18} />
                                <span>{comments}</span>
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
      <Footer />
    </div>
  );
};

export default Profile;
