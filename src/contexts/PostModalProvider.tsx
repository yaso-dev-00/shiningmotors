"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import PostModal from "@/components/social/PostModal";

type PostModalContextValue = {
  openPost: (id: string, commentId?: string) => void;
  closePost: () => void;
  isOpen: boolean;
  postId: string | null;
};

const PostModalContext = createContext<PostModalContextValue | null>(null);

export const PostModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [postId, setPostId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const openPost = useCallback((id: string, commentId?: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("modalScrollPosition", String(window.scrollY));
    }
    setPostId(id);
    setCommentId(commentId);
    setIsOpen(true);
  }, []);

  const closePost = useCallback(() => {
    setIsOpen(false);
    setPostId(null);
    setCommentId(undefined);
  }, []);

  // Close modal only when navigating to auth page or the post detail page itself
  // Keep it open on all other pages (home, shop, event, social, messenger, etc.)
  useEffect(() => {
    if (!isOpen) return;
    // Only close if navigating to auth or the post detail page itself (full page view)
    if (pathname === "/auth" || pathname?.startsWith("/social/post/")) {
      closePost();
    }
  }, [pathname, isOpen, closePost]);

  const value = useMemo(
    () => ({
      openPost,
      closePost,
      isOpen,
      postId,
    }),
    [openPost, closePost, isOpen, postId]
  );

  return (
    <PostModalContext.Provider value={value}>
      {children}
      {isOpen && postId && (
        <PostModal
          postId={postId}
          onClose={closePost}
          commentId={commentId}
        />
      )}
    </PostModalContext.Provider>
  );
};

export const usePostModal = () => {
  const ctx = useContext(PostModalContext);
  if (!ctx) {
    throw new Error("usePostModal must be used within PostModalProvider");
  }
  return ctx;
};
