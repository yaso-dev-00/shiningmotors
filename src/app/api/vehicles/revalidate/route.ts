import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action } = body;

    // Revalidate all cached vehicles data and the /vehicles page
    revalidateTag("vehicles","max");
    revalidatePath("/vehicles");

    // Optionally revalidate specific vehicle detail page if id is provided
    if (id && action) {
      revalidatePath(`/vehicles/${id}`);
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Vehicles data revalidated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error revalidating vehicles data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

