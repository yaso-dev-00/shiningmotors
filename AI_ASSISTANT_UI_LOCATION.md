# AI Assistant - Where It Appears in the UI

## 📍 Location in the Application

The AI Assistant appears on **ALL pages** within the main layout of the application.

---

## 🎯 Visual Location

### **Floating Button (When Closed)**

**Position**: 
- **Bottom Right Corner**
- `bottom-6` (24px from bottom)
- `right-6` (24px from right)
- `z-index: 50` (above most content)

**Appearance**:
- **Circular red button** (56px × 56px)
- **Color**: `bg-sm-red` (Shining Motors red)
- **Icon**: MessageCircle (white)
- **Shadow**: Large shadow for visibility
- **Animation**: Scale animation on load

**Visual**:
```
                    ┌─────────────────────┐
                    │                     │
                    │    Page Content     │
                    │                     │
                    │                     │
                    │              ┌────┐ │
                    │              │ 💬 │ │ ← AI Button
                    │              └────┘ │
                    │                     │
                    └─────────────────────┘
```

---

### **Chat Window (When Open)**

**Position**:
- **Bottom Right Corner** (same position as button)
- `fixed` positioning
- `w-96` (384px wide)
- `h-[600px]` (600px tall, max 80vh)
- `z-index: 50`

**Appearance**:
- **Card-based design** with shadow
- **Red header** with "AI Assistant" title
- **White message area** with gray background
- **Input field** at bottom
- **Smooth animations** (fade in/out, scale)

**Visual**:
```
                    ┌─────────────────────┐
                    │                     │
                    │    Page Content     │
                    │                     │
                    │         ┌─────────┐ │
                    │         │ AI      │ │
                    │         │ Header  │ │
                    │         ├─────────┤ │
                    │         │         │ │
                    │         │ Messages│ │
                    │         │         │ │
                    │         ├─────────┤ │
                    │         │ Input   │ │
                    │         └─────────┘ │
                    └─────────────────────┘
```

---

## 📱 Responsive Behavior

### **Desktop View**
- Button appears in **bottom-right corner**
- Chat window: **384px wide × 600px tall**
- Positioned above bottom navigation

### **Mobile View**
- Same position (bottom-right)
- May overlap with bottom navigation
- Chat window adjusts to screen size (max 80vh)
- Full-width on very small screens

---

## 🎨 UI Components

### **1. Floating Button**
```tsx
<Button className="h-14 w-14 rounded-full bg-sm-red">
  <MessageCircle className="h-6 w-6 text-white" />
</Button>
```

**Features**:
- Always visible (when chat is closed)
- Smooth scale animation
- Hover effect (lighter red)
- Click to open chat

### **2. Chat Window Header**
```tsx
<div className="bg-sm-red text-white">
  <MessageCircle /> AI Assistant
  <X /> {/* Close button */}
</div>
```

**Features**:
- Red header matching brand
- Close button (X) in top-right
- AI Assistant title

### **3. Message Area**
```tsx
<div className="bg-gray-50 overflow-y-auto">
  {/* User messages: right-aligned, red background */}
  {/* AI messages: left-aligned, white background */}
</div>
```

**Features**:
- Scrollable message history
- User messages: Red bubbles, right-aligned
- AI messages: White bubbles, left-aligned
- Timestamps on each message
- Cache indicator (if cached)
- Action buttons (when applicable)

### **4. Input Area**
```tsx
<div className="border-t bg-white">
  <Input placeholder="Type your message..." />
  <Button><Send /></Button>
</div>
```

**Features**:
- Text input field
- Send button (disabled when empty/loading)
- Enter key to send
- Loading spinner when processing

---

## 🔄 State Management

### **Button States**
1. **Closed**: Shows floating button
2. **Open**: Button hidden, chat window visible
3. **Loading**: Send button shows spinner

### **Visibility Rules**
- Button: Always visible when chat is closed
- Chat Window: Only visible when `isOpen === true`
- Hidden on messenger pages (to avoid conflicts)

---

## 📍 Where It's Rendered

