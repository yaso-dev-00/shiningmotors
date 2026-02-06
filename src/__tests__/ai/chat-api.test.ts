/**
 * Automated Tests for AI Chat API
 * Tests all FAQ scenarios and response quality
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/chat/route';
import { getRuleBasedResponse } from '@/lib/ai/rule-engine';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

jest.mock('@/lib/ai/circuit-breaker', () => ({
  canMakeAPICall: jest.fn(() => true),
  recordAPISuccess: jest.fn(),
  recordAPIFailure: jest.fn(),
}));

jest.mock('@/lib/ai/analytics', () => ({
  trackAPICall: jest.fn(),
  trackCacheHit: jest.fn(),
  trackCacheMiss: jest.fn(),
  trackRuleMatch: jest.fn(),
  trackError: jest.fn(),
}));

// Mock OpenAI API
global.fetch = jest.fn();

describe('AI Chat API - FAQ Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Mock AI response' } }],
      }),
    });
  });

  describe('Rule-Based FAQ Responses', () => {
    const faqTests = [
      {
        category: 'Return Policy',
        queries: [
          'What is your return policy?',
          'How do I return an item?',
          'Can I return this?',
          'Return policy',
          'Refund policy',
        ],
        expectedKeywords: ['return', '30 days', 'unused', 'packaging'],
        minLength: 50,
      },
      {
        category: 'Support Contact',
        queries: [
          'How do I contact support?',
          'Customer service',
          'Help desk',
          'Support email',
        ],
        expectedKeywords: ['support', 'email', 'support@shiningmotors.com', '24 hours'],
        minLength: 40,
      },
      {
        category: 'Shipping',
        queries: [
          'Shipping time?',
          'How long to ship?',
          'When will it arrive?',
          'Delivery time',
        ],
        expectedKeywords: ['shipping', '5-7', 'business days', 'tracking'],
        minLength: 40,
      },
      {
        category: 'Order Tracking',
        queries: [
          'Track my order',
          'Order status',
          'Where is my order?',
          'Order tracking',
        ],
        expectedKeywords: ['track', 'order', 'profile', 'status'],
        minLength: 30,
      },
      {
        category: 'Payment Methods',
        queries: [
          'Payment methods',
          'How to pay?',
          'Accepted payments',
          'What payment methods?',
        ],
        expectedKeywords: ['credit cards', 'debit', 'UPI', 'wallets', 'secure'],
        minLength: 40,
      },
      {
        category: 'Account Settings',
        queries: [
          'Change password',
          'Update profile',
          'Edit account',
          'Account settings',
        ],
        expectedKeywords: ['profile', 'settings', 'update'],
        minLength: 30,
      },
      {
        category: 'Services',
        queries: [
          'What services do you offer?',
          'Available services',
          'Service types',
          'Book service',
        ],
        expectedKeywords: ['services', 'car wash', 'AC service', 'maintenance', 'book'],
        minLength: 50,
      },
      {
        category: 'Events',
        queries: [
          'Upcoming events',
          'What events?',
          'Event calendar',
          'When is the next event?',
        ],
        expectedKeywords: ['events', 'page', 'upcoming', 'filter'],
        minLength: 30,
      },
      {
        category: 'Products',
        queries: [
          'What products do you have?',
          'Available products',
          'Product categories',
        ],
        expectedKeywords: ['products', 'automotive', 'parts', 'shop', 'catalog'],
        minLength: 40,
      },
      {
        category: 'Vendor Registration',
        queries: [
          'Become a vendor',
          'Vendor registration',
          'How to sell?',
          'Register as vendor',
        ],
        expectedKeywords: ['vendor', 'registration', 'contact', 'process'],
        minLength: 40,
      },
      {
        category: 'Sim Racing',
        queries: [
          'Sim racing',
          'Simulator',
          'Racing leagues',
          'Sim events',
        ],
        expectedKeywords: ['sim racing', 'events', 'leagues', 'equipment'],
        minLength: 40,
      },
      {
        category: 'Greetings',
        queries: ['Hi', 'Hello', 'Hey'],
        expectedKeywords: ['hello', 'assistant', 'help'],
        minLength: 30,
      },
      {
        category: 'Thank You',
        queries: ['Thank you', 'Thanks', 'I appreciate it'],
        expectedKeywords: ['welcome', 'help'],
        minLength: 20,
      },
      {
        category: 'Goodbye',
        queries: ['Bye', 'Goodbye', 'See you', 'Farewell'],
        expectedKeywords: ['goodbye', 'assistance', 'great day'],
        minLength: 20,
      },
    ];

    faqTests.forEach(({ category, queries, expectedKeywords, minLength }) => {
      describe(category, () => {
        queries.forEach((query) => {
          it(`should respond correctly to: "${query}"`, async () => {
            const req = new NextRequest('http://localhost:3000/api/ai/chat', {
              method: 'POST',
              body: JSON.stringify({ message: query }),
            });

            const response = await POST(req);
            const data = await response.json();

            // Verify response structure
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('response');
            expect(data.response).toBeTruthy();
            expect(typeof data.response).toBe('string');
            expect(data.response.length).toBeGreaterThanOrEqual(minLength);

            // Verify response quality - contains expected keywords
            const lowerResponse = data.response.toLowerCase();
            const foundKeywords = expectedKeywords.filter((keyword) =>
              lowerResponse.includes(keyword.toLowerCase())
            );
            expect(foundKeywords.length).toBeGreaterThan(0);

            // Verify source
            expect(['rule', 'precomputed', 'cache', 'ai']).toContain(data.source);

            // If rule-based, should be fast
            if (data.source === 'rule') {
              expect(data.cached).toBe(false);
            }
          });
        });
      });
    });
  });

  describe('Response Quality Validation', () => {
    it('should provide helpful responses for product queries', async () => {
      const queries = [
        'What products do you have?',
        'Show me products',
        'I want to buy something',
      ];

      for (const query of queries) {
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ message: query }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(data.response.length).toBeGreaterThan(20);
        expect(data.response.toLowerCase()).toMatch(/product|shop|buy|item/);
      }
    });

    it('should provide helpful responses for service queries', async () => {
      const queries = [
        'What services are available?',
        'I need car service',
        'Book a service',
      ];

      for (const query of queries) {
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ message: query }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(data.response.length).toBeGreaterThan(20);
        // Should mention services
        const lowerResponse = data.response.toLowerCase();
        expect(
          lowerResponse.includes('service') ||
            lowerResponse.includes('book') ||
            lowerResponse.includes('appointment')
        ).toBe(true);
      }
    });

    it('should provide helpful responses for order queries', async () => {
      const queries = [
        'Where is my order?',
        'Track my order',
        'Order status',
      ];

      for (const query of queries) {
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ message: query }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(data.response.length).toBeGreaterThan(20);
        const lowerResponse = data.response.toLowerCase();
        expect(
          lowerResponse.includes('order') ||
            lowerResponse.includes('track') ||
            lowerResponse.includes('status')
        ).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing message', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Message is required');
    });

    it('should handle empty message', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('should handle API failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test query that needs API' }),
      });

      const response = await POST(req);
      const data = await response.json();

      // Should still return a response (fallback)
      expect(data).toHaveProperty('response');
      expect(data.response).toBeTruthy();
    });
  });

  describe('Cache Functionality', () => {
    it('should cache responses', async () => {
      const uniqueMessage = `Cache test ${Date.now()}`;

      // First request
      const req1 = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: uniqueMessage }),
      });
      const response1 = await POST(req1);
      const data1 = await response1.json();

      // Second request (should be cached)
      const req2 = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: uniqueMessage }),
      });
      const response2 = await POST(req2);
      const data2 = await response2.json();

      // Responses should match
      expect(data1.response).toBe(data2.response);
    });
  });

  describe('Response Time Performance', () => {
    it('rule-based responses should be fast', async () => {
      const start = Date.now();
      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
      });
      await POST(req);
      const duration = Date.now() - start;

      // Rule-based should be very fast (allowing for test overhead)
      expect(duration).toBeLessThan(5000); // 5 seconds max for test environment
    });
  });
});

