# AI Assistant Test Cases - Comprehensive Testing Guide

## Overview
This document contains comprehensive test cases to verify all AI Assistant features are working correctly.

---

## 1. Authentication & Authorization Tests

### Test 1.1: Unauthenticated User Chat
**Scenario:** User without authentication sends a message
- **Steps:**
  1. Open AI chat without logging in
  2. Send message: "Hello"
- **Expected:**
  - Chat should work (guest mode)
  - Response should be received
  - No user-specific personalization
  - No conversation history saved

### Test 1.2: Authenticated User Chat
**Scenario:** Logged-in user sends a message
- **Steps:**
  1. Log in to the application
  2. Open AI chat
  3. Send message: "What products did I view?"
- **Expected:**
  - Chat should work
  - Response should include user's viewing history
  - Conversation should be saved to database
  - Usage should be tracked

### Test 1.3: Tracking Without Auth
**Scenario:** Track interaction without authentication
- **Steps:**
  1. Without logging in, trigger a product view
  2. Check if tracking API is called
- **Expected:**
  - Tracking should fail gracefully
  - No error should be shown to user
  - Console warning may appear

### Test 1.4: Tracking With Auth
**Scenario:** Track interaction with valid authentication
- **Steps:**
  1. Log in
  2. View a product
  3. Check database for interaction record
- **Expected:**
  - Interaction should be saved to `user_interactions` table
  - Metadata should include product details
  - Timestamp should be recorded

---

## 2. Chat API Endpoint Tests (`/api/ai/chat`)

### Test 2.1: Missing Message Parameter
**Scenario:** Send request without message
- **Request:**
  ```json
  {
    "conversationHistory": [],
    "userId": "test-user-id"
  }
  ```
- **Expected:**
  - Status: 400
  - Error: "Message is required"

### Test 2.2: Empty Message
**Scenario:** Send empty message
- **Request:**
  ```json
  {
    "message": "",
    "userId": "test-user-id"
  }
  ```
- **Expected:**
  - Status: 400
  - Error: "Message is required"

### Test 2.3: Pre-computed Response Match
**Scenario:** Query matches database pre-computed response
- **Steps:**
  1. Add pre-computed response in database:
     - Pattern: "return policy"
     - Response: "Our return policy allows returns within 30 days..."
  2. Send message: "What is your return policy?"
- **Expected:**
  - Status: 200
  - Response should match pre-computed text
  - Source: "precomputed"
  - No API call made
  - Fast response time (< 100ms)

### Test 2.4: Rule-Based Response Match
**Scenario:** Query matches hardcoded rule
- **Test Cases:**
  - "What is your return policy?" → Should match return policy rule
  - "How do I contact support?" → Should match support rule
  - "Shipping time?" → Should match shipping rule
  - "Hi" → Should match greeting rule
  - "Thank you" → Should match thank you rule
- **Expected:**
  - Status: 200
  - Source: "rule"
  - Response matches rule response
  - No API call made
  - Very fast response (< 50ms)

### Test 2.5: Cache Hit (Database)
**Scenario:** Query was previously cached in database
- **Steps:**
  1. Send message: "Tell me about car parts"
  2. Wait for response (should call API)
  3. Send same message again immediately
- **Expected:**
  - First request: Source "ai", cached: false
  - Second request: Source "cache", cached: true
  - Response identical
  - Much faster second response
  - Cache hits incremented in database

### Test 2.6: Cache Hit (Memory)
**Scenario:** Query cached in server memory
- **Steps:**
  1. Send message: "What products do you have?"
  2. Send same message within cache TTL
- **Expected:**
  - Second request uses memory cache
  - Very fast response
  - Source: "cache"

### Test 2.7: Cache Miss
**Scenario:** New query not in cache
- **Steps:**
  1. Send unique message: "Tell me about electric vehicles in 2024"
- **Expected:**
  - Status: 200
  - Source: "ai"
  - Cached: false
  - Response saved to cache
  - API call made

### Test 2.8: User Context Integration
**Scenario:** Authenticated user with cart and orders
- **Steps:**
  1. Add items to cart
  2. Place an order
  3. Send message: "What's in my cart?"
- **Expected:**
  - Response should mention cart items
  - Context should include cart info
  - Action buttons should include "View Cart"

### Test 2.9: User Interaction History
**Scenario:** User with viewing/search history
- **Steps:**
  1. View 3 products
  2. Search for "brake pads"
  3. Send message: "What did I search for?"
