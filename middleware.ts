import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/wishlist"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Supabase auth token is typically stored in cookies (access_token or an array of tokens)
  const hasAccessToken =
    req.cookies.get("access_token") ||
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb:token") ||
    hasArrayToken(req);

  if (!hasAccessToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function hasArrayToken(req: NextRequest) {
  for (const c of req.cookies.getAll()) {
    try {
      const parsed = JSON.parse(c.value);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

export const config = {
  matcher: ["/wishlist/:path*", "/wishlist"],
};

