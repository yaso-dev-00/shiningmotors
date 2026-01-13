import { supabase } from "../client";
import {
  getCached,
  setCached,
  stableKeyForObject,
  DEFAULT_CACHE_TTL_MS,
  clearCacheByPrefix,
} from "@/lib/cache";
import type { Database } from "../types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];

// Extended product interface with additional properties
export interface ProductDetail extends Omit<Product, 'weight' | 'length' | 'breadth' | 'height' | 'pickup_postcode' | 'gst_percentage'> {
  image_url?: string;
  category_id?: string;
  subcategory_id?: string;
  brand?: string;
  rating?: number;
  stock?: number;
  colors?: string[];
  sizes?: string[];
  // Physical properties
  weight?: number | null;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  // Shipping & tax properties
  pickup_postcode?: string | null;
  gst_percentage?: number | null;
}

export interface CartItemWithProduct extends CartItem {
  product: ProductDetail;
  color: string | null;
  size: string | null;
}

export interface ProductFilters {
  category?: string;
  status?: "on_sale" | "upcoming" | "in_stock";
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "updated";
  page?: number;
  pageSize?: number;
  search?: string;
  parts?: string;
  subCategory?: string;
  // Optional list of product IDs to constrain results to
  ids?: string[];
}

// Export the shop API functions
export const shopApi = {
  products: {
    getFiltered: async (filters: ProductFilters = {}) => {
      // Build a stable cache key based on filters
      const cacheKey = `shop/products/getFiltered:${stableKeyForObject(
        filters as Record<string, unknown>
      )}`;
      const cached = getCached<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const { page = 1, pageSize = 15 } = filters;
      let query = supabase.from("products").select("*", { count: "exact" });

      if (filters.ids && filters.ids.length > 0) {
        query = query.in("id", filters.ids);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,category.ilike.%${filters.search}%,subCategory.ilike.%${filters.search}%,parts.ilike.%${filters.search}%`
        );
      }
      if (filters.parts) {
        query = query.eq("parts", filters.parts);
      }
      if (filters.subCategory) {
        query = query.eq("subCategory", filters.subCategory);
      }
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "price_asc":
            query = query.order("price", { ascending: true });
            break;
          case "price_desc":
            query = query.order("price", { ascending: false });
            break;
          case "newest":
            query = query.order("created_at", { ascending: false });
            break;
          case "updated":
            query = query.order("updated_at", { ascending: false });
            break;
        }
      }

      // Get the count first
      const countQuery = await query;
      const totalCount = countQuery.count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Then handle pagination for the actual data
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      const result = await query.range(start, end);

      // Return the result with an added count property
      const response = {
        ...result,
        count: totalCount,
        pageCount: totalPages,
      };
      setCached(cacheKey, response, DEFAULT_CACHE_TTL_MS);
      return response;
    },
    // Useful to clear caches after any mutation affecting products
    clearProductsCache: () => clearCacheByPrefix("shop/products/"),
    getAll: (userId: string) =>
      supabase.from("products").select("*").eq("seller_id", userId),
    getById: (id: string) =>
      supabase.from("products").select().eq("id", id).single(),
    insert: (values: ProductInsert) => supabase.from("products").insert(values),
    update: (id: string, values: ProductUpdate) =>
      supabase.from("products").update(values).eq("id", id),
    delete: (id: string) => supabase.from("products").delete().eq("id", id),
  },
  cartItems: {
    getByUserId: (userId: string, bypassCache?: boolean) => {
      // Always order by created_at desc to ensure consistent ordering
      // The bypassCache parameter is kept for future use if needed
      return supabase
        .from("cart_items")
        .select(
          `
        *
      `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    },
    count: (userId: string) =>
      supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    insert: (values: Database["public"]["Tables"]["cart_items"]["Insert"]) =>
      supabase.from("cart_items").insert(values),
    update: (
      id: string,
      values: Database["public"]["Tables"]["cart_items"]["Update"]
    ) => supabase.from("cart_items").update(values).eq("id", id),
    delete: (id: string) => supabase.from("cart_items").delete().eq("id", id),
    deleteByUserId: (userId: string) =>
      supabase.from("cart_items").delete().eq("user_id", userId),
  },
  orderItems: {
    getByOrderId: (orderId: string) =>
      supabase
        .from("order_items")
        .select(
          `
        *,
        product:products(*)
      `
        )
        .eq("order_id", orderId),
  },
};

export { type Product, type ProductInsert, type ProductUpdate };
