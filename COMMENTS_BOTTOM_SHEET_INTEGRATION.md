# Instagram-Style Comments Bottom Sheet Integration Guide

This document explains how to integrate the new Instagram-style comments bottom sheet component.

## Overview

The `CommentsBottomSheet` component provides an Instagram-like bottom sheet experience for viewing and interacting with post comments. It's designed as a separate integration for testing purposes.

## Files Created

1. **`src/components/social/CommentsBottomSheet.tsx`** - Main component
2. **`src/components/social/CommentsBottomSheetDemo.tsx`** - Demo/example component

## Features

- ✅ Instagram-style bottom sheet UI
- ✅ Smooth animations and transitions
- ✅ Post preview at the top
- ✅ Scrollable comments list
- ✅ Fixed input at the bottom
- ✅ Emoji picker support
- ✅ Reply to comments
- ✅ Edit/Delete own comments
- ✅ View nested replies
- ✅ Real-time comment updates
- ✅ Optimistic UI updates

## Basic Usage

```tsx
import { CommentsBottomSheet } from "@/components/social/CommentsBottomSheet";
import { useState } from "react";

function YourComponent() {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setCommentsOpen(true)}>
        View Comments
      </button>

      <CommentsBottomSheet
        postId="your-post-id"
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </>
  );
}
```

## Full Usage with Optional Props

```tsx
import { CommentsBottomSheet } from "@/components/social/CommentsBottomSheet";
import { useState } from "react";

function PostCard({ id, author, content, media }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setCommentsOpen(true)}>
        <MessageSquare size={22} />
      </button>

      <CommentsBottomSheet
        postId={id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postAuthor={{
          id: author.id,
          username: author.username,
          full_name: author.full_name,
          avatar_url: author.avatar_url,
        }}
        postContent={content}
        postMedia={media}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `postId` | `string` | ✅ Yes | The ID of the post |
| `open` | `boolean` | ✅ Yes | Controls whether the bottom sheet is open |
| `onOpenChange` | `(open: boolean) => void` | ✅ Yes | Callback when open state changes |
| `postAuthor` | `object` | ❌ No | Post author info for preview header |
| `postContent` | `string` | ❌ No | Post content text for preview |
| `postMedia` | `string[]` | ❌ No | Array of media URLs for preview |

## Integration Example: PostCard Component

To integrate into `PostCard.tsx`, replace the `handleCommentClick` function:

```tsx
// Add state
const [commentsOpen, setCommentsOpen] = useState(false);

// Update handleCommentClick
const handleCommentClick = (e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  setCommentsOpen(true); // Open bottom sheet instead of navigating
};

// Add the component at the end of your JSX
<CommentsBottomSheet
  postId={id}
  open={commentsOpen}
  onOpenChange={setCommentsOpen}
  postAuthor={{
    id: author.id,
    username: author.username,
    full_name: author.full_name,
    avatar_url: author.avatar_url,
  }}
  postContent={content}
  postMedia={media}
/>
```

## Testing

1. Import the demo component:
```tsx
import { CommentsBottomSheetDemo } from "@/components/social/CommentsBottomSheetDemo";
```

2. Add it to any page to test:
```tsx
<CommentsBottomSheetDemo />
```

## Styling

The component uses:
- Tailwind CSS for styling
- Radix UI Drawer for bottom sheet functionality
- Instagram-like design patterns

## Dependencies

- `@radix-ui/react-dialog` (via `vaul` drawer)
- `@emoji-mart/react` for emoji picker
- `next/image` for optimized images
- Existing social API modules

## Notes

- The component is fully self-contained and doesn't affect existing comment functionality
- It can be used alongside or as a replacement for the current `CommentsSection` component
- The bottom sheet automatically focuses the input when opened
- Comments are loaded incrementally (20 at a time)
- Optimistic updates provide instant feedback

## Future Enhancements

Potential improvements:
- [ ] Pull-to-refresh
- [ ] Infinite scroll
- [ ] Comment reactions/likes
- [ ] Mention autocomplete
- [ ] Image upload in comments
- [ ] Keyboard shortcuts




