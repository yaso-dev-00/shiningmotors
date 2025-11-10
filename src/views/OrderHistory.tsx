"use client";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Package,
  Check,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useCart, Order } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import Layout from "@/components/Layout";

const OrderHistory = () => {
  const { orders, fetchOrders, isLoading } = useCart();
  const router = useRouter();
  const [filteredOrders, setFilteredOrders] = useState<
    Array<{
      id: string;
      originalOrderId: string;
      item: {
        id: string;
        product_id: string;
        quantity: number;
        price: number;
        name?: string;
        image?: string;
      };
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      status: string;
      created_at: string;
      shipping_address?: {
        name: string;
        line1: string;
        city: string;
        state: string;
        postal_code: string;
      };
    }>
  >([]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders and create separate entries for each product
  useEffect(() => {
    const processedOrders: Array<{
      id: string;
      originalOrderId: string;
      item: {
        id: string;
        product_id: string;
        quantity: number;
        price: number;
        name?: string;
        image?: string;
      };
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      status: string;
      created_at: string;
      shipping_address?: {
        name: string;
        line1: string;
        city: string;
        state: string;
        postal_code: string;
      };
    }> = [];

    orders.forEach((order) => {
      // Only show paid and failed orders (hide pending)
      if (order.status === "paid" || order.status === "failed") {
        // Create separate entry for each product in the order
        order.items.forEach((item, index) => {
          processedOrders.push({
            ...order,
            id: `${order.id}-${index}`, // Unique ID for each product
            originalOrderId: order.id,
            item: item,
            // Calculate individual product totals
            subtotal: item.price * item.quantity,
            // For individual product, we'll calculate proportional shipping and tax
            shipping:
              order.items.length > 1
                ? 0
                : order.total -
                  order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            tax: item.price * item.quantity * 0.08, // 8% GST
            total:
              item.price * item.quantity + item.price * item.quantity * 0.08,
          });
        });
      }
    });

    setFilteredOrders(processedOrders);
  }, [orders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Check className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "cancelled":
      case "failed":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Delivered";
      case "paid":
        return "Paid";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "failed":
        return "Payment Failed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold">Order History</h1>
          <div className="mt-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sm-red border-r-transparent align-[-0.125em]"></div>
            <p className="mt-4 text-lg">Loading your orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold">Order History</h1>

        {filteredOrders.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <h2 className="mb-4 text-xl font-semibold">No orders found</h2>
            <p className="mb-6 text-gray-500">
              You haven't placed any orders yet.
            </p>
            <NextLink
              href={"/shop" as any}
              className="inline-flex items-center rounded-md bg-sm-red px-4 py-2 text-sm font-medium text-white hover:bg-sm-red-light"
            >
              Start Shopping
            </NextLink>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/shop/orders/${order.originalOrderId}?item=${order.item.id}` as any
                  )
                }
                role="button"
              >
                <div className="p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold">
                          Order #{order.originalOrderId.substring(0, 8)}
                        </h2>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Placed on{" "}
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Quantity: {order.item.quantity}
                        </p>
                        <p className="font-medium">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-1 text-sm font-medium">Product</h3>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-14 w-14 overflow-hidden rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/shop/product/${order.item.product_id}` as any);
                          }}
                        >
                          <img
                            src={order.item.image || "/placeholder.svg"}
                            alt={order.item.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p
                            className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/shop/product/${order.item.product_id}` as any
                              );
                            }}
                          >
                            {order.item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{order.item.price} each
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-medium">
                        Shipping Address
                      </h3>
                      {order.shipping_address ? (
                        <p className="text-sm text-gray-600">
                          {order.shipping_address.name},{" "}
                          {order.shipping_address.line1},{" "}
                          {order.shipping_address.city},{" "}
                          {order.shipping_address.state}{" "}
                          {order.shipping_address.postal_code}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Address information unavailable
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistory;
