"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, MoreVertical, ShoppingCart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { shopApi } from "@/integrations/supabase/modules/shop";
import { useCart } from "@/contexts/CartContext";
import { toast as toaster } from "sonner";
const ProductDetail = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  console.log(id)
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter()
  const { addToCart } = useCart();
  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line

  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: product, error } = await shopApi.products.getById(id);
console.log(product)
      if (error) throw error;
      if (!product) throw new Error('Product not found');

      setProduct(product);
      setSelectedImage(product.images && product.images.length > 0 ? product.images[0] : null);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20 text-lg text-gray-600">Loading...</div>;
  }

  if (!product) {
    return <div className="flex justify-center items-center py-20 text-lg text-gray-600">Product not found</div>;
  }

  // Generate extra info (badges, price style, etc.)
  const isOnSale = product.status === 'on_sale';
  const isNew = product.status === 'new_arrival';
  const isUpcoming = product.status === 'upcoming';

  const handleAddToCart = async () => {
    // Fix: Pass a proper product object with all required properties
    await addToCart({
      id,
      name:product.name,
      price:product.price,
      images:product.images,
    }, 1);
    
    toaster.success("Product added to cart!");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-2">
        <Button
          variant="ghost"
          className="mb-4 flex items-center p-[0px]"
           onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </Button>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <AspectRatio ratio={16 / 9} className="overflow-hidden bg-gray-100 rounded-lg">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600">No Image</div>
              )}
            </AspectRatio>
            {product.images && product.images.length > 1 && (
              <div className="mt-4 h-24 flex w-full overflow-scroll scrollbar-hide">
              
                  {product.images.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded border-2  flex-shrink-0 basis-1/4 cursor-pointer h-24 transition-transform duration-200 ${img === selectedImage ? 'border-sm-red scale-110' : 'border-transparent'}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={product.name} className="h-full w-full object-cover rounded" />
                    </div>
                  ))}
               
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="capitalize">{product.category}</Badge>
              {isOnSale && <Badge className="bg-sm-red">On Sale</Badge>}
              {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
              {isNew && <Badge className="bg-blue-500">New</Badge>}
              {product.inventory > 0 ? (
                <Badge variant="secondary">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-semibold text-gray-800">{new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(product.price.toFixed(2))}</span>
              {product.original_price && (
                <span className="text-md line-through text-gray-500">${product.original_price.toFixed(2)}</span>
              )}
            </div>
            <p className="text-gray-600">{product.description}</p>
            <div className="flex gap-2 items-center mt-4">
              <Button  onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96">
                  <SheetHeader>
                    <SheetTitle>Additional Details</SheetTitle>
                    <SheetDescription>
                      <div className="space-y-3 mt-2 text-xs">
                        <p><span className="font-semibold">Product ID:</span> {product.id}</p>
                        <p><span className="font-semibold">Category:</span> {product.category}</p>
                        <p><span className="font-semibold">Inventory:</span> {product.inventory}</p>
                        <p><span className="font-semibold">Created:</span> {product.created_at}</p>
                        <p><span className="font-semibold">Updated:</span> {product.updated_at}</p>
                        <p><span className="font-semibold">Status:</span> {product.status || "N/A"}</p>
                        <p><span className="font-semibold">Seller:</span> {product.seller_id || "N/A"}</p>
                      </div>
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
