// Rule-based response engine for common FAQs
// Avoids AI API calls for simple, predictable queries

interface Rule {
  patterns: RegExp[];
  response: string | ((match: RegExpMatchArray) => string);
  priority: number; // Higher priority = checked first
  requiresAuth?: boolean;
}

const RULES: Rule[] = [
  // Return policy
  {
    patterns: [
      /return\s+policy/i,
      /refund\s+policy/i,
      /how\s+to\s+return/i,
      /can\s+i\s+return/i,
    ],
    response:
      "Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. For more details, visit your order history or contact support.",
    priority: 10,
  },
  
  // Contact support
  {
    patterns: [
      /contact\s+support/i,
      /customer\s+service/i,
      /help\s+desk/i,
      /support\s+email/i,
      /how\s+to\s+contact/i,
    ],
    response:
      "You can contact our support team via email at support@shiningmotors.com or through the messaging system. We typically respond within 24 hours.",
    priority: 10,
  },
  
  // Shipping/Delivery
  {
    patterns: [
      /shipping/i,
      /delivery\s+time/i,
      /how\s+long\s+to\s+ship/i,
      /when\s+will\s+it\s+arrive/i,
    ],
    response:
      "Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available at checkout. You'll receive tracking information once your order ships.",
    priority: 9,
  },
  
  // Order tracking
  {
    patterns: [
      /track\s+order/i,
      /order\s+status/i,
      /where\s+is\s+my\s+order/i,
      /order\s+tracking/i,
    ],
    response:
      "You can track your order in the 'Orders' section of your profile. Click on any order to see detailed status and tracking information.",
    priority: 9,
  },
  
  // Payment methods
  {
    patterns: [
      /payment\s+methods/i,
      /how\s+to\s+pay/i,
      /accepted\s+payments/i,
      /what\s+payment/i,
    ],
    response:
      "We accept all major credit cards, debit cards, UPI, and digital wallets. Payment is processed securely at checkout.",
    priority: 8,
  },
  
  // Account/Profile
  {
    patterns: [
      /change\s+password/i,
      /update\s+profile/i,
      /edit\s+account/i,
      /account\s+settings/i,
    ],
    response:
      "You can update your profile and account settings by going to your profile page and clicking the 'Settings' button.",
    priority: 8,
  },
  
  // Services
  {
    patterns: [
      /what\s+services/i,
      /available\s+services/i,
      /service\s+types/i,
      /book\s+service/i,
    ],
    response:
      "We offer various automotive services including car wash, AC service, general maintenance, and more. Browse the Services section to see all available services and book an appointment.",
    priority: 7,
  },
  
  // Events
  {
    patterns: [
      /upcoming\s+events/i,
      /what\s+events/i,
      /event\s+calendar/i,
      /when\s+is\s+the\s+next/i,
    ],
    response:
      "Check out our Events page to see all upcoming automotive events, races, and meetups. You can filter by category and location.",
    priority: 7,
  },
  
  // Products
  {
    patterns: [
      /what\s+products/i,
      /available\s+products/i,
      /product\s+categories/i,
    ],
    response:
      "We have a wide range of automotive products including OEM parts, accessories, tools, and more. Browse the Shop section to explore our catalog.",
    priority: 6,
  },
  
  // Vendor registration
  {
    patterns: [
      /become\s+a\s+vendor/i,
      /vendor\s+registration/i,
      /how\s+to\s+sell/i,
      /register\s+as\s+vendor/i,
    ],
    response:
      "To become a vendor, please visit the vendor registration page or contact our vendor support team. We'll guide you through the registration process.",
    priority: 6,
  },
  
  // Sim Racing
  {
    patterns: [
      /sim\s+racing/i,
      /simulator/i,
      /racing\s+leagues/i,
      /sim\s+events/i,
    ],
    response:
      "Explore our Sim Racing section for virtual racing events, leagues, garages, and equipment. Join competitions and connect with other racing enthusiasts!",
    priority: 5,
  },
  
  // General greeting
  {
    patterns: [/^hi$|^hello$|^hey$/i],
    response:
      "Hello! I'm your Shining Motors AI assistant. How can I help you today? I can help you find products, answer questions about services, or assist with orders.",
    priority: 4,
  },
  
  // Thank you
  {
    patterns: [/thank\s+you|thanks|appreciate/i],
    response: "You're welcome! Is there anything else I can help you with?",
    priority: 3,
  },
  
  // Goodbye
  {
    patterns: [/bye|goodbye|see\s+you|farewell/i],
    response:
      "Goodbye! Feel free to come back anytime if you need assistance. Have a great day!",
    priority: 2,
  },
];

/**
 * Check if a query matches any rule and return the response
 * @returns Response string if matched, null otherwise
 */
export function getRuleBasedResponse(query: string): string | null {
  // Sort rules by priority (highest first)
  const sortedRules = [...RULES].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    for (const pattern of rule.patterns) {
      const match = query.match(pattern);
      if (match) {
        if (typeof rule.response === "function") {
          return rule.response(match);
        }
        return rule.response;
      }
    }
  }
  
  return null;
}

/**
 * Check if a query is likely to match a rule (for early exit)
 */
export function isLikelyRuleBased(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  
  // Very short queries are likely rule-based
  if (lowerQuery.length < 20) {
    return true;
  }
  
  // Check for common FAQ keywords
  const faqKeywords = [
    "policy",
    "return",
    "refund",
    "contact",
    "support",
    "shipping",
    "delivery",
    "payment",
    "account",
    "profile",
    "password",
    "hi",
    "hello",
    "thanks",
    "bye",
  ];
  
  return faqKeywords.some((keyword) => lowerQuery.includes(keyword));
}

/**
 * Get all available rule patterns (for debugging/admin)
 */
export function getAllRules(): Rule[] {
  return [...RULES];
}


