# AI Assistant Quick Test Checklist

Use this checklist to quickly verify all AI Assistant features are working.

## ✅ Pre-Testing Setup
- [ ] Database migrations applied (`ai_response_cache`, `user_interactions`, `ai_conversations`, `user_ai_usage`)
- [ ] OpenAI API key set in `.env.local` (or using mock mode)
- [ ] Server running (`npm run dev`)
- [ ] Test user account created
- [ ] Browser console open for debugging

---

## 🔐 Authentication Tests (5 min)

### Unauthenticated User
- [ ] Open chat without logging in
- [ ] Send: "Hello"
- [ ] ✅ Should receive response
- [ ] ✅ No personalization

### Authenticated User
- [ ] Log in
- [ ] Open chat
- [ ] Send: "What products did I view?"
- [ ] ✅ Should work with user context

---

## 💬 Basic Chat Tests (10 min)

### Rule-Based Responses (Should be instant, no API call)
- [ ] "Hi" → ✅ Greeting response
- [ ] "What is your return policy?" → ✅ Return policy info
- [ ] "How do I contact support?" → ✅ Support contact
- [ ] "Shipping time?" → ✅ Shipping info
- [ ] "Thank you" → ✅ Thank you response

### Cache Tests
- [ ] Send unique message: "Tell me about brake pads"
- [ ] Wait for response (first time = API call)
- [ ] Send same message again
- [ ] ✅ Second time should be instant (cached)
- [ ] ✅ Response shows "cached" indicator

### API Calls (If no rule/cache match)
- [ ] Send: "Compare engine oils for my Honda Civic"
- [ ] ✅ Should receive AI response
- [ ] ✅ Response time < 3 seconds
- [ ] ✅ Response is relevant

---

## 📊 Tracking Tests (5 min)

### Product View Tracking
- [ ] View a product page
- [ ] Check browser console (should see tracking call)
- [ ] Check database: `SELECT * FROM user_interactions WHERE interaction_type = 'view'`
- [ ] ✅ Record exists

### Search Tracking
- [ ] Search for "brake pads" in shop
- [ ] Check database
- [ ] ✅ Search interaction recorded

### Add to Cart Tracking
- [ ] Add product to cart
- [ ] Check database
- [ ] ✅ Add to cart interaction recorded

---

## 🎯 Context & Personalization Tests (10 min)

### Cart Context
- [ ] Add items to cart
- [ ] Open chat
- [ ] Ask: "What's in my cart?"
- [ ] ✅ Response mentions cart items
- [ ] ✅ Action button: "View Cart"

### Order History Context
- [ ] Place an order (or have existing orders)
- [ ] Ask: "What did I order?"
- [ ] ✅ Response mentions orders

### Viewing History Context
- [ ] View 3-5 products
- [ ] Ask: "What products did I view?"
- [ ] ✅ Response lists viewed products

### Search History Context
- [ ] Search for multiple items
- [ ] Ask: "What did I search for?"
- [ ] ✅ Response mentions searches

---

## 🎨 UI Component Tests (5 min)

### Chat Window
- [ ] Click AI chat button → ✅ Window opens
- [ ] Click close button → ✅ Window closes
- [ ] Type message → ✅ Input works
- [ ] Click send → ✅ Message sent
- [ ] Press Enter → ✅ Message sent
- [ ] Try empty message → ✅ Send disabled

### Loading States
- [ ] Send message → ✅ Loading spinner shows
- [ ] Wait for response → ✅ Spinner disappears

### Error Handling
- [ ] Disconnect network
- [ ] Send message → ✅ Error message shown
- [ ] Reconnect → ✅ Can retry

### Action Buttons
- [ ] Ask: "Show me products"
- [ ] ✅ Action buttons appear
- [ ] Click button → ✅ Navigation works

### FAQ Dialog
- [ ] Click FAQ icon (help circle)
- [ ] ✅ Dialog opens
- [ ] Select question → ✅ Question sent to chat

---

## 🗄️ Database Tests (5 min)

### Cache Table
```sql
SELECT * FROM ai_response_cache ORDER BY created_at DESC LIMIT 5;
```
- [ ] ✅ Recent queries cached
- [ ] ✅ Expiration dates set
- [ ] ✅ Cache hits incrementing

### Usage Table
```sql
SELECT * FROM user_ai_usage WHERE user_id = 'your-user-id';
```
- [ ] ✅ Request count accurate
- [ ] ✅ Token count recorded
- [ ] ✅ Cost estimate calculated

### Conversations Table
```sql
SELECT * FROM ai_conversations WHERE user_id = 'your-user-id';
```
- [ ] ✅ Messages array saved
- [ ] ✅ Context saved
- [ ] ✅ Updated timestamp

### Interactions Table
```sql
SELECT * FROM user_interactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 10;
```
- [ ] ✅ All interactions recorded
- [ ] ✅ Metadata preserved

---

## ⚡ Performance Tests (5 min)

### Response Times
- [ ] Rule-based query ("Hi") → ✅ < 50ms
- [ ] Cached query → ✅ < 100ms
- [ ] API call → ✅ < 3 seconds

