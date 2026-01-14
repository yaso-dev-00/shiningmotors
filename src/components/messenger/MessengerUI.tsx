"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import Conversations from "./Conversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { confirmToast } from "@/utils/confirmToast";
import { useAuth } from "@/contexts/AuthContext";
import { socialApi } from "@/integrations/supabase/modules/social";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useParams } from "next/navigation";

// Define Media type as expected by MessageBubble
import {
  sendMessage,
  fetchMessages,
  subscribeToMessages,
  fetchConversations,
  updateMessage,
  deleteMessage,
  deleteConversationBetweenUsers,
  uploadFile,
} from "@/integrations/supabase/modules/chat";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { format } from "date-fns";
import {
  getEncryptedCache,
  setEncryptedCache,
  deleteEncryptedCache,
  clearConversationMessagesCache,
  getConversationsCacheKey,
  getMessagesCacheKey,
} from "@/lib/encrypted-cache";

// Define Media type as expected by MessageBubble
interface Media {
  type: "image" | "video" | "file";
  url: string;
  name?: string;
}

// Define Message type that aligns with Supabase data and MessageBubble expectations
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string | null;
  message_type: string | null;
  created_at: string;

  // Derived fields for MessageBubble compatibility
  text?: string;
  sender: "user" | "other";
  timestamp: Date;

  // Fields expected by MessageBubble
  read: boolean;
  sent?: boolean;
  delivered?: boolean;
  media?: Media[];
  reactions?: Array<{ emoji: string; user: "user" | "other" }>;
}

// Define Conversation type that aligns with the Conversation list component expectations
export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageType: string;
  timestamp: Date;
  unread: number;
  online?: boolean;
  avatar_url: string | null;
  full_name: string | null;
  username: string | null;
}

// Define the expected structure from the Supabase RPC function
interface ConversationRpcRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_type: string | null;
  last_message_time: string | null;
  last_seen: string | null;
  unread_count: number;
}

// Define a minimal UserProfile type for externalProfile
interface UserProfile {
  id?: string;
  user_id?: string;
  avatar_url?: string;
  full_name?: string;
  username?: string;
  online?: boolean;
}

interface MessengerUIProps {
  initialUserId?: string | null;
}

