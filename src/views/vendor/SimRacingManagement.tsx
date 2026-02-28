"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad, Plus, Edit, Trash2, XCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type SimProduct } from '@/integrations/supabase/modules/simRacing';
import Back from './Back';

const SimRacingManagement = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<SimProduct[]>([]);
  const [productStatus, setProductStatus] = useState<"active" | "disabled" | "all">("active");
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const initialFetchDone = React.useRef(false);

  const fetchSimProducts = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/sim-products?status=${productStatus}&_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setProducts([]); return; }
        throw new Error(body?.error || "Failed to fetch sim products");
      }
      const body = await res.json();
      setProducts((body?.data || []) as SimProduct[]);
    } catch (error) {
      console.error('Error fetching sim products:', error);
      toast({ title: "Error", description: "Failed to load sim racing products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, productStatus, session?.access_token, toast]);

  useEffect(() => { 
    if (user && !initialFetchDone.current) {
      fetchSimProducts();
      initialFetchDone.current = true;
    }
  }, [user, fetchSimProducts]);

  useEffect(() => { 
    if (user && initialFetchDone.current) {
      fetchSimProducts(); 
    }
  }, [productStatus]);
  useEffect(() => {
    if (!pathname?.includes("/vendor/simracing-management")) return;
    fetchSimProducts();
  }, [pathname, fetchSimProducts]);
  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchSimProducts();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchSimProducts]);

  const handleToggleStatus = async (productId: string, isDisabled: boolean) => {
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/sim-products/${productId}/toggle-status`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ is_disabled: isDisabled }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Failed to update product status");

      toast({
        title: "Success",
        description: body.message || (isDisabled ? "Product disabled successfully" : "Product enabled successfully"),
      });

      fetchSimProducts();
    } catch (error: unknown) {
      console.error("Error toggling product status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/sim-products/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.canDisable) {
          toast({
            title: "Cannot Delete",
            description: body.error,
            action: (
              <Button onClick={() => handleToggleStatus(id, true)} size="sm">
                Disable Instead
              </Button>
            ),
          });
          return;
        }
        throw new Error(body?.error ?? "Failed to delete product");
      }
      setProducts(products.filter(product => product.id !== id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Back />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">SimRacing Management</h1>
              <p className="text-gray-600 mt-2">Manage your sim racing equipment and events</p>
            </div>
            <NextLink href={"/vendor/simracing/product/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs 
          defaultValue="products" 
          className="w-full"
          onValueChange={(value) => {
            if (value === "disabled") {
              setProductStatus("disabled");
            } else if (value === "products") {
              setProductStatus("active");
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="disabled">Disabled</TabsTrigger>
            <TabsTrigger value="leagues">
              <NextLink href={"/vendor/simleague-management" as any} className="w-full">
                Leagues
              </NextLink>
            </TabsTrigger>
            <TabsTrigger value="events">
              <NextLink href={"/vendor/simevent-management" as any} className="w-full">
                Events
              </NextLink>
            </TabsTrigger>
            <TabsTrigger value="garages">
              <NextLink href={"/vendor/simgarage-management" as any} className="w-full">
                Garages
              </NextLink>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gamepad className="w-5 h-5 mr-2" />
                  SimRacing Products ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Gamepad className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first sim racing product</p>
                    <NextLink href={"/vendor/simracing/product/create" as any}>
                      <Button>Add Your First Product</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div key={product.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${product.is_disabled ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                              {product.is_disabled && (
                                <Badge variant="secondary" className="mt-1">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/simracing/product/${product.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button
                                variant={product.is_disabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleStatus(product.id, !product.is_disabled)}
                              >
                                {product.is_disabled ? "Enable" : "Disable"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {product.image_url && product.image_url.length > 0 && (
                            <img 
                              src={product.image_url[0]} 
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                          <p className="text-xl font-bold text-green-600">${product.price}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                          <p className="text-sm text-gray-500">Brand: {product.brand}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disabled">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="w-5 h-5 mr-2 text-gray-600" />
                  Disabled SimRacing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading disabled products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Disabled Products</h3>
                    <p className="text-gray-600">All your sim racing products are currently active.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 opacity-60 hover:opacity-100 transition-opacity">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                              <Badge variant="secondary" className="mt-1">
                                Disabled
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleStatus(product.id, false)}
                              >
                                Enable
                              </Button>
                            </div>
                          </div>
                          {product.image_url && product.image_url.length > 0 && (
                            <img 
                              src={product.image_url[0]} 
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                          <p className="text-xl font-bold text-gray-600">${product.price}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                          <p className="text-sm text-gray-500">Brand: {product.brand}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SimRacingManagement;