- **Expected:**
  - Response should mention recent searches
  - Should reference viewed products
  - Personalized recommendations

### Test 2.10: Model Selection (GPT-3.5)
**Scenario:** Simple query should use GPT-3.5
- **Test Cases:**
  - "What is a brake pad?"
  - "How do I track my order?"
  - "Where is the shop page?"
- **Expected:**
  - Model: "gpt-3.5-turbo"
  - Lower cost
  - Fast response

### Test 2.11: Model Selection (GPT-4)
**Scenario:** Complex query should use GPT-4
- **Test Cases:**
  - "Compare different types of engine oils and recommend the best one for my 2020 Honda Civic"
  - "Analyze my purchase history and suggest personalized products"
- **Expected:**
  - Model: "gpt-4"
  - Higher quality response
  - Higher cost

### Test 2.12: Conversation History
**Scenario:** Multi-turn conversation
- **Steps:**
  1. Send: "What products do you have?"
  2. Send: "Tell me more about the first one"
  3. Send: "What's the price?"
- **Expected:**
  - Each response should consider previous messages
  - Context maintained across turns
  - Conversation saved to database

### Test 2.13: Action Buttons Generation
**Scenario:** Query triggers action button generation
- **Test Cases:**
  - "Show me my cart" → Should have "View Cart" button
  - "I want to buy products" → Should have "Browse Shop" button
  - "Book a service" → Should have "Browse Services" button
  - "Find vendors" → Should have "Find Vendors" button
- **Expected:**
  - Response includes `actions` array
  - Buttons are clickable
  - Navigation works correctly

### Test 2.14: Circuit Breaker Active
**Scenario:** API failures trigger circuit breaker
- **Steps:**
  1. Disable OpenAI API key (or simulate failures)
  2. Make multiple failed requests
  3. Try to send message
- **Expected:**
  - After threshold, circuit breaker opens
  - Error: "AI service temporarily unavailable"
  - Graceful degradation

### Test 2.15: Rate Limiting by User Tier
**Scenario:** Different limits for free/premium/vendor
- **Test Cases:**
  - Free user: Limited requests
  - Premium user: Higher limit
  - Vendor: Highest limit
- **Expected:**
  - Limits enforced correctly
  - Appropriate error messages
  - Usage tracked per tier

### Test 2.16: Usage Tracking
**Scenario:** API usage recorded in database
- **Steps:**
  1. Send message as authenticated user
  2. Check `user_ai_usage` table
- **Expected:**
  - Request count incremented
  - Token count recorded
  - Cost estimate calculated
  - Monthly period tracked

### Test 2.17: Conversation History Saving
**Scenario:** Conversation saved to database
- **Steps:**
  1. Send multiple messages
  2. Check `ai_conversations` table
- **Expected:**
  - Messages array contains all messages
  - Context saved
  - Updated timestamp on each message

### Test 2.18: Error Handling - API Failure
**Scenario:** OpenAI API returns error
- **Steps:**
  1. Use invalid API key
  2. Send message
- **Expected:**
  - Status: 500
  - Error message in response
  - Fallback response provided
  - Error tracked in analytics

### Test 2.19: Error Handling - Network Timeout
**Scenario:** API call times out
- **Steps:**
  1. Simulate network timeout
  2. Send message
- **Expected:**
  - Timeout handled gracefully
  - Error response
  - Circuit breaker updated

### Test 2.20: Error Handling - Invalid Response
**Scenario:** API returns unexpected format
- **Steps:**
  1. Mock API to return invalid JSON
  2. Send message
- **Expected:**
  - Error handled
  - Fallback response
  - No crash

---

## 3. Tracking API Tests (`/api/ai/track`)

### Test 3.1: Track Product View
**Scenario:** User views a product
- **Request:**
  ```json
  {
    "interaction_type": "view",
    "item_type": "product",
    "item_id": "product-123",
    "metadata": {
      "productName": "Brake Pads",
      "category": "brakes",
      "price": 2999
    }
  }
  ```
- **Expected:**
  - Status: 200
  - Success: true
  - Record in `user_interactions` table
  - Metadata saved correctly

### Test 3.2: Track Product Click
**Scenario:** User clicks on product card
- **Request:**
  ```json
  {
    "interaction_type": "click",
    "item_type": "product",
    "item_id": "product-456"
  }
  ```
- **Expected:**
  - Status: 200
  - Interaction recorded