const MessengerUI: React.FC<MessengerUIProps> = ({ initialUserId }) => {
  const isMobile = useIsMobile();
  const { user, session } = useAuth();
  useOnlineStatus(user?.id);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialUserId || null
  );
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [newMessageContent, setNewMessageContent] = useState("");
  const lastMessageDateRef = useRef<Date | null>(null);
  const [inputFooterHeight, setInputFooterHeight] = useState(56);
  const inputFooterRef = useRef<HTMLDivElement>(null);

  const { userId } = useParams<{ userId?: string }>();
  const [externalProfile, setExternalProfile] = useState<UserProfile | null>(
    null
  );

  // Helper function for checking if user is online
  const isUserOnline = useCallback((lastSeen: string | null) => {
    if (!lastSeen) return false;
    const seen = new Date(lastSeen.endsWith("Z") ? lastSeen : lastSeen + "Z");
    const now = new Date();
    return now.getTime() - seen.getTime() < 60 * 1000;
  }, []);

  // Helper to get auth headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    const accessToken = session?.access_token;
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [session]);

  // SWR Fetchers
  const fetchConversationsData = useCallback(async (): Promise<Conversation[]> => {
    if (!user?.id) return [];
    
    // Fetch from API route with cache busting
    const response = await fetch(`/api/messenger/conversations?_t=${Date.now()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch conversations");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch conversations");
    }

    const data = result.data as ConversationRpcRow[];

    const localConversations: Conversation[] = (
      data as ConversationRpcRow[]
    ).map((conv) => ({
      id: conv.user_id,
      user_id: conv.user_id,
      name: conv.full_name || conv.username || "Unknown User",
      avatar: conv.avatar_url || conv.full_name?.[0]?.toUpperCase() || conv.username?.[0]?.toUpperCase() || "U",
      avatar_url: conv.avatar_url,
      lastMessage: conv.last_message || "",
      lastMessageType: conv.last_message_type || "",
      timestamp: conv.last_message_time
        ? new Date(conv.last_message_time)
        : new Date(),
      unread: conv.unread_count || 0,
      online: isUserOnline(conv.last_seen),
      full_name: conv.full_name,
      username: conv.username,
    }));

    // Fetch additional profile information if needed
    const uniqueUserIds = Array.from(
      new Set(localConversations.map((c) => c.user_id))
    );
    const profiles = await Promise.all(
      uniqueUserIds.map(async (id) => {
        try {
          const { data } = await socialApi.profiles.getById(id);
          return data;
        } catch (error) {
          console.error(`Error fetching profile for user ${id}:`, error);
          return null;
        }
      })
    );

    // Merge profile information into localConversations
    const enrichedConversations = localConversations.map((conv) => {
      const profile = profiles.find((p) => p?.id === conv.user_id);
      return {
        ...conv,
        avatar:
          profile?.avatar_url ||
          conv.avatar ||
          conv.full_name?.[0]?.toUpperCase() ||
          conv.username?.[0]?.toUpperCase() ||
          "U",
        name: profile?.full_name || conv.full_name || conv.username || "Unknown User",
        full_name:
          profile?.full_name || conv.full_name || conv.username || "Unknown User",
        username: profile?.username || conv.username || "Unknown User",
      };
    });

    // Store in encrypted cache synchronously before returning
    const cacheKey = getConversationsCacheKey(user.id);
    try {
      await setEncryptedCache(cacheKey, enrichedConversations, user.id);
    } catch (err) {
      console.error('Failed to cache conversations:', err);
    }

    return enrichedConversations;
  }, [user?.id, isUserOnline, getAuthHeaders]);

  const fetchMessagesData = useCallback(async () => {
    if (!activeConversation || !user?.id) return [];
    
    // Fetch from API route with cache busting
    const response = await fetch(
      `/api/messenger/messages?user1=${user.id}&user2=${activeConversation}&_t=${Date.now()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch messages");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch messages");
    }

    const data = result.data as Database["public"]["Tables"]["messages"]["Row"][];

    const messages = (data as Database["public"]["Tables"]["messages"]["Row"][]).map((msg) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.content,
      message_type: msg.message_type,
      created_at: msg.created_at || new Date().toISOString(),
      text: msg.content || undefined,
      sender: msg.sender_id === user.id ? "user" : "other",
      timestamp: new Date(msg.created_at || Date.now()),
      read: false,
      sent: true,
      delivered: true,
      media: undefined,
      reactions: undefined,
    })) as Message[];

    // Store in encrypted cache synchronously before returning
    const cacheKey = getMessagesCacheKey(user.id, activeConversation);
    try {
      await setEncryptedCache(cacheKey, messages, user.id);
    } catch (err) {
      console.error('Failed to cache messages:', err);
    }

    return messages;
  }, [activeConversation, user?.id, getAuthHeaders]);

  // Load cached data for SWR fallback
  const [cachedConversations, setCachedConversations] = useState<Conversation[] | null>(null);
  const [cachedMessages, setCachedMessages] = useState<Message[] | null>(null);

  // Load cached conversations on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadCachedConversations = async () => {
      const cacheKey = getConversationsCacheKey(user.id);
      const cached = await getEncryptedCache<Conversation[]>(cacheKey, user.id);
      if (cached) {
        setCachedConversations(cached);
      }
    };
    loadCachedConversations();
  }, [user?.id]);

  // Load cached messages when conversation changes
  useEffect(() => {
    if (!activeConversation || !user?.id) {
      setCachedMessages(null);
      return;
    }
    const loadCachedMessages = async () => {
      const cacheKey = getMessagesCacheKey(user.id, activeConversation);
      const cached = await getEncryptedCache<Message[]>(cacheKey, user.id);
      if (cached) {
        setCachedMessages(cached);
      }
    };
    loadCachedMessages();
  }, [activeConversation, user?.id]);

  // SWR Hooks - Use cached data as fallback, but always fetch fresh
  const {
    data: conversations,
    isLoading: loadingConversations,
    mutate: mutateConversations,
  } = useSWR<Conversation[]>(
    user?.id ? ['conversations', user.id] : null,
    fetchConversationsData,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true, // Revalidate stale cache in background
      revalidateOnMount: true, // Always fetch fresh data on mount
      dedupingInterval: 1000, // Reduce deduping to allow faster updates
      fallbackData: cachedConversations || undefined, // Show cached data immediately
      keepPreviousData: false, // Don't keep old data when fetching new
    }
  );

  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: mutateMessages,
  } = useSWR<Message[]>(
    activeConversation && user?.id ? ['messages', user.id, activeConversation] : null,
    fetchMessagesData,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true, // Revalidate stale cache in background
      revalidateOnMount: true, // Always fetch fresh data on mount
      dedupingInterval: 1000, // Reduce deduping to allow faster updates
      fallbackData: cachedMessages || undefined, // Show cached data immediately
      keepPreviousData: false, // Don't keep old data when fetching new
    }
  );

  // Update cached state when fresh data arrives from SWR
  useEffect(() => {
    if (conversations && conversations.length > 0 && user?.id) {
      setCachedConversations(conversations);
    }
  }, [conversations, user?.id]);

  useEffect(() => {
    if (messages && messages.length >= 0 && user?.id && activeConversation) {
      setCachedMessages(messages);
    }
  }, [messages, user?.id, activeConversation]);

  // Use SWR data or fallback to cached data
  const displayConversations = conversations ?? cachedConversations ?? [];
  const displayMessages = messages ?? cachedMessages ?? [];

  // Ensure the URL param is always honored (e.g., on hard refresh)
  useEffect(() => {
    if (initialUserId) {
      setActiveConversation(initialUserId);
    }
  }, [initialUserId]);

  // On mobile, hide the recent list when landing directly on /messenger/[id] (e.g., after refresh)
  useEffect(() => {
    if (isMobile && initialUserId) {
      setShowConversationList(false);
     
    }
  }, [isMobile, initialUserId]);

  // Wait for client hydration to avoid flashing sidebar on mobile
  useEffect(() => {
    setHydrated(true);
  }, []);

  // On mobile, if no active conversation and no deep-link target, show the recent list
  useEffect(() => {
    if (hydrated && isMobile && !activeConversation && !initialUserId) {
      setShowConversationList(true);
    }
  }, [hydrated, isMobile, activeConversation, initialUserId]);

  useEffect(() => {
    // Removed theme preference check from localStorage
  }, []);

  useEffect(() => {
    if (!user || !activeConversation) return;

    const channel = supabase.channel(`typing:${activeConversation}:${user.id}`);

    channel
      .on("broadcast", { event: "typing" }, (event) => {
        const { isTyping } = event.payload;
        if (isTyping) {
          setTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeConversation, user]);

  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Try scrolling the ScrollArea viewport directly (more reliable)
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth"
          });
        }
      }
      
      // Also try scrollIntoView as a fallback
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
  }, []);

  // Scroll to bottom when messages change and loading is complete
  useEffect(() => {
    if (!loadingMessages && displayMessages.length > 0) {
      // Use multiple attempts with increasing delays to ensure scroll works
      // This handles cases where DOM might not be fully updated yet
      const scrollAttempts = [100, 300, 500];
      scrollAttempts.forEach((delay) => {
        setTimeout(() => {
          scrollToBottom();
        }, delay);
      });
    }
  }, [displayMessages, loadingMessages, scrollToBottom]);

  // Handle initialUserId selection when conversations are loaded
  useEffect(() => {
    if (initialUserId && !activeConversation && displayConversations.length > 0) {
      handleSelectConversation(initialUserId);
    }
  }, [initialUserId, activeConversation, displayConversations.length]);

  // --- Setup Real-time Subscription ---
  useEffect(() => {
    if (!user?.id || !activeConversation) return;
    
    const messageSubscription = subscribeToMessages({
      user1: user.id,
      user2: activeConversation,
      onMessage: (msg: Record<string, unknown> & { id?: string; isDeleted?: boolean }) => {
        const typedMsg = msg as Database["public"]["Tables"]["messages"]["Row"] & {
          isDeleted?: boolean;
        };
        
        if (typedMsg.isDeleted) {
          // Update messages cache by removing deleted message
          mutateMessages(async (currentMessages) => {
            if (!currentMessages) return currentMessages;
            const updated = currentMessages.filter((message) => message.id !== typedMsg.id);
            // Update encrypted cache
            if (user?.id && activeConversation) {
              const cacheKey = getMessagesCacheKey(user.id, activeConversation);
              setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
                console.error('Failed to update messages cache:', err);
              });
            }
            return updated;
          }, false);
        } else if (
          (typedMsg.sender_id === user?.id &&
            typedMsg.receiver_id === activeConversation) ||
          (typedMsg.sender_id === activeConversation && typedMsg.receiver_id === user?.id)
        ) {
          const newMessage: Message = {
            id: typedMsg.id,
            sender_id: typedMsg.sender_id,
            receiver_id: typedMsg.receiver_id,
            content: typedMsg.content,
            message_type: typedMsg.message_type,
            created_at: typedMsg.created_at || new Date().toISOString(),
            text: typedMsg.content || undefined,
            sender: typedMsg.sender_id === user.id ? "user" : "other",
            timestamp: new Date(typedMsg.created_at || Date.now()),
            read: false,
            sent: true,
            delivered: true,
            media: undefined,
            reactions: undefined,
          };

          // Update messages cache by adding new message
          mutateMessages(async (currentMessages) => {
            if (!currentMessages) return [newMessage];
            // Check if message already exists to avoid duplicates
            if (currentMessages.some(m => m.id === newMessage.id)) {
              return currentMessages;
            }
            const updated = [...currentMessages, newMessage];
            // Update encrypted cache
            if (user?.id && activeConversation) {
              const cacheKey = getMessagesCacheKey(user.id, activeConversation);
              setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
                console.error('Failed to update messages cache:', err);
              });
            }
            return updated;
          }, false);

          // Update conversations cache
          const conversationToUpdateId =
            typedMsg.sender_id === user.id ? typedMsg.receiver_id : typedMsg.sender_id;

          mutateConversations(async (currentConversations) => {
            if (!currentConversations) return currentConversations;
            const updated = currentConversations.map((conv) =>
              conv.user_id === conversationToUpdateId
                ? {
                    ...conv,
                    lastMessage: typedMsg.content || "",
                    lastMessageType: typedMsg.message_type || "",
                    timestamp: new Date(typedMsg.created_at || Date.now()),
                    unread:
                      conv.user_id !== activeConversation
                        ? conv.unread + 1
                        : conv.unread,
                  }
                : conv
            );
            // Update encrypted cache
            if (user?.id) {
              const cacheKey = getConversationsCacheKey(user.id);
              setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
                console.error('Failed to update conversations cache:', err);
              });
            }
            return updated;
          }, false);
        }
      },
    });

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [activeConversation, user?.id, mutateMessages, mutateConversations]);

  const handleSendMessage = async (content: string, media: File[] = []) => {
    if ((!content.trim() && media.length === 0) || !user || !activeConversation)
      return;

    // 1. Send text message if available
    if (content.trim()) {
      try {
        const response = await fetch("/api/messenger/messages", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sender_id: user.id,
            receiver_id: activeConversation,
            content: content.trim(),
            message_type: "text",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error sending text message:", errorData.error);
        } else {
          // Update cache after successful send
          const result = await response.json();
          if (result.success && result.data && user.id && activeConversation) {
            const newMessage: Message = {
              id: result.data.id,
              sender_id: result.data.sender_id,
              receiver_id: result.data.receiver_id,
              content: result.data.content,
              message_type: result.data.message_type,
              created_at: result.data.created_at || new Date().toISOString(),
              text: result.data.content || undefined,
              sender: "user",
              timestamp: new Date(result.data.created_at || Date.now()),
              read: false,
              sent: true,
              delivered: true,
              media: undefined,
              reactions: undefined,
            };
            
            // Optimistically update cache
            mutateMessages(async (currentMessages) => {
              if (!currentMessages) return [newMessage];
              if (currentMessages.some(m => m.id === newMessage.id)) {
                return currentMessages;
              }
              const updated = [...currentMessages, newMessage];
              const cacheKey = getMessagesCacheKey(user.id, activeConversation);
              setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
                console.error('Failed to update messages cache:', err);
              });
              return updated;
            }, false);
          }
        }
      } catch (error) {
        console.error("Text message error:", error);
      }
    }

    // 2. Upload and send each file
    for (const file of media) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      // Map "file" type to "image" since database doesn't support "file" type
      const message_type: "video" | "image" | "text" | "post" = isImage ? "image" : isVideo ? "video" : "image";

      try {
        // Upload to Supabase storage (keep using direct client for storage)
        const publicUrl = await uploadFile(file, user.id, "message-media");

        const response = await fetch("/api/messenger/messages", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sender_id: user.id,
            receiver_id: activeConversation,
            content: publicUrl,
            message_type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Error sending ${message_type} message:`, errorData.error);
        } else {
          // Update cache after successful send
          const result = await response.json();
          if (result.success && result.data && user.id && activeConversation) {
            const newMessage: Message = {
              id: result.data.id,
              sender_id: result.data.sender_id,
              receiver_id: result.data.receiver_id,
              content: result.data.content,
              message_type: result.data.message_type,
              created_at: result.data.created_at || new Date().toISOString(),
              text: result.data.content || undefined,
              sender: "user",
              timestamp: new Date(result.data.created_at || Date.now()),
              read: false,
              sent: true,
              delivered: true,
              media: undefined,
              reactions: undefined,
            };
            
            // Optimistically update cache
            mutateMessages(async (currentMessages) => {
              if (!currentMessages) return [newMessage];
              if (currentMessages.some(m => m.id === newMessage.id)) {
                return currentMessages;
              }
              const updated = [...currentMessages, newMessage];
              const cacheKey = getMessagesCacheKey(user.id, activeConversation);
              setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
                console.error('Failed to update messages cache:', err);
              });
              return updated;
            }, false);
          }
        }
      } catch (err) {
        console.error(`Upload error for ${message_type}:`, err);
      }
    }

    // After sending, check if the conversation exists
    const exists = displayConversations.some(
      (conv) => conv.user_id === activeConversation
    );
    if (!exists) {
      // Fetch the profile of the new user
      const { data: profile } = await socialApi.profiles.getById(
        activeConversation
      );
      if (profile) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("userName", profile.full_name || "");
        }
        mutateConversations((prev) => {
          if (!prev) return prev;
          return [
            {
              id: profile.id,
              user_id: profile.id,
              name: profile.full_name || profile.username || "Unknown User",
              avatar:
                profile.avatar_url ??
                (profile.full_name?.[0]?.toUpperCase() ||
                  profile.username?.[0]?.toUpperCase() ||
                  "U"),
              avatar_url: profile.avatar_url,
              lastMessage: content,
              lastMessageType:
                media.length > 0
                  ? media[0].type.startsWith("image/")
                    ? "image"
                    : media[0].type.startsWith("video/")
                    ? "video"
                    : "file"
                  : "text",
              timestamp: new Date(),
              unread: 0,
              online: false,
              full_name: profile.full_name,
              username: profile.username,
            },
            ...prev,
          ];
        }, false);
      }
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;
    try {
      const response = await fetch("/api/messenger/conversations", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete conversation");
      }

      toast.success("Conversation history deleted.");
      setActiveConversation(null);
      // Clear messages cache
      mutateMessages([], false);
      // Clear encrypted cache for this conversation
      if (user.id) {
        await clearConversationMessagesCache(user.id, conversationId);
      }
      // Revalidate conversations to get updated list
      await mutateConversations();
      // Update encrypted conversations cache after revalidation
      if (user.id) {
        const cacheKey = getConversationsCacheKey(user.id);
        const updatedConversations = await fetchConversationsData();
        await setEncryptedCache(cacheKey, updatedConversations, user.id);
      }
    } catch (error) {
      console.error("Error deleting conversation history:", error);
      toast.error("Failed to delete conversation history.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(newMessageContent);
    }
  };

  const handleDeleteMedia = (messageId: string, mediaIndex: number) => {
    mutateMessages((currentMessages) => {
      if (!currentMessages) return currentMessages;
      return currentMessages.map((msg) => {
        if (msg.id === messageId && msg.media) {
          const updatedMedia = [...msg.media];
          if (updatedMedia[mediaIndex]?.url) {
            URL.revokeObjectURL(updatedMedia[mediaIndex].url);
          }
          updatedMedia.splice(mediaIndex, 1);
          return {
            ...msg,
            media: updatedMedia.length > 0 ? updatedMedia : undefined,
          };
        }
        return msg;
      });
    }, false);
    toast.success("Media deleted");
  };

  const handleUnsendMessage = (messageId: string) => {
    // Remove the message from the messages array
    mutateMessages(async (currentMessages) => {
      if (!currentMessages) return currentMessages;
      const filtered = currentMessages.filter((msg) => msg.id !== messageId);
      
      // Update encrypted cache
      if (user?.id && activeConversation) {
        const cacheKey = getMessagesCacheKey(user.id, activeConversation);
        setEncryptedCache(cacheKey, filtered, user.id).catch((err) => {
          console.error('Failed to update messages cache:', err);
        });
      }
      
      // Update the conversation's last message if needed
      if (activeConversation && filtered.length > 0) {
        const lastMsg = filtered[filtered.length - 1];
        mutateConversations(async (currentConversations) => {
          if (!currentConversations) return currentConversations;
          const updated = currentConversations.map((conv) =>
            conv.user_id === activeConversation
              ? {
                  ...conv,
                  lastMessage: lastMsg.content || "",
                  lastMessageType: lastMsg.message_type || "",
                  timestamp: lastMsg.timestamp,
                }
              : conv
          );
          // Update encrypted cache
          if (user?.id) {
            const cacheKey = getConversationsCacheKey(user.id);
            setEncryptedCache(cacheKey, updated, user.id).catch((err) => {
              console.error('Failed to update conversations cache:', err);
            });
          }
          return updated;
        }, false);
      }
      
      return filtered;
    }, false);

    toast.success("Message unsent");
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    if (isMobile) {
      setShowConversationList(false);
    }

    // Persist selected user's name for header/avatar fallback on refresh
    const selectedConv = displayConversations.find((conv) => conv.user_id === id);
    const displayName =
      selectedConv?.full_name ||
      selectedConv?.username ||
      selectedConv?.name ||
      "User";
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("userName", displayName);
    }

    // Mark unread messages as read
    mutateConversations((currentConversations) => {
      if (!currentConversations) return currentConversations;
      return currentConversations.map((conv) =>
        conv.user_id === id ? { ...conv, unread: 0 } : conv
      );
    }, false);

    // Note: Scrolling to bottom is handled by useEffect that watches messages and loadingMessages
    // This ensures messages are loaded before scrolling
  };

  const toggleConversationList = () => {
    if (isMobile && activeConversation) {
      // On mobile, when in a conversation, back button should:
      // 1. Clear active conversation
      // 2. Navigate to /messenger (without userId)
      // 3. Show conversation list
      setActiveConversation(null);
      router.push('/messenger');
      setShowConversationList(true);
    } else {
      // Desktop or when no active conversation, just toggle
      setShowConversationList(!showConversationList);
    }
  };

  const selectedConversationProfile = displayConversations.find(
    (c) => c.user_id === activeConversation
  );

  // Fetch profile if not found in conversations
  useEffect(() => {
    if (userId && !selectedConversationProfile) {
      socialApi.profiles.getById(userId).then(({ data }) => {
        if (data) {
          const displayName =
            data.full_name || data.username || (typeof window !== 'undefined' ? sessionStorage.getItem("userName") : null) || "User";
          if (typeof window !== 'undefined') {
            sessionStorage.setItem("userName", displayName);
          }
          setExternalProfile({
            id: data.id,
            user_id: data.id,
            avatar_url: data.avatar_url || undefined,
            full_name: data.full_name || undefined,
            username: data.username || undefined,
            online: false,
          });
        }
      });
    } else {
      setExternalProfile(null);
    }
  }, [userId, selectedConversationProfile]);

  // Use selectedConversationProfile or externalProfile in your UI
  const profile = selectedConversationProfile || externalProfile;

  // Update input/footer height dynamically
  useEffect(() => {
    if (isMobile && inputFooterRef.current) {
      setInputFooterHeight(inputFooterRef.current.offsetHeight);
    }
  });

  useEffect(() => {
    if (isMobile && activeConversation) {
      setShowConversationList(false);
    }
  }, [isMobile, activeConversation]);

  return (
    <div
      className={
        `flex w-full h-screen min-h-screen` +
        ` bg-white dark:bg-gray-900` +
        ` border ` +
        `border-gray-200 dark:border-gray-700` +
        ` rounded-lg overflow-hidden shadow-md`
      }
      style={{ maxHeight: "100vh" }}
    >
      {/* Conversations Sidebar */}
      {hydrated && (showConversationList || !isMobile) && (
        <div
          className={
            `${
              isMobile ? "w-full absolute z-10 h-full" : "w-1/3 h-full"
            } border-r ` +
            `border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900`
          }
        >
          <Conversations
            conversations={displayConversations}
            onSelectConversation={handleSelectConversation}
            activeConversation={activeConversation}
            loading={loadingConversations}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Chat Area */}
      <div
        className={`${
          isMobile && showConversationList && !activeConversation ? "hidden" : "flex"
        } ${
          isMobile ? "w-full" : "w-2/3"
        } flex-col h-full relative max-[764px]:w-full`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div
              className={
                `flex items-center justify-between p-4 border-b ` +
                `border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ` +
                (isMobile ? "fixed top-0 left-0 right-0 z-30" : "")
              }
              style={
                isMobile
                  ? {
                      height: 56,
                      minHeight: 56,
                      maxHeight: 56,
                      marginTop: "2px",
                    }
                  : {}
              }
            >
              <div className="flex items-center w-full">
                {isMobile && (
                  <button
                    onClick={toggleConversationList}
                    className={
                      `mr-2 ` +
                      `text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white`
                    }
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div
                  className="flex cursor-pointer"
                  onClick={() => {
                    console.log(profile);
                    router.push((`/profile/${profile?.id}`) as any);
                  }}
                >
                  <Avatar
                    className={
                      `h-10 w-10 mr-3 ` + `bg-gray-100 dark:bg-gray-700`
                    }
                  >
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={
                        profile?.full_name?.[0]?.toUpperCase() ||
                        profile?.username?.[0]?.toUpperCase() ||
                        (typeof window !== 'undefined' ? sessionStorage.getItem("userName")?.[0]?.toUpperCase() : null) ||
                        "U"
                      }
                    />
                    <AvatarFallback>
                      {" "}
                      {profile?.full_name?.[0]?.toUpperCase() ||
                        profile?.username?.[0]?.toUpperCase() ||
                        (typeof window !== 'undefined' ? sessionStorage.getItem("userName")?.[0]?.toUpperCase() : null) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3
                      className={
                        `font-semibold ` + `text-gray-800 dark:text-white`
                      }
                    >
                      {profile?.full_name || profile?.username || (typeof window !== 'undefined' ? sessionStorage.getItem("userName") : null) || userId}
                    </h3>
                    <span
                      className={
                        `text-xs ` + `text-gray-500 dark:text-gray-400 mb-1`
                      }
                    >
                      {profile?.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={
                      `p-2 rounded-full ` +
                      `text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`
                    }
                  >
                    <MoreVertical size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.push((`/profile/${profile?.id}`) as any)}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      confirmToast({
                        title: "Delete History",
                        description:
                          "Are you sure you want to delete this conversation history? This cannot be undone.",
                        onConfirm: () =>
                          handleDeleteConversation(activeConversation),
                      })
                    }
                    className="text-red-500"
                  >
                    Delete History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea
              className={`flex-1 p-4 bg-gray-50 dark:bg-gray-800 ${
                isMobile ? "overflow-y-auto" : ""
              }`}
              ref={scrollAreaRef}
              style={
                isMobile
                  ? {
                      marginTop: 56, // height of header
                      marginBottom: 0,
                      paddingBottom: inputFooterHeight + 8, // 8px extra for spacing
                      height: "calc(100vh - 56px)",
                    }
                  : {}
              }
            >
              {typing && (
                <div className="text-sm text-gray-500 italic px-4 py-1">
                  {profile?.full_name || "User"} is typing...
                </div>
              )}
              <div className="flex flex-col space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-gray-500">
                    Loading messages...
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  displayMessages.map((message) => {
                    const messageDate = new Date(message.timestamp);
                    const showDateHeader =
                      lastMessageDateRef.current === null || // Show header for the first message
                      messageDate.toDateString() !==
                        lastMessageDateRef.current.toDateString();

                    // Update the ref for the next iteration
                    lastMessageDateRef.current = messageDate;

                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const dateHeader = showDateHeader ? (
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-4">
                        {messageDate.toDateString() === today.toDateString()
                          ? "Today"
                          : messageDate.toDateString() ===
                            yesterday.toDateString()
                          ? "Yesterday"
                          : format(messageDate, "MM/dd/yyyy")}
                      </div>
                    ) : null;

                    return (
                      <React.Fragment key={message.id}>
                        {dateHeader}
                        <MessageBubble
                          message={{
                            ...message,
                            content: message.content || "",
                            message_type: message.message_type || "",
                            type: message.message_type || undefined,
                            text: message.text || message.content || undefined,
                          }}
                          onDeleteMedia={handleDeleteMedia}
                          onUnsendMessage={handleUnsendMessage}
                        />
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div
              className={
                `border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ` +
                (isMobile ? "fixed bottom-0 left-0 right-0 z-30" : "")
              }
              ref={inputFooterRef}
              style={
                isMobile
                  ? {
                      minHeight: 56,
                      paddingBottom: "env(safe-area-inset-bottom)",
                    }
                  : {}
              }
            >
              <MessageInput
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                onSendMessage={handleSendMessage}
                disabled={loadingMessages}
              />
            </div>
          </>
        ) : (
          <div
            className={
              `flex items-center justify-center h-full ` + `text-gray-400`
            }
          >
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerUI;
