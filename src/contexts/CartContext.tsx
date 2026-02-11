"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  supabase,
  shopApi,
  simRacingApi,
} from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
  gst_percentage?: number;
  inventory?: number;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string; // Changed to match input form which uses string
  country: string;
  is_default?: boolean;
  phone?: string;
  user_id?: string; // Added to match db schema
  created_at?: string; // Added to match db schema
  id_1?: string; // Added to match db schema
}

export interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
  }[];
  shipping_address?: Address;
}

// Lightweight DB row shapes to avoid 'any'
type DbCartItem = {
  id: string;
  product_id: string;
  quantity: number;
};

type DbOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address?: { id?: string } | null;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  product_id?: string;
  simProduct_id?: string;
  quantity: number;
  price: number;
};

type DbAddress = Omit<Address, "postal_code"> & {
  postal_code?: number | string;
};

type ShopProductLite = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  gst_percentage?: number;
  inventory?: number;
};
type SimProductLite = {
  id: string;
  name: string;
  price: number;
  image_url?: string[];
  gst_percentage?: number;
  inventory?: number;
};

interface CartContextType {
  cartItems: CartItem[];
  addresses: Address[];
  orders: Order[];
  isLoading: boolean;
  addToCart: (product: ShopProductLite, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  removeAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCartItems: () => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order | undefined>;
  calculateTotal: () => number;
  validateInventory: () => {
    isValid: boolean;
    outOfStockItems: CartItem[];
    lowStockItems: CartItem[];
  };
  canIncreaseQuantity: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    // During Next.js build/SSR, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        cartItems: [],
        addresses: [],
        orders: [],
        isLoading: false,
        addToCart: async () => {},
        updateQuantity: async () => {},
        removeFromCart: async () => {},
        clearCart: async () => {},
        addAddress: async () => {},
        updateAddress: async () => {},
        removeAddress: async () => {},
        setDefaultAddress: async () => {},
        fetchOrders: async () => {},
        fetchCartItems: async () => {},
        getOrderById: async () => undefined,
        calculateTotal: () => 0,
        validateInventory: () => ({ isValid: true, outOfStockItems: [], lowStockItems: [] }),
        canIncreaseQuantity: () => false,
      } as CartContextType;
    }
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated, session } = useAuth();
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const didInitGuestRef = useRef(false);
  const hasMergedCartRef = useRef(false);

  const normalizeCartItems = useCallback((data: any[]): CartItem[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const product = item?.product || item?.sim_product || {};
      const images =
        (product?.images as string[] | undefined) ||
        (product?.image_url as string[] | undefined) ||
        [];
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        name: product.name || "Unknown Product",
        price: product.price || 0,
        image: Array.isArray(images) ? images[0] || "" : "",
        gst_percentage: product.gst_percentage ?? 0,
        inventory: product.inventory ?? product.stock ?? product.quantity ?? 0,
      };
    });
  }, []);

  // Helper to get headers with Authorization token
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    const accessToken = session?.access_token;
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [session]);

  const fetchCartItemsFromApi = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!user || !isAuthenticated || !session?.access_token) {
      return [];
    }

    // Get access token from session
    const accessToken = session.access_token;
    
    // Add timestamp to bypass any browser or network caching
    const headers: HeadersInit = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Authorization": `Bearer ${accessToken}`,
    };
    
    const res = await fetch(`/api/cart?_t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // If unauthorized, return empty array instead of throwing
      if (res.status === 401) {
        return [];
      }
      throw new Error(body?.error || "Failed to fetch cart");
    }

    const body = await res.json();
    return normalizeCartItems(body?.data || []);
  }, [normalizeCartItems, session, user, isAuthenticated]);

  const fetchCartItems = useCallback(async () => {
    if (!user || !isAuthenticated) {
      // Clear cart items when user is not authenticated
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const items = await fetchCartItemsFromApi();
      setCartItems(items);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      // Don't show error toast for unauthorized errors (user might have logged out)
      if (error instanceof Error && error.message !== "Unauthorized") {
        toast({
          title: "Error",
          description: "Failed to fetch cart items",
          variant: "destructive",
        });
      }
      // Clear cart items on error
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, toast, fetchCartItemsFromApi]);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch through Next.js route handler to avoid any client-side caching issues
      const headers = getAuthHeaders();
      const res = await fetch(`/api/addresses?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // If unauthorized, return empty array instead of throwing
        if (res.status === 401) {
          setAddresses([]);
          return;
        }
        throw new Error(body?.error || "Failed to fetch addresses");
      }

      const body = await res.json();
      const data = body?.data as DbAddress[] | undefined;

      if (data && Array.isArray(data)) {
        const formattedAddresses: Address[] = data.map((addr) => ({
          ...addr,
          postal_code: addr.postal_code?.toString() || "",
        }));

        setAddresses(formattedAddresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch addresses",
        variant: "destructive",
      });
    }
  }, [user, toast, getAuthHeaders]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      if (orderData) {
        // Fetch sim products once to avoid repeated API calls per order
        const { data: simProducts } = await simRacingApi.shop.getProducts();
        const productsIds = (simProducts as SimProductLite[]).map(
          (item) => item.id
        );
        const ordersWithItems = await Promise.all(
          (orderData as DbOrder[]).map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);

            if (itemsError) throw itemsError;

            const itemsWithDetails = await Promise.all(
              ((itemsData as DbOrderItem[]) || []).map(async (item) => {
                if (item.product_id || item.simProduct_id) {
                  try {
                    if (
                      item.simProduct_id &&
                      productsIds.includes(item.simProduct_id)
                    ) {
                      const { data: product } =
                        await simRacingApi.shop.getProductById(
                          item.simProduct_id
                        );
                      return {
                        ...item,
                        name:
                          (product as SimProductLite | null)?.name ||
                          "Product no longer available",
                        image:
                          (product as SimProductLite | null)?.image_url?.[0] ||
                          "",
                      };
                    }
                    if (!item.product_id) {
                      return {
                        ...item,
                        name: "Product no longer available",
                        image: "",
                      };
                    }
                    const { data: product } = await shopApi.products.getById(
                      item.product_id
                    );
                    return {
                      ...item,
                      name:
                        (product as ShopProductLite | null)?.name ||
                        "Product no longer available",
                      image:
                        (product as ShopProductLite | null)?.images?.[0] || "",
                    };
                  } catch (e) {
                    return {
                      ...item,
                      name: "Product no longer available",
                      image: "",
                    };
                  }
                }
                return item;
              })
            );

            // Get shipping address if it exists
            let shippingAddress: Address | undefined;
            if (
              order.shipping_address &&
              typeof order.shipping_address === "object"
            ) {
              const addressId = (order.shipping_address as { id?: string }).id;

              if (addressId) {
                const { data: addressData } = await supabase
                  .from("user_addresses")
                  .select("*")
                  .eq("id", addressId)
                  .maybeSingle();

                if (addressData && addressData.id) {
                  // Convert postal_code to string and handle nullable fields
                  shippingAddress = {
                    id: addressData.id,
                    name: addressData.name || "",
                    line1: addressData.line1 || "",
                    line2: addressData.line2 || undefined,
                    city: addressData.city || "",
                    state: addressData.state || "",
                    postal_code: addressData.postal_code?.toString() || "",
                    country: addressData.country || "",
                    is_default: addressData.is_default || undefined,
                    phone: addressData.phone || undefined,
                    user_id: addressData.user_id || undefined,
                    created_at: addressData.created_at || undefined,
                    id_1: addressData.id_1 || undefined,
                  };
                }
              }
            }

            return {
              ...order,
              items: itemsWithDetails || [],
              shipping_address: shippingAddress,
            };
          })
        );

        setOrders(ordersWithItems as Order[]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const getOrderById = async (orderId: string) => {
    if (!user) return undefined;

    // First, check if the order is already loaded
    const existingOrder = orders.find((order) => order.id === orderId);
    if (existingOrder) {
      return existingOrder;
    }

    // Otherwise, fetch the order
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (order) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        if (itemsError) throw itemsError;

        // For each order item, fetch the product details
        const itemsWithDetails = await Promise.all(
          ((itemsData as DbOrderItem[]) || []).map(async (item) => {
            if (item.product_id) {
              const { data: product } = await shopApi.products.getById(
                item.product_id
              );
              return {
                ...item,
                name:
                  (product as ShopProductLite | null)?.name ||
                  "Product no longer available",
                image: (product as ShopProductLite | null)?.images?.[0] || "",
              };
            }
            return item;
          })
        );

        // Get shipping address
        let shippingAddress: Address | undefined;
        if (
          order.shipping_address &&
          typeof order.shipping_address === "object"
        ) {
          const addressId = (order.shipping_address as { id?: string }).id;

          if (addressId) {
            const { data: addressData } = await supabase
              .from("user_addresses")
              .select("*")
              .eq("id", addressId)
              .maybeSingle();

            if (addressData && addressData.id) {
              // Convert postal_code to string and handle nullable fields
              shippingAddress = {
                id: addressData.id,
                name: addressData.name || "",
                line1: addressData.line1 || "",
                line2: addressData.line2 || undefined,
                city: addressData.city || "",
                state: addressData.state || "",
                postal_code: addressData.postal_code?.toString() || "",
                country: addressData.country || "",
                is_default: addressData.is_default || undefined,
                phone: addressData.phone || undefined,
                user_id: addressData.user_id || undefined,
                created_at: addressData.created_at || undefined,
                id_1: addressData.id_1 || undefined,
              };
            }
          }
        }

        const fullOrder = {
          ...order,
          items: itemsWithDetails || [],
          shipping_address: shippingAddress,
        };

        return fullOrder as Order;
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    }

    return undefined;
  };

  const saveCartToLocalStorage = (items: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const saveAddressesToLocalStorage = (addresses: Address[]) => {
    localStorage.setItem("addresses", JSON.stringify(addresses));
  };

  const addToCart = async (product: ShopProductLite, quantity: number) => {
    // Check inventory before adding
    if (product.inventory !== undefined && quantity > product.inventory) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.inventory} items available in stock`,
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated && user) {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: product.id, quantity }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to add to cart");
        }

        const body = await res.json();
        setCartItems(normalizeCartItems(body?.data || []));
        toast({
          description: "Product added to cart",
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast({
          title: "Error",
          description: "Failed to add product to cart",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const existingItemIndex = cartItems.findIndex(
        (item) => item.product_id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        const updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedCartItems);
        saveCartToLocalStorage(updatedCartItems);
      } else {
        // Add new item
        const newItem: CartItem = {
          id: uuidv4(),
          product_id: product.id,
          quantity,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          gst_percentage: product.gst_percentage,
          inventory: product.inventory,
        };

        const updatedCartItems = [...cartItems, newItem];
        setCartItems(updatedCartItems);
        saveCartToLocalStorage(updatedCartItems);
      }

      toast({
        description:
          existingItemIndex >= 0 ? "Cart updated" : "Product added to cart",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }

    // Check inventory limits
    const item = cartItems.find((item) => item.id === itemId);
    if (item && item.inventory !== undefined && quantity > item.inventory) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.inventory} items available in stock`,
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated && user) {
      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: getAuthHeaders(),
          body: JSON.stringify({ itemId, quantity }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to update cart");
        }

        const body = await res.json();
        setCartItems(normalizeCartItems(body?.data || []));

        toast({
          description: "Cart updated",
        });
      } catch (error) {
        console.error("Error updating cart:", error);
        toast({
          title: "Error",
          description: "Failed to update cart",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const updatedCartItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );

      setCartItems(updatedCartItems);
      saveCartToLocalStorage(updatedCartItems);

      toast({
        description: "Cart updated",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (isAuthenticated && user) {
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
          headers: getAuthHeaders(),
          body: JSON.stringify({ itemId }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to remove item");
        }

        const body = await res.json();
        setCartItems(normalizeCartItems(body?.data || []));

        toast({
          description: "Item removed from cart",
        });
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedCartItems);
      saveCartToLocalStorage(updatedCartItems);

      toast({
        description: "Item removed from cart",
      });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated && user) {
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
          headers: getAuthHeaders(),
          body: JSON.stringify({ clearAll: true }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to clear cart");
        }

        setCartItems([]);

        toast({
          description: "Cart cleared",
        });
      } catch (error) {
        console.error("Error clearing cart:", error);
        toast({
          title: "Error",
          description: "Failed to clear cart",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      setCartItems([]);
      localStorage.removeItem("cart");

      toast({
        description: "Cart cleared",
      });
    }
  };

  const addAddress = async (address: Omit<Address, "id">) => {
    if (isAuthenticated && user) {
      try {
        // If this is the first address or set as default, update all other addresses to not be default
        if (address.is_default || addresses.length === 0) {
          await supabase
            .from("user_addresses")
            .update({ is_default: false })
            .eq("user_id", user.id);

          // Ensure this one is set to default
          address.is_default = true;
        }

        // Convert postal_code to number for database storage
        const dbAddress = {
          ...address,
          user_id: user.id,
          postal_code: parseInt(address.postal_code as string) || 0,
        };

        // Using a direct query since user_addresses is not in the typed API
        const { data, error } = await supabase
          .from("user_addresses")
          .insert(dbAddress)
          .select();

        if (error) throw error;

        if (data) {
          await fetchAddresses(); // Refetch all addresses

          toast({
            description: "Address added successfully",
          });
        }
      } catch (error) {
        console.error("Error adding address:", error);
        toast({
          title: "Error",
          description: "Failed to add address",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const newAddress: Address = {
        id: uuidv4(),
        ...address,
      };

      // If this is the first address or set as default, update all others
      if (newAddress.is_default || addresses.length === 0) {
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          is_default: false,
        }));

        newAddress.is_default = true;
        const finalAddresses = [...updatedAddresses, newAddress];
        setAddresses(finalAddresses);
        saveAddressesToLocalStorage(finalAddresses);
      } else {
        const finalAddresses = [...addresses, newAddress];
        setAddresses(finalAddresses);
        saveAddressesToLocalStorage(finalAddresses);
      }

      toast({
        description: "Address added successfully",
      });
    }
  };

  const updateAddress = async (address: Address) => {
    if (isAuthenticated && user) {
      try {
        // Update local state immediately for instant UI feedback
        if (address.is_default) {
          // If setting as default, update all other addresses first in local state
          const updatedAddresses = addresses.map((addr) => ({
            ...addr,
            is_default: addr.id === address.id ? true : false,
          }));
          // Update the specific address
          const finalAddresses = updatedAddresses.map((addr) =>
            addr.id === address.id ? address : addr
          );
          setAddresses(finalAddresses);
        } else {
          // Update the specific address in local state
          const updatedAddresses = addresses.map((addr) =>
            addr.id === address.id ? address : addr
          );
          setAddresses(updatedAddresses);
        }

        // If setting as default, update all other addresses first in database
        if (address.is_default) {
          await supabase
            .from("user_addresses")
            .update({ is_default: false })
            .eq("user_id", user.id)
            .neq("id", address.id);
        }

        // Convert postal_code to number for database
        const dbAddress = {
          ...address,
          postal_code: parseInt(address.postal_code as string) || 0,
        };

        // Remove user_id from update payload if present to avoid conflicts
        const { user_id, ...updateData } = dbAddress;

        // Using a direct query since user_addresses is not in the typed API
        const { error } = await supabase
          .from("user_addresses")
          .update(updateData)
          .eq("id", address.id)
          .eq("user_id", user.id);

        if (error) throw error;

        // Refetch to ensure state is in sync with database
        await fetchAddresses();

        toast({
          description: "Address updated successfully",
        });
      } catch (error) {
        console.error("Error updating address:", error);
        // Revert to previous state on error by refetching
        await fetchAddresses();
        toast({
          title: "Error",
          description: "Failed to update address",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      // If setting as default, update all other addresses first
      if (address.is_default) {
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          is_default: addr.id === address.id ? true : false,
        }));

        setAddresses(updatedAddresses);
        saveAddressesToLocalStorage(updatedAddresses);
      } else {
        const updatedAddresses = addresses.map((addr) =>
          addr.id === address.id ? address : addr
        );

        setAddresses(updatedAddresses);
        saveAddressesToLocalStorage(updatedAddresses);
      }

      toast({
        description: "Address updated successfully",
      });
    }
  };

  const removeAddress = async (addressId: string) => {
    if (isAuthenticated && user) {
      try {
        // Check if it's a default address
        const addressToRemove = addresses.find((addr) => addr.id === addressId);

        // Using a direct query since user_addresses is not in the typed API
        const { error } = await supabase
          .from("user_addresses")
          .delete()
          .eq("id", addressId)
          .eq("user_id", user.id);

        if (error) throw error;

        await fetchAddresses(); // Refetch all addresses

        // If it was a default address, set another one as default if available
        if (addressToRemove?.is_default) {
          const remainingAddresses = addresses.filter(
            (addr) => addr.id !== addressId
          );
          if (remainingAddresses.length > 0) {
            await setDefaultAddress(remainingAddresses[0].id);
          }
        }

        toast({
          description: "Address removed successfully",
        });
      } catch (error) {
        console.error("Error removing address:", error);
        toast({
          title: "Error",
          description: "Failed to remove address",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const addressToRemove = addresses.find((addr) => addr.id === addressId);
      const updatedAddresses = addresses.filter(
        (addr) => addr.id !== addressId
      );

      // If it was a default address, set another one as default if available
      if (addressToRemove?.is_default && updatedAddresses.length > 0) {
        updatedAddresses[0].is_default = true;
      }

      setAddresses(updatedAddresses);
      saveAddressesToLocalStorage(updatedAddresses);

      toast({
        description: "Address removed successfully",
      });
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (isAuthenticated && user) {
      try {
        // Update local state immediately for instant UI feedback
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          is_default: addr.id === addressId,
        }));
        setAddresses(updatedAddresses);

        // First, set all addresses to not default
        await supabase
          .from("user_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);

        // Then set the selected one as default
        const { error } = await supabase
          .from("user_addresses")
          .update({ is_default: true })
          .eq("id", addressId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Refetch to ensure state is in sync with database
        await fetchAddresses();

        toast({
          description: "Default address updated",
        });
      } catch (error) {
        console.error("Error setting default address:", error);
        // Revert to previous state on error by refetching
        await fetchAddresses();
        toast({
          title: "Error",
          description: "Failed to update default address",
          variant: "destructive",
        });
      }
    } else {
      // For non-authenticated users, use local storage
      const updatedAddresses = addresses.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }));

      setAddresses(updatedAddresses);
      saveAddressesToLocalStorage(updatedAddresses);

      toast({
        description: "Default address updated",
      });
    }
  };

  const calculateTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const validateInventory = useCallback(() => {
    const outOfStockItems: CartItem[] = [];
    const lowStockItems: CartItem[] = [];

    cartItems.forEach((item) => {
      const inventory = item.inventory || 0;
      if (inventory === 0) {
        outOfStockItems.push(item);
      } else if (inventory < 5 && inventory > 0) {
        lowStockItems.push(item);
      }
    });

    return {
      isValid: outOfStockItems.length === 0,
      outOfStockItems,
      lowStockItems,
    };
  }, [cartItems]);

  const canIncreaseQuantity = useCallback(
    (itemId: string) => {
      const item = cartItems.find((item) => item.id === itemId);
      if (!item) return false;

      const inventory = item.inventory || 0;
      return item.quantity < inventory;
    },
    [cartItems]
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      if (lastFetchedUserIdRef.current === user.id && hasMergedCartRef.current) {
        return;
      }
      
      const initializeUserCart = async () => {
        try {
          // First, fetch database cart
          await fetchCartItems();
          
          // Then, check for localStorage cart and merge (only once per login)
          if (!hasMergedCartRef.current) {
            const localCart = localStorage.getItem("cart");
            if (localCart) {
              try {
                const localCartItems: CartItem[] = JSON.parse(localCart);
                
                if (localCartItems.length > 0) {
                  for (const localItem of localCartItems) {
                    try {
                      await fetch("/api/cart", {
                        method: "POST",
                        cache: "no-store",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          product_id: localItem.product_id,
                          quantity: localItem.quantity,
                        }),
                      });
                    } catch (error) {
                      console.error(
                        `Failed to merge product ${localItem.product_id} to cart:`,
                        error
                      );
                    }
                  }
                  // Clear localStorage cart after merging
                  localStorage.removeItem("cart");
                  // Refresh cart items from database
                  await fetchCartItems();
                }
              } catch (error) {
                console.error("Error parsing cart data from localStorage:", error);
                localStorage.removeItem("cart");
              }
            }
            hasMergedCartRef.current = true;
          }
          
          lastFetchedUserIdRef.current = user.id;
          fetchAddresses();
          fetchOrders();
        } catch (error) {
          console.error("Error initializing user cart:", error);
        }
      };
      
      initializeUserCart();
    } else {
      // Reset merge flag when user logs out
      hasMergedCartRef.current = false;
      lastFetchedUserIdRef.current = null;
      
      // Clear cart items, addresses, and orders when user logs out
      setCartItems([]);
      setAddresses([]);
      setOrders([]);
      setIsLoading(false);
      
      if (didInitGuestRef.current) return;
      didInitGuestRef.current = true;
      // Initialize with local storage data for non-authenticated users
      const localCart = localStorage.getItem("cart");
      if (localCart) {
        try {
          setCartItems(JSON.parse(localCart));
        } catch (error) {
          console.error("Error parsing cart data from localStorage:", error);
          localStorage.removeItem("cart");
        }
      }

      const localAddresses = localStorage.getItem("addresses");
      if (localAddresses) {
        try {
          setAddresses(JSON.parse(localAddresses));
        } catch (error) {
          console.error("Error parsing address data from localStorage:", error);
          localStorage.removeItem("addresses");
        }
      }

      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchCartItems, fetchAddresses, fetchOrders]);

  const value = {
    cartItems,
    addresses,
    orders,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    fetchOrders,
    getOrderById,
    calculateTotal,
    fetchCartItems,
    validateInventory,
    canIncreaseQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
