"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { socialApi } from "@/integrations/supabase/client";
import {
  PostWithProfile,
  PostProfile,
} from "@/integrations/supabase/modules/social";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PostCardWrapper from "@/components/social/PostCardWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";

const PostDetail = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await socialApi.posts.getById(id);
        if (error) {
          console.error("Error fetching post:", error);
        }
        if (data) {
          const profile = data.profile as PostProfile;
          const postWithProfile = {
            ...data,
            category: data.category as
              | "Product"
              | "Vehicle"
              | "Experience"
              | null,
          };
          setPost(postWithProfile as PostWithProfile);

          if (user && user.id && profile.id) {
            const { data: followData } =
              await socialApi.follows.checkIfFollowing(user.id, profile.id);
            setIsFollowing(!!followData);
          }
        }
      } catch (error) {
        console.error("Error fetching post details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  console.log({ post });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto mt-2 p-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/social")}
            className="inline-flex items-center mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="w-full">
            <div className="lg:w-[50%] lg:relative lg:inset-x-1/4">
              <PostSkeleton />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Post Not Found</h2>
          <p className="text-gray-600">
            The post you are looking for does not exist or has been deleted.
          </p>
          <NextLink href="/social" className="mt-4">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Social Feed
            </Button>
          </NextLink>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto mt-2 p-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/social")}
          className="inline-flex items-center mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="w-full">
          <div className="lg:w-[50%] lg:relative lg:inset-x-1/4 ">
            <PostCardWrapper post={post} type="page"></PostCardWrapper>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Add PostSkeleton component for loading state
const PostSkeleton = () => (
  <Card className="overflow-hidden relative shadow-sm h-full hover:shadow-md transition-shadow cursor-pointer border-gray-200 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-center p-3 border-b">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-6 rounded-full bg-gray-200" />
    </div>
    {/* Media */}
    <div className="bg-gray-200 w-full h-[300px] md:h-[500px] flex items-center justify-center">
      <div className="w-3/4 h-3/4 bg-gray-300 rounded" />
    </div>
    {/* Content */}
    <div className="p-4">
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
    {/* Action buttons */}
    <div className="px-4 py-2 flex justify-between">
      <div className="flex space-x-4">
        <div className="h-6 w-6 rounded-full bg-gray-200" />
        <div className="h-6 w-6 rounded-full bg-gray-200" />
        <div className="h-6 w-6 rounded-full bg-gray-200" />
      </div>
      <div className="h-6 w-6 rounded-full bg-gray-200" />
    </div>
    {/* Likes count */}
    <div className="px-4 pt-1 pb-2">
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
    {/* Comments section skeleton */}
    <div className="px-4 pb-3 space-y-2">
      <div className="h-4 w-1/2 bg-gray-100 rounded" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-4 w-1/3 bg-gray-100 rounded" />
    </div>
  </Card>
);

export default PostDetail;
