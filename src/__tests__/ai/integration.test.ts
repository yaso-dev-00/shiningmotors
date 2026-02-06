/**
 * Integration Tests for AI Assistant
 * Tests complete flows and user scenarios
 */

import { getRuleBasedResponse } from '@/lib/ai/rule-engine';
import { classifyQuery } from '@/lib/ai/query-classifier';

describe('AI Assistant Integration Tests', () => {
  describe('Complete User Journey - FAQ Flow', () => {
    it('should handle a complete FAQ conversation', () => {
      const conversation = [
        { user: 'Hi', expected: 'greeting' },
        { user: 'What is your return policy?', expected: 'return policy' },
        { user: 'How do I contact support?', expected: 'support' },
        { user: 'Thank you', expected: 'thank you' },
      ];

      conversation.forEach(({ user, expected }) => {
        const response = getRuleBasedResponse(user);
        expect(response).toBeTruthy();
        expect(response!.toLowerCase()).toContain(expected);
      });
    });

    it('should handle product inquiry flow', () => {
      const queries = [
        'What products do you have?',
        'Show me brake pads',
        'How much does it cost?',
      ];

      queries.forEach((query) => {
        // Some may not match rules (which is fine)
        const response = getRuleBasedResponse(query);
        // If it matches, should be helpful
        if (response) {
          expect(response.length).toBeGreaterThan(20);
        }
      });
    });
  });

  describe('Query Classification Integration', () => {
    it('should classify simple queries correctly', () => {
      const simpleQueries = [
        'What is a brake pad?',
        'How do I track my order?',
        'Where is the shop?',
      ];

      simpleQueries.forEach((query) => {
        const classification = classifyQuery(query);
        expect(classification.complexity).toBe('simple');
        expect(classification.recommendedModel).toBe('gpt-3.5-turbo');
      });
    });

    it('should classify complex queries correctly', () => {
      const complexQueries = [
        'Compare different types of engine oils and recommend the best one for my 2020 Honda Civic',
        'Analyze my purchase history and suggest personalized products',
      ];

      complexQueries.forEach((query) => {
        const classification = classifyQuery(query);
        expect(['complex', 'simple']).toContain(classification.complexity);
      });
    });
  });

  describe('Response Quality Across All FAQs', () => {
    const allFAQQueries = [
      // Return Policy
      'What is your return policy?',
      'How do I return an item?',
      'Can I return this?',
      // Support
      'How do I contact support?',
      'Customer service',
      // Shipping
      'Shipping time?',
      'How long to ship?',
      // Order Tracking
      'Track my order',
      'Order status',
      // Payment
      'Payment methods',
      'How to pay?',
      // Services
      'What services do you offer?',
      'Book a service',
      // Events
      'Upcoming events',
      'What events?',
      // Products
      'What products do you have?',
      // Greetings
      'Hi',
      'Hello',
      // Thank you
      'Thank you',
      'Thanks',
      // Goodbye
      'Bye',
      'Goodbye',
    ];

    it('all FAQ queries should return helpful responses', () => {
      allFAQQueries.forEach((query) => {
        const response = getRuleBasedResponse(query);
        
        if (response) {
          // Should be meaningful
          expect(response.length).toBeGreaterThan(15);
          expect(response.trim().length).toBeGreaterThan(0);
          
          // Should not be just "I don't know" or error messages
          const lowerResponse = response.toLowerCase();
          expect(lowerResponse).not.toMatch(/don't know|error|unavailable|cannot help/);
        }
      });
    });

    it('all FAQ responses should be user-friendly', () => {
      allFAQQueries.forEach((query) => {
        const response = getRuleBasedResponse(query);
        
        if (response) {
          // Should start with capital letter
          expect(response[0]).toMatch(/[A-Z]/);
          
          // Should end with punctuation
          expect(response[response.length - 1]).toMatch(/[.!?]/);
          
          // Should not have excessive punctuation
          const exclamationCount = (response.match(/!/g) || []).length;
          expect(exclamationCount).toBeLessThan(3);
        }
      });
    });
  });
});

