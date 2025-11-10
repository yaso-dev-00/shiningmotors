"use client";
import React, { useState, useEffect, useRef } from "react";
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
  const { user } = useAuth();
  useOnlineStatus(user?.id);
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialUserId || null
  );
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showConversationList, setShowConversationList] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const lastMessageDateRef = useRef<Date | null>(null);
  const [inputFooterHeight, setInputFooterHeight] = useState(56);
  const inputFooterRef = useRef<HTMLDivElement>(null);

  const { userId } = useParams<{ userId?: string }>();
  const [externalProfile, setExternalProfile] = useState<UserProfile | null>(
    null
  );

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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isUserOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;

    // Ensure lastSeen is treated as UTC
    const seen = new Date(lastSeen.endsWith("Z") ? lastSeen : lastSeen + "Z");
    const now = new Date();

    const diff = now.getTime() - seen.getTime();
    const diffSeconds = Math.floor(diff / 1000);

    return diff < 60 * 1000;
  };

  useEffect(() => {
    const fetchConvos = async () => {
      if (!user) return;
      setLoadingConversations(true);
      try {
        const { data, error } = await fetchConversations(user.id);
        if (error) throw error;

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
        const conversationsWithProfiles = localConversations.map((conv) => {
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

        setConversations(conversationsWithProfiles);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConvos();
  }, [user]);

  // --- Fetch Messages for Selected Conversation ---
  useEffect(() => {
    if (initialUserId && !activeConversation && conversations.length > 0) {
      handleSelectConversation(initialUserId);
      return;
    }

    const getMessages = async () => {
      if (!activeConversation || !user) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const { data, error } = await fetchMessages({
          user1: user.id,
          user2: activeConversation,
        }); // Use chat.ts function
        if (error) throw error;

        const localMessages: Message[] = (
          data as Database["public"]["Tables"]["messages"]["Row"][]
        ).map((msg) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          message_type: msg.message_type,
          created_at: msg.created_at || new Date().toISOString(),
          text: msg.content || undefined,
          sender: msg.sender_id === user?.id ? "user" : "other",
          timestamp: new Date(msg.created_at || Date.now()),
          read: false,
          sent: true,
          delivered: true,
          media: undefined,
          reactions: undefined,
        }));

        setMessages(localMessages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    getMessages();

    // --- Setup Real-time Subscription ---
    if (!user?.id || !activeConversation) return;
    
    const messageSubscription = subscribeToMessages({
      user1: user.id,
      user2: activeConversation,
      onMessage: (msg: Record<string, unknown> & { id?: string; isDeleted?: boolean }) => {
        const typedMsg = msg as Database["public"]["Tables"]["messages"]["Row"] & {
          isDeleted?: boolean;
        };
        if (typedMsg.isDeleted) {
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.filter(
              (message) => message.id !== typedMsg.id
            );

            return updatedMessages;
          });
        } else if (
          (typedMsg.sender_id === user?.id &&
            typedMsg.receiver_id === activeConversation) ||
          (typedMsg.sender_id === activeConversation && typedMsg.receiver_id === user?.id)
        ) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: typedMsg.id,
              sender_id: typedMsg.sender_id,
              receiver_id: typedMsg.receiver_id,
              content: typedMsg.content,
              message_type: typedMsg.message_type,
              created_at: typedMsg.created_at || new Date().toISOString(),
              text: typedMsg.content || undefined,
              sender: typedMsg.sender_id === user?.id ? "user" : "other",
              timestamp: new Date(typedMsg.created_at || Date.now()),
              read: false,
              sent: true,
              delivered: true,
              media: undefined,
              reactions: undefined,
            },
          ]);

          const conversationToUpdateId =
            typedMsg.sender_id === user?.id ? typedMsg.receiver_id : typedMsg.sender_id;

          setConversations((prevConversations) =>
            prevConversations.map((conv) =>
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
            )
          );
        }
      },
    });

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [activeConversation, user]); // Removed messages from dependency array

  const handleSendMessage = async (content: string, media: File[] = []) => {
    if ((!content.trim() && media.length === 0) || !user || !activeConversation)
      return;

    // 1. Send text message if available
    if (content.trim()) {
      try {
        const { error } = await sendMessage({
          sender_id: user.id,
          receiver_id: activeConversation,
          content: content.trim(),
          message_type: "text",
        });

        if (error) console.error("Error sending text message:", error);
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
        // Upload to Supabase storage
        const publicUrl = await uploadFile(file, user.id, "message-media");

        const { error } = await sendMessage({
          sender_id: user.id,
          receiver_id: activeConversation,
          content: publicUrl,
          message_type,
        });

        if (error) {
          console.error(`Error sending ${message_type} message:`, error);
        }
      } catch (err) {
        console.error(`Upload error for ${message_type}:`, err);
      }
    }

    // After sending, check if the conversation exists
    const exists = conversations.some(
      (conv) => conv.user_id === activeConversation
    );
    if (!exists) {
      // Fetch the profile of the new user
      const { data: profile } = await socialApi.profiles.getById(
        activeConversation
      );
      if (profile) {
        setConversations((prev) => [
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
        ]);
      }
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;
    try {
      const { error } = await deleteConversationBetweenUsers(
        user.id,
        conversationId
      );
      if (error) throw error;
      toast.success("Conversation history deleted.");
      setActiveConversation(null);
      setMessages([]);
      // Re-fetch conversations to update the list
      const { data, error: fetchError } = await fetchConversations(user.id);
      if (fetchError) throw fetchError;
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
      setConversations(localConversations);
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
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
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
      })
    );
    toast.success("Media deleted");
  };

  const handleUnsendMessage = (messageId: string) => {
    // Remove the message from the messages array
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );

    // Update the conversation\'s last message if needed
    if (activeConversation) {
      const remainingMessages = messages.filter((msg) => msg.id !== messageId);
      const lastMsg =
        remainingMessages.length > 0
          ? remainingMessages[remainingMessages.length - 1]
          : null;

      if (lastMsg) {
        setConversations(
          conversations.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  lastMessage: lastMsg.text || "",
                  lastMessageType: lastMsg.message_type || "",
                  timestamp: lastMsg.timestamp,
                }
              : conv
          )
        );
      }
    }

    toast.success("Message unsent"); // Show success toast after state update
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    if (isMobile) {
      setShowConversationList(false);
    }

    // Mark unread messages as read
    setConversations(
      conversations.map((conv) =>
        conv.user_id === id ? { ...conv, unread: 0 } : conv
      )
    );

    // Force scroll to bottom when changing conversations
    setTimeout(scrollToBottom, 100);
  };

  const toggleConversationList = () => {
    setShowConversationList(!showConversationList);
  };

  const selectedConversationProfile = conversations.find(
    (c) => c.user_id === activeConversation
  );

  // Fetch profile if not found in conversations
  useEffect(() => {
    if (userId && !selectedConversationProfile) {
      socialApi.profiles.getById(userId).then(({ data }) => {
        if (data) {
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
      {(showConversationList || !isMobile) && (
        <div
          className={
            `${
              isMobile ? "w-full absolute z-10 h-full" : "w-1/3 h-full"
            } border-r ` +
            `border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900`
          }
        >
          <Conversations
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            activeConversation={activeConversation}
            loading={loadingConversations}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Chat Area */}
      <div
        className={`${isMobile && showConversationList ? "hidden" : "flex"} ${
          isMobile ? "w-full" : "w-2/3"
        } flex-col h-full relative`}
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
              <div className="flex items-center">
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
                      alt={(profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || "U")}
                    />
                    <AvatarFallback>
                      {" "}
                      {profile?.full_name?.[0]?.toUpperCase() ||
                        profile?.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3
                      className={
                        `font-semibold ` + `text-gray-800 dark:text-white`
                      }
                    >
                      {profile?.full_name || profile?.username || userId}
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
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => {
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
