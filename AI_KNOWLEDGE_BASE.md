# AI Assistant Knowledge Base - What Questions Can It Answer?

## Overview
The Shining Motors AI Assistant can answer questions about the platform, help with navigation, provide information about features, and assist with user-specific queries using context awareness.

---

## 📋 **Instant Rule-Based Responses** (No API Call - Fastest)

These questions get instant responses from pre-defined rules:

### 1. **Return & Refund Policy**
- "What is your return policy?"
- "How do I return an item?"
- "Can I get a refund?"
- "Refund policy"

**Response**: Returns within 30 days, items must be unused and in original packaging.

### 2. **Contact & Support**
- "How do I contact support?"
- "Customer service"
- "Help desk"
- "Support email"

**Response**: Contact via email at support@shiningmotors.com or messaging system. Response within 24 hours.

### 3. **Shipping & Delivery**
- "Shipping information"
- "How long does delivery take?"
- "When will my order arrive?"
- "Delivery time"

**Response**: Standard shipping 5-7 business days. Express shipping (2-3 days) available at checkout.

### 4. **Order Tracking**
- "Track my order"
- "Order status"
- "Where is my order?"
- "Order tracking"

**Response**: Track orders in the 'Orders' section of your profile.

### 5. **Payment Methods**
- "What payment methods do you accept?"
- "How do I pay?"
- "Accepted payments"

**Response**: Credit cards, debit cards, UPI, and digital wallets. Secure checkout.

### 6. **Account & Profile**
- "How do I change my password?"
- "Update my profile"
- "Account settings"
- "Edit account"

**Response**: Update profile and settings from your profile page.

### 7. **Services**
- "What services do you offer?"
- "Available services"
- "Book a service"
- "Service types"

**Response**: Car wash, AC service, general maintenance, and more. Browse Services section.

### 8. **Events**
- "Upcoming events"
- "What events are there?"
- "Event calendar"
- "When is the next event?"

**Response**: Check Events page for automotive events, races, and meetups. Filter by category and location.

### 9. **Products**
- "What products do you have?"
- "Available products"
- "Product categories"

**Response**: Wide range including OEM parts, accessories, tools. Browse Shop section.

### 10. **Vendor Registration**
- "How do I become a vendor?"
- "Vendor registration"
- "How to sell on the platform?"

**Response**: Visit vendor registration page or contact vendor support team.

### 11. **Sim Racing**
- "What is sim racing?"
- "Simulator"
- "Racing leagues"
- "Sim events"

**Response**: Virtual racing events, leagues, garages, and equipment. Join competitions.

### 12. **Greetings & Politeness**
- "Hi", "Hello", "Hey"
- "Thank you", "Thanks"
- "Bye", "Goodbye"

**Response**: Friendly greetings and acknowledgments.

---

## 🤖 **AI-Powered Context-Aware Responses** (Using OpenAI)

These questions use AI with full context awareness:

### **Platform Features & Navigation**

#### Shopping & Products
- "Find me a red sports car under 50k"
- "Show me car parts for Honda City"
- "What products are similar to [product name]?"
- "I'm looking for [product type]"
- "Best products in [category]"
- "Products under [price]"
- "What's in my cart?" (Uses actual cart data)
- "Add [product] to cart" (Can generate action buttons)

#### Services
- "Find a mechanic near me for AC repair"
- "Book a car wash service"
- "What services are available in [location]?"
- "I need [service type]"
- "Service prices"
- "How to book a service?"

#### Events
- "Events this weekend in Bangalore"
- "Upcoming racing events"
- "Events near me" (Uses user location)
- "What events are happening?"
- "How do I register for events?"

#### Vendors
- "Find vendors near me"
- "Show me mechanics in [city]"
- "Vendor locations"
- "Best rated vendors"
- "Vendors for [service type]"

#### Orders & Cart
- "What's in my cart?" (Shows actual cart items)
- "My order status" (Uses order history)
- "Track my orders"
- "Order history"
- "How much is in my cart?" (Calculates from cart)

#### Vehicles
- "Find vehicles"
- "Show me [vehicle type]"
- "Vehicle listings"
- "Best vehicles in [price range]"

#### Sim Racing
- "Sim racing events"
- "Racing leagues"
- "Sim racing equipment"
- "Join a racing league"

### **Context-Aware Personalized Questions**

The AI knows:
- **Current Page**: "What can I do on this page?"
- **Cart Contents**: "Should I buy these items together?"
- **Order History**: "What did I order before?"
- **Location**: "Events near me" (uses user location)
- **User Preferences**: Personalized recommendations

### **General Platform Questions**

- "What is Shining Motors?"
- "How does this platform work?"
- "What features are available?"
- "How do I use [feature]?"
- "Help me navigate the app"
- "What can I do here?"

### **Troubleshooting & Help**

