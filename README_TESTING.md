# AI Assistant Automated Testing

## 🎯 Quick Start

```bash
# Run all FAQ tests (recommended)
npm run test:ai:faq

# Run Jest unit tests
npm run test:ai

# Run with watch mode
npm run test:ai:watch
```

## 📊 Current Test Results

**Status:** ✅ **17/20 tests passing (85%)**

- Average Quality Score: **94%**
- Average Response Time: **272ms**
- Rule-based responses: **85%** (fast, no API cost)

## 📁 Test Files

### Automated Test Scripts
- `test-ai-automated.js` - Main FAQ test runner (Node.js)
- `src/__tests__/ai/` - Jest unit tests

### Documentation
- `AI_AUTOMATED_TESTING_GUIDE.md` - Complete testing guide
- `AI_ASSISTANT_TEST_CASES.md` - Comprehensive test cases
- `AI_ASSISTANT_QUICK_TEST_CHECKLIST.md` - Quick manual checklist

## ✅ What Gets Tested

- ✅ All FAQ queries (20+ test cases)
- ✅ Response quality validation
- ✅ Keyword matching
- ✅ Grammar and formatting
- ✅ Helpfulness checks
- ✅ Performance metrics
- ✅ Rule-based vs API calls
- ✅ Cache functionality

## 🎯 Quality Metrics

Each response is scored 0-100 based on:
- Response existence (20 pts)
- Minimum length (15 pts)
- Keyword matching (20 pts)
- Helpfulness (20 pts)
- Grammar (15 pts)
- Actionability (10 pts)

**Passing Score: 70+**

## 📈 Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Return Policy | 3 | 67% pass |
| Support | 2 | 100% pass |
| Shipping | 2 | 100% pass |
| Order Tracking | 2 | 50% pass |
| Payment | 2 | 100% pass |
| Services | 2 | 50% pass |
| Events | 2 | 100% pass |
| Products | 1 | 100% pass |
| Greetings | 2 | 100% pass |
| Thank You | 1 | 100% pass |
| Goodbye | 1 | 100% pass |

## 🚀 Running Tests

### Basic Test Run
```bash
npm run test:ai:faq
```

### With Custom URL
```bash
TEST_URL=http://localhost:3001 node test-ai-automated.js
```

### Jest Tests
```bash
npm run test:ai              # Run once
npm run test:ai:watch        # Watch mode
npm run test:coverage        # With coverage
```

## 📝 Adding New Tests

Edit `test-ai-automated.js`:

```javascript
const allFAQTests = [
  // ... existing tests
  { 
    query: 'Your new question', 
    category: 'Category', 
    keywords: ['keyword1', 'keyword2'] 
  },
];
```

## 🔍 Understanding Results

### ✅ Passed
- Response exists
- Meets minimum length
- Contains expected keywords OR is helpful enough
- Quality score ≥ 70%

### ❌ Failed
- Missing response
- Too short
- Missing keywords and not helpful enough
- Quality score < 70%

## 📊 Performance Analysis

The test runner reports:
- **Rule-based responses** - Fast, no API cost
- **Cached responses** - Fast, from database
- **API calls** - Slower, costs money

**Target:** 80%+ rule-based responses

## 🐛 Troubleshooting

### Tests Failing
1. Ensure server is running: `npm run dev`
2. Check API endpoint is accessible
3. Verify test URL in script
4. Review error messages

### Low Quality Scores
1. Check which keywords are missing
2. Review rule engine patterns
3. Adjust quality thresholds if needed

## 📚 More Information

See `AI_AUTOMATED_TESTING_GUIDE.md` for complete documentation.

