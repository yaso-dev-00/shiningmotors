
import { Menu } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const NavLink = ({ to, children, onClick, className = "" }: NavLinkProps) => {
  return (
    <NextLink
      href={to as any}
      className={`flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {children}
    </NextLink>
  );
};

export const MobileNavigation = ({isSidebarOpen,setIsSidebarOpen}:{isSidebarOpen:boolean,setIsSidebarOpen:any}) => {
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost"
        size="icon" 
        className="rounded-md p-2 mr-3  lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={26} />
      </Button>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent 
          side="left" 
          className="w-max max-w-[280px] backdrop-blur-lg bg-white/80 border-r border-white/10"
        >
          <SheetHeader>
            <SheetTitle className="text-left mt-[10px]">
              <span className="text-sm-red">SHINING</span> MOTORS
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col space-y-1 mt-6">
            {/* <NavLink to="/" onClick={() => setIsSidebarOpen(false)}>Home</NavLink> */}
            <NavLink to="/social" onClick={() => setIsSidebarOpen(false)}>Social</NavLink>
            <NavLink to="/shop" onClick={() => setIsSidebarOpen(false)}>Shop</NavLink>
            <NavLink to="/vehicles" onClick={() => setIsSidebarOpen(false)}>Vehicles</NavLink>
            <NavLink to="/moto-revolution" onClick={() => setIsSidebarOpen(false)}>MotoRevolution</NavLink>
            {/* <NavLink to="/services" onClick={() => setIsSidebarOpen(false)}>Services</NavLink>
            <NavLink to="/events" onClick={() => setIsSidebarOpen(false)}>Events</NavLink>
            <NavLink to="/sim-racing" onClick={() => setIsSidebarOpen(false)}>Sim Racing</NavLink> */}
              <NavLink to="/about" onClick={() => setIsSidebarOpen(false)}>About</NavLink>
              <NavLink to="/shop/cart" onClick={() => setIsSidebarOpen(false)}>Cart</NavLink>
              
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" onClick={() => setIsSidebarOpen(false)}>Profile</NavLink>
                <NavLink to="/settings" onClick={() => setIsSidebarOpen(false)}>Settings</NavLink>
                <NavLink to="/shop/orders" onClick={() => setIsSidebarOpen(false)}>Your Orders</NavLink>
                <button
                  className="flex w-full items-center py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 text-sm-red"
                  onClick={async () => {
                    setIsSidebarOpen(false);
                    await signOut();
                    // Redirect to home page after logout
                    router.push('/');
                    router.refresh();
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink 
                to="/auth" 
                onClick={() => setIsSidebarOpen(false)} 
                className="text-sm-red"
              >
                Login / Register
              </NavLink>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
