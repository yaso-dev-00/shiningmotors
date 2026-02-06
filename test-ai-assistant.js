/**
 * AI Assistant Manual Test Script
 * Run this in browser console or Node.js to test AI Assistant endpoints
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Copy and paste sections to test
 * 3. Or use as reference for automated tests
 */

// ============================================
// CONFIGURATION
// ============================================
const BASE_URL = 'http://localhost:3000'; // Change to your URL
const TEST_USER_ID = 'your-test-user-id'; // Replace with actual user ID
const TEST_TOKEN = 'your-test-token'; // Replace with actual auth token

// ============================================
// HELPER FUNCTIONS
// ============================================

async function testChatAPI(message, userId = null, context = {}) {
  const response = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId,
      conversationHistory: [],
      context,
    }),
  });
  
  const data = await response.json();
  console.log('Chat API Response:', {
    status: response.status,
    source: data.source,
    cached: data.cached,
    model: data.model,
    response: data.response?.substring(0, 100) + '...',
    hasActions: !!data.actions,
  });
  return data;
}

async function testTrackAPI(interactionType, itemType, itemId, metadata = {}) {
  const response = await fetch(`${BASE_URL}/api/ai/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify({
      interaction_type: interactionType,
      item_type: itemType,
      item_id: itemId,
      metadata,
    }),
  });
  
  const data = await response.json();
  console.log('Track API Response:', {
    status: response.status,
    success: data.success,
    error: data.error,
  });
  return data;
}

// ============================================
// TEST SUITE 1: BASIC CHAT TESTS
// ============================================

async function runBasicChatTests() {
  console.log('\n=== BASIC CHAT TESTS ===\n');
  
  // Test 1: Simple greeting
  console.log('Test 1: Simple greeting');
  await testChatAPI('Hi');
  
  // Test 2: Rule-based query
  console.log('\nTest 2: Return policy (should match rule)');
  await testChatAPI('What is your return policy?');
  
  // Test 3: Cache test
  console.log('\nTest 3: Cache test (send same message twice)');
  const uniqueMessage = `Test message ${Date.now()}`;
  await testChatAPI(uniqueMessage);
  console.log('Sending same message again...');
  await testChatAPI(uniqueMessage);
  
  // Test 4: With user context
  console.log('\nTest 4: With user context');
  await testChatAPI('What products did I view?', TEST_USER_ID, {
    page: { pathname: '/shop', pageType: 'shop' },
    user: {
      cartItems: [{ name: 'Brake Pads', id: '123' }],
      orders: [],
    },
  });
}

// ============================================
// TEST SUITE 2: TRACKING TESTS
// ============================================

async function runTrackingTests() {
  console.log('\n=== TRACKING TESTS ===\n');
  
  // Test 1: Track product view
  console.log('Test 1: Track product view');
  await testTrackAPI('view', 'product', 'product-123', {
    productName: 'Brake Pads',
    category: 'brakes',
    price: 2999,
  });
  
  // Test 2: Track search
  console.log('\nTest 2: Track search');
  await testTrackAPI('search', 'product', null, {
    query: 'brake pads',
    resultsCount: 15,
  });
  
  // Test 3: Track add to cart
  console.log('\nTest 3: Track add to cart');
  await testTrackAPI('add_to_cart', 'product', 'product-456', {
    productName: 'Engine Oil',
    quantity: 2,
  });
  
  // Test 4: Track without auth (should fail)
  console.log('\nTest 4: Track without auth (should fail)');
  const response = await fetch(`${BASE_URL}/api/ai/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interaction_type: 'view',
      item_type: 'product',
    }),
  });
  console.log('Response:', response.status, await response.json());
}

// ============================================
// TEST SUITE 3: ERROR HANDLING TESTS
// ============================================

async function runErrorHandlingTests() {
  console.log('\n=== ERROR HANDLING TESTS ===\n');
  
  // Test 1: Missing message
  console.log('Test 1: Missing message');
  const response1 = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('Response:', response1.status, await response1.json());
  
  // Test 2: Empty message
  console.log('\nTest 2: Empty message');
  const response2 = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '' }),
  });
  console.log('Response:', response2.status, await response2.json());
}

// ============================================
// TEST SUITE 4: RULE-BASED RESPONSES
// ============================================

