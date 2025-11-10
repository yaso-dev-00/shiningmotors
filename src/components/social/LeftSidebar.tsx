import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LeftSidebarProps {
  onCreatePost: () => void;
}

const LeftSidebar = ({ onCreatePost }: LeftSidebarProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="sticky top-20 hidden h-fit space-y-6 lg:block">
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Welcome to Social</h2>
        <p className="text-sm text-gray-500">
          Connect with fellow automotive enthusiasts, share your passion, and
          discover amazing content.
        </p>
        {isAuthenticated ? (
          <Button
            onClick={onCreatePost}
            className="mt-4 w-full bg-sm-red hover:bg-sm-red-light"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        ) : (
          <Button
            onClick={() => (window.location.href = "/auth")}
            className="mt-4 w-full bg-sm-red hover:bg-sm-red-light"
          >
            Login to Post
          </Button>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Top Hashtags</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            #CarMeets
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            #NewRides
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            #Restoration
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            #Supercars
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            #ClassicCars
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
