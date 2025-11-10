import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";

interface Conversation {
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

interface ConversationsProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  activeConversation: string | null;
  loading: boolean;
  isMobile: boolean;
}

const Conversations: React.FC<ConversationsProps> = ({
  conversations,
  onSelectConversation,
  activeConversation,
  loading,
  isMobile,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`p-4 border-b ${"border-gray-200"} flex items-center`}>
        <button
          onClick={() => router.push("/social")}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 mr-2"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className={`text-lg font-semibold`}>Recent Conversations</h2>
      </div>
      <div className="p-3">
        <Input
          placeholder="Search conversations..."
          className="mt-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading
            ? Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 rounded-lg mb-2  animate-pulse"
                >
                  {/* Profile Image */}
                  <div className="h-10 w-10 rounded-full bg-gray-300 mr-3" />

                  {/* Name and Message */}
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 rounded bg-gray-300" />
                    <div className="h-3 w-48 rounded bg-gray-300" />
                  </div>

                  {/* Timestamp */}
                  <div className="h-3 w-16 ml-2 rounded bg-gray-300" />
                </div>
              ))
            : [...filteredConversations]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((conversation) => (
                  <div
                    key={conversation.user_id}
                    className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 rounded-md transition-colors
                      ${
                        !isMobile && conversation.user_id === activeConversation
                          ? "bg-gray-200"
                          : "bg-white"
                      }`}
                    onClick={() => {
                      router.push(`/messenger/${conversation.user_id}`);
                      onSelectConversation(conversation.user_id);
                    }}
                  >
                    <div className="relative">
                      <Avatar className={`h-12 w-12 mr-3`}>
                        <AvatarImage
                          src={conversation.avatar || undefined}
                          alt="avatar"
                        />
                        <AvatarFallback>
                          {(conversation.full_name?.[0] || conversation.username?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <span className="absolute bottom-0 right-2 w-3 h-3 bg-racing-green rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className={`font-medium truncate`}>
                          {conversation.name}
                        </h3>
                        <span className={`text-xs text-gray-400`}>
                          {differenceInSeconds(
                            new Date(),
                            conversation.timestamp
                          ) < 60
                            ? "just now"
                            : formatDistanceToNow(conversation.timestamp, {
                                addSuffix: true,
                              }).replace(/^about /, "")}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-medium text-gray-800 line-clamp-1 overflow-hidden`}
                      >
                        {conversation.lastMessageType === "image"
                          ? "📷 Photo"
                          : conversation.lastMessageType === "video"
                          ? "🎥 Video"
                          : conversation.lastMessageType === "post"
                          ? "📢 Post"
                          : conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="ml-2 bg-racing-red rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Conversations;
