"use client";
/**
 * Demo/Example component showing how to use CommentsBottomSheet
 * 
 * This is a separate integration for testing the Instagram-style comments bottom sheet.
 * 
 * Usage:
 * 1. Import this component or use CommentsBottomSheet directly
 * 2. Pass the required props (postId, open, onOpenChange)
 * 3. Optionally pass postAuthor, postContent, postMedia for better UX
 * 
 * Example integration in PostCard or Post component:
 * 
 * ```tsx
 * const [commentsOpen, setCommentsOpen] = useState(false);
 * 
 * <button onClick={() => setCommentsOpen(true)}>
 *   <MessageSquare size={22} />
 * </button>
 * 
 * <CommentsBottomSheet
 *   postId={id}
 *   open={commentsOpen}
 *   onOpenChange={setCommentsOpen}
 *   postAuthor={{
 *     id: author.id,
 *     username: author.username,
 *     full_name: author.full_name,
 *     avatar_url: author.avatar_url,
 *   }}
 *   postContent={content}
 *   postMedia={media}
 * />
 * ```
 */

import { useState } from "react";
import { CommentsBottomSheet } from "./CommentsBottomSheet";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function CommentsBottomSheetDemo() {
  const [open, setOpen] = useState(false);

  // Example post data - replace with actual post data
  const examplePost = {
    id: "example-post-id",
    author: {
      id: "user-123",
      username: "johndoe",
      full_name: "John Doe",
      avatar_url: "https://avatars.dicebear.com/api/identicon/user-123.svg",
    },
    content: "This is an example post to test the Instagram-style comments bottom sheet! 🎉",
    media: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7"],
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Comments Bottom Sheet Demo</h2>
      <p className="text-gray-600 mb-4">
        Click the button below to open the Instagram-style comments bottom sheet.
      </p>
      
      <Button onClick={() => setOpen(true)} className="gap-2">
        <MessageSquare size={20} />
        Open Comments
      </Button>

      <CommentsBottomSheet
        postId={examplePost.id}
        open={open}
        onOpenChange={setOpen}
        postAuthor={examplePost.author}
        postContent={examplePost.content}
        postMedia={examplePost.media}
      />
    </div>
  );
}





