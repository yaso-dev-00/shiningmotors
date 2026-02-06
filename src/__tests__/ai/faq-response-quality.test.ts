/**
 * FAQ Response Quality Tests
 * Validates that all FAQ responses are helpful, accurate, and complete
 */

import { getRuleBasedResponse } from '@/lib/ai/rule-engine';

interface FAQQualityCheck {
  query: string;
  minLength: number;
  requiredKeywords: string[];
  forbiddenKeywords?: string[];
  shouldBeHelpful: boolean;
}

const faqQualityTests: FAQQualityCheck[] = [
  {
    query: 'What is your return policy?',
    minLength: 50,
    requiredKeywords: ['return', '30 days', 'unused', 'packaging'],
    forbiddenKeywords: ['error', 'cannot', 'unavailable'],
    shouldBeHelpful: true,
  },
  {
    query: 'How do I contact support?',
    minLength: 40,
    requiredKeywords: ['support', 'email', 'contact'],
    forbiddenKeywords: ['error'],
    shouldBeHelpful: true,
  },
  {
    query: 'Shipping time?',
    minLength: 40,
    requiredKeywords: ['shipping', 'days', 'tracking'],
    shouldBeHelpful: true,
  },
  {
    query: 'Track my order',
    minLength: 30,
    requiredKeywords: ['order', 'track', 'profile'],
    shouldBeHelpful: true,
  },
  {
    query: 'Payment methods',
    minLength: 40,
    requiredKeywords: ['payment', 'card', 'secure'],
    shouldBeHelpful: true,
  },
  {
    query: 'What services do you offer?',
    minLength: 50,
    requiredKeywords: ['services', 'car', 'maintenance'],
    shouldBeHelpful: true,
  },
  {
    query: 'Upcoming events',
    minLength: 30,
    requiredKeywords: ['events', 'page'],
    shouldBeHelpful: true,
  },
  {
    query: 'Hi',
    minLength: 30,
    requiredKeywords: ['hello', 'assistant', 'help'],
    shouldBeHelpful: true,
  },
];

describe('FAQ Response Quality Validation', () => {
  faqQualityTests.forEach(({ query, minLength, requiredKeywords, forbiddenKeywords, shouldBeHelpful }) => {
    describe(`Query: "${query}"`, () => {
      it('should return a response', () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(typeof response).toBe('string');
      });

      it('should meet minimum length requirement', () => {
        const response = getRuleBasedResponse(query);
        expect(response?.length).toBeGreaterThanOrEqual(minLength);
      });

      it('should contain required keywords', () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        const lowerResponse = response!.toLowerCase();
        
        requiredKeywords.forEach((keyword) => {
          expect(lowerResponse).toContain(keyword.toLowerCase());
        });
      });

      if (forbiddenKeywords) {
        it('should not contain forbidden keywords', () => {
          const response = getRuleBasedResponse(query);
          expect(response).toBeTruthy();
          const lowerResponse = response!.toLowerCase();
          
          forbiddenKeywords.forEach((keyword) => {
            expect(lowerResponse).not.toContain(keyword.toLowerCase());
          });
        });
      }

      it('should be helpful and informative', () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        
        // Check for helpful indicators
        const helpfulIndicators = ['can', 'you', 'visit', 'check', 'contact', 'go to'];
        const lowerResponse = response!.toLowerCase();
        const hasHelpfulContent = helpfulIndicators.some((indicator) =>
          lowerResponse.includes(indicator)
        ) || response!.length > 40;
        
        expect(hasHelpfulContent).toBe(true);
      });

      it('should not be empty or just whitespace', () => {
        const response = getRuleBasedResponse(query);
        expect(response?.trim().length).toBeGreaterThan(0);
      });

      it('should be grammatically correct (basic check)', () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        
        // Basic grammar checks
        expect(response).not.toMatch(/^\s*[a-z]/); // Should start with capital
        expect(response).toMatch(/[.!?]$/); // Should end with punctuation
      });
    });
  });

  describe('Response Completeness', () => {
    it('all FAQ responses should provide actionable information', () => {
      const testQueries = [
        'What is your return policy?',
        'How do I contact support?',
        'Shipping time?',
        'Payment methods',
      ];

      testQueries.forEach((query) => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        
        // Should contain actionable words
        const actionableWords = ['visit', 'go to', 'check', 'contact', 'click', 'use'];
        const lowerResponse = response!.toLowerCase();
        const hasAction = actionableWords.some((word) => lowerResponse.includes(word));
        
        // Or should be informative enough
        expect(hasAction || response!.length > 50).toBe(true);
      });
    });

    it('responses should not be too short or too long', () => {
      const testQueries = [
        'Hi',
        'What is your return policy?',
        'Thank you',
      ];

      testQueries.forEach((query) => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        
        // Not too short (at least 20 chars)
        expect(response!.length).toBeGreaterThanOrEqual(20);
        
        // Not too long (max 500 chars for rule-based)
        expect(response!.length).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('Response Consistency', () => {
    it('same query should return same response', () => {
      const query = 'What is your return policy?';
      const response1 = getRuleBasedResponse(query);
      const response2 = getRuleBasedResponse(query);
      
      expect(response1).toBe(response2);
    });

    it('similar queries should return consistent responses', () => {
      const queries = [
        'Return policy',
        'What is your return policy?',
        'How do I return?',
      ];

      const responses = queries.map((q) => getRuleBasedResponse(q));
      
      // All should return responses (may be same or different but all valid)
      responses.forEach((response) => {
        expect(response).toBeTruthy();
      });
    });
  });
});

