import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getRuleBasedResponse } from "@/lib/ai/rule-engine";
import { classifyQuery, shouldUseGPT35, shouldUseGPT4 } from "@/lib/ai/query-classifier";
import { canMakeAPICall, recordAPISuccess, recordAPIFailure } from "@/lib/ai/circuit-breaker";
import { optimizePrompt, getMinimalSystemPrompt } from "@/lib/ai/prompt-optimizer";
import { trackAPICall, trackCacheHit, trackCacheMiss, trackRuleMatch, trackError } from "@/lib/ai/analytics";

// Server-side cache (in-memory for now, can be replaced with Redis)
const serverCache = new Map<string, { response: string; expiresAt: number }>();

/**
 * Get user tier for rate limiting
 */
async function getUserTier(userId?: string): Promise<"free" | "premium" | "vendor"> {
  if (!userId) return "free";
  
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("role, is_vendor")
      .eq("id", userId)
      .single();
    
    if (data?.role === "VENDOR" || data?.is_vendor) return "vendor";
    if (data?.role === "PREMIUM") return "premium";
    return "free";
  } catch {
    return "free";
  }
}

/**
 * Check server-side cache (database first, then memory)
 */
async function getServerCached(queryHash: string, queryText: string): Promise<string | null> {
  try {
    // First check database cache
    const supabase = createServerClient();
    // @ts-ignore - AI tables not in TypeScript types yet
    const { data, error } = await (supabase as any)
      .from("ai_response_cache")
      .select("response_text, expires_at, cache_hits")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (data && !error) {
      // Update cache hits
      // @ts-ignore - AI tables not in TypeScript types yet
      await (supabase as any)
        .from("ai_response_cache")
        .update({ cache_hits: (data.cache_hits || 0) + 1 })
        .eq("query_hash", queryHash);
      
      return data.response_text;
    }
  } catch (err) {
    console.warn("Database cache check failed, using memory cache:", err);
  }

  // Fallback to memory cache
  const cached = serverCache.get(queryHash);
  if (!cached) return null;
  
  if (cached.expiresAt <= Date.now()) {
    serverCache.delete(queryHash);
    return null;
  }
  
  return cached.response;
}

/**
 * Set server-side cache (database + memory)
 */
async function setServerCache(
  queryHash: string, 
  queryText: string,
  response: string, 
  model?: string,
  tokens?: number,
  ttl: number = 7 * 24 * 60 * 60 * 1000
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttl);

  // Save to database
  try {
    const supabase = createServerClient();
    // @ts-ignore - AI tables not in TypeScript types yet
    await (supabase as any)
      .from("ai_response_cache")
      .upsert({
        query_hash: queryHash,
        query_text: queryText,
        response_text: response,
        model_used: model,
        tokens_used: tokens,
        expires_at: expiresAt.toISOString(),
        cache_hits: 0,
      }, {
        onConflict: "query_hash",
      });
  } catch (err) {
    console.warn("Failed to save to database cache, using memory only:", err);
  }

  // Also save to memory cache
  serverCache.set(queryHash, {
    response,
    expiresAt: Date.now() + ttl,
  });
  
  // Clean old entries periodically
  if (serverCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of serverCache.entries()) {
      if (value.expiresAt <= now) {
        serverCache.delete(key);
      }
    }
  }
}

/**
 * Hash query for cache key
 */
