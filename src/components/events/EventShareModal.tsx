
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Event } from "@/integrations/supabase/modules/events";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link as LinkIcon,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharePlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: (url: string, title: string) => string;
}

interface EventShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

export const EventShareModal: React.FC<EventShareModalProps> = ({ 
  isOpen, 
  onClose,
  event
}) => {
  const { toast } = useToast();
  const eventUrl = `${window.location.origin}/events/${event.id}`;
  
  const sharePlatforms: SharePlatform[] = [
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "bg-[#3b5998] hover:bg-[#324b81]",
      shareUrl: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      color: "bg-[#1DA1F2] hover:bg-[#0d95e8]",
      shareUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "bg-[#0077b5] hover:bg-[#00669c]",
      shareUrl: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
    {
      name: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-[#25D366] hover:bg-[#20bd5a]",
      shareUrl: (url, title) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
    },
    {
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      color: "bg-gray-600 hover:bg-gray-700",
      shareUrl: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this event: ${url}`)}`,
    },
  ];

  const handleShare = (platform: SharePlatform) => {
    const shareUrl = platform.shareUrl(eventUrl, `Event: ${event.title}`);
    window.open(shareUrl, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this link with anyone.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md py-2 px-3">
        <DialogHeader>
          <DialogTitle className="text-center">Share This Event</DialogTitle>
          <DialogDescription className="text-center">
            Share "{event.title}" with your friends and colleagues
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 py-4">
          {sharePlatforms.map(platform => (
            <Button
              key={platform.name}
              onClick={() => handleShare(platform)}
              className={`flex flex-col items-center justify-center h-20 text-xs text-white ${platform.color}`}
            >
              {platform.icon}
              <span className="mt-1">{platform.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <input
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={eventUrl}
              readOnly
            />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
            <span className="sr-only">Copy</span>
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
