/**
 * Tests for Rule Engine - All FAQ Rules
 */

import { getRuleBasedResponse } from '@/lib/ai/rule-engine';

describe('Rule Engine - FAQ Coverage', () => {
  describe('Return Policy Rules', () => {
    const testCases = [
      'What is your return policy?',
      'Return policy',
      'Refund policy',
      'How to return?',
      'Can I return this?',
    ];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response).toContain('return');
        expect(response.length).toBeGreaterThan(30);
      });
    });
  });

  describe('Support Contact Rules', () => {
    const testCases = [
      'How do I contact support?',
      'Customer service',
      'Help desk',
      'Support email',
    ];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/support|contact|email/);
      });
    });
  });

  describe('Shipping Rules', () => {
    const testCases = [
      'Shipping time?',
      'How long to ship?',
      'When will it arrive?',
      'Delivery time',
    ];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/shipping|delivery|days/);
      });
    });
  });

  describe('Order Tracking Rules', () => {
    const testCases = [
      'Track my order',
      'Order status',
      'Where is my order?',
      'Order tracking',
    ];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/order|track/);
      });
    });
  });

  describe('Payment Methods Rules', () => {
    const testCases = [
      'Payment methods',
      'How to pay?',
      'Accepted payments',
      'What payment methods?',
    ];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/payment|card|upi|wallet/);
      });
    });
  });

  describe('Greeting Rules', () => {
    const testCases = ['Hi', 'Hello', 'Hey'];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/hello|hi|assistant/);
      });
    });
  });

  describe('Thank You Rules', () => {
    const testCases = ['Thank you', 'Thanks', 'I appreciate it'];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/welcome|help/);
      });
    });
  });

  describe('Goodbye Rules', () => {
    const testCases = ['Bye', 'Goodbye', 'See you', 'Farewell'];

    testCases.forEach((query) => {
      it(`should match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeTruthy();
        expect(response.toLowerCase()).toMatch(/goodbye|bye|assistance/);
      });
    });
  });

  describe('Non-Matching Queries', () => {
    const testCases = [
      'Random question about nothing',
      'Tell me a joke',
      'What is the weather?',
    ];

    testCases.forEach((query) => {
      it(`should not match: "${query}"`, () => {
        const response = getRuleBasedResponse(query);
        expect(response).toBeNull();
      });
    });
  });
});

