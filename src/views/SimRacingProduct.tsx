"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Package,
  ArrowLeft,
  Tag,
  CheckCircle,
  Clock,
  Truck
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";

const SimRacingProduct = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
const {addToCart}=useCart()
  const { data: product, isLoading } = useQuery({
    queryKey: ["simProduct", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await simAppApi.products.getProductDetails(id);
      if (error) {
        console.error("Error fetching product:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product details",
        });
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    if (product && product.image_url && product.image_url.length > 0) {
      setSelectedImage(product.image_url[0]);
    }
  }, [product]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async() => {
    if (!product) return;
     
    // Fix: Pass a proper product object with all required properties
    await addToCart({
      id:product.id,
      name:product.name,
      price:product.price,
      images:product.image_url || undefined,
    }, quantity);
    

    toast({
      title: "Added to cart",
      description: `${product.name} (${quantity}) added to your cart`,
    });
  };

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto">
        <NextLink href="/sim-racing" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Sim Racing
        </NextLink>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full mt-6" />
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="border rounded-lg overflow-hidden bg-white">
                <AspectRatio ratio={1 / 1}>
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </AspectRatio>
              </div>

              {product.image_url && product.image_url.length > 1 && (
                <Carousel className="w-full">
                  <CarouselContent>
                    {product.image_url.map((image, index) => (
                      <CarouselItem key={index} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                        <div className="p-1">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className={`border-2 rounded-md overflow-hidden w-full aspect-square ${
                              selectedImage === image ? "border-blue-500" : "border-transparent"
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                {product.category && (
                  <Badge variant="outline" className="mb-2">
                    {product.category}
                  </Badge>
                )}
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.brand && (
                  <div className="flex items-center mt-2 text-gray-600">
                    <Tag size={16} className="mr-1.5" />
                    <span>{product.brand}</span>
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>

              <div className="space-y-4">
                {product.description && <p className="text-gray-700">{product.description}</p>}

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle size={16} className="mr-2 text-green-500" />
                    <span>{(product.stock ?? 0) > 0 ? "In stock" : "Out of stock"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="mr-2 text-blue-500" />
                    <span>Ships in 2-3 business days</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Truck size={16} className="mr-2 text-blue-500" />
                    <span>Free shipping on orders over $100</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-medium">Quantity</span>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock ?? 0, quantity + 1))}
                      disabled={quantity >= (product.stock ?? 0)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={(product.stock ?? 0) <= 0}
                    size="lg"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <Package size={18} />
                    Request Quote
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="mb-6 text-gray-600">The product you're looking for might have been removed or doesn't exist.</p>
            <NextLink href="/sim-racing">
              <Button>Back to Sim Racing</Button>
            </NextLink>
          </div>
        )}

        {/* Product Details Tabs */}
        {!isLoading && product && (
          <div className="mt-16">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="py-6">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-bold mb-4">Product Details</h3>
                  {product.description ? (
                    <p className="mb-4">{product.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No detailed description available for this product.</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="py-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-500">Brand</div>
                        <div>{product.brand || "N/A"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-500">Category</div>
                        <div>{product.category || "N/A"}</div>
                      </div>
                      {product.features && typeof product.features === 'object' && (
                        Object.entries(product.features as Record<string, unknown>).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="font-medium text-sm text-gray-500">{key}</div>
                            <div>{String(value)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="compatibility" className="py-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 italic">Compatibility information is not available for this product.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SimRacingProduct;
