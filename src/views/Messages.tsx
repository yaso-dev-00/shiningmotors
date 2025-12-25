import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePostModal } from "@/contexts/PostModalProvider";
import {
  sendMessage,
  fetchMessages,
  subscribeToMessages,
  updateMessage,
  deleteMessage,
  uploadFile,
  fetchConversations,
  deleteConversationBetweenUsers,
} from "@/integrations/supabase/modules/chat";
import Picker from "@emoji-mart/react";
import { FaRegSmile } from "react-icons/fa";
import { FiSend, FiDownload } from "react-icons/fi";
import { useMediaQuery } from "react-responsive";
import {
  socialApi,
  PostWithProfile,
} from "@/integrations/supabase/modules/social";
import { ShareModal } from "@/lib/shareModel";
import React from "react";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string | null;
  message_type: string | null;
  created_at: string | null;
  reaction?: string | null;
}

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_type: string;
  last_message_time: string;
}

const Messages = () => {
  const { id: urlId } = useParams();
  const urlIdParam = Array.isArray(urlId) ? urlId[0] : urlId ?? null;
  const { user } = useAuth();
  const { openPost } = usePostModal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(urlIdParam);
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState<
    Record<string, boolean>
  >({});
  const [postCache, setPostCache] = useState<Record<string, any>>({});

  // Fetch conversations for sidebar
  useEffect(() => {
    if (!user?.id) return;
    setLoadingConversations(true);
    fetchConversations(user.id).then(({ data }) => {
      setConversations(data || []);
      setLoadingConversations(false);
    });
  }, [user?.id]);

  // Fetch and subscribe to messages for selected conversation
  useEffect(() => {
    if (!user?.id || !selectedUserId) return;
    setLoadingMessages(true);
    fetchMessages({ user1: user.id, user2: selectedUserId }).then(
      ({ data }) => {
        setMessages((data || []) as Message[]);
        setLoadingMessages(false);
      }
    );
    const channel = subscribeToMessages({
      user1: user.id,
      user2: selectedUserId,
      onMessage: (msg: Record<string, unknown> & { id?: string; isDeleted?: boolean }) => {
        if (msg.isDeleted) {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        } else {
          setMessages((prev) => [...prev, msg as unknown as Message]);
        }
      },
    });
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user?.id, selectedUserId]);

  // Fetch and cache profiles for conversation users (sidebar)
  useEffect(() => {
    const fetchSidebarProfiles = async () => {
      const uniqueIds = Array.from(
        new Set(conversations.map((c) => c.user_id))
      );
      const missingIds = uniqueIds.filter((id) => !profileCache[id]);
      if (missingIds.length === 0) return;
      const newProfiles: Record<string, Profile> = { ...profileCache };
      const newLoading: Record<string, boolean> = { ...loadingProfiles };
      await Promise.all(
        missingIds.map(async (id) => {
          newLoading[id] = true;
          const { data } = await socialApi.profiles.getById(id);
          newLoading[id] = false;
          if (data) {
            newProfiles[id] = {
              id: data.id,
              full_name: data.full_name || "User",
              avatar_url: data.avatar_url || "/default-avatar.png",
            };
          } else {
            newProfiles[id] = {
              id,
              full_name: "User",
              avatar_url: "/default-avatar.png",
            };
          }
        })
      );
      setProfileCache(newProfiles);
      setLoadingProfiles(newLoading);
    };
    if (conversations.length > 0) fetchSidebarProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Fetch and cache sender profiles for all messages
  useEffect(() => {
    const fetchProfiles = async () => {
      const uniqueIds = Array.from(
        new Set(messages.map((msg) => msg.sender_id))
      );
      const missingIds = uniqueIds.filter((id) => !profileCache[id]);
      if (missingIds.length === 0) return;
      const newProfiles: Record<string, Profile> = { ...profileCache };
      const newLoading: Record<string, boolean> = { ...loadingProfiles };
      await Promise.all(
        missingIds.map(async (id) => {
          newLoading[id] = true;
          const { data } = await socialApi.profiles.getById(id);
          newLoading[id] = false;
          if (data) {
            newProfiles[id] = {
              id: data.id,
              full_name: data.full_name || "User",
              avatar_url: data.avatar_url || "/default-avatar.png",
            };
          } else {
            newProfiles[id] = {
              id,
              full_name: "User",
              avatar_url: "/default-avatar.png",
            };
          }
        })
      );
      setProfileCache(newProfiles);
      setLoadingProfiles(newLoading);
    };
    if (messages.length > 0) fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user?.id || !selectedUserId) return;
    const { error } = await sendMessage({
      sender_id: user.id,
      receiver_id: selectedUserId,
      content: input,
      message_type: "text",
    });
    if (error) {
      console.error("Send message error:", error);
      return;
    }
    setInput("");
  };

  // Send file (image/video)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !selectedUserId) return;
    if (file.type.startsWith("video") && file.size > 20 * 1024 * 1024) {
      alert("Video must be less than 20MB");
      return;
    }
    try {
      const url = await uploadFile(file, user.id);
      const type = file.type.startsWith("image") ? "image" : "video";
      await sendMessage({
        sender_id: user.id,
        receiver_id: selectedUserId,
        content: url,
        message_type: type,
      });
    } catch (error) {
      alert("Upload failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Edit message
  const handleEdit = async (msgId: string) => {
    if (!input.trim()) return false;
    const { error } = await updateMessage(msgId, input);
    if (!error) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, content: input } : msg))
      );
      setEditingId(null);
      setInput("");
      return true;
    }
    return false;
  };

  // Delete message
  const handleDelete = async (msgId: string) => {
    const { error } = await deleteMessage(msgId);
    if (!error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== msgId));
    }
  };

  // Emoji picker logic
  const handleEmojiSelect = (emoji: { native: string }) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newValue =
      input.substring(0, start) + emoji.native + input.substring(end);
    setInput(newValue);
    setShowEmoji(false);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + emoji.native.length,
        start + emoji.native.length
      );
    }, 0);
  };

  // Helper for date separator
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Skeleton components
  const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
  );

  const PostPreview = ({ postId }: { postId: string }) => {
    const [post, setPost] = useState<PostWithProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //   let mounted = true;
    //   setLoading(true);
    //   socialApi.posts.getById(postId).then(({ data }) => {
    //     if (mounted) {
    //       setPost(data || null);
    //       setLoading(false);
    //     }
    //   });
    //   return () => {
    //     mounted = false;
    //   };
    // }, [postId]);

    useEffect(() => {
  let mounted = true;
  setLoading(true);
  socialApi.posts.getById(postId).then(({ data }) => {
    if (mounted) {
      if (data) {
        setPost({
          ...data,
          content: data.content || "",
          category: data.category as "Product" | "Vehicle" | "Service" | null,
        } as PostWithProfile);
      } else {
        setPost(null);
      }
      setLoading(false);
    }
  });
  return () => {
    mounted = false;
  };
}, [postId]);

    if (loading) {
      return <div className="w-60 h-32 bg-gray-200 rounded-lg animate-pulse" />;
    }

    if (!post) {
      return (
        <div className="w-60 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
          Post not found
        </div>
      );
    }

    const image = post.media_urls?.[0] || "/default-image.png";

    return (
      <div
        className="cursor-pointer bg-white text-black rounded-lg p-3 shadow hover:bg-gray-100 transition w-60"
        onClick={() => {
          sessionStorage.setItem('modalScrollPosition', String(window.scrollY));
          openPost(postId);
        }}
      >
        <img
          src={image}
          alt={post.content?.slice(0, 20) || "Post"}
          className="w-full h-28 object-cover rounded mb-2"
        />
      </div>
    );
  };


  // Add this function to delete all messages between two users
  const deleteConversationHistory = async (
    userId: string,
    otherUserId: string
  ) => {
    await deleteConversationBetweenUsers(userId, otherUserId);
  };

  return (
    <div className="flex h-screen text-black">
      {/* Sidebar: Recent Conversations */}
      {(!isMobile || !selectedUserId) && (
        <aside
          className="w-full sm:w-80 bg-black text-white flex-shrink-0 flex flex-col border-r border-gray-800 overflow-y-auto"
          style={{
            maxWidth: 350,
            display: isMobile && selectedUserId ? "none" : undefined,
          }}
        >
          <div className="p-4 text-lg font-bold border-b border-gray-700">
            Messages
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="p-4 text-gray-400">No conversations</div>
            ) : (
              conversations.map((conv) => {
                const userProfile = profileCache[conv.user_id] || {
                  avatar_url: "/default-avatar.png",
                  full_name: "User",
                  id: conv.user_id,
                };
                const isProfileLoading = loadingProfiles[conv.user_id];
                return (
                  <div
                    key={conv.user_id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 ${
                      selectedUserId === conv.user_id ? "bg-gray-900" : ""
                    }`}
                    onClick={() => setSelectedUserId(conv.user_id)}
                  >
                    {isProfileLoading ? (
                      <Skeleton className="w-10 h-10" />
                    ) : (
                      <img
                        src={userProfile.avatar_url || "/default-avatar.png"}
                        alt={userProfile.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {isProfileLoading ? (
                          <Skeleton className="h-4 w-24" />
                        ) : (
                          userProfile.full_name
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {conv.last_message_type === "image"
                          ? "📷 Photo"
                          : conv.last_message_type === "video"
                          ? "🎥 Video"
                          : conv.last_message_type === "post"
                          ? "Post"
                          : conv.last_message}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {conv.last_message_time &&
                        new Date(conv.last_message_time).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
      {/* Main Chat Area */}
      {(!isMobile || selectedUserId) && (
        <main
          className="flex-1 flex flex-col"
          style={isMobile && !selectedUserId ? { display: "none" } : {}}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 bg-white relative">
            {isMobile && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setSelectedUserId(null)}
              >
                ←
              </button>
            )}
            {/* Always show selected user's avatar and name in header */}
            {selectedUserId &&
              (loadingProfiles[selectedUserId] ? (
                <>
                  <Skeleton className="w-10 h-10" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                  </div>
                </>
              ) : profileCache[selectedUserId] ? (
                <>
                  <img
                    src={
                      profileCache[selectedUserId].avatar_url ||
                      "/default-avatar.png"
                    }
                    alt={profileCache[selectedUserId].full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-1">
                      {profileCache[selectedUserId].full_name}
                    </div>
                    {/* Optionally show last active here if desired */}
                  </div>
                </>
              ) : null)}
            <div className="ml-auto relative">
              <button
                className="p-2 rounded-full hover:bg-gray-200"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                aria-label="Open menu"
              >
                <span style={{ fontSize: 24, fontWeight: "bold" }}>⋮</span>
              </button>
              {headerMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-20">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      if (selectedUserId) {
                        window.location.href = `/profile/${selectedUserId}`;
                      }
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete History
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto flex flex-col-reverse px-8 py-6"
            style={{ background: "#D3D3D3" }}
          >
            <div className="flex flex-col gap-6">
              {loadingMessages ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="w-8 h-8 self-end" />
                    <div className="max-w-xs rounded-2xl px-4 py-3 bg-gray-300 flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet</div>
              ) : (
                (() => {
                  // Group messages by day for date separators
                  const result: JSX.Element[] = [];
                  let lastDate = "";
                  messages.forEach((msg, idx) => {
                    const msgDate = msg.created_at
                      ? new Date(msg.created_at).toDateString()
                      : "";
                    if (msgDate !== lastDate) {
                      result.push(
                        <div
                          key={msg.id + "-date"}
                          className="flex justify-center my-2"
                        >
                          <span className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full">
                            {getDateLabel(msg.created_at || "")}
                          </span>
                        </div>
                      );
                      lastDate = msgDate;
                    }
                    const isCurrentUser = msg.sender_id === user?.id;
                    const senderProfile = profileCache[msg.sender_id] || {
                      avatar_url: "/default-avatar.png",
                      full_name: "User",
                      id: msg.sender_id,
                    };
                    const isProfileLoading = loadingProfiles[msg.sender_id];
                    result.push(
                      <div
                        key={msg.id}
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isCurrentUser &&
                          (isProfileLoading ? (
                            <Skeleton className="w-8 h-8 self-end" />
                          ) : (
                            <img
                              src={
                                senderProfile.avatar_url ||
                                "/default-avatar.png"
                              }
                              alt={senderProfile.full_name}
                              className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                            />
                          ))}
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-3 relative flex flex-col ${
                            isCurrentUser
                              ? "bg-blue-600 text-white items-end"
                              : "bg-gray-700 text-white items-start"
                          }`}
                        >
                          {/* Username */}
                          <div className="text-xs font-semibold mb-1">
                            {isProfileLoading ? (
                              <Skeleton className="h-3 w-16" />
                            ) : (
                              senderProfile.full_name
                            )}
                          </div>
                          {/* Message content or edit input */}
                          {msg.message_type === "image" ? (
                            <div className="relative group">
                              <img
                                src={msg.content || ""}
                                alt="img"
                                className="rounded mb-2 max-w-[200px]"
                              />
                              <button
                                onClick={() => {
                                  if (!msg.content) return;
                                  const a = document.createElement("a");
                                  a.href = msg.content;
                                  a.download = "image.jpg";
                                  a.click();
                                }}
                                className="absolute bottom-1 right-1 bg-white/80 rounded-full p-1 text-black text-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Download image"
                              >
                                <FiDownload />
                              </button>
                            </div>
                          ) : msg.message_type === "video" ? (
                            <div className="relative group">
                              <video
                                src={msg.content || undefined}
                                controls
                                className="rounded mb-2 max-w-[200px]"
                              />
                              <button
                                onClick={() => {
                                  if (!msg.content) return;
                                  const a = document.createElement("a");
                                  a.href = msg.content;
                                  a.download = "video.mp4";
                                  a.click();
                                }}
                                className="absolute bottom-1 right-1 bg-white/80 rounded-full p-1 text-black text-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Download video"
                              >
                                <FiDownload />
                              </button>
                            </div>
                          ) : msg.message_type === "post" ? (
                            <PostPreview postId={msg.content || ""} />
                          ) : (
                            <div>{msg.content || ""}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1 text-right w-full">
                            {msg.created_at &&
                              new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                          </div>

                          {/* Three-dot menu for own messages (always visible on hover) */}
                          {isCurrentUser && editingId !== msg.id && (
                            <div className="absolute top-1 right-1 flex flex-col items-end">
                              <button
                                className="text-xs px-1 hover:bg-gray-200 rounded"
                                onClick={() =>
                                  setOpenOptionsId((prev) =>
                                    prev === msg.id ? null : msg.id
                                  )
                                }
                              >
                                ⋮
                              </button>

                              {openOptionsId === msg.id && (
                                <div className="mt-2 w-24 bg-white rounded shadow-lg z-10">
                                  {msg.message_type === "text" ? (
                                    <>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          setEditingId(msg.id);
                                          setInput(msg.content || "");
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => {
                                          handleDelete(msg.id);
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  ) : msg.message_type === "post" ? (
                                    <>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          setSharePostId(msg.content);
                                          setShareModalOpen(true);
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Share
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => {
                                          handleDelete(msg.id);
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          if (!msg.content) return;
                                          const a = document.createElement("a");
                                          a.href = msg.content;
                                          a.download =
                                            msg.message_type === "image"
                                              ? "image.jpg"
                                              : "video.mp4";
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Download
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => {
                                          handleDelete(msg.id);
                                          setOpenOptionsId(null);
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {isCurrentUser &&
                          (isProfileLoading ? (
                            <Skeleton className="w-8 h-8 self-end" />
                          ) : (
                            <img
                              src={
                                senderProfile.avatar_url ||
                                "/default-avatar.png"
                              }
                              alt={senderProfile.full_name}
                              className="w-8 h-8 rounded-full object-cover ml-2 self-end"
                            />
                          ))}
                      </div>
                    );
                  });
                  return result;
                })()
              )}
            </div>
          </div>
          {/* Input */}
          <form
            className="flex items-center gap-3 border-t border-gray-300 px-6 py-4 bg-white relative"
            onSubmit={async (e) => {
              e.preventDefault();

              if (editingId) {
                await handleEdit(editingId);
                return;
              }
              await handleSend();
            }}
          >
            <div className="relative">
              <button
                type="button"
                className="text-gray-400 hover:text-red-500"
                onClick={() => setShowEmoji((v) => !v)}
                tabIndex={-1}
              >
                <FaRegSmile size={22} />
              </button>
              {showEmoji && (
                <div className="absolute z-50 bottom-12 left-0">
                  <Picker
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-transparent outline-none text-black placeholder-gray-400 px-2"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {editingId ? (
              <button
                type="button"
                className="ml-2 text-xs text-red-500 hover:underline"
                onClick={() => {
                  setEditingId(null);
                  setInput("");
                }}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="text-gray-400 hover:text-blue-500"
                onClick={() => fileInputRef.current?.click()}
                tabIndex={-1}
              >
                📎
              </button>
            )}

            <button type="submit" className="text-blue-500 hover:text-blue-400">
              <FiSend size={22} />
            </button>
          </form>
        </main>
      )}
      {/* At the bottom of the component, render ShareModal */}
      {shareModalOpen && sharePostId && (
        <ShareModal
          open={shareModalOpen}
          postId={sharePostId}
          onClose={() => setShareModalOpen(false)}
        />
      )}
      {/* Confirmation Dialog Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-semibold text-lg mb-4">
              Delete Conversation?
            </div>
            <div className="mb-6 text-gray-700">
              Are you sure you want to delete all messages with this user? This
              action cannot be undone.
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (user?.id && selectedUserId) {
                    await deleteConversationHistory(user.id, selectedUserId);
                    window.location.reload();
                  }
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
