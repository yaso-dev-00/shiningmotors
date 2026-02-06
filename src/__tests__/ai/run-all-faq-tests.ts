/**
 * Comprehensive FAQ Test Runner
 * Tests all user-based FAQs and validates response quality
 */

import { getRuleBasedResponse } from '@/lib/ai/rule-engine';

interface FAQTestResult {
  query: string;
  passed: boolean;
  response: string | null;
  issues: string[];
  qualityScore: number; // 0-100
}

interface QualityMetrics {
  hasResponse: boolean;
  minLength: boolean;
  hasKeywords: boolean;
  isHelpful: boolean;
  isGrammatical: boolean;
  isActionable: boolean;
}

function evaluateResponseQuality(
  query: string,
  response: string | null,
  expectedKeywords: string[]
): QualityMetrics {
  if (!response) {
    return {
      hasResponse: false,
      minLength: false,
      hasKeywords: false,
      isHelpful: false,
      isGrammatical: false,
      isActionable: false,
    };
  }

  const lowerResponse = response.toLowerCase();
  const lowerQuery = query.toLowerCase();

  return {
    hasResponse: true,
    minLength: response.length >= 20,
    hasKeywords: expectedKeywords.some((kw) => lowerResponse.includes(kw.toLowerCase())),
    isHelpful: response.length > 30 && !lowerResponse.includes('error'),
    isGrammatical: /^[A-Z]/.test(response) && /[.!?]$/.test(response),
    isActionable:
      lowerResponse.includes('visit') ||
      lowerResponse.includes('check') ||
      lowerResponse.includes('contact') ||
      lowerResponse.includes('go to') ||
      response.length > 50,
  };
}

function calculateQualityScore(metrics: QualityMetrics): number {
  const weights = {
    hasResponse: 20,
    minLength: 15,
    hasKeywords: 20,
    isHelpful: 20,
    isGrammatical: 15,
    isActionable: 10,
  };

  let score = 0;
  if (metrics.hasResponse) score += weights.hasResponse;
  if (metrics.minLength) score += weights.minLength;
  if (metrics.hasKeywords) score += weights.hasKeywords;
  if (metrics.isHelpful) score += weights.isHelpful;
  if (metrics.isGrammatical) score += weights.isGrammatical;
  if (metrics.isActionable) score += weights.isActionable;

  return score;
}

// All FAQ test cases with expected keywords
const allFAQTests = [
  {
    category: 'Return Policy',
    queries: [
      { query: 'What is your return policy?', keywords: ['return', '30 days', 'unused'] },
      { query: 'How do I return an item?', keywords: ['return', '30 days'] },
      { query: 'Can I return this?', keywords: ['return', '30 days'] },
      { query: 'Return policy', keywords: ['return', 'policy'] },
      { query: 'Refund policy', keywords: ['return', 'refund'] },
    ],
  },
  {
    category: 'Support Contact',
    queries: [
      { query: 'How do I contact support?', keywords: ['support', 'email', 'contact'] },
      { query: 'Customer service', keywords: ['support', 'service', 'contact'] },
      { query: 'Help desk', keywords: ['support', 'help'] },
      { query: 'Support email', keywords: ['support', 'email'] },
    ],
  },
  {
    category: 'Shipping',
    queries: [
      { query: 'Shipping time?', keywords: ['shipping', 'days', 'delivery'] },
      { query: 'How long to ship?', keywords: ['shipping', 'days'] },
      { query: 'When will it arrive?', keywords: ['shipping', 'arrive', 'days'] },
      { query: 'Delivery time', keywords: ['delivery', 'shipping', 'days'] },
    ],
  },
  {
    category: 'Order Tracking',
    queries: [
      { query: 'Track my order', keywords: ['order', 'track', 'status'] },
      { query: 'Order status', keywords: ['order', 'status', 'track'] },
      { query: 'Where is my order?', keywords: ['order', 'track'] },
      { query: 'Order tracking', keywords: ['order', 'track'] },
    ],
  },
  {
    category: 'Payment Methods',
    queries: [
      { query: 'Payment methods', keywords: ['payment', 'card', 'upi', 'wallet'] },
      { query: 'How to pay?', keywords: ['payment', 'pay'] },
      { query: 'Accepted payments', keywords: ['payment', 'card'] },
      { query: 'What payment methods?', keywords: ['payment', 'method'] },
    ],
  },
  {
    category: 'Account Settings',
    queries: [
      { query: 'Change password', keywords: ['profile', 'settings', 'password'] },
      { query: 'Update profile', keywords: ['profile', 'update', 'settings'] },
      { query: 'Edit account', keywords: ['account', 'profile', 'settings'] },
      { query: 'Account settings', keywords: ['account', 'settings', 'profile'] },
    ],
  },
  {
    category: 'Services',
    queries: [
      { query: 'What services do you offer?', keywords: ['services', 'car', 'maintenance'] },
      { query: 'Available services', keywords: ['services', 'available'] },
      { query: 'Service types', keywords: ['services', 'types'] },
      { query: 'Book a service', keywords: ['services', 'book'] },
    ],
  },
  {
    category: 'Events',
    queries: [
      { query: 'Upcoming events', keywords: ['events', 'upcoming'] },
      { query: 'What events?', keywords: ['events'] },
      { query: 'Event calendar', keywords: ['events', 'calendar'] },
      { query: 'When is the next event?', keywords: ['events', 'upcoming'] },
    ],
  },
  {
    category: 'Products',
    queries: [
      { query: 'What products do you have?', keywords: ['products', 'shop', 'catalog'] },
      { query: 'Available products', keywords: ['products', 'available'] },
      { query: 'Product categories', keywords: ['products', 'categories'] },
    ],
  },
  {
    category: 'Vendor Registration',
    queries: [
      { query: 'Become a vendor', keywords: ['vendor', 'registration'] },
      { query: 'Vendor registration', keywords: ['vendor', 'registration'] },
      { query: 'How to sell?', keywords: ['vendor', 'sell'] },
      { query: 'Register as vendor', keywords: ['vendor', 'register'] },
    ],
  },
  {
    category: 'Sim Racing',
    queries: [
      { query: 'Sim racing', keywords: ['sim racing', 'events', 'leagues'] },
      { query: 'Simulator', keywords: ['sim', 'racing'] },
      { query: 'Racing leagues', keywords: ['racing', 'leagues'] },
      { query: 'Sim events', keywords: ['sim', 'events'] },
    ],
  },
  {
    category: 'Greetings',
    queries: [
      { query: 'Hi', keywords: ['hello', 'assistant', 'help'] },
      { query: 'Hello', keywords: ['hello', 'assistant'] },
      { query: 'Hey', keywords: ['hello', 'assistant'] },
    ],
  },
  {
    category: 'Thank You',
    queries: [
      { query: 'Thank you', keywords: ['welcome', 'help'] },
      { query: 'Thanks', keywords: ['welcome'] },
      { query: 'I appreciate it', keywords: ['welcome'] },
    ],
  },
  {
    category: 'Goodbye',
    queries: [
      { query: 'Bye', keywords: ['goodbye', 'assistance'] },
      { query: 'Goodbye', keywords: ['goodbye'] },
      { query: 'See you', keywords: ['goodbye', 'see'] },
      { query: 'Farewell', keywords: ['goodbye'] },
    ],
  },
];

