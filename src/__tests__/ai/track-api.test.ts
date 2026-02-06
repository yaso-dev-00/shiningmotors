/**
 * Automated Tests for AI Tracking API
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/track/route';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createAuthenticatedServerClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })
        ),
      },
      from: jest.fn(() => ({
        insert: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })
  ),
}));

describe('AI Track API', () => {
  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/track', {
        method: 'POST',
        body: JSON.stringify({
          interaction_type: 'view',
          item_type: 'product',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Interaction Tracking', () => {
    const interactionTypes = ['view', 'click', 'add_to_cart', 'search', 'purchase'];
    const itemTypes = ['product', 'service', 'event', 'vendor', 'post'];

    interactionTypes.forEach((interactionType) => {
      itemTypes.forEach((itemType) => {
        it(`should track ${interactionType} for ${itemType}`, async () => {
          const req = new NextRequest('http://localhost:3000/api/ai/track', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer valid-token',
            },
            body: JSON.stringify({
              interaction_type: interactionType,
              item_type: itemType,
              item_id: 'test-id-123',
              metadata: { test: 'data' },
            }),
          });

          const response = await POST(req);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);
        });
      });
    });
  });

  describe('Metadata Handling', () => {
    it('should accept metadata with product details', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/track', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          interaction_type: 'view',
          item_type: 'product',
          item_id: 'product-123',
          metadata: {
            productName: 'Brake Pads',
            category: 'brakes',
            price: 2999,
          },
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });

    it('should handle empty metadata', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/track', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          interaction_type: 'view',
          item_type: 'product',
          item_id: 'product-123',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });
  });
});

