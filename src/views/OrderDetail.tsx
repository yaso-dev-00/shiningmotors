"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useCart, Order } from "@/contexts/CartContext";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import Layout from "@/components/Layout";
import { Clock, Package, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const OrderDetail = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { getOrderById, isLoading } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);

    const fetchOrder = async () => {
      try {
        if (!id) return;

        const orderData = await getOrderById(id);
        if (orderData) {
          setOrder(orderData);

          // If there's an item parameter, find the specific item
          const itemId = params.get("item");
          if (itemId) {
            const item = orderData.items.find((i) => i.id === itemId);
            if (item) {
              setSelectedItem(item);
            }
          }
        } else {
          toast({
            title: "Order not found",
            description: "We couldn't find the order you're looking for",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [id, getOrderById, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "cancelled":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Delivered";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || loadingOrder) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <div className="mt-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sm-red border-r-transparent align-[-0.125em]"></div>
            <p className="mt-4 text-lg">Loading order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <div className="mt-10 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
            <h2 className="mt-4 text-xl font-semibold">Order Not Found</h2>
            <p className="mt-2 text-gray-600">
              We couldn't find the order you're looking for.
            </p>
            <Button asChild className="mt-6">
              <NextLink href="/shop/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </NextLink>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate totals based on selected item or all items
  const subtotal = selectedItem
    ? selectedItem.price * selectedItem.quantity
    : order.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

  const shipping = selectedItem ? 0 : subtotal > 100 ? 0 : 9.99;
  const tax = selectedItem
    ? selectedItem.price * selectedItem.quantity * 0.08
    : subtotal * 0.08;

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="mb-6 flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <NextLink href="/shop/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </NextLink>
          </Button>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Order #{order.id.substring(0, 8)}
            </h1>
            <p className="text-gray-500">
              Placed on{" "}
              {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 px-6 py-3">
                <h2 className="font-medium">Order Items</h2>
              </div>
              <div className="divide-y px-6">
                {(selectedItem ? [selectedItem] : order.items).map((item) => (
                  <div key={item.id} className="flex py-4">
                    <div
                      className="mr-6 h-20 w-20 flex-shrink-0 overflow-hidden rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push(`/shop/product/${item.product_id}`)}
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name || `Product`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3
                          className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => router.push(`/shop/product/${item.product_id}`)}
                        >
                          {item.name || "Product"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end justify-between">
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 px-6 py-3">
                <h2 className="font-medium">Shipping Information</h2>
              </div>
              <div className="p-6">
                {order.shipping_address ? (
                  <div>
                    <h3 className="font-semibold">
                      {order.shipping_address.name}
                    </h3>
                    <p>{order.shipping_address.phone}</p>
                    <p>{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && (
                      <p>{order.shipping_address.line2}</p>
                    )}
                    <p>
                      {order.shipping_address.city},{" "}
                      {order.shipping_address.state}{" "}
                      {order.shipping_address.postal_code}
                    </p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                ) : (
                  <p>Shipping information not available</p>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="border-b bg-gray-50 px-6 py-3">
              <h2 className="font-medium">Order Summary</h2>
            </div>
            <div className="p-6">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between">
                <span className="text-base font-medium">Total</span>
                <span className="text-base font-medium">
                  {formatPrice(subtotal + shipping + tax)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetail;
