// Query classifier to determine which AI model to use
// Routes simple queries to cheaper models, complex to GPT-4

export type QueryComplexity = "simple" | "medium" | "complex";
export type RecommendedModel = "gpt-3.5-turbo" | "gpt-4" | "embedding";

interface ClassificationResult {
  complexity: QueryComplexity;
  recommendedModel: RecommendedModel;
  confidence: number; // 0-1
  reasoning: string;
}

// Keywords that indicate simple queries
const SIMPLE_KEYWORDS = [
  "what is",
  "what are",
  "how to",
  "where is",
  "when is",
  "who is",
  "can i",
  "do you",
  "is there",
  "tell me about",
  "explain",
];

// Keywords that indicate complex queries
const COMPLEX_KEYWORDS = [
  "compare",
  "recommend",
  "suggest",
  "analyze",
  "which is better",
  "what should i",
  "help me choose",
  "find the best",
  "personalized",
  "based on",
];

// Keywords that indicate semantic search (use embeddings)
const SEMANTIC_KEYWORDS = [
  "find",
  "search",
  "look for",
  "show me",
  "products like",
  "similar to",
];

/**
 * Classify a query to determine complexity and recommended model
 */
export function classifyQuery(query: string): ClassificationResult {
  const lowerQuery = query.toLowerCase().trim();
  const queryLength = lowerQuery.length;
  const wordCount = lowerQuery.split(/\s+/).length;
  
  // Check for semantic search patterns
  const hasSemanticKeywords = SEMANTIC_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  
  if (hasSemanticKeywords && wordCount <= 10) {
    return {
      complexity: "simple",
      recommendedModel: "embedding",
      confidence: 0.8,
      reasoning: "Query appears to be a search request, use embeddings for semantic search",
    };
  }
  
  // Check for simple query patterns
  const hasSimpleKeywords = SIMPLE_KEYWORDS.some((keyword) =>
    lowerQuery.startsWith(keyword) || lowerQuery.includes(keyword)
  );
  
  // Check for complex query patterns
  const hasComplexKeywords = COMPLEX_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  
  // Very short queries are usually simple
  if (queryLength < 30 && !hasComplexKeywords) {
    return {
      complexity: "simple",
      recommendedModel: "gpt-3.5-turbo",
      confidence: 0.9,
      reasoning: "Short query, likely a simple question",
    };
  }
  
  // Very long queries are usually complex
  if (queryLength > 200 || wordCount > 30) {
    return {
      complexity: "complex",
      recommendedModel: "gpt-4",
      confidence: 0.8,
      reasoning: "Long query, likely requires complex reasoning",
    };
  }
  
  // Has complex keywords
  if (hasComplexKeywords) {
    return {
      complexity: "complex",
      recommendedModel: "gpt-4",
      confidence: 0.85,
      reasoning: "Query contains complex reasoning keywords",
    };
  }
  
  // Has simple keywords and is not too long
  if (hasSimpleKeywords && queryLength < 100) {
    return {
      complexity: "simple",
      recommendedModel: "gpt-3.5-turbo",
      confidence: 0.75,
      reasoning: "Query matches simple question patterns",
    };
  }
  
  // Questions with question marks are usually medium complexity
  if (lowerQuery.includes("?") && wordCount > 5 && wordCount < 20) {
    return {
      complexity: "medium",
      recommendedModel: "gpt-3.5-turbo",
      confidence: 0.7,
      reasoning: "Question format, medium complexity, try GPT-3.5 first",
    };
  }
  
  // Default to medium complexity
  return {
    complexity: "medium",
    recommendedModel: "gpt-3.5-turbo",
    confidence: 0.6,
    reasoning: "Default classification, start with GPT-3.5",
  };
}

/**
 * Get cost estimate for a query based on classification
 */
export function getCostEstimate(
  classification: ClassificationResult,
  estimatedTokens: number = 500
): number {
  // Cost per 1K tokens (approximate)
  const costs = {
    "gpt-3.5-turbo": 0.0015, // $0.0015 per 1K tokens
    "gpt-4": 0.03, // $0.03 per 1K tokens
    embedding: 0.00002, // $0.00002 per 1K tokens
  };
  
  const modelCost = costs[classification.recommendedModel];
  return (estimatedTokens / 1000) * modelCost;
}

/**
 * Check if query should use GPT-3.5 (cheaper model)
 */
export function shouldUseGPT35(query: string): boolean {
  const classification = classifyQuery(query);
  return classification.recommendedModel === "gpt-3.5-turbo";
}

/**
 * Check if query should use GPT-4 (more powerful model)
 */
export function shouldUseGPT4(query: string): boolean {
  const classification = classifyQuery(query);
  return classification.recommendedModel === "gpt-4";
}

/**
 * Check if query should use embeddings (semantic search)
 */
export function shouldUseEmbeddings(query: string): boolean {
  const classification = classifyQuery(query);
  return classification.recommendedModel === "embedding";
}


