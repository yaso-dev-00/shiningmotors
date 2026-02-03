import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/wishlist"];

// Rate limiting for AI API
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Rate limits per tier (requests per hour)
const RATE_LIMITS = {
  free: 10,
  premium: 100,
  vendor: 200,
};

function getRateLimitKey(req: NextRequest): string | null {
  // Try to get user ID from cookies or headers
  const userId = req.cookies.get("user_id")?.value || 
                 req.headers.get("x-user-id");
  
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const ip = req.ip || 
             req.headers.get("x-forwarded-for")?.split(",")[0] ||
             req.headers.get("x-real-ip") ||
             "unknown";
  
  return `ip:${ip}`;
}

function checkRateLimit(req: NextRequest, tier: "free" | "premium" | "vendor" = "free"): boolean {
  const key = getRateLimitKey(req);
  if (!key) return true; // Allow if can't identify user
  
  const now = Date.now();
  const limit = RATE_LIMITS[tier];
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const record = rateLimitStore[key];
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return true;
  }
  
  if (record.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limiting for AI API
  if (pathname.startsWith("/api/ai/")) {
    // TODO: Get user tier from database/cookies
    // For now, default to free tier
    const tier: "free" | "premium" | "vendor" = "free";
    
    if (!checkRateLimit(req, tier)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
  }

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
  matcher: [
    "/wishlist/:path*", 
    "/wishlist",
    "/api/ai/:path*",
  ],
};

