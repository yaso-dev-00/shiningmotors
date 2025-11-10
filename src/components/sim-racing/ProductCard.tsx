
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { Badge } from '@/components/ui/badge';
import { SimProduct } from '@/integrations/supabase/modules/simAppPage';

interface ProductCardProps {
  product: SimProduct;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full transition-all hover:shadow-lg overflow-hidden">
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          {product.image_url && product.image_url[0] ? (
            <img 
              src={product.image_url[0]} 
              alt={product.name} 
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          {product.category && (
            <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200 font-medium mb-1">
              {product.category}
            </Badge>
          )}
          <CardTitle className="text-lg truncate">{product.name}</CardTitle>
          {product.brand && (
            <div className="flex items-center text-sm text-gray-600">
              <Tag size={14} className="mr-1 text-gray-500" />
              {product.brand}
            </div>
          )}
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="mt-1 font-semibold text-lg">${product.price.toFixed(2)}</div>
          <div className="mt-2 text-sm text-gray-600">
            {(product.stock ?? 0) > 0 ? (
              <span className="text-green-600">In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <NextLink href={`/sim-racing/products/${product.id}`} className="w-full">
            <Button className="w-full flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              View Product
            </Button>
          </NextLink>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