### Concurrent Requests
- [ ] Send 3 messages quickly
- [ ] ✅ All processed
- [ ] ✅ No errors

---

## 🔒 Security Tests (5 min)

### Input Sanitization
- [ ] Send: "<script>alert('xss')</script>"
- [ ] ✅ Script not executed
- [ ] ✅ Safe rendering

### SQL Injection
- [ ] Send: "'; DROP TABLE users; --"
- [ ] ✅ No database damage
- [ ] ✅ Handled safely

### Authentication
- [ ] Try tracking without token
- [ ] ✅ 401 Unauthorized
- [ ] ✅ No data access

---

## 🎯 Action Button Tests (5 min)

### Cart Actions
- [ ] Ask: "Show me my cart"
- [ ] ✅ "View Cart" button appears
- [ ] Click → ✅ Navigates to cart

### Shop Actions
- [ ] Ask: "I want to buy products"
- [ ] ✅ "Browse Shop" button appears
- [ ] Click → ✅ Navigates to shop

### Service Actions
- [ ] Ask: "Book a service"
- [ ] ✅ "Browse Services" button appears
- [ ] Click → ✅ Navigates to services

### Vendor Actions
- [ ] Ask: "Find vendors near me"
- [ ] ✅ "Find Vendors" button appears
- [ ] Click → ✅ Navigates to vendor map

---

## 🔄 Error Recovery Tests (5 min)

### API Failure
- [ ] Temporarily disable API key
- [ ] Send message
- [ ] ✅ Graceful error message
- [ ] ✅ Circuit breaker activates
- [ ] Re-enable API key
- [ ] ✅ Recovers after timeout

### Network Issues
- [ ] Disconnect network
- [ ] Send message
- [ ] ✅ Error shown
- [ ] Reconnect
- [ ] ✅ Can retry successfully

---

## 📱 Mobile Tests (5 min)

### Mobile Responsiveness
- [ ] Open on mobile device
- [ ] ✅ Chat button visible
- [ ] ✅ Window fits screen
- [ ] ✅ Touch interactions work
- [ ] ✅ Keyboard doesn't cover input

---

## 🎓 Advanced Tests (10 min)

### Multi-Turn Conversation
- [ ] Ask: "What products do you have?"
- [ ] Ask: "Tell me more about the first one"
- [ ] Ask: "What's the price?"
- [ ] ✅ Context maintained
- [ ] ✅ Responses are coherent

### Model Selection
- [ ] Simple query → ✅ Uses GPT-3.5
- [ ] Complex query → ✅ Uses GPT-4
- [ ] Check response for model info

### User Tier Limits
- [ ] Free user → ✅ Basic limits
- [ ] Premium user → ✅ Higher limits
- [ ] Vendor → ✅ Highest limits

---

## 📈 Analytics Verification (5 min)

### Check Analytics
- [ ] Send various messages
- [ ] Check console logs
- [ ] ✅ API calls tracked
- [ ] ✅ Cache hits tracked
- [ ] ✅ Rule matches tracked
- [ ] ✅ Errors logged

---

## ✅ Final Verification

### All Systems Working
- [ ] Chat opens and closes smoothly
- [ ] Messages send and receive correctly
- [ ] Caching reduces API calls
- [ ] Rule-based responses are instant
- [ ] User context personalizes responses
- [ ] Action buttons work
- [ ] Tracking saves to database
- [ ] Errors handled gracefully
- [ ] Performance meets targets
- [ ] Mobile experience is good

---

## 🐛 Common Issues to Check

### If Chat Doesn't Open
- [ ] Check browser console for errors
- [ ] Verify component is imported in layout
- [ ] Check if AIContext provider is set up

### If No Responses
- [ ] Check API endpoint is accessible
- [ ] Verify OpenAI API key (or mock mode)
- [ ] Check network tab for failed requests
- [ ] Review server logs

### If Cache Not Working
- [ ] Verify database tables exist
- [ ] Check cache TTL settings
- [ ] Review cache implementation

### If Tracking Not Working
- [ ] Verify user is authenticated
- [ ] Check token is valid
- [ ] Review database permissions
- [ ] Check browser console for errors

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Authentication: ✅ / ❌
Basic Chat: ✅ / ❌
Tracking: ✅ / ❌
Context: ✅ / ❌
UI Components: ✅ / ❌
Database: ✅ / ❌
Performance: ✅ / ❌
Security: ✅ / ❌
Action Buttons: ✅ / ❌
Error Recovery: ✅ / ❌
Mobile: ✅ / ❌

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## 🚀 Quick Test Command

Run this in browser console after loading the test script:

```javascript
// Load test script first, then:
AIAssistantTests.runAllTests();
```

Or test individual features:

```javascript
AIAssistantTests.runBasicChatTests();
AIAssistantTests.runCacheTests();
AIAssistantTests.runRuleBasedTests();
```

---

**Total Estimated Time: 60-75 minutes for complete testing**

**Quick Smoke Test: 15 minutes (Basic Chat + Tracking + UI)**

