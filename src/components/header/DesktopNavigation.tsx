
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useNotifications } from "@/components/notifications/NotificationProvider";

export const DesktopNavigation = () => {
  const isMobile = useIsMobile();
  const pathname = usePathname() ?? "/";
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  if (isMobile) return null;
  
  const isActive = pathname;
  const isSimRacingActive = isActive.startsWith('/sim-racing');
  
  return (
    <div className="hidden items-center space-x-4 min-[768px]:flex">
      <NextLink href="/" className={`nav-link ${isActive === '/' ? 'text-sm-red' : ''} hover:text-sm-red`}>
        Home
      </NextLink>
      {/* <Link to="/social" className="nav-link">
        Social
      </Link>
      <Link to="/shop" className="nav-link">
        Shop
      </Link>
      <Link to="/vehicles" className="nav-link">
        Vehicles
      </Link> */}
      <NextLink href="/events" className={`nav-link ${isActive === '/events' ? 'text-sm-red' : ''} hover:text-sm-red`}>
        MotorSports & Events
      </NextLink>
      <NextLink href="/sim-racing" className={`nav-link ${isSimRacingActive ? 'text-sm-red' : ''} hover:text-sm-red`}>
        SR
      </NextLink>
      <NextLink href="/vendors/map" className={`nav-link ${isActive === '/vendors/map' ? 'text-sm-red' : ''} hover:text-sm-red`}>
        Find Vendors
      </NextLink>
      <NextLink href="/about" className={`nav-link ${isActive === '/about' ? 'text-sm-red' : ''} hover:text-sm-red`}>
        About
      </NextLink>
      {/* <Link to="/services" className={`nav-link ${isActive === '/services' ? 'text-sm-600' : ''} hover:text-red-600`}>
        Services
      </Link> */}
      {/* <Link to="/moto-revolution" className={`nav-link ${isActive === '/moto-revolution' ? 'text-red-600' : ''} hover:text-red-600`}>
          <span className="text-nowrap"> Moto Revolution</span>
      </Link> */}
      {/* <NotificationsDropdown
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      /> */}
    </div>
  );
};
