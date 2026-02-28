"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Star,
  MessageSquare,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { vendorAnalyticsApi, type ShopAnalytics } from "@/integrations/supabase/modules/vendorAnalytics";
import { useToast } from "@/hooks/use-toast";
import Back from "./Back";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import { ArrowLeft } from 'lucide-react'

import { useRouter } from "next/navigation"
type Product = Database["public"]["Tables"]["products"]["Row"];

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[] | null;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  shipping_address: unknown;
  profiles?: {
    full_name: string | null;
    username?: string | null;
  } | null;
  items: OrderItem[];
}

const ShopManagement = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [productStatus, setProductStatus] = useState<"active" | "disabled" | "all">("active");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const router = useRouter();
  const initialFetchDone = React.useRef(false);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) h["Authorization"] = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/vendor/products?sortBy=${sortBy}&status=${productStatus}&_t=${Date.now()}`,
        { method: "GET", cache: "no-store", credentials: "include", headers: getAuthHeaders() }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setProducts([]); return; }
        throw new Error(body?.error || "Failed to fetch products");
      }
      const body = await res.json();
      setProducts((body?.data || []) as Product[]);
    } catch (error: unknown) {
      console.error("Error fetching products:", error);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, sortBy, productStatus, toast, getAuthHeaders]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      const res = await fetch(`/api/vendor/shop/orders?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setOrders([]); return; }
        throw new Error(body?.error || "Failed to fetch orders");
      }
      const body = await res.json();
      setOrders((body?.data || []) as Order[]);
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setOrdersLoading(false);
    }
  }, [user, toast, getAuthHeaders]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/vendor/shop/analytics?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const body = await res.json();
      setAnalytics(body?.data ?? null);
    } catch (error: unknown) {
      console.error("Error fetching analytics:", error);
    }
  }, [user, getAuthHeaders]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchOrders(), fetchAnalytics()]);
  }, [fetchProducts, fetchOrders, fetchAnalytics]);

  useEffect(() => {
    if (user && !initialFetchDone.current) {
      fetchData();
      initialFetchDone.current = true;
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (user && initialFetchDone.current) {
      fetchProducts();
    }
  }, [sortBy, productStatus]);

  useEffect(() => {
    if (!pathname?.includes("/vendor/shop-management")) return;
    fetchData();
  }, [pathname, fetchData]);

  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchData]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleToggleStatus = async (productId: string, isDisabled: boolean) => {
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/products/${productId}/toggle-status`, {
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

      fetchProducts();
    } catch (error: unknown) {
      console.error("Error toggling product status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/products/${productToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.canDisable) {
          setShowDeleteDialog(false);
          toast({
            title: "Cannot Delete",
            description: body.error,
            action: (
              <Button onClick={() => handleToggleStatus(productToDelete.id, true)} size="sm">
                Disable Instead
              </Button>
            ),
          });
          return;
        }
        throw new Error(body?.error ?? "Failed to delete product");
      }

      setProducts(
        products.filter((product) => product.id !== productToDelete.id)
      );

      // Trigger revalidation for shop SSG/ISR
      try {
        await fetch("/api/shop/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: productToDelete.id,
            action: "delete",
          }),
        });
      } catch (revalidateError) {
        console.error("Error triggering shop revalidation:", revalidateError);
      }

      toast({
        title: "Success",
        description:
          "Product and associated social media post deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await vendorAnalyticsApi.updateOrderStatus(
        orderId,
        newStatus
      );

      if (error) throw error;

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      // Refresh analytics
      fetchAnalytics();
    } catch (error: unknown) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "shipped":
        return <Package className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "shipped":
        return "text-blue-600";
      case "delivered":
        return "text-green-600";
      case "completed":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <span
        className={`flex items-center ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive && "rotate-180"}`} />
        {Math.abs(rate).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-between px-4 relative top-3">
            <div className="flex items-center space-x-2 gap-1">
              <Button variant="outline" size="icon" onClick={() => router.push("/vendor-dashboard")} aria-label="Back">
                   <ArrowLeft className="h-4 w-4" />
              </Button>
        <p>back</p>
      </div>
    </div>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shop Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your products, orders, inventory, and track business
                growth
              </p>
            </div>
            <NextLink href={"/vendor/shop/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </NextLink>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.totalRevenue)}
                    </p>
                    <div className="text-xs mt-1">
                      {formatGrowthRate(analytics.growthMetrics.revenueGrowth)}
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">
                      {analytics.totalOrders}
                    </p>
                    <div className="text-xs mt-1">
                      {formatGrowthRate(analytics.growthMetrics.orderGrowth)}
                    </div>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stock Remaining</p>
                    <p className="text-2xl font-bold">
                      {analytics.inventoryMetrics.totalInventoryRemaining}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.inventoryMetrics.inStockProducts} products
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analytics.inventoryMetrics.outOfStockProducts}
                    </p>
                    <p className="text-xs text-gray-500">
                      products need restocking
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs 
          defaultValue="inventory" 
          className="w-full"
          onValueChange={(value) => {
            if (value === "disabled") {
              setProductStatus("disabled");
            } else if (value === "inventory" || value === "out-of-stock" || value === "products") {
              setProductStatus("active");
            }
          }}
        >
          <TabsList className="w-full">
            <div className="flex overflow-scroll scrollbar-hide md:grid w-full grid-cols-7">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
              <TabsTrigger value="disabled">Disabled</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.inventoryMetrics.inStockProducts}
                      </div>
                      <p className="text-sm text-gray-600">In Stock Products</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {analytics.inventoryMetrics.lowStockProducts}
                      </div>
                      <p className="text-sm text-gray-600">Low Stock (&lt;5)</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          analytics.inventoryMetrics.totalInventoryValue
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Total Inventory Value
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {analytics.inventoryMetrics.totalInventoryRemaining}
                      </div>
                      <p className="text-sm text-gray-600">Total Units</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold">Current Stock Levels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium truncate">
                            {product.name}
                          </h5>
                          <Badge
                            variant={
                              product.inventory === 0
                                ? "destructive"
                                : product.inventory < 5
                                ? "secondary"
                                : "default"
                            }
                            className={
                              product.inventory === 0
                                ? "text-red-600"
                                : product.inventory < 5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }
                          >
                            {product.inventory === 0
                              ? "Out of Stock"
                              : product.inventory < 5
                              ? "Low Stock"
                              : "In Stock"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {product.category}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">
                            {product.inventory} units
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="out-of-stock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Out of Stock Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.outOfStockProducts?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      All Products In Stock!
                    </h3>
                    <p className="text-gray-600">
                      Great job! No products are out of stock.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics?.outOfStockProducts?.map((product: ShopAnalytics["outOfStockProducts"][number]) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-800">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {product.category}
                            </p>
                            {product.lastSold && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last sold:{" "}
                                {new Date(
                                  product.lastSold
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <NextLink href={`/vendor/shop/edit/${product.id}` as any}>
                            <Button size="sm" variant="outline">
                              Restock
                            </Button>
                          </NextLink>
                        </div>
                      </div>
                    ))}
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
                  Disabled Products
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
                    <h3 className="text-lg font-semibold mb-2">
                      No Disabled Products
                    </h3>
                    <p className="text-gray-600">
                      All your products are currently active.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="border rounded-lg p-4 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg truncate">
                                {product.name}
                              </h3>
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
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]!}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">
                            {product.category}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-600">
                              {formatCurrency(product.price)}
                            </span>
                            <Badge variant="outline">
                              {product.inventory} in stock
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Complete Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.orderHistory?.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-gray-600">
                      Orders will appear here once customers start purchasing
                      your products.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics?.orderHistory?.map((order: ShopAnalytics["orderHistory"][number]) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">
                              Order #{order.id.slice(0, 8)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                            >
                              {order.status}
                            </Badge>
                            <p className="text-lg font-semibold mt-1">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {order.items.map((item: OrderItem) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                            >
                              {item.product.images?.[0] && (
                                <img
                                  src={item.product.images?.[0]!}
                                  alt={item.product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-medium">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {item.quantity} × {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedbacks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Customer Feedbacks & Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.feedbacks?.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Feedbacks Yet
                    </h3>
                    <p className="text-gray-600">
                      Customer reviews and ratings will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics?.feedbacks?.map((feedback: ShopAnalytics["feedbacks"][number]) => (
                      <div key={feedback.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {feedback.customer_name}
                              </span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < feedback.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {feedback.product_name}
                            </p>
                            <p className="text-sm">{feedback.comment}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Growth Metrics & Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {formatGrowthRate(
                          analytics.growthMetrics.monthlyGrowthRate
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Monthly Growth</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {formatGrowthRate(
                          analytics.growthMetrics.weeklyGrowthRate
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Weekly Growth</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {formatGrowthRate(
                          analytics.growthMetrics.revenueGrowth
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Revenue Growth</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {formatGrowthRate(analytics.growthMetrics.orderGrowth)}
                      </div>
                      <p className="text-sm text-gray-600">Order Growth</p>
                    </div>
                  </div>
                )}

                {analytics && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">
                      Key Performance Indicators
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800">
                          Average Order Value
                        </h5>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(analytics.avgOrderValue)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800">
                          Total Products Sold
                        </h5>
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.totalSales}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-medium text-purple-800">
                          Products in Catalog
                        </h5>
                        <p className="text-2xl font-bold text-purple-600">
                          {analytics.totalProducts}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Product Catalog ({products.length})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="sort-select"
                      className="text-sm font-medium"
                    >
                      Sort by:
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort-select" className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Recently Created</SelectItem>
                        <SelectItem value="updated">
                          Recently Updated
                        </SelectItem>
                        <SelectItem value="price_asc">
                          Price: Low to High
                        </SelectItem>
                        <SelectItem value="price_desc">
                          Price: High to Low
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Products Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start by adding your first product to your shop
                    </p>
                    <NextLink href={"/vendor/shop/create" as any}>
                      <Button>Add Your First Product</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${product.is_disabled ? 'opacity-50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg truncate">
                                {product.name}
                              </h3>
                              {product.is_disabled && (
                                <Badge variant="secondary" className="mt-1">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                          <NextLink href={`/vendor/shop/edit/${product.id}` as any}>
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
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]!}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">
                            {product.category}
                          </p>
                          <div className="text-xs text-gray-500 mb-2">
                            {sortBy === "updated" && product.updated_at ? (
                              <>
                                Updated:{" "}
                                {new Date(
                                  product.updated_at
                                ).toLocaleDateString()}
                              </>
                            ) : (
                              <>
                                Created:{" "}
                                {new Date(
                                  product.created_at
                                ).toLocaleDateString()}
                              </>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </span>
                            <Badge
                              variant={
                                product.inventory === 0
                                  ? "destructive"
                                  : product.inventory < 5
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {product.inventory} in stock
                            </Badge>
                          </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              action will also delete the associated social media post and
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShopManagement;
