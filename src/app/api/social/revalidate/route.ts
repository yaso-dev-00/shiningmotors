import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action } = body;

    // Revalidate all cached social data and the /social page
    revalidateTag("social", "max");
    revalidatePath("/social");

    // Optionally revalidate specific post detail page if id is provided
    if (id && action) {
      revalidatePath(`/social/${id}`);
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Social data revalidated successfully",
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

