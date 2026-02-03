"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import NextLink from "next/link";

export default function FeatureComparisonTable() {
  const { user } = useSafeAuth();

  // Only show for unauthenticated users
  if (user) {
    return null;
  }

  const { data: statsData } = useQuery({
    queryKey: ["comparison-stats"],
    queryFn: async () => {
      const [statsRes, wishlistRes] = await Promise.all([
        fetch("/api/home/stats"),
        fetch("/api/home/stats"), // We'll need to add wishlist count to stats
      ]);
      const stats = statsRes.ok ? (await statsRes.json()).data : {};
      return stats;
    },
    staleTime: 10 * 60 * 1000,
  });

  const features = [
    {
      feature: "Browse products",
      guest: true,
      member: true,
      memberExtra: `${statsData?.memberCount || 0} get personalized`,
    },
    {
      feature: "Save favorites",
      guest: false,
      member: true,
      memberExtra: "Unlimited saves",
    },
    {
      feature: "Join events",
      guest: false,
      member: true,
      memberExtra: "Full access",
    },
    {
      feature: "AI Assistant",
      guest: "Limited",
      member: "Full",
      memberExtra: "Advanced features",
    },
  ];

  return (
    <section className="py-6">
      <div className="mx-auto px-4 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Guest vs Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Feature</th>
                    <th className="text-center p-4">Guest</th>
                    <th className="text-center p-4">Member</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4 font-medium">{feature.feature}</td>
                      <td className="p-4 text-center">
                        {typeof feature.guest === "boolean" ? (
                          feature.guest ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.guest}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {typeof feature.member === "boolean" ? (
                            feature.member ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )
                          ) : (
                            <span className="text-sm font-semibold">{feature.member}</span>
                          )}
                          {feature.memberExtra && (
                            <span className="text-xs text-gray-500">
                              {feature.memberExtra}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center">
              <Button asChild size="lg" className="bg-sm-red hover:bg-sm-red-light">
                <NextLink href="/auth">Upgrade to Member</NextLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

