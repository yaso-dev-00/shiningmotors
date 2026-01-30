"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Car } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sm-red/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sm-red/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo Section */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="group">
              <div className="relative w-48 h-20 md:w-64 md:h-24 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/shiningMotors.jpg"
                  alt="Shining Motors Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* 404 Number with Animation */}
          <div className="mb-6">
            <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-sm-red via-red-700 to-sm-red animate-pulse">
              404
            </h1>
          </div>

          {/* Main Message */}
          <div className="mb-8 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto">
              Oops! The page you're looking for seems to have taken a wrong turn. 
              Let's get you back on track.
            </p>
          </div>

          {/* Icon Illustration */}
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-sm-red/10 to-sm-red/5 flex items-center justify-center">
                <Car className="w-16 h-16 md:w-20 md:h-20 text-sm-red animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-sm-red rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="bg-sm-red hover:bg-sm-red-light text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="mr-2 h-5 w-5" />
              Go to Homepage
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-sm-red hover:text-sm-red px-8 py-6 text-lg font-semibold transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="text-sm-red hover:text-sm-red-light hover:underline transition-colors"
              >
                Shop
              </Link>
              <Link
                href="/events"
                className="text-sm-red hover:text-sm-red-light hover:underline transition-colors"
              >
                Events
              </Link>
              <Link
                href="/sim-racing"
                className="text-sm-red hover:text-sm-red-light hover:underline transition-colors"
              >
                Sim Racing
              </Link>
              <Link
                href="/social"
                className="text-sm-red hover:text-sm-red-light hover:underline transition-colors"
              >
                Social
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
