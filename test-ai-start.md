# AI Assistant Testing - Quick Start Guide

## ✅ Setup Complete!

The AI Assistant has been integrated into your application:

1. ✅ **AIProvider** added to `src/app/providers.tsx`
2. ✅ **AIChatAssistant** component added to `src/app/(main)/layout.tsx`
3. ✅ Server should be running on `http://localhost:3000`

## 🚀 Quick Test Steps

### Step 1: Verify Integration
1. Open your browser and navigate to `http://localhost:3000`
2. Look for the **red circular chat button** in the bottom-right corner
3. Click it to open the AI chat window

### Step 2: Basic Functionality Test
1. **Open Chat**: Click the chat button → ✅ Window should open
2. **Send Message**: Type "Hi" and press Enter → ✅ Should get greeting response
3. **Rule-Based Test**: Type "What is your return policy?" → ✅ Should get instant response (no API call)
4. **Close Chat**: Click X button → ✅ Window should close

### Step 3: API Endpoint Test
Open browser console and run:

```javascript
// Test chat API
fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
})
.then(r => r.json())
.then(console.log);
```

**Expected**: Response with `response`, `source`, and `cached` fields

### Step 4: Tracking Test (if logged in)
```javascript
// Test tracking API (requires auth token)
fetch('/api/ai/track', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    interaction_type: 'view',
    item_type: 'product',
    item_id: 'test-123',
    metadata: { productName: 'Test Product' }
  })
})
.then(r => r.json())
.then(console.log);
```

## 📋 What to Check

### Visual Checks
- [ ] Chat button appears in bottom-right
- [ ] Button is red circular with message icon
- [ ] Clicking opens chat window
- [ ] Chat window has proper styling
- [ ] Input field works
- [ ] Send button works
- [ ] Close button works

### Functional Checks
- [ ] Can send messages
- [ ] Receives responses
- [ ] Loading state shows during API calls
- [ ] Error handling works (try disconnecting network)
- [ ] Rule-based responses are instant
- [ ] Cache works (send same message twice)

### Database Checks (if you have access)
```sql
-- Check cache table
SELECT * FROM ai_response_cache ORDER BY created_at DESC LIMIT 5;

-- Check usage tracking
SELECT * FROM user_ai_usage ORDER BY created_at DESC LIMIT 5;

-- Check conversations
SELECT * FROM ai_conversations ORDER BY updated_at DESC LIMIT 5;

-- Check interactions
SELECT * FROM user_interactions ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Chat Button Not Appearing
- Check browser console for errors
- Verify `AIChatAssistant` is imported in layout
- Check if component renders (inspect DOM)

### No Response from API
- Check server logs for errors
- Verify OpenAI API key in `.env.local` (or using mock mode)
- Check network tab for failed requests
- Verify `/api/ai/chat` endpoint is accessible

### Context Errors
- Verify `AIProvider` is in providers.tsx
- Check that `AIContext` is properly set up
- Ensure `useAI()` hook is used within provider

## 📝 Next Steps

1. **Run Full Test Suite**: Use `AI_ASSISTANT_TEST_CASES.md` for comprehensive testing
2. **Quick Checklist**: Use `AI_ASSISTANT_QUICK_TEST_CHECKLIST.md` for rapid verification
3. **Automated Tests**: Load `test-ai-assistant.js` in browser console

## 🎯 Success Criteria

✅ Chat button visible and clickable
✅ Chat window opens and closes smoothly
✅ Messages can be sent and received
✅ Rule-based responses work (instant)
✅ API calls work (with or without API key)
✅ Error handling is graceful
✅ No console errors

---

**Ready to test!** Open `http://localhost:3000` and look for the chat button in the bottom-right corner.

