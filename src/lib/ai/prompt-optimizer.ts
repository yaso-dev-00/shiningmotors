// Prompt optimizer to minimize token usage
// Removes unnecessary context and optimizes prompts

interface OptimizedPrompt {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  tokenEstimate: number;
  optimization: {
    removedContext: string[];
    shortenedBy: number;
  };
}

/**
 * Optimize system prompt by removing unnecessary parts
 */
function optimizeSystemPrompt(original: string): string {
  // Remove excessive whitespace
  let optimized = original.replace(/\s+/g, " ").trim();

  // Remove redundant phrases
  const redundantPhrases = [
    /please\s+note\s+that/gi,
    /it\s+is\s+important\s+to\s+note/gi,
    /we\s+would\s+like\s+to/gi,
    /we\s+are\s+pleased\s+to/gi,
  ];

  for (const phrase of redundantPhrases) {
    optimized = optimized.replace(phrase, "");
  }

  // Remove excessive politeness (keep it concise)
  optimized = optimized.replace(/\s+/g, " ").trim();

  return optimized;
}

/**
 * Optimize conversation history
 */
function optimizeConversationHistory(
  history: Array<{ role: string; content: string }>,
  maxHistory: number = 5
): Array<{ role: string; content: string }> {
  // Keep only recent messages
  const recent = history.slice(-maxHistory);

  // Truncate very long messages
  return recent.map((msg) => ({
    ...msg,
    content:
      msg.content.length > 500
        ? msg.content.substring(0, 500) + "..."
        : msg.content,
  }));
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Optimize prompt for AI API call
 */
export function optimizePrompt(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userMessage: string,
  options: {
    maxHistory?: number;
    maxSystemPromptLength?: number;
    maxMessageLength?: number;
  } = {}
): OptimizedPrompt {
  const {
    maxHistory = 5,
    maxSystemPromptLength = 500,
    maxMessageLength = 1000,
  } = options;

  const originalSystemPrompt = systemPrompt;
  const originalHistory = conversationHistory;
  const originalMessage = userMessage;

  // Optimize system prompt
  let optimizedSystem = optimizeSystemPrompt(systemPrompt);
  if (optimizedSystem.length > maxSystemPromptLength) {
    optimizedSystem = optimizedSystem.substring(0, maxSystemPromptLength) + "...";
  }

  // Optimize conversation history
  const optimizedHistory = optimizeConversationHistory(
    conversationHistory,
    maxHistory
  );

  // Truncate user message if too long
  let optimizedMessage = userMessage;
  if (optimizedMessage.length > maxMessageLength) {
    optimizedMessage =
      optimizedMessage.substring(0, maxMessageLength) + "...";
  }

  // Calculate token savings
  const originalTokens =
    estimateTokens(originalSystemPrompt) +
    originalHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0) +
    estimateTokens(originalMessage);

  const optimizedTokens =
    estimateTokens(optimizedSystem) +
    optimizedHistory.reduce(
      (sum, msg) => sum + estimateTokens(msg.content),
      0
    ) +
    estimateTokens(optimizedMessage);

  const removedContext: string[] = [];
  if (originalSystemPrompt.length > optimizedSystem.length) {
    removedContext.push("system prompt shortened");
  }
  if (originalHistory.length > optimizedHistory.length) {
    removedContext.push(
      `conversation history reduced from ${originalHistory.length} to ${optimizedHistory.length} messages`
    );
  }
  if (originalMessage.length > optimizedMessage.length) {
    removedContext.push("user message truncated");
  }

  return {
    systemPrompt: optimizedSystem,
    messages: [
      ...optimizedHistory,
      { role: "user", content: optimizedMessage },
    ],
    tokenEstimate: optimizedTokens,
    optimization: {
      removedContext,
      shortenedBy: originalTokens - optimizedTokens,
    },
  };
}

/**
 * Get minimal system prompt for common queries
 */
export function getMinimalSystemPrompt(context?: {
  hasCart?: boolean;
  hasOrders?: boolean;
  hasBookings?: boolean;
}): string {
  let prompt =
    "You are a helpful AI assistant for Shining Motors, an automotive platform. ";

  if (context?.hasCart) {
    prompt += "The user has items in their cart. ";
  }
  if (context?.hasOrders) {
    prompt += "The user has order history. ";
  }
  if (context?.hasBookings) {
    prompt += "The user has service bookings. ";
  }

  prompt +=
    "Be concise and helpful. If unsure, suggest contacting support.";

  return prompt;
}

/**
 * Remove unnecessary context from user data
 */
export function minimizeContext(context: {
  cart?: any[];
  orders?: any[];
  bookings?: any[];
}): {
  cart?: any[];
  orders?: any[];
  bookings?: any[];
} {
  return {
    cart: context.cart?.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
    })),
    orders: context.orders?.slice(0, 2).map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
    })),
    bookings: context.bookings?.slice(0, 2).map((booking) => ({
      id: booking.id,
      service: booking.service?.title,
      date: booking.booking_date,
    })),
  };
}