async function runRuleBasedTests() {
  console.log('\n=== RULE-BASED RESPONSE TESTS ===\n');
  
  const ruleQueries = [
    'What is your return policy?',
    'How do I contact support?',
    'Shipping time?',
    'How do I track my order?',
    'What payment methods do you accept?',
    'Hi',
    'Thank you',
    'Bye',
  ];
  
  for (const query of ruleQueries) {
    console.log(`\nTesting: "${query}"`);
    const start = Date.now();
    const result = await testChatAPI(query);
    const duration = Date.now() - start;
    console.log(`Duration: ${duration}ms, Source: ${result.source}`);
  }
}

// ============================================
// TEST SUITE 5: CACHE TESTS
// ============================================

async function runCacheTests() {
  console.log('\n=== CACHE TESTS ===\n');
  
  const testMessage = `Cache test ${Date.now()}`;
  
  // First request (should call API)
  console.log('First request (should call API):');
  const start1 = Date.now();
  const result1 = await testChatAPI(testMessage);
  const duration1 = Date.now() - start1;
  console.log(`Duration: ${duration1}ms, Cached: ${result1.cached}, Source: ${result1.source}`);
  
  // Second request (should use cache)
  console.log('\nSecond request (should use cache):');
  const start2 = Date.now();
  const result2 = await testChatAPI(testMessage);
  const duration2 = Date.now() - start2;
  console.log(`Duration: ${duration2}ms, Cached: ${result2.cached}, Source: ${result2.source}`);
  
  console.log(`\nSpeed improvement: ${((duration1 - duration2) / duration1 * 100).toFixed(1)}%`);
}

// ============================================
// TEST SUITE 6: CONTEXT TESTS
// ============================================

async function runContextTests() {
  console.log('\n=== CONTEXT TESTS ===\n');
  
  // Test with cart context
  console.log('Test 1: With cart context');
  await testChatAPI('What is in my cart?', TEST_USER_ID, {
    user: {
      cartItems: [
        { name: 'Brake Pads', id: '123', price: 2999 },
        { name: 'Engine Oil', id: '456', price: 1499 },
      ],
    },
  });
  
  // Test with order history
  console.log('\nTest 2: With order history');
  await testChatAPI('What did I order?', TEST_USER_ID, {
    user: {
      orders: [
        { id: 'order-1', total: 4498, status: 'delivered' },
      ],
    },
  });
  
  // Test with page context
  console.log('\nTest 3: With page context');
  await testChatAPI('What products are on this page?', TEST_USER_ID, {
    page: {
      pathname: '/shop',
      pageType: 'shop',
    },
  });
}

// ============================================
// TEST SUITE 7: PERFORMANCE TESTS
// ============================================

async function runPerformanceTests() {
  console.log('\n=== PERFORMANCE TESTS ===\n');
  
  const tests = [
    { name: 'Rule-based (Hi)', query: 'Hi' },
    { name: 'Simple query', query: 'What is a brake pad?' },
    { name: 'Complex query', query: 'Compare different types of engine oils and recommend the best one for my car' },
  ];
  
  for (const test of tests) {
    console.log(`\n${test.name}:`);
    const times = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await testChatAPI(test.query);
      times.push(Date.now() - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average: ${avg.toFixed(0)}ms`);
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('🚀 Starting AI Assistant Test Suite\n');
  console.log('='.repeat(50));
  
  try {
    await runBasicChatTests();
    await runTrackingTests();
    await runErrorHandlingTests();
    await runRuleBasedTests();
    await runCacheTests();
    await runContextTests();
    await runPerformanceTests();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// ============================================
// EXPORT FOR USE
// ============================================

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testChatAPI,
    testTrackAPI,
    runAllTests,
    runBasicChatTests,
    runTrackingTests,
    runErrorHandlingTests,
    runRuleBasedTests,
    runCacheTests,
    runContextTests,
    runPerformanceTests,
  };
}

// For browser console
if (typeof window !== 'undefined') {
  window.AIAssistantTests = {
    testChatAPI,
    testTrackAPI,
    runAllTests,
    runBasicChatTests,
    runTrackingTests,
    runErrorHandlingTests,
    runRuleBasedTests,
    runCacheTests,
    runContextTests,
    runPerformanceTests,
  };
  console.log('AI Assistant test functions loaded! Use AIAssistantTests.runAllTests() to run all tests.');
}

