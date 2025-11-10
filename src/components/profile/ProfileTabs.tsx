
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { UserCircle, Heart, Bookmark, Clock, Ticket } from "lucide-react";
import { EventRegistrationsHistory } from "@/components/profile/EventRegistrationsHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserEventRegistrations } from "@/integrations/supabase/modules/eventAppPage";

interface ProfileTabsProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ userId, isOwnProfile }) => {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="posts" className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          Posts
        </TabsTrigger>
        {isOwnProfile && (
          <>
            <TabsTrigger value="liked" className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Liked
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center">
              <Ticket className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
          </>
        )}
        <TabsTrigger value="about" className="flex items-center">
          <UserCircle className="mr-2 h-4 w-4" />
          About
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {/* PostFeed is missing, so commenting out for now */}
        {/* <PostFeed userId={userId} /> */}
        <Card className="p-6">
          <p className="text-gray-600">User's posts will appear here.</p>
        </Card>
      </TabsContent>

      {isOwnProfile && (
        <>
          <TabsContent value="liked">
            <Card className="p-6">
              <p className="text-gray-600">Liked posts will appear here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card className="p-6">
              <p className="text-gray-600">Saved posts will appear here.</p>
            </Card>
          </TabsContent>
          
         
        </>
      )}

      <TabsContent value="about">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">About</h3>
          <p className="text-gray-600">
            This user hasn't added any additional information yet.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
