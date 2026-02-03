"use client";

import { useSafeAuth } from "@/hooks/use-safe-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import NextLink from "next/link";

export default function LimitedOfferBanner() {
  const { user } = useSafeAuth();

  // Only show for unauthenticated users
  if (user) {
    return null;
  }

  // For now, show a generic offer banner
  // In the future, this can check for active promotions from the database
  const offerText = "Sign up today for exclusive deals!";

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto px-4 sm:px-8">
        <Card className="bg-gradient-to-r from-sm-red to-sm-red/80 text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Timer className="h-6 w-6" />
                <div>
                  <h3 className="text-xl font-bold">{offerText}</h3>
                  <p className="text-sm opacity-90">Limited time offer - Join now!</p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-sm-red hover:bg-gray-100"
              >
                <NextLink href="/auth">Claim Offer</NextLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

