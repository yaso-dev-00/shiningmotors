import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action, profileId } = body;

    // Revalidate all cached social data and the /social page
    revalidateTag("social", "max");
    revalidatePath("/social");

    // Revalidate specific post detail page if id and action are provided
    if (id && action) {
      revalidatePath(`/social/post/${id}`);
    }

    // Revalidate profile page if profileId is provided
    if (profileId) {
      revalidatePath(`/profile/${profileId}`);
      // Also revalidate the profile cache tags
      revalidateTag(`profile-${profileId}`, "max");
      revalidateTag(`profile-stats-${profileId}`, "max");
      revalidateTag(`profile-posts-${profileId}`, "max");
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Social data revalidated successfully",
      profileId: profileId || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error revalidating social data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

