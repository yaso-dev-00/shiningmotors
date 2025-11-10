
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const NotificationsDropdown = () => {
  const [notificationCount, setNotificationCount] = useState(3);
  const { toast } = useToast();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative p-[10px] hidden min-[370px]:block">
          <Bell size={22} />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-sm-red text-white text-xs">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setNotificationCount(0);
              toast({
                title: "Success",
                description: "All notifications marked as read",
              });
            }}
            className="text-xs text-sm-red hover:text-sm-red-light"
          >
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {[
          { id: 1, text: "Your order has been shipped!", time: "5 minutes ago" },
          { id: 2, text: "John commented on your post", time: "2 hours ago" },
          { id: 3, text: "New products available in shop", time: "1 day ago" },
        ].map((notification) => (
          <DropdownMenuItem 
            key={notification.id} 
            className="flex flex-col items-start py-2 cursor-pointer"
            onClick={() => {
              if (notificationCount > 0) {
                setNotificationCount(prev => prev - 1);
              }
              toast({
                title: "Notification",
                description: `Opened notification ${notification.id}`,
              });
            }}
          >
            <span>{notification.text}</span>
            <span className="text-xs text-gray-500">{notification.time}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="/notifications" className="w-full text-center text-sm-red">
            View all notifications
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