export function runAllFAQTests(): {
  results: FAQTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageQualityScore: number;
    categoryBreakdown: Record<string, { passed: number; total: number }>;
  };
} {
  const results: FAQTestResult[] = [];

  allFAQTests.forEach(({ category, queries }) => {
    queries.forEach(({ query, keywords }) => {
      const response = getRuleBasedResponse(query);
      const metrics = evaluateResponseQuality(query, response, keywords);
      const qualityScore = calculateQualityScore(metrics);

      const issues: string[] = [];
      if (!metrics.hasResponse) issues.push('No response returned');
      if (!metrics.minLength) issues.push('Response too short');
      if (!metrics.hasKeywords) issues.push('Missing expected keywords');
      if (!metrics.isHelpful) issues.push('Response not helpful');
      if (!metrics.isGrammatical) issues.push('Grammar issues');
      if (!metrics.isActionable) issues.push('Not actionable');

      const passed = qualityScore >= 70 && metrics.hasResponse;

      results.push({
        query,
        passed,
        response,
        issues,
        qualityScore,
      });
    });
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const averageQualityScore =
    results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;

  const categoryBreakdown: Record<string, { passed: number; total: number }> = {};
  allFAQTests.forEach(({ category, queries }) => {
    const categoryResults = results.filter((r) =>
      queries.some((q) => q.query === r.query)
    );
    categoryBreakdown[category] = {
      passed: categoryResults.filter((r) => r.passed).length,
      total: categoryResults.length,
    };
  });

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      categoryBreakdown,
    },
  };
}

// Export for use in tests
if (typeof describe !== 'undefined') {
  describe('All FAQ Tests - Automated', () => {
    it('should test all FAQs and validate quality', () => {
      const testResults = runAllFAQTests();

      // Log summary
      console.log('\n=== FAQ Test Summary ===');
      console.log(`Total Tests: ${testResults.summary.total}`);
      console.log(`Passed: ${testResults.summary.passed}`);
      console.log(`Failed: ${testResults.summary.failed}`);
      console.log(`Average Quality Score: ${testResults.summary.averageQualityScore}%`);
      console.log('\nCategory Breakdown:');
      Object.entries(testResults.summary.categoryBreakdown).forEach(([category, stats]) => {
        console.log(`  ${category}: ${stats.passed}/${stats.total} passed`);
      });

      // Show failed tests
      const failedTests = testResults.results.filter((r) => !r.passed);
      if (failedTests.length > 0) {
        console.log('\nFailed Tests:');
        failedTests.forEach((test) => {
          console.log(`  ❌ "${test.query}"`);
          console.log(`     Quality Score: ${test.qualityScore}%`);
          console.log(`     Issues: ${test.issues.join(', ')}`);
        });
      }

      // Assertions
      expect(testResults.summary.passed).toBeGreaterThan(0);
      expect(testResults.summary.averageQualityScore).toBeGreaterThan(70);
    });
  });
}