### **File**: `src/app/(main)/layout.tsx`

```tsx
<AIProvider>
  {children}
  <BottomNav />
  <AIChatAssistant />  {/* ← Here */}
</AIProvider>
```

### **Pages Where It Appears**
✅ All pages under `(main)` route group:
- `/` (Home)
- `/shop` and all shop pages
- `/services` and all service pages
- `/events` and all event pages
- `/vehicles` and all vehicle pages
- `/vendors/map`
- `/social` and all social pages
- `/sim-racing` and all sim racing pages
- `/profile` and profile pages
- `/wishlist`
- `/settings`
- And all other main pages

### **Pages Where It's Hidden**
❌ Pages NOT in `(main)` route:
- `/auth` (authentication pages)
- `/admin` (admin pages - if separate layout)
- `/messenger` (has its own messaging UI)

---

## 🎯 User Interaction Flow

1. **User sees floating button** → Bottom right corner
2. **User clicks button** → Chat window opens with animation
3. **User types message** → Input field at bottom
4. **User sends message** → 
   - Message appears in chat (right side, red)
   - Loading indicator shows
   - AI responds (left side, white)
   - Action buttons may appear
5. **User clicks X or outside** → Chat window closes

---

## 🎨 Styling Details

### **Colors**
- **Button/Header**: `bg-sm-red` (Shining Motors brand red)
- **User Messages**: `bg-sm-red text-white`
- **AI Messages**: `bg-white text-gray-900 border`
- **Background**: `bg-gray-50`

### **Sizing**
- **Button**: 56px × 56px (h-14 w-14)
- **Chat Window**: 384px × 600px (w-96 h-[600px])
- **Max Height**: 80vh (responsive)

### **Z-Index Hierarchy**
- **AI Assistant**: `z-50`
- **Bottom Navigation**: `z-50` (same level)
- **Floating Quick Settings**: Lower z-index
- **Messenger Button**: `z-50` (mobile only)

---

## 🔧 Customization Options

To change the position, edit `src/components/AIChatAssistant.tsx`:

```tsx
// Change button position
className="fixed bottom-6 right-6"  // Current
// Options:
// "bottom-4 right-4" - Closer to corner
// "bottom-20 right-6" - Higher up
// "bottom-6 left-6" - Left side

// Change chat window size
className="w-96 h-[600px]"  // Current
// Options:
// "w-[500px] h-[700px]" - Larger
// "w-80 h-[500px]" - Smaller
```

---

## 📸 Visual Reference

### **Desktop View**
```
┌─────────────────────────────────────────┐
│                                         │
│         Main Page Content               │
│                                         │
│                                         │
│                              ┌──────┐   │
│                              │  💬  │   │ ← Floating Button
│                              └──────┘   │
│                                         │
│                              ┌────────┐ │
│                              │ AI     │ │ ← Chat Window (when open)
│                              │ Chat   │ │
│                              │        │ │
│                              └────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### **Mobile View**
```
┌─────────────────┐
│                 │
│  Page Content   │
│                 │
│        ┌────┐   │
│        │ 💬 │   │ ← Button
│        └────┘   │
│                 │
│        ┌──────┐ │
│        │ AI   │ │ ← Chat Window
│        │ Chat │ │
│        └──────┘ │
│                 │
│  ┌───────────┐  │
│  │ Bottom Nav│  │
│  └───────────┘  │
└─────────────────┘
```

---

## ✅ Current Implementation Status

- ✅ Floating button visible on all main pages
- ✅ Chat window opens/closes smoothly
- ✅ Messages display correctly
- ✅ Action buttons appear when relevant
- ✅ Responsive design works on mobile
- ✅ Proper z-index layering
- ✅ Context-aware responses

---

## 🚀 How Users Find It

1. **Visual Discovery**: Red circular button is eye-catching
2. **Always Visible**: Never hidden, always accessible
3. **Familiar Pattern**: Standard chat widget pattern users recognize
4. **Help Text**: Initial message explains what AI can do

---

*The AI Assistant is always one click away from any page!*