### Test 3.3: Track Add to Cart
**Scenario:** User adds product to cart
- **Request:**
  ```json
  {
    "interaction_type": "add_to_cart",
    "item_type": "product",
    "item_id": "product-789",
    "metadata": {
      "productName": "Engine Oil",
      "quantity": 2
    }
  }
  ```
- **Expected:**
  - Status: 200
  - Interaction saved
  - Metadata includes quantity

### Test 3.4: Track Search
**Scenario:** User searches for products
- **Request:**
  ```json
  {
    "interaction_type": "search",
    "item_type": "product",
    "metadata": {
      "query": "brake pads",
      "resultsCount": 15,
      "category": "brakes"
    }
  }
  ```
- **Expected:**
  - Status: 200
  - Search query saved
  - Results count recorded

### Test 3.5: Track Without Auth
**Scenario:** Track without authentication token
- **Request:**
  ```json
  {
    "interaction_type": "view",
    "item_type": "product"
  }
  ```
- **Headers:** No Authorization header
- **Expected:**
  - Status: 401
  - Error: "Unauthorized"

### Test 3.6: Track With Invalid Token
**Scenario:** Track with expired/invalid token
- **Request:** Same as Test 3.1
- **Headers:** Authorization: Bearer invalid-token
- **Expected:**
  - Status: 401
  - Error: "Unauthorized"

### Test 3.7: Track Missing Fields
**Scenario:** Track with missing required fields
- **Request:**
  ```json
  {
    "interaction_type": "view"
  }
  ```
- **Expected:**
  - Status: 200 (item_type optional)
  - Or appropriate validation error

### Test 3.8: Track Service View
**Scenario:** User views a service
- **Request:**
  ```json
  {
    "interaction_type": "view",
    "item_type": "service",
    "item_id": "service-123"
  }
  ```
- **Expected:**
  - Status: 200
  - Service interaction recorded

### Test 3.9: Track Event View
**Scenario:** User views an event
- **Request:**
  ```json
  {
    "interaction_type": "view",
    "item_type": "event",
    "item_id": "event-456"
  }
  ```
- **Expected:**
  - Status: 200
  - Event interaction recorded

---

## 4. Client-Side Component Tests

### Test 4.1: Chat Window Open/Close
**Scenario:** Toggle chat window
- **Steps:**
  1. Click AI chat button
  2. Verify window opens
  3. Click close button
  4. Verify window closes
- **Expected:**
  - Smooth animation
  - Window appears/disappears correctly
  - Button state updates

### Test 4.2: Send Message via Button
**Scenario:** Send message using send button
- **Steps:**
  1. Type message: "Hello"
  2. Click send button
- **Expected:**
  - Message appears in chat
  - Input clears
  - Loading indicator shows
  - Response received

### Test 4.3: Send Message via Enter Key
**Scenario:** Send message using Enter key
- **Steps:**
  1. Type message: "Hello"
  2. Press Enter
- **Expected:**
  - Message sent
  - Input clears
  - Response received

### Test 4.4: Prevent Empty Message
**Scenario:** Try to send empty message
- **Steps:**
  1. Leave input empty
  2. Try to send
- **Expected:**
  - Send button disabled
  - Enter key doesn't send
  - No API call made

### Test 4.5: Client-Side Cache Check
**Scenario:** Check client cache before API call
- **Steps:**
  1. Send message: "What is a brake pad?"
  2. Wait for response
  3. Send same message again
- **Expected:**
  - Second request uses client cache
  - No API call made
  - Instant response
  - Cached indicator shown

### Test 4.6: Loading State
**Scenario:** Show loading during API call
- **Steps:**
  1. Send message
  2. Observe loading state
- **Expected:**
  - Loading spinner appears
  - Input disabled
  - Send button shows spinner
  - Loading disappears on response

### Test 4.7: Error Display
**Scenario:** Show error message on failure
- **Steps:**
  1. Disconnect network
  2. Send message
- **Expected:**
  - Error message displayed
  - User-friendly message
  - No crash
  - Can retry

### Test 4.8: Message History Display
**Scenario:** Display conversation history
- **Steps:**
  1. Send multiple messages
  2. Scroll through chat
- **Expected:**
  - All messages visible
  - Correct timestamps
  - Proper styling (user vs assistant)
  - Auto-scroll to bottom

### Test 4.9: Action Buttons Display
**Scenario:** Show action buttons in response
- **Steps:**
  1. Send: "Show me products"
  2. Wait for response
- **Expected:**
  - Action buttons appear
  - Buttons are clickable
  - Navigation works
  - Buttons styled correctly