function hashQuery(query: string, userId?: string): string {
  const str = `${query}|${userId || ""}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Call OpenAI API (with fallback to mock for development)
 */
async function callOpenAI(
  model: "gpt-3.5-turbo" | "gpt-4",
  messages: Array<{ role: string; content: string }>,
  stream: boolean = false
): Promise<string> {
  // Check circuit breaker
  if (!canMakeAPICall()) {
    throw new Error("AI service temporarily unavailable. Please try again later.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  console.log(apiKey);
  
  // If no API key, use mock response for development
  if (!apiKey) {
    const mockResponses = [
      "I'd be happy to help you with that! Let me check our inventory for you.",
      "That's a great question! Based on your preferences, I'd recommend checking out our featured products section.",
      "I can help you find what you're looking for. Could you provide a bit more detail?",
    ];
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }
console.log(content,"success");   
    recordAPISuccess();
    return content;
  } catch (error) {
    recordAPIFailure();
    throw error;
  }
}

/**
 * Generate action buttons based on query and context
 */
function generateActionButtons(
  query: string,
  context: any,
  response: string
): any[] {
  const actions: any[] = [];
  const lowerQuery = query.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Cart-related actions
  if (lowerQuery.includes("cart") || lowerQuery.includes("checkout")) {
    if (context?.user?.cartItems?.length > 0) {
      actions.push({
        type: "navigate",
        label: "View Cart",
        path: "/shop/cart",
        icon: "cart",
      });
      actions.push({
        type: "navigate",
        label: "Checkout",
        path: "/shop/checkout",
        icon: "cart",
      });
    }
  }

  // Order-related actions
  if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
    if (context?.user?.orders?.length > 0) {
      actions.push({
        type: "navigate",
        label: "View Orders",
        path: "/shop/orders",
        icon: "cart",
      });
    }
  }

  // Product search actions
  if (lowerQuery.includes("product") || lowerQuery.includes("buy") || lowerQuery.includes("find")) {
    actions.push({
      type: "navigate",
      label: "Browse Shop",
      path: "/shop",
      icon: "cart",
    });
  }

  // Service booking actions
  if (lowerQuery.includes("service") || lowerQuery.includes("book")) {
    actions.push({
      type: "navigate",
      label: "Browse Services",
      path: "/services",
      icon: "calendar",
    });
  }

  // Event actions
  if (lowerQuery.includes("event") || lowerQuery.includes("race")) {
    actions.push({
      type: "navigate",
      label: "View Events",
      path: "/events",
      icon: "calendar",
    });
  }

  // Vendor map actions
  if (lowerQuery.includes("vendor") || lowerQuery.includes("mechanic") || lowerQuery.includes("near me")) {
    actions.push({
      type: "navigate",
      label: "Find Vendors",
      path: "/vendors/map",
      icon: "map",
    });
  }

  return actions;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let message = "";
  let userId: string | undefined = undefined;
  
  try {
    const body = await req.json();
    message = body.message;
    const { conversationHistory = [], context } = body;
    userId = body.userId;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Step 1: Check database pre-computed responses
    try {
      const supabase = createServerClient();
      // @ts-ignore - AI tables not in TypeScript types yet
      const { data: precomputed } = await (supabase as any)
        .from("ai_precomputed_responses")
        .select("response_text, priority, query_pattern")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (precomputed && precomputed.length > 0) {
        // Check if message matches any pattern (simple contains check)
        const lowerMessage = message.toLowerCase();
        for (const precomp of precomputed) {
          // Simple pattern matching (can be enhanced)
          if (precomp.query_pattern && lowerMessage.includes(precomp.query_pattern.toLowerCase())) {
            const responseTime = Date.now() - startTime;
            trackRuleMatch(responseTime, userId);
            return NextResponse.json({
              response: precomp.response_text,
              source: "precomputed",
              cached: false,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Pre-computed responses check failed:", err);
    }

    // Step 2: Check rule-based responses (fastest, no API call)
    const ruleResponse = getRuleBasedResponse(message);
    if (ruleResponse) {
      const responseTime = Date.now() - startTime;
      trackRuleMatch(responseTime, userId);
      return NextResponse.json({
        response: ruleResponse,
        source: "rule",
        cached: false,
      });
    }

    // Step 3: Check server-side cache (database + memory)
    const queryHash = hashQuery(message, userId);
    const cachedResponse = await getServerCached(queryHash, message);
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      trackCacheHit("server", responseTime, userId);
      return NextResponse.json({
        response: cachedResponse,
        source: "cache",
        cached: true,
      });
    }

    trackCacheMiss(userId, message);

    // Step 4: Fetch user interactions for personalization
    let userInteractionsInfo = "";
    if (userId) {
      try {
        const supabase = createServerClient();
        // @ts-ignore - AI tables not in TypeScript types yet
        const { data: interactions } = await (supabase as any)
          .from("user_interactions")
          .select("interaction_type, item_type, item_id, metadata, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20); // Get last 20 interactions

        if (interactions && interactions.length > 0) {
          // Group interactions by type
          const views = interactions.filter((i: any) => i.interaction_type === "view" && i.item_type === "product");
          const clicks = interactions.filter((i: any) => i.interaction_type === "click" && i.item_type === "product");
          const searches = interactions.filter((i: any) => i.interaction_type === "search");
          const addToCarts = interactions.filter((i: any) => i.interaction_type === "add_to_cart" && i.item_type === "product");

          // Build interaction summary
          const interactionParts: string[] = [];

          if (searches.length > 0) {
            const recentSearches = searches.slice(0, 5).map((s: any) => s.metadata?.query || "unknown").filter(Boolean);
            if (recentSearches.length > 0) {
              interactionParts.push(`Recent searches: ${recentSearches.join(", ")}`);
            }
          }

          if (views.length > 0) {
            const viewedProducts = views.slice(0, 5).map((v: any) => {
              const name = v.metadata?.productName || v.item_id;
              const category = v.metadata?.category ? ` (${v.metadata.category})` : "";
              return `${name}${category}`;
            }).filter(Boolean);
            if (viewedProducts.length > 0) {
              interactionParts.push(`Recently viewed products: ${viewedProducts.join(", ")}`);
            }
          }

          if (addToCarts.length > 0) {
            const cartedProducts = addToCarts.slice(0, 3).map((c: any) => {
              const name = c.metadata?.productName || c.item_id;
              return name;
            }).filter(Boolean);
            if (cartedProducts.length > 0) {
              interactionParts.push(`Recently added to cart: ${cartedProducts.join(", ")}`);
            }
          }

          // Extract interests from interactions
          const categories = new Set<string>();
          views.forEach((v: any) => {
            if (v.metadata?.category) categories.add(v.metadata.category);
          });
          clicks.forEach((c: any) => {
            if (c.metadata?.category) categories.add(c.metadata.category);
          });

          if (categories.size > 0) {
            interactionParts.push(`Interested categories: ${Array.from(categories).slice(0, 5).join(", ")}`);
          }

          if (interactionParts.length > 0) {
            userInteractionsInfo = `User Activity & Interests:\n${interactionParts.join("\n")}`;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user interactions:", err);
        // Continue without interaction data
      }
    }

    // Step 5: Classify query and select model
    const classification = classifyQuery(message);
    const model = classification.recommendedModel === "gpt-4" ? "gpt-4" : "gpt-3.5-turbo";

    // Step 6: Build enhanced system prompt with context
    const pageInfo = context?.page ? `Current page: ${context.page.pathname} (${context.page.pageType})` : "";
    const cartInfo = context?.user?.cartItems?.length > 0 
      ? `User has ${context.user.cartItems.length} items in cart: ${context.user.cartItems.slice(0, 3).map((item: any) => item.name).join(", ")}`
      : "User's cart is empty";
    const orderInfo = context?.user?.orders?.length > 0
      ? `User has ${context.user.orders.length} past orders`
      : "User has no past orders";
    const locationInfo = context?.user?.location ? `User location: ${context.user.location}` : "";

    const enhancedSystemPrompt = `You are a helpful AI assistant for Shining Motors, an automotive social platform.

Context:
${pageInfo}
${cartInfo}
${orderInfo}
${locationInfo}
${userInteractionsInfo ? `\n${userInteractionsInfo}` : ""}

You help users with:
- Finding products in the shop
- Understanding services offered
- Answering questions about events
- Helping with orders and bookings
- Finding vendors and mechanics
- General questions about the platform

IMPORTANT: Use the user's activity and interests to provide personalized recommendations and responses. 
- Reference their recent searches when relevant
- Suggest products based on what they've viewed or added to cart
- Acknowledge their interests in specific categories
- If they ask "what did I search for?" or "what products did I view?", use the activity data provided

Be friendly, concise, and helpful. Use the context provided to give personalized responses. If you don't know something, suggest they contact support.`;

    const systemPrompt = getMinimalSystemPrompt({
      hasCart: context?.user?.cartItems?.length > 0,
      hasOrders: context?.user?.orders?.length > 0,
      hasBookings: context?.user?.hasBookings,
    });

    // Use enhanced prompt for better context awareness
    const optimized = optimizePrompt(
      enhancedSystemPrompt,
      conversationHistory,
      message,
      {
        maxHistory: 5,
        maxSystemPromptLength: 800, // Increased for context
        maxMessageLength: 1000,
      }
    );

    // Step 6: Call AI API
    const aiResponse = await callOpenAI(model, [
      { role: "system", content: optimized.systemPrompt },
      ...optimized.messages,
    ]);

    // Step 8: Cache response (database + memory)
    const ttl = classification.complexity === "simple" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const estimatedTokens = optimized.tokenEstimate;
    await setServerCache(queryHash, message, aiResponse, model, estimatedTokens, ttl);

    // Step 9: Track analytics and save to database
    const responseTime = Date.now() - startTime;
    const cost = model === "gpt-4" 
      ? (estimatedTokens / 1000) * 0.03 
      : (estimatedTokens / 1000) * 0.0015;
    
    trackAPICall(model, estimatedTokens, cost, responseTime, userId, message);

    // Save usage to database
    if (userId) {
      try {
        const supabase = createServerClient();
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month

        // Get or create usage record for this month
        // @ts-ignore - AI tables not in TypeScript types yet
        const { data: existing } = await (supabase as any)
          .from("user_ai_usage")
          .select("*")
          .eq("user_id", userId)
          .eq("period_start", periodStart.toISOString())
          .single();

        if (existing) {
          // Update existing record
          // @ts-ignore - AI tables not in TypeScript types yet
          await (supabase as any)
            .from("user_ai_usage")
            .update({
              request_count: existing.request_count + 1,
              token_count: existing.token_count + estimatedTokens,
              cost_estimate: parseFloat(String(existing.cost_estimate || 0)) + cost,
            })
            .eq("id", existing.id);
        } else {
          // Create new record
          // @ts-ignore - AI tables not in TypeScript types yet
          await (supabase as any)
            .from("user_ai_usage")
            .insert({
              user_id: userId,
              request_count: 1,
              token_count: estimatedTokens,
              cost_estimate: cost,
              period_start: periodStart.toISOString(),
            });
        }
      } catch (err) {
        console.warn("Failed to save usage to database:", err);
      }
    }

    // Save conversation history
    if (userId) {
      try {
        const supabase = createServerClient();
        const allMessages = [
          ...conversationHistory,
          { role: "user", content: message },
          { role: "assistant", content: aiResponse },
        ];

        // Get or create conversation
        // @ts-ignore - AI tables not in TypeScript types yet
        const { data: existingConv } = await (supabase as any)
          .from("ai_conversations")
          .select("id, messages")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (existingConv) {
          // Update existing conversation
          // @ts-ignore - AI tables not in TypeScript types yet
          await (supabase as any)
            .from("ai_conversations")
            .update({
              messages: allMessages,
              context: context || {},
            })
            .eq("id", existingConv.id);
        } else {
          // Create new conversation
          // @ts-ignore - AI tables not in TypeScript types yet
          await (supabase as any)
            .from("ai_conversations")
            .insert({
              user_id: userId,
              messages: allMessages,
              context: context || {},
            });
        }
      } catch (err) {
        console.warn("Failed to save conversation history:", err);
      }
    }

    // Generate action buttons based on query and response
    const actions = generateActionButtons(message, context, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      source: "ai",
      cached: false,
      model,
      tokens: estimatedTokens,
      cost,
      actions: actions.length > 0 ? actions : undefined,
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    trackError(error.message || "Unknown error", userId, message);
    
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      {
        error: "Failed to process your message. Please try again.",
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

