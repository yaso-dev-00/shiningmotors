import NextLink from "next/link";
import { Heart, Calendar, Gauge, Fuel, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WishlistButton } from "../ui/WishlistButton";
import Image from "next/image";

interface VehicleCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  seats: number;
  location: string;
  status?:string
  isFeatured?: boolean;
}

const VehicleCard = ({
  id,
  title,
  price,
  image,
  year,
  mileage,
  fuelType,
  transmission,
  seats,
  location,
  status,
  isFeatured = false,
}: VehicleCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted
        ? "Vehicle removed from wishlist"
        : "Vehicle added to wishlist"
    );
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMileage = (miles: number) => {
    return new Intl.NumberFormat("en-IN").format(miles);
  };
const statusColor = status ? (status.toLowerCase() === "available" ? "text-green-600" : status.toLowerCase() === "reserved" ? "text-blue-700" : "text-red-600") : "text-gray-600";
  return (
    <div className="vehicle-card animate-fade-in h-full">
      <div className="relative h-64 overflow-hidden">
        {/* Vehicle image */}
        <NextLink href={`/vehicles/${id}` as any}>
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          />
        </NextLink>

        {/* Featured badge */}
        {isFeatured && (
          <Badge className="absolute left-3 top-3 bg-sm-red px-3 py-1 text-xs font-bold uppercase">
            Featured
          </Badge>
        )}

        {/* Wishlist button */}
        {/* <button
          className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-sm-red hover:text-white"
          onClick={handleWishlist}
        >
          <Heart
            className={isWishlisted ? "fill-sm-red text-sm-red" : ""}
            size={18}
          />
        </button> */}
        <div className="absolute top-2 right-2">
            <WishlistButton 
              itemId={id}
              itemType="vehicle"
              variant="icon"
            
            />
          </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3 rounded-md bg-sm-black px-3 py-1 text-white">
          <span className="text-lg font-bold">{formatPrice(price)}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Vehicle title */}
        <NextLink href={`/vehicles/${id}` as any}>
          <h3 className="mb-2 text-xl font-bold hover:text-sm-red">
            {title}
          </h3>
        </NextLink>

        {/* Location */}
        {status && <p className={`mb-3 text-sm ${statusColor}`}>{status}</p>}

        {/* Vehicle specs */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar size={16} className="mr-1" />
            <span>{year}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Gauge size={16} className="mr-1" />
            <span>{formatMileage(mileage)} mi</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Fuel size={16} className="mr-1" />
            <span>{fuelType}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Users size={16} className="mr-1" />
            <span>{seats} seats</span>
          </div>
        </div>

        {/* CTA button */}
        <NextLink href={`/vehicles/${id}` as any}>
          <Button className="w-full bg-sm-red hover:bg-sm-red-light">
            View Details
          </Button>
        </NextLink>
      </div>
    </div>
      );
};

export default VehicleCard;
