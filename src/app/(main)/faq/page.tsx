"use client";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAllRules } from "@/lib/ai/rule-engine";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const rules = getAllRules();

  // Filter rules based on search
  const filteredRules = rules.filter((rule) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const responseText = typeof rule.response === "string" ? rule.response : "";
    return (
      responseText.toLowerCase().includes(searchLower) ||
      rule.patterns.some((pattern) => pattern.toString().toLowerCase().includes(searchLower))
    );
  });

  // Group rules by category
  const accountRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /account|login|signup|password|register|forgot/i.test(p.toString()))
  );
  const shoppingRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /cart|order|checkout|payment|shipping|return|refund|wishlist/i.test(p.toString()))
  );
  const serviceRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /service|book|appointment|mechanic/i.test(p.toString()))
  );
  const eventRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /event|register|attend|race/i.test(p.toString()))
  );
  const productRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /product|search|find|buy/i.test(p.toString()))
  );
  const featureRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /feature|social|vendor|map|sim\s+racing|vehicle/i.test(p.toString()))
  );
  const supportRules = filteredRules.filter((r) =>
    r.patterns.some((p) => /support|contact|help|troubleshoot/i.test(p.toString()))
  );
  const generalRules = filteredRules.filter((r) => {
    const allOther = [...accountRules, ...shoppingRules, ...serviceRules, ...eventRules, ...productRules, ...featureRules, ...supportRules];
    return !allOther.includes(r);
  });

  const categorizedRules: Record<string, typeof filteredRules> = {
    "Account & Access": accountRules,
    "Shopping & Orders": shoppingRules,
    "Services & Bookings": serviceRules,
    "Events": eventRules,
    "Products": productRules,
    "Platform Features": featureRules,
    "Support & Help": supportRules,
    "General": generalRules,
  };

  const getQuestionFromPattern = (pattern: RegExp): string => {
    const patternStr = pattern.toString().replace(/[\/\^$]/g, "").replace(/i$/, "");
    // Convert regex pattern to readable question
    if (patternStr.includes("return")) return "How do I return an item?";
    if (patternStr.includes("refund")) return "What is the refund policy?";
    if (patternStr.includes("contact")) return "How do I contact support?";
    if (patternStr.includes("shipping")) return "What are the shipping options?";
    if (patternStr.includes("track")) return "How do I track my order?";
    if (patternStr.includes("payment")) return "What payment methods are accepted?";
    if (patternStr.includes("signup")) return "How do I create an account?";
    if (patternStr.includes("login")) return "How do I login?";
    if (patternStr.includes("wishlist")) return "How do I use the wishlist?";
    if (patternStr.includes("service")) return "How do I book a service?";
    if (patternStr.includes("event")) return "How do I register for events?";
    if (patternStr.includes("vendor")) return "How do I find vendors?";
    if (patternStr.includes("social")) return "What is the social wall?";
    if (patternStr.includes("sim")) return "What is sim racing?";
    return patternStr.replace(/\|/g, " or ").replace(/\\s\+/g, " ");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600">
            Find quick answers to common questions about Shining Motors
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        {Object.entries(categorizedRules).map(([category, categoryRules]) => {
          if (categoryRules.length === 0) return null;

          return (
            <Card key={category} className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categoryRules.map((rule, index) => {
                    const questions = rule.patterns.map(getQuestionFromPattern);
                    const response = typeof rule.response === "string" ? rule.response : "Click to see response";

                    return (
                      <AccordionItem key={index} value={`item-${category}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {questions[0] || "Question"}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <p className="text-gray-700">{response}</p>
                            {questions.length > 1 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-gray-500 mb-2">Related questions:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {questions.slice(1).map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}

        {/* No results */}
        {searchQuery && filteredRules.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No FAQs found matching "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-2">
                Try asking the AI assistant for help!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
            <p className="text-gray-700 mb-4">
              Can't find what you're looking for? Our AI assistant is here to help!
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Click the AI assistant button (bottom right) to chat</li>
              <li>• Ask any question in natural language</li>
              <li>• Get instant, personalized answers</li>
              <li>• Contact support: support@shiningmotors.com</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

