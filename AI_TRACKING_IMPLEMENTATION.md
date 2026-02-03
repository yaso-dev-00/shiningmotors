# AI User Tracking Implementation

## ✅ **Tracking Now Implemented!**

User interactions are now being tracked and saved to the `user_interactions` database table.

---

## 📍 **Where Tracking is Implemented**

### 1. **Product Views** ✅
**File:** `src/views/ProductDetail.tsx`
- **When:** User views a product detail page
- **Tracks:** `view` interaction for `product` type
- **Metadata:** Product name, category, price

```typescript
// Tracks when product is loaded
trackInteraction("view", "product", id, {
  productName: product.name,
  category: product.category,
  price: product.price,
});
```

---

### 2. **Product Card Clicks** ✅
**File:** `src/components/shop/ProductCard.tsx`
- **When:** User clicks on a product card (image, name, or category link)
- **Tracks:** `click` interaction for `product` type
- **Metadata:** Product name, category, price

```typescript
// Tracks when product card is clicked
trackInteraction("click", "product", id, {
  productName: name,
  category,
  price,
});
```

---

### 3. **Add to Cart** ✅
**Files:**
- `src/views/ProductDetail.tsx` - When adding from product detail page
- `src/components/shop/ProductCard.tsx` - When adding from product card

- **When:** User adds a product to cart
- **Tracks:** `add_to_cart` interaction for `product` type
- **Metadata:** Product name, price, quantity

```typescript
// Tracks when product is added to cart
trackInteraction("add_to_cart", "product", id, {
  productName: product.name,
  price: product.price,
  quantity: 1,
});
```

---

### 4. **Search** ✅
**File:** `src/views/Shop.tsx`
- **When:** User searches for products
- **Tracks:** `search` interaction for `product` type
- **Metadata:** Search query, results count, category filter

```typescript
// Tracks when user searches
trackInteraction("search", "product", undefined, {
  query: debouncedSearchTerm,
  resultsCount: count || 0,
  category: selectedCategory || undefined,
});
```

---

## 🔍 **What Gets Tracked**

### Interaction Types:
- ✅ `view` - Product detail page views
- ✅ `click` - Product card clicks
- ✅ `add_to_cart` - Add to cart actions
- ✅ `search` - Product searches
- ⏳ `purchase` - Not yet implemented (can be added to checkout)

### Item Types:
- ✅ `product` - All product-related interactions
- ⏳ `service` - Not yet implemented
- ⏳ `event` - Not yet implemented
- ⏳ `vendor` - Not yet implemented
- ⏳ `post` - Not yet implemented

---

## 📊 **Database Structure**

All interactions are saved to `user_interactions` table:

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  interaction_type TEXT, -- 'view', 'click', 'add_to_cart', 'search', 'purchase'
  item_type TEXT, -- 'product', 'service', 'event', 'vendor', 'post'
  item_id UUID, -- ID of the item (product_id, service_id, etc.)
  metadata JSONB, -- Additional context (page, query, price, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 **How to Test**

### Test 1: Product View
1. Navigate to a product detail page: `/shop/product/[id]`
2. **Check Database:**
   ```sql
   SELECT * FROM user_interactions 
   WHERE interaction_type = 'view' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Should see a `view` record with product metadata

### Test 2: Product Click
1. Click on a product card in the shop
2. **Check Database:**
   ```sql
   SELECT * FROM user_interactions 
   WHERE interaction_type = 'click' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Should see a `click` record

### Test 3: Add to Cart
1. Add a product to cart (from product page or card)
2. **Check Database:**
   ```sql
   SELECT * FROM user_interactions 
   WHERE interaction_type = 'add_to_cart' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Should see an `add_to_cart` record with quantity

### Test 4: Search
1. Search for products in the shop page
2. **Check Database:**
   ```sql
   SELECT * FROM user_interactions 
   WHERE interaction_type = 'search' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Should see a `search` record with query and results count

---

## 📈 **What This Data Enables**

### For AI Learning:
1. **Product Recommendations**
   - Understand which products users view most
   - Recommend similar products based on clicks
   - Suggest products based on search patterns

2. **Personalization**
   - Show products based on browsing history
   - Customize homepage based on interests
   - Tailor AI responses based on user behavior

3. **Analytics**
   - Track popular products
   - Understand user journey
   - Identify conversion patterns

4. **AI Context**
   - AI can reference user's browsing history
   - Provide personalized recommendations
   - Understand user preferences

---

## 🔧 **How It Works**

### Flow:
1. User performs action (view, click, add to cart, search)
2. Component calls `trackInteraction()` hook
3. Hook sends request to `/api/ai/track` with:
   - Authorization token (from session)
   - Interaction type
   - Item type
   - Item ID
   - Metadata (JSONB)
4. API validates user and saves to database
5. Data is available for AI learning and analytics

### Authentication:
- ✅ Uses `session.access_token` from AuthContext
- ✅ Sends `Authorization: Bearer <token>` header
- ✅ API validates token before saving

---

## 🚀 **Future Enhancements**

### Can Add Tracking For:
1. **Services**
   - Service views
   - Service bookings
   - Service searches

2. **Events**
   - Event views
   - Event registrations
   - Event searches

3. **Vendors**
   - Vendor profile views
   - Vendor map interactions

4. **Social**
   - Post views
   - Post likes
   - Post comments

5. **Purchases**
   - Order completion
   - Purchase tracking (in checkout)

---

## ✅ **Summary**

### Implemented:
- ✅ Product views
- ✅ Product clicks
- ✅ Add to cart
- ✅ Product search
- ✅ Authentication
- ✅ Database writes

### Ready to Use:
- All tracking is active and saving to database
- Data is available for AI learning
- Can query database to see user interactions

**Test it out and check the `user_interactions` table to see the data!** 🎯

