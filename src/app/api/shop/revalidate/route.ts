import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action } = body;

    // Revalidate all cached shop data and the /shop page
    revalidateTag("shop","max");
    revalidatePath("/shop");

    // Optionally revalidate specific product detail page if id is provided
    if (id && action) {
      revalidatePath(`/shop/${id}`);
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Shop data revalidated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error revalidating shop data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

