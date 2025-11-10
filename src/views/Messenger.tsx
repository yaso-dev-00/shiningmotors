"use client";
import React from "react";
import MessengerUI from "@/components/messenger/MessengerUI";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams } from "next/navigation";

const Messenger = () => {
  const isMobile = useIsMobile();
  const { userId } = useParams<{ userId?: string }>();

  return (
    <div className="w-full h-screen min-h-screen flex bg-white dark:bg-gray-900">
      {/* <h1 className="text-2xl font-bold text-gray-800 mb-4">Messages</h1> */}
      <MessengerUI initialUserId={userId} />
    </div>
  );
};

export default Messenger;
