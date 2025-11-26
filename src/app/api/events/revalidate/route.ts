import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action } = body as { id?: string; action?: string };

    // Revalidate all cached event data and the /events page
    revalidateTag("events","max");
    revalidatePath("/events");

    // Optionally revalidate a specific event detail page
    if (id) {
      revalidatePath(`/events/${id}`);
    }

    return NextResponse.json({
      revalidated: true,
      tag: "events",
      path: "/events",
      action: action ?? "unknown",
      id: id ?? null,
    });
  } catch (error) {
    console.error("Error revalidating events:", error);
    return NextResponse.json(
      { revalidated: false, error: (error as Error)?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


