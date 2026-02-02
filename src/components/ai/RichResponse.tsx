"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCard {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface ServiceCard {
  id: string;
  title: string;
  price: string;
  location: string;
  image?: string;
}

interface EventCard {
  id: string;
  title: string;
  date: string;
  location: string;
  image?: string;
}

interface RichResponseProps {
  type: "product" | "service" | "event";
  items: ProductCard[] | ServiceCard[] | EventCard[];
  onItemClick?: (id: string) => void;
}

export const RichResponse = ({ type, items, onItemClick }: RichResponseProps) => {
  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    if (onItemClick) {
      onItemClick(id);
    }
  };

  if (type === "product") {
    return (
      <div className="space-y-2 mt-2">
        {(items as ProductCard[]).map((product) => (
          <Card key={product.id} className="p-2">
            <CardContent className="p-0 flex gap-3">
              {product.image && (
                <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                {product.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm">₹{product.price.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClick(product.id)}
                    className="h-7 text-xs"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "service") {
    return (
      <div className="space-y-2 mt-2">
        {(items as ServiceCard[]).map((service) => (
          <Card key={service.id} className="p-2">
            <CardContent className="p-0">
              <h4 className="font-semibold text-sm">{service.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{service.location}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm">{service.price}</span>
                <Link href={`/services/${service.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "event") {
    return (
      <div className="space-y-2 mt-2">
        {(items as EventCard[]).map((event) => (
          <Card key={event.id} className="p-2">
            <CardContent className="p-0">
              <h4 className="font-semibold text-sm">{event.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{event.date}</p>
              <p className="text-xs text-gray-600">{event.location}</p>
              <div className="mt-2">
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return null;
};


