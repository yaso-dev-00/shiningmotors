"use client";
import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShoppingBag,
  Car,
  Users,
  BarChart,
  Wrench,
  CalendarDays,
  Trophy,
  Activity,
  Gamepad,
  Package2,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  backLink?: string;
}

const AdminLayout = ({ children, title, backLink }: AdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname ?? "/";

  const handleBack = () => {
    if (backLink == "/adminVendor") {
      router.push("/admin");
    } else if (backLink == "/admin/vendor-activities") {
      router.push("/admin/vendor-activities");
    } else if(backLink && backLink.includes("/vendor/")) {
      router.push(backLink as any);
    } else {
      router.back();
    }
  };

  // Navigation menu items with icons and links
  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: <BarChart className="mr-2 h-4 w-4" />,
    },
    {
      path: "/admin/products",
      label: "Products",
      icon: <ShoppingBag className="mr-2 h-4 w-4" />,
    },
    {
      path: "/admin/vehicles",
      label: "Vehicles",
      icon: <Car className="mr-2 h-4 w-4" />,
    },
    {
      path: "/admin/services",
      label: "Services",
      icon: <Wrench className="h-4 w-4 mr-2" />,
    },
    {
      path: "/admin/events",
      label: "Events",
      icon: <CalendarDays className="h-4 w-4 mr-2" />,
    },
    {
      path: "/admin/sim-events",
      label: "Sim Events",
      icon: <Gamepad className="h-4 w-4 mr-2" />,
    },
    {
      path: "/admin/sim-leagues",
      label: "Sim Leagues",
      icon: <Trophy className="h-4 w-4 mr-2" />,
    },
    {
      path: "/admin/sim-garages",
      label: "Sim Garages",
      icon: <Wrench className="h-4 w-4 mr-2" />,
    },
    {
      path: "/admin/sim-products",
      label: "Sim Products",
      icon: <Package2 className="h-4 w-4 mr-2" />,
    },
    // { path: "/admin/users", label: "Users", icon: <Users className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col space-y-3 md:space-y-6">
          {/* Top bar with back button and title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentPath !== "/admin" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleBack}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>
          </div>

          {/* Admin navigation */}
          {typeof window !== 'undefined' && !window.location.pathname.includes("vendor") && (
            <div className="overflow-x-auto">
              <div className="flex flex-wrap gap-2 py-2">
                {navItems.map((item) => (
                  <NextLink href={item.path as any} key={item.path}>
                    <Button
                      variant={currentPath == item.path ? "default" : "outline"}
                      className="flex items-center whitespace-nowrap"
                      size="sm"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  </NextLink>
                ))}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="mt-4">{children}</div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
