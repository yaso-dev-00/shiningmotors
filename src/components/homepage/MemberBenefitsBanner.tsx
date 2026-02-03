"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

export default function MemberBenefitsBanner() {
  const { user } = useSafeAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ["member-count"],
    queryFn: async () => {
      const response = await fetch("/api/home/stats");
      if (!response.ok) return { memberCount: 0 };
      const result = await response.json();
      return result.data || { memberCount: 0 };
    },
    staleTime: 10 * 60 * 1000,
  });

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = localStorage.getItem("member-benefits-dismissed");
      if (wasDismissed === "true") {
        setDismissed(true);
      }
    }
  }, []);

  // Only show for unauthenticated users
  if (user || dismissed) {
    return null;
  }

  const memberCount = data?.memberCount || 0;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("member-benefits-dismissed", "true");
    }
  };

  const benefits = [
    "Get personalized recommendations",
    "Save your browsing history",
    "Access exclusive deals",
    "Join events & competitions",
  ];

  return (
    <section className="py-6">
      <div className="mx-auto px-4 sm:px-8">
        <Card className="bg-gradient-to-r from-sm-red/10 to-sm-red/5 border-2 border-sm-red/30 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  Join {memberCount.toLocaleString()}+ members
                </h2>
                <ul className="space-y-2 mb-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-sm-red flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-sm-red hover:bg-sm-red-light"
                >
                  <NextLink href="/auth">Sign Up Free</NextLink>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <NextLink href="/auth">Already a member? Sign In</NextLink>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

