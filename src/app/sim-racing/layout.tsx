"use client";

import { RouteRemember } from "@/components/RouteRemember";

export default function SimRacingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteRemember />
      {children}
    </>
  );
}