### Test 4.10: FAQ Dialog Integration
**Scenario:** Open FAQ dialog
- **Steps:**
  1. Click FAQ button (help icon)
  2. Select a question
- **Expected:**
  - Dialog opens
  - Questions displayed
  - Selecting question sends it
  - Dialog closes

### Test 4.11: Context Collection
**Scenario:** Component collects page context
- **Steps:**
  1. Navigate to shop page
  2. Add item to cart
  3. Open chat
  4. Send: "What's in my cart?"
- **Expected:**
  - Context includes current page
  - Cart items included
  - Response references cart

### Test 4.12: Conversation History Maintenance
**Scenario:** Maintain conversation across messages
- **Steps:**
  1. Send: "What products do you have?"
  2. Send: "Tell me more"
- **Expected:**
  - Second message considers first
  - Context maintained
  - History sent to API

### Test 4.13: Mobile Responsiveness
**Scenario:** Chat works on mobile
- **Steps:**
  1. Open on mobile device
  2. Test chat functionality
- **Expected:**
  - Chat button visible
  - Window fits screen
  - Touch interactions work
  - Keyboard doesn't cover input

---

## 5. Cache System Tests

### Test 5.1: Database Cache Creation
**Scenario:** Response saved to database cache
- **Steps:**
  1. Send unique message
  2. Check `ai_response_cache` table
- **Expected:**
  - Record created
  - Query hash stored
  - Response text saved
  - Expiration date set
  - Cache hits = 0

### Test 5.2: Database Cache Retrieval
**Scenario:** Retrieve from database cache
- **Steps:**
  1. Send message (creates cache)
  2. Send same message again
  3. Check cache hits
- **Expected:**
  - Cache hit incremented
  - Response from cache
  - Fast response time

### Test 5.3: Cache Expiration
**Scenario:** Expired cache not used
- **Steps:**
  1. Manually expire cache entry
  2. Send same message
- **Expected:**
  - New API call made
  - New cache entry created
  - Old entry ignored

### Test 5.4: Memory Cache Fallback
**Scenario:** Database cache fails, use memory
- **Steps:**
  1. Disable database access
  2. Send message
  3. Send same message again
- **Expected:**
  - First: API call, memory cache
  - Second: Memory cache used
  - No database error shown

### Test 5.5: Client Cache (IndexedDB)
**Scenario:** Client-side caching
- **Steps:**
  1. Send message
  2. Refresh page
  3. Send same message
- **Expected:**
  - Client cache checked first
  - Instant response if cached
  - Cache persists across sessions

### Test 5.6: Cache TTL by Complexity
**Scenario:** Different TTL for simple vs complex
- **Test Cases:**
  - Simple query: 7 days TTL
  - Complex query: 1 day TTL
- **Expected:**
  - TTL set correctly
  - Expiration dates differ

---

## 6. Query Classification Tests

### Test 6.1: Simple Query Classification
**Scenario:** Classify simple queries
- **Test Cases:**
  - "What is a brake pad?"
  - "How do I track my order?"
  - "Where is the shop?"
- **Expected:**
  - Complexity: "simple"
  - Model: "gpt-3.5-turbo"
  - High confidence

### Test 6.2: Complex Query Classification
**Scenario:** Classify complex queries
- **Test Cases:**
  - "Compare different engine oils and recommend the best one"
  - "Analyze my purchase history and suggest products"
- **Expected:**
  - Complexity: "complex"
  - Model: "gpt-4"
  - Appropriate reasoning

### Test 6.3: Semantic Search Classification
**Scenario:** Classify search queries
- **Test Cases:**
  - "Find brake pads"
  - "Show me products like this"
- **Expected:**
  - Recommended model: "embedding"
  - Complexity: "simple"
  - Search pattern detected

---

## 7. Rule Engine Tests

### Test 7.1: Return Policy Rule
**Scenario:** Match return policy queries
- **Test Cases:**
  - "What is your return policy?"
  - "How do I return an item?"
  - "Can I return this?"
- **Expected:**
  - Rule matched
  - Standard return policy response
  - No API call

### Test 7.2: Support Contact Rule
**Scenario:** Match support queries
- **Test Cases:**
  - "How do I contact support?"
  - "Customer service"
  - "Help desk"
- **Expected:**
  - Rule matched
  - Support contact info
  - No API call

### Test 7.3: Shipping Rule
**Scenario:** Match shipping queries
- **Test Cases:**
  - "Shipping time?"
  - "How long for delivery?"
  - "When will it arrive?"
