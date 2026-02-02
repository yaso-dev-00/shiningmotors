"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAI } from "@/contexts/AIContext";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getAICached, setAICached } from "@/lib/ai-cache";
import { AIActionButtons } from "@/components/ai/AIActionButtons";
import { FAQDialog } from "@/components/ai/FAQDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cached?: boolean;
  source?: string;
}

interface ActionButton {
  type: "navigate" | "add_to_cart" | "search" | "book_service";
  label: string;
  path?: string;
  productId?: string;
  serviceId?: string;
  query?: string;
  icon?: string;
}

export const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your Shining Motors AI assistant. How can I help you today? I can help you find products, answer questions about services, or assist with orders.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getContextForAI, addMessage } = useAI();
  const { cartItems, orders } = useCart();
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || input.trim();
    if (!query || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) {
      setInput("");
    }
    setIsLoading(true);

    try {
      // Check client-side cache first
      const cachedResponse = await getAICached(query, user?.id);
      if (cachedResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: cachedResponse,
          timestamp: new Date(),
          cached: true,
          source: "client_cache",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Get context for AI
      const context = getContextForAI();
      
      // If not cached, call API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: user?.id,
          context: {
            page: context.page,
            user: {
              cartItems: context.user.cartItems,
              orders: context.user.orders,
              hasBookings: context.user.hasBookings,
              location: context.user.location,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
        cached: data.cached || false,
        source: data.source || "ai",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      addMessage("assistant", assistantMessage.content);
      addMessage("user", query);

      // Parse action buttons from response if available
      if (data.actions && Array.isArray(data.actions)) {
        setActionButtons(data.actions);
      } else {
        setActionButtons([]);
      }

      // Cache the response client-side
      if (data.response && !data.cached) {
        await setAICached(
          query,
          data.response,
          user?.id,
          undefined,
          data.model,
          data.tokens
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-sm-red hover:bg-sm-red-light shadow-lg"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh]"
          >
            <Card className="h-full flex flex-col shadow-2xl border-2">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-sm-red text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-sm-red-light h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-sm-red text-white"
                          : "bg-white text-gray-900 border"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.cached && (
                          <span className="text-xs opacity-50 ml-2">
                            (cached)
                          </span>
                        )}
                      </div>
                      {/* Action buttons for assistant messages */}
                      {message.role === "assistant" && message.id === messages[messages.length - 1]?.id && actionButtons.length > 0 && (
                        <AIActionButtons
                          actions={actionButtons}
                          onActionComplete={() => {
                            // Optionally close chat or show feedback
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-sm-red" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1 pr-11 h-10"
                    />
                    {/* FAQ Button */}
                    <button
                      onClick={() => setIsFAQOpen(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sm-red focus:ring-offset-1"
                      title="Browse FAQs"
                      aria-label="Open FAQ"
                      type="button"
                    >
                      <HelpCircle className="h-4 w-4 text-gray-500 hover:text-sm-red transition-colors" />
                    </button>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-sm-red hover:bg-sm-red-light h-10 w-10 p-0 flex-shrink-0"
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Dialog */}
      <FAQDialog
        open={isFAQOpen}
        onOpenChange={setIsFAQOpen}
        onSelectQuestion={(question) => {
          handleSendMessage(question);
        }}
      />
    </>
  );
};

