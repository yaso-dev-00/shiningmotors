import { useState } from "react";
import { Plus, Image } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateStoryModal from "./CreateStoryModal";

interface CreateStoryProps {
  userAvatar?: string;
}

const CreateStory = ({ userAvatar }: CreateStoryProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="flex flex-col items-center gap-1 cursor-pointer w-20"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Only show the 'Your Story' text, remove the avatar and plus icon */}
        <span className="text-xs text-muted-foreground mt-12">Your Story</span>
      </div>

      <CreateStoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CreateStory;
