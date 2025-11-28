import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

type SimEntityType = "event" | "league" | "garage" | "product";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, entityType } = body as {
      id?: string;
      action?: string;
      entityType?: SimEntityType;
    };

    // Revalidate all cached sim-racing data and the /sim-racing page
    revalidateTag("sim-racing","max");
    revalidatePath("/sim-racing");

    // Optionally revalidate specific detail pages based on entity type
    if (id && entityType) {
      switch (entityType) {
        case "event":
          revalidatePath(`/sim-racing/events/${id}`);
          break;
        case "league":
          revalidatePath(`/sim-racing/leagues/${id}`);
          break;
        case "garage":
          revalidatePath(`/sim-racing/garages/${id}`);
          break;
        case "product":
          revalidatePath(`/sim-racing/products/${id}`);
          break;
        default:
          break;
      }
    }

    return NextResponse.json({
      revalidated: true,
      tag: "sim-racing",
      path: "/sim-racing",
      action: action ?? "unknown",
      entityType: entityType ?? null,
      id: id ?? null,
    });
  } catch (error) {
    console.error("Error revalidating sim-racing:", error);
    return NextResponse.json(
      {
        revalidated: false,
        error: (error as Error)?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}