- "I can't find [something]"
- "How do I [action]?"
- "Where is [feature]?"
- "I'm having trouble with [issue]"
- "Help me with [task]"

---

## 🎯 **Action Capabilities**

The AI can generate action buttons for:

1. **Navigation**
   - "Show me products" → Button: "Browse Shop"
   - "Find vendors" → Button: "Find Vendors"
   - "View events" → Button: "View Events"
   - "My cart" → Button: "View Cart"
   - "My orders" → Button: "View Orders"

2. **Shopping Actions**
   - "Add to cart" (ready for implementation)
   - "Checkout" → Button: "Go to Checkout"
   - "View product" → Button: "View Product"

3. **Service Actions**
   - "Book service" → Button: "Browse Services"
   - "Find mechanic" → Button: "Find Vendors"

---

## 📊 **What Context the AI Has Access To**

### **Page Context**
- Current page pathname
- Page type (shop, services, events, vehicles, vendor-map, social, sim-racing)

### **User Context**
- Cart items (names, quantities, prices)
- Order history (count, status)
- User location (if set in profile)
- User preferences (role, interests, tags)
- Service bookings (if available)

### **Conversation Context**
- Last 10 messages in conversation
- Conversation history (persisted per user)

---

## 🚫 **What the AI Cannot Do (Yet)**

1. **Direct Actions** (Coming Soon)
   - Cannot directly add items to cart (shows button instead)
   - Cannot directly book services (navigates to booking page)
   - Cannot process payments

2. **Real-Time Data** (Limited)
   - Cannot check live inventory
   - Cannot check real-time availability
   - Cannot access live pricing (uses cached data)

3. **External Information**
   - Cannot access external websites
   - Cannot check competitor prices
   - Cannot provide information outside the platform

4. **Account Management**
   - Cannot change passwords directly
   - Cannot delete accounts
   - Cannot process refunds

---

## 💡 **Best Practices for Users**

### **Good Questions:**
✅ "Find me car parts for my Honda City"
✅ "What's in my cart?"
✅ "Show me events near Bangalore"
✅ "How do I track my order?"
✅ "Find a mechanic for AC repair"

### **Less Effective Questions:**
❌ "What's the weather?" (Not related to platform)
❌ "Tell me a joke" (Not platform-related)
❌ "What's 2+2?" (Not relevant to Shining Motors)

---

## 🔄 **Response Sources**

1. **Rule Engine** (Instant, 0ms)
   - Pre-defined FAQs
   - Common questions
   - No API cost

2. **Server Cache** (Fast, <100ms)
   - Previously asked questions
   - Shared across users
   - 7-day TTL

3. **Client Cache** (Instant, 0ms)
   - User's previous questions
   - Stored in browser
   - 24-hour TTL

4. **AI (OpenAI)** (1-3 seconds)
   - Complex questions
   - Context-aware responses
   - Personalized answers

---

## 📈 **Response Quality**

- **Rule-Based**: 100% accurate, instant
- **Cached**: Same as original AI response
- **AI Responses**: High quality, context-aware, personalized

---

## 🎓 **Learning & Improvement**

The AI learns from:
- User interactions (tracked in database)
- Conversation patterns
- Common questions (improves caching)
- User feedback (future feature)

---

## 🔐 **Privacy & Security**

- User data is only used for context within the conversation
- No personal data is sent to OpenAI beyond necessary context
- Conversations are stored locally (browser) and optionally in database
- All API calls are secured with authentication

---

## 📝 **Example Conversations**

### Example 1: Shopping
**User**: "I'm looking for car parts"
**AI**: "I can help you find car parts! We have a wide range including OEM parts, accessories, and tools. [Browse Shop Button]"

### Example 2: Cart Check
**User**: "What's in my cart?"
**AI**: "You have 3 items in your cart: [lists items]. Total: ₹X. [View Cart Button]"

### Example 3: Service Booking
**User**: "I need AC service in Bangalore"
**AI**: "I can help you find AC service providers in Bangalore. [Find Vendors Button] You can also browse all services. [Browse Services Button]"

### Example 4: Event Discovery
**User**: "Events this weekend"
**AI**: "Check out our Events page for upcoming automotive events this weekend. You can filter by location and category. [View Events Button]"

---

## 🚀 **Future Enhancements**

1. **Voice Input**: Speak to the assistant
2. **Image Understanding**: Upload images to find similar products
3. **Proactive Suggestions**: AI suggests actions before you ask
4. **Multi-language Support**: Respond in different languages
5. **Advanced Recommendations**: ML-based product/service recommendations

---

## 📞 **Need Help?**

If the AI cannot answer your question:
1. Try rephrasing your question
2. Be more specific about what you're looking for
3. Contact support@shiningmotors.com
4. Use the platform's search feature

---

*Last Updated: Based on current implementation*
*AI Model: GPT-3.5-turbo (simple queries) / GPT-4 (complex queries)*