- **Expected:**
  - Rule matched
  - Shipping info provided
  - No API call

### Test 7.4: Priority Order
**Scenario:** Higher priority rules checked first
- **Steps:**
  1. Query matches multiple rules
  2. Check which rule is used
- **Expected:**
  - Highest priority rule used
  - Correct response

---

## 8. User Tier Tests

### Test 8.1: Free User Limits
**Scenario:** Free user rate limiting
- **Steps:**
  1. Create free user account
  2. Make multiple requests
- **Expected:**
  - Limits enforced
  - Appropriate error after limit
  - Usage tracked

### Test 8.2: Premium User Benefits
**Scenario:** Premium user has higher limits
- **Steps:**
  1. Create premium user
  2. Make requests
- **Expected:**
  - Higher rate limit
  - Priority in queue
  - Better experience

### Test 8.3: Vendor User Benefits
**Scenario:** Vendor user has highest limits
- **Steps:**
  1. Create vendor account
  2. Make requests
- **Expected:**
  - Highest rate limit
  - Highest priority
  - Best experience

---

## 9. Integration Tests

### Test 9.1: End-to-End Chat Flow
**Scenario:** Complete chat interaction
- **Steps:**
  1. User logs in
  2. Views products
  3. Opens chat
  4. Asks: "What products did I view?"
  5. Receives personalized response
  6. Clicks action button
- **Expected:**
  - All steps work
  - Data flows correctly
  - No errors

### Test 9.2: Tracking Integration
**Scenario:** Tracking affects AI responses
- **Steps:**
  1. Track product views
  2. Track searches
  3. Ask AI about interests
- **Expected:**
  - AI references tracked data
  - Personalized responses
  - Recommendations based on history

### Test 9.3: Cache Integration
**Scenario:** Multiple cache layers work together
- **Steps:**
  1. Send message (creates all caches)
  2. Send same message
- **Expected:**
  - Client cache checked first
  - Then server cache
  - Fastest response used

---

## 10. Error Recovery Tests

### Test 10.1: API Failure Recovery
**Scenario:** Recover from API failure
- **Steps:**
  1. Simulate API failure
  2. Wait for circuit breaker
  3. Fix API
  4. Retry
- **Expected:**
  - Circuit breaker opens
  - Graceful error message
  - Recovers when fixed
  - Circuit breaker closes

### Test 10.2: Network Interruption
**Scenario:** Handle network issues
- **Steps:**
  1. Start chat
  2. Disconnect network
  3. Send message
  4. Reconnect
  5. Retry
- **Expected:**
  - Error shown
  - Can retry
  - Works after reconnect

### Test 10.3: Database Failure
**Scenario:** Handle database errors
- **Steps:**
  1. Disable database
  2. Send message
- **Expected:**
  - Falls back to memory cache
  - Still works (degraded)
  - Error logged
  - No crash

---

## 11. Performance Tests

### Test 11.1: Response Time - Rule Match
**Scenario:** Measure rule-based response time
- **Steps:**
  1. Send: "Hi"
  2. Measure response time
- **Expected:**
  - Response time < 50ms
  - Very fast

### Test 11.2: Response Time - Cache Hit
**Scenario:** Measure cached response time
- **Steps:**
  1. Send message (cache it)
  2. Send same message
  3. Measure time
- **Expected:**
  - Response time < 100ms
  - Fast retrieval

### Test 11.3: Response Time - API Call
**Scenario:** Measure API call response time
- **Steps:**
  1. Send unique message
  2. Measure time
- **Expected:**
  - Response time < 3 seconds
  - Reasonable for API call

### Test 11.4: Concurrent Requests
**Scenario:** Handle multiple simultaneous requests
- **Steps:**
  1. Send 5 messages simultaneously
- **Expected:**
  - All processed
  - Queue works correctly
  - No errors
  - Responses received

---

## 12. Security Tests

### Test 12.1: SQL Injection Prevention
**Scenario:** Malicious input in message
- **Steps:**
  1. Send: "'; DROP TABLE users; --"
- **Expected:**
  - Input sanitized
  - No database damage
  - Safe handling

### Test 12.2: XSS Prevention
**Scenario:** Script injection in message
- **Steps:**
  1. Send: "<script>alert('xss')</script>"
- **Expected:**
  - Script not executed
  - Safe rendering
  - Sanitized output

### Test 12.3: Token Validation
**Scenario:** Invalid/expired tokens
- **Steps:**
  1. Use expired token
  2. Try to track interaction
