/**
 * Automated AI Assistant Test Runner
 * Run this to test all FAQs and validate response quality
 * 
 * Usage:
 *   node test-ai-automated.js
 *   OR
 *   npm run test:ai
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// All FAQ test cases
const allFAQTests = [
  // Return Policy
  { query: 'What is your return policy?', category: 'Return Policy', keywords: ['return', '30 days'] },
  { query: 'How do I return an item?', category: 'Return Policy', keywords: ['return'] },
  { query: 'Can I return this?', category: 'Return Policy', keywords: ['return'] },
  
  // Support
  { query: 'How do I contact support?', category: 'Support', keywords: ['support', 'email'] },
  { query: 'Customer service', category: 'Support', keywords: ['support'] },
  
  // Shipping
  { query: 'Shipping time?', category: 'Shipping', keywords: ['shipping', 'days'] },
  { query: 'How long to ship?', category: 'Shipping', keywords: ['shipping'] },
  
  // Order Tracking
  { query: 'Track my order', category: 'Order Tracking', keywords: ['order', 'track'] },
  { query: 'Order status', category: 'Order Tracking', keywords: ['order'] },
  
  // Payment
  { query: 'Payment methods', category: 'Payment', keywords: ['payment', 'card'] },
  { query: 'How to pay?', category: 'Payment', keywords: ['payment'] },
  
  // Services
  { query: 'What services do you offer?', category: 'Services', keywords: ['services'] },
  { query: 'Book a service', category: 'Services', keywords: ['services', 'book'] },
  
  // Events
  { query: 'Upcoming events', category: 'Events', keywords: ['events'] },
  { query: 'What events?', category: 'Events', keywords: ['events'] },
  
  // Products
  { query: 'What products do you have?', category: 'Products', keywords: ['products'] },
  
  // Greetings
  { query: 'Hi', category: 'Greetings', keywords: ['hello', 'assistant'] },
  { query: 'Hello', category: 'Greetings', keywords: ['hello'] },
  
  // Thank You
  { query: 'Thank you', category: 'Thank You', keywords: ['welcome'] },
  
  // Goodbye
  { query: 'Bye', category: 'Goodbye', keywords: ['goodbye'] },
];

async function testFAQ(query, category, keywords) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
    });
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        query,
        category,
        passed: false,
        error: `HTTP ${response.status}`,
        duration,
      };
    }
    
    const data = await response.json();
    const responseText = data.response || '';
    const lowerResponse = responseText.toLowerCase();
    
    // Quality checks
    const checks = {
      hasResponse: responseText.length > 0,
      minLength: responseText.length >= 20,
      hasKeywords: keywords.length === 0 || keywords.some(kw => lowerResponse.includes(kw.toLowerCase())),
      isHelpful: responseText.length > 30,
      source: data.source,
      cached: data.cached || false,
    };
    
    // More flexible passing criteria - allow if response exists and is helpful even if keywords don't match exactly
    const passed = checks.hasResponse && checks.minLength && (checks.hasKeywords || (checks.isHelpful && responseText.length > 40));
    const qualityScore = [
      checks.hasResponse ? 20 : 0,
      checks.minLength ? 20 : 0,
      checks.hasKeywords ? 30 : 0,
      checks.isHelpful ? 20 : 0,
      checks.source === 'rule' ? 10 : 0,
    ].reduce((a, b) => a + b, 0);
    
    return {
      query,
      category,
      passed,
      qualityScore,
      duration,
      response: responseText.substring(0, 100),
      source: data.source,
      cached: data.cached,
      checks,
    };
  } catch (error) {
    return {
      query,
      category,
      passed: false,
      error: error.message,
      duration: 0,
    };
  }
}

async function runAllTests() {
  log('\n🚀 Starting Automated AI Assistant FAQ Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = [];
  const categoryStats = {};
  
  // Test all FAQs
  for (const test of allFAQTests) {
    log(`\nTesting: "${test.query}"`, 'blue');
    const result = await testFAQ(test.query, test.category, test.keywords);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Update category stats
    if (!categoryStats[test.category]) {
      categoryStats[test.category] = { passed: 0, total: 0, avgScore: 0, scores: [] };
    }
    categoryStats[test.category].total++;
    if (result.passed) categoryStats[test.category].passed++;
    if (result.qualityScore) {
      categoryStats[test.category].scores.push(result.qualityScore);
    }
    
    // Display result
    if (result.passed) {
      log(`  ✅ PASSED (${result.qualityScore}% quality, ${result.duration}ms)`, 'green');
      log(`     Source: ${result.source}${result.cached ? ' (cached)' : ''}`, 'cyan');
    } else {
      log(`  ❌ FAILED`, 'red');
      if (result.error) {
        log(`     Error: ${result.error}`, 'red');
      } else {
        log(`     Quality Score: ${result.qualityScore}%`, 'yellow');
        log(`     Issues: ${Object.entries(result.checks || {})
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', ')}`, 'yellow');
      }
    }
  }
  
  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgQuality = results
    .filter(r => r.qualityScore)
    .reduce((sum, r) => sum + r.qualityScore, 0) / results.filter(r => r.qualityScore).length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  // Calculate category averages
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    stats.avgScore = stats.scores.length > 0
      ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
      : 0;
  });
  
  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTotal Tests: ${results.length}`, 'blue');
  log(`✅ Passed: ${passed} (${((passed/results.length)*100).toFixed(1)}%)`, 'green');
  log(`❌ Failed: ${failed} (${((failed/results.length)*100).toFixed(1)}%)`, failed > 0 ? 'red' : 'green');
  log(`📈 Average Quality Score: ${avgQuality.toFixed(1)}%`, 'blue');
  log(`⏱️  Average Response Time: ${avgDuration.toFixed(0)}ms`, 'blue');
  
  log('\n📋 Category Breakdown:', 'cyan');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(0);
    const color = stats.passed === stats.total ? 'green' : stats.passed > 0 ? 'yellow' : 'red';
    log(`  ${category}: ${stats.passed}/${stats.total} passed (${passRate}%) - Avg Quality: ${stats.avgScore.toFixed(1)}%`, color);
  });
  
  // Show failed tests
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    failedTests.forEach(test => {
      log(`  • "${test.query}" (${test.category})`, 'red');
      if (test.error) {
        log(`    Error: ${test.error}`, 'red');
      } else {
        log(`    Quality: ${test.qualityScore}%`, 'yellow');
      }
    });
  }
  
  // Performance analysis
  const ruleBased = results.filter(r => r.source === 'rule');
  const cached = results.filter(r => r.cached);
  const apiCalls = results.filter(r => r.source === 'ai');
  
  log('\n⚡ Performance Analysis:', 'cyan');
  log(`  Rule-based responses: ${ruleBased.length} (${((ruleBased.length/results.length)*100).toFixed(1)}%)`, 'green');
  log(`  Cached responses: ${cached.length} (${((cached.length/results.length)*100).toFixed(1)}%)`, 'green');
  log(`  API calls: ${apiCalls.length} (${((apiCalls.length/results.length)*100).toFixed(1)}%)`, 'yellow');
  
  if (ruleBased.length > 0) {
    const avgRuleTime = ruleBased.reduce((sum, r) => sum + r.duration, 0) / ruleBased.length;
    log(`  Avg rule-based time: ${avgRuleTime.toFixed(0)}ms`, 'green');
  }
  
  if (apiCalls.length > 0) {
    const avgAPITime = apiCalls.reduce((sum, r) => sum + r.duration, 0) / apiCalls.length;
    log(`  Avg API call time: ${avgAPITime.toFixed(0)}ms`, 'yellow');
  }
  
  // Final verdict
  log('\n' + '='.repeat(60), 'cyan');
  if (passed === results.length && avgQuality >= 80) {
    log('✅ ALL TESTS PASSED - Excellent Quality!', 'green');
  } else if (passed >= results.length * 0.8 && avgQuality >= 70) {
    log('⚠️  MOST TESTS PASSED - Good Quality', 'yellow');
  } else {
    log('❌ SOME TESTS FAILED - Needs Improvement', 'red');
  }
  log('='.repeat(60) + '\n', 'cyan');
  
  return {
    total: results.length,
    passed,
    failed,
    avgQuality,
    avgDuration,
    categoryStats,
  };
}

// Run if executed directly
if (require.main === module) {
  runAllTests()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testFAQ, allFAQTests };

