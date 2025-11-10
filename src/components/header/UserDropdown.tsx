
import { Calendar, LogOut, Settings, ShoppingBag, UserCircle, Gamepad, Trophy, Clock, Building, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export const UserDropdown = () => {
  const router = useRouter();
  const { signOut, user, profile } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white z-50">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push((`/profile/${user?.id}`) as any)}>
          <UserCircle className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        
        {/* Vendor Dashboard for verified vendors */}
        {profile?.is_vendor && (
          <DropdownMenuItem onClick={() => router.push("/vendor-dashboard" as any)}>
            <Building className="mr-2 h-4 w-4" /> Vendor Dashboard
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => router.push("/settings" as any)}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push("/wishlist" as any)}>
          <Heart className="mr-2 h-4 w-4 fill-sm-red text-sm-red" /> Wishlist
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push("/shop/orders" as any)}>
          <ShoppingBag className="mr-2 h-4 w-4"></ShoppingBag>
          Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/eventHistory" as any)}>
          <Calendar className="mr-2 h-4 w-4"></Calendar>
          Events
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => router.push("/myServiceBookings" as any)}>
          <Calendar className="mr-2 h-4 w-4"></Calendar>
          Services
        </DropdownMenuItem>
        {/* Sim Racing submenu with history options */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Gamepad className="mr-2 h-4 w-4" />
            Sim Racing
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white z-50">
            <DropdownMenuItem onClick={() => router.push("/sim-racing" as any)}>
              <Gamepad className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sim-racing/my-events" as any)}>
              <Calendar className="mr-2 h-4 w-4" />
              My Events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sim-racing/my-leagues" as any)}>
              <Trophy className="mr-2 h-4 w-4" />
              My Leagues
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sim-racing/history" as any)}>
              <Clock className="mr-2 h-4 w-4" />
              Racing History
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