- **Expected:**
  - 401 Unauthorized
  - No data access
  - Secure rejection

---

## 13. Analytics & Monitoring Tests

### Test 13.1: Analytics Tracking
**Scenario:** Verify analytics are tracked
- **Steps:**
  1. Send various messages
  2. Check analytics data
- **Expected:**
  - API calls tracked
  - Cache hits/misses tracked
  - Rule matches tracked
  - Errors tracked

### Test 13.2: Usage Statistics
**Scenario:** Verify usage statistics
- **Steps:**
  1. Make multiple requests
  2. Check usage table
- **Expected:**
  - Request count accurate
  - Token count accurate
  - Cost estimate reasonable
  - Monthly aggregation correct

---

## 14. Edge Cases

### Test 14.1: Very Long Message
**Scenario:** Send extremely long message
- **Steps:**
  1. Send message with 5000+ characters
- **Expected:**
  - Handled gracefully
  - Truncated if needed
  - Response received

### Test 14.2: Special Characters
**Scenario:** Message with special characters
- **Steps:**
  1. Send: "What's the price? @#$%^&*()"
- **Expected:**
  - Handled correctly
  - No errors
  - Response received

### Test 14.3: Unicode/Emoji
**Scenario:** Message with emojis
- **Steps:**
  1. Send: "Hello! 😊 🚗"
- **Expected:**
  - Handled correctly
  - Emojis preserved
  - Response received

### Test 14.4: Rapid Fire Messages
**Scenario:** Send many messages quickly
- **Steps:**
  1. Send 10 messages in 5 seconds
- **Expected:**
  - All processed
  - Queue handles correctly
  - No data loss

### Test 14.5: Empty Context
**Scenario:** Message with no context
- **Steps:**
  1. Send message without user context
- **Expected:**
  - Works correctly
  - Generic response
  - No errors

---

## 15. Database Tests

### Test 15.1: Cache Table Operations
**Scenario:** Verify cache table operations
- **Steps:**
  1. Send message
  2. Check `ai_response_cache` table
  3. Verify upsert works
- **Expected:**
  - Record created/updated
  - Query hash unique
  - Expiration set correctly

### Test 15.2: Usage Table Operations
**Scenario:** Verify usage tracking
- **Steps:**
  1. Send messages as user
  2. Check `user_ai_usage` table
- **Expected:**
  - Monthly records created
  - Counts incremented
  - Costs calculated

### Test 15.3: Conversation Table Operations
**Scenario:** Verify conversation saving
- **Steps:**
  1. Have conversation
  2. Check `ai_conversations` table
- **Expected:**
  - Messages array saved
  - Context saved
  - Updated timestamp

### Test 15.4: Interactions Table Operations
**Scenario:** Verify interaction tracking
- **Steps:**
  1. Track various interactions
  2. Check `user_interactions` table
- **Expected:**
  - All interactions saved
  - Metadata preserved
  - Timestamps correct

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] OpenAI API key configured (or mock mode)
- [ ] Test user accounts created (free, premium, vendor)
- [ ] Sample data in database

### Test Execution
- [ ] Run all authentication tests
- [ ] Run all API endpoint tests
- [ ] Run all tracking tests
- [ ] Run all component tests
- [ ] Run all cache tests
- [ ] Run all integration tests
- [ ] Run all error handling tests
- [ ] Run all performance tests
- [ ] Run all security tests

### Post-Testing
- [ ] Review error logs
- [ ] Check database for test data
- [ ] Verify analytics data
- [ ] Clean up test data
- [ ] Document any issues found

---

## Expected Results Summary

### Success Criteria
- ✅ All API endpoints return correct status codes
- ✅ Authentication works for all scenarios
- ✅ Caching reduces API calls significantly
- ✅ Rule-based responses are instant
- ✅ User context personalizes responses
- ✅ Error handling is graceful
- ✅ Performance meets targets (< 3s for API calls)
- ✅ Security measures prevent attacks
- ✅ Analytics track all events
- ✅ Database operations are reliable

### Performance Targets
- Rule-based response: < 50ms
- Cache hit response: < 100ms
- API call response: < 3s
- Database operations: < 200ms

### Error Rate Targets
- API success rate: > 95%
- Cache hit rate: > 60% (after warm-up)
- Rule match rate: > 30% (for common queries)

---

## Notes
- Use mock mode for development (no API key)
- Test with real API key for production validation
- Monitor costs during testing
- Clean up test data regularly
- Keep test cases updated as features change

