import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action } = body as { id?: string; action?: string };

    // Revalidate all cached service data and the /services page
    revalidateTag("services", "max");
    revalidatePath("/services");

    // Optionally revalidate a specific service detail page
    if (id) {
      revalidatePath(`/services/${id}`);
    }

    return NextResponse.json({
      revalidated: true,
      tag: "services",
      path: "/services",
      action: action ?? "unknown",
      id: id ?? null,
    });
  } catch (error) {
    console.error("Error revalidating services:", error);
    return NextResponse.json(
      { revalidated: false, error: (error as Error)?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}




