"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Search, X } from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  keywords: string[];
}

const FAQ_CATEGORIES = [
  "General",
  "Shopping & Products",
  "Services & Bookings",
  "Orders & Cart",
  "Events",
  "Vendors",
  "Account & Profile",
  "Payment & Shipping",
  "Support & Help",
];

const FAQ_QUESTIONS: FAQItem[] = [
  // General
  {
    id: "1",
    category: "General",
    question: "What is Shining Motors?",
    keywords: ["what", "shining motors", "platform", "app"],
  },
  {
    id: "2",
    category: "General",
    question: "What features does the platform offer?",
    keywords: ["features", "what can i do", "capabilities"],
  },
  {
    id: "3",
    category: "General",
    question: "How do I navigate the app?",
    keywords: ["navigate", "how to use", "tutorial", "guide"],
  },
  {
    id: "4",
    category: "General",
    question: "Is the platform free to use?",
    keywords: ["free", "cost", "paid", "subscription"],
  },

  // Shopping & Products
  {
    id: "5",
    category: "Shopping & Products",
    question: "What products are available?",
    keywords: ["products", "what products", "catalog"],
  },
  {
    id: "6",
    category: "Shopping & Products",
    question: "How do I search for products?",
    keywords: ["search", "find product", "filter"],
  },
  {
    id: "7",
    category: "Shopping & Products",
    question: "How do I add items to cart?",
    keywords: ["add to cart", "cart", "shopping"],
  },
  {
    id: "8",
    category: "Shopping & Products",
    question: "Can I find parts for my specific vehicle?",
    keywords: ["parts", "vehicle", "car parts", "compatible"],
  },
  {
    id: "9",
    category: "Shopping & Products",
    question: "What product categories do you have?",
    keywords: ["categories", "product types", "oem parts"],
  },

  // Services & Bookings
  {
    id: "10",
    category: "Services & Bookings",
    question: "What services do you offer?",
    keywords: ["services", "what services", "available services"],
  },
  {
    id: "11",
    category: "Services & Bookings",
    question: "How do I book a service?",
    keywords: ["book service", "appointment", "schedule"],
  },
  {
    id: "12",
    category: "Services & Bookings",
    question: "Can I find a mechanic near me?",
    keywords: ["mechanic", "near me", "find mechanic", "service provider"],
  },
  {
    id: "13",
    category: "Services & Bookings",
    question: "What types of automotive services are available?",
    keywords: ["car wash", "ac service", "maintenance", "repair"],
  },
  {
    id: "14",
    category: "Services & Bookings",
    question: "How do I view my service bookings?",
    keywords: ["my bookings", "service bookings", "appointments"],
  },

  // Orders & Cart
  {
    id: "15",
    category: "Orders & Cart",
    question: "How do I track my order?",
    keywords: ["track order", "order status", "where is my order"],
  },
  {
    id: "16",
    category: "Orders & Cart",
    question: "What's in my cart?",
    keywords: ["cart", "what's in cart", "cart items"],
  },
  {
    id: "17",
    category: "Orders & Cart",
    question: "How do I checkout?",
    keywords: ["checkout", "how to buy", "purchase", "place order"],
  },
  {
    id: "18",
    category: "Orders & Cart",
    question: "How do I view my order history?",
    keywords: ["order history", "past orders", "my orders"],
  },
  {
    id: "19",
    category: "Orders & Cart",
    question: "Can I cancel my order?",
    keywords: ["cancel order", "how to cancel"],
  },

  // Events
  {
    id: "20",
    category: "Events",
    question: "What events are coming up?",
    keywords: ["events", "upcoming events", "what events"],
  },
  {
    id: "21",
    category: "Events",
    question: "How do I register for an event?",
    keywords: ["register", "join event", "attend event", "rsvp"],
  },
  {
    id: "22",
    category: "Events",
    question: "Are there events near me?",
    keywords: ["events near me", "local events", "events in"],
  },
  {
    id: "23",
    category: "Events",
    question: "What types of events do you have?",
    keywords: ["event types", "racing events", "meetups"],
  },

  // Vendors
  {
    id: "24",
    category: "Vendors",
    question: "How do I find vendors near me?",
    keywords: ["find vendors", "vendors near me", "vendor map"],
  },
  {
    id: "25",
    category: "Vendors",
    question: "How do I become a vendor?",
    keywords: ["become vendor", "vendor registration", "how to sell"],
  },
  {
    id: "26",
    category: "Vendors",
    question: "Can I see vendor locations on a map?",
    keywords: ["vendor map", "map", "locations"],
  },
  {
    id: "27",
    category: "Vendors",
    question: "How do I contact a vendor?",
    keywords: ["contact vendor", "vendor contact"],
  },

  // Account & Profile
  {
    id: "28",
    category: "Account & Profile",
    question: "How do I create an account?",
    keywords: ["sign up", "create account", "register"],
  },
  {
    id: "29",
    category: "Account & Profile",
    question: "How do I update my profile?",
    keywords: ["update profile", "edit profile", "profile settings"],
  },
  {
    id: "30",
    category: "Account & Profile",
    question: "How do I change my password?",
    keywords: ["change password", "reset password", "forgot password"],
  },
  {
    id: "31",
    category: "Account & Profile",
    question: "How do I add items to my wishlist?",
    keywords: ["wishlist", "save for later", "favorites"],
  },
  {
    id: "32",
    category: "Account & Profile",
    question: "How do I customize my profile?",
    keywords: ["customize profile", "profile picture", "avatar"],
  },

  // Payment & Shipping
  {
    id: "33",
    category: "Payment & Shipping",
    question: "What payment methods do you accept?",
    keywords: ["payment methods", "how to pay", "accepted payments"],
  },
  {
    id: "34",
    category: "Payment & Shipping",
    question: "How long does shipping take?",
    keywords: ["shipping", "delivery time", "when will it arrive"],
  },
  {
    id: "35",
    category: "Payment & Shipping",
    question: "What is your return policy?",
    keywords: ["return policy", "refund policy", "how to return"],
  },
  {
    id: "36",
    category: "Payment & Shipping",
    question: "Is payment secure?",
    keywords: ["security", "safe", "payment security"],
  },
  {
    id: "37",
    category: "Payment & Shipping",
    question: "What if my payment fails?",
    keywords: ["payment failed", "payment error", "transaction failed"],
  },

  // Support & Help
  {
    id: "38",
    category: "Support & Help",
    question: "How do I contact support?",
    keywords: ["contact support", "customer service", "help desk"],
  },
  {
    id: "39",
    category: "Support & Help",
    question: "I'm having trouble logging in",
    keywords: ["can't login", "login problem", "login issue"],
  },
  {
    id: "40",
    category: "Support & Help",
    question: "How do I get help?",
    keywords: ["help", "support", "assistance"],
  },
  {
    id: "41",
    category: "Support & Help",
    question: "Where can I find tutorials?",
    keywords: ["tutorial", "guide", "how to"],
  },

  // Sim Racing
  {
    id: "42",
    category: "General",
    question: "What is sim racing?",
    keywords: ["sim racing", "simulator", "virtual racing"],
  },
  {
    id: "43",
    category: "General",
    question: "How do I join a racing league?",
    keywords: ["racing league", "join league", "sim racing events"],
  },
  {
    id: "44",
    category: "General",
    question: "What sim racing equipment is available?",
    keywords: ["sim racing equipment", "racing gear"],
  },

  // Social Features
  {
    id: "45",
    category: "General",
    question: "How do I use the social features?",
    keywords: ["social", "social wall", "create post", "share"],
  },
  {
    id: "46",
    category: "General",
    question: "How do I follow other users?",
    keywords: ["follow", "social", "users"],
  },
];

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectQuestion: (question: string) => void;
}

export const FAQDialog = ({ open, onOpenChange, onSelectQuestion }: FAQDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredQuestions = FAQ_QUESTIONS.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleQuestionClick = (question: string) => {
    onSelectQuestion(question);
    onOpenChange(false);
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-sm-red" />
            Frequently Asked Questions
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Select a question to ask the AI assistant
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="px-6 pb-4 space-y-3 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Category Filter */}
          <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
            <div className="flex flex-wrap gap-2 min-w-max scrollbar-hide">
              <Button
                variant={selectedCategory === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("All")}
                className="text-xs h-7 px-3"
              >
                All
              </Button>
              {FAQ_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs h-7 px-3 whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List - Scrollable */}
        <div className="flex-1 min-h-0 px-6 py-4 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="space-y-2 pr-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No questions found.</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term or category.</p>
                </div>
              ) : (
                filteredQuestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestionClick(faq.question)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-sm-red transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 group-hover:text-sm-red transition-colors leading-relaxed">
                          {faq.question}
                        </p>
                        <span className="text-xs text-gray-500 mt-2 inline-block">
                          {faq.category}
                        </span>
                      </div>
                      <HelpCircle className="h-4 w-4 text-gray-400 group-hover:text-sm-red transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

