import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { socialApi } from "@/integrations/supabase/modules/social";
import Profile from "@/views/Profile";
import type { PostWithProfile } from "@/integrations/supabase/modules/social";

// Allow dynamic routes not pre-rendered to be generated on-demand
export const dynamicParams = true;

// Fetch all profile IDs for static generation
export async function generateStaticParams() {
  try {
    const supabase = createServerClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id");

    if (error) {
      console.error("Error fetching profiles for static generation:", error);
      return [];
    }

    return (profiles || []).map((profile) => ({
      id: profile.id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

// Server-side data fetching functions with caching
async function getProfileData(id: string) {
  return unstable_cache(
    async () => {
      const { data, error } = await socialApi.profiles.getById(id);
      if (error) throw error;
      return data;
    },
    [`profile-${id}`],
    {
      tags: [`profile-${id}`],
      revalidate: false, // Revalidate only on-demand
    }
  )();
}

async function getProfileStats(id: string) {
  return unstable_cache(
    async () => {
      return await socialApi.profiles.getStats(id);
    },
    [`profile-stats-${id}`],
    {
      tags: [`profile-${id}`],
      revalidate: false,
    }
  )();
}

async function getProfilePosts(id: string): Promise<(PostWithProfile & { likes?: number; comments?: number })[]> {
  return unstable_cache(
    async () => {
      const { data: postsData } = await socialApi.posts.getByUserId(id);
      if (!postsData?.length) return [];

      const postsWithStats = await Promise.all(
        postsData.map(async (post: any) => {
          const stats = await socialApi.posts.getPostStats(post.id);
          return { ...post, ...stats } as PostWithProfile & { likes?: number; comments?: number };
        })
      );
      return postsWithStats;
    },
    [`profile-posts-${id}`],
    {
      tags: [`profile-${id}`],
      revalidate: false,
    }
  )();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  try {
    // Fetch all data in parallel
    const [profileData, statsData, postsData] = await Promise.all([
      getProfileData(id),
      getProfileStats(id),
      getProfilePosts(id),
    ]);

    if (!profileData) {
      notFound();
    }

    // Pass initial data to client component
    return (
      <Profile
        initialProfile={profileData}
        initialStats={statsData}
        initialPosts={postsData}
        profileId={id}
      />
    );
  } catch (error) {
    console.error("Error fetching profile data:", error);
    notFound();
  }
}
