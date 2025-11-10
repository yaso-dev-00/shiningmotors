
import { supabase } from '../client';
import type { Database } from '../types';

export interface VendorActivityData {
  id: string;
  business_name: string;
  personal_name: string;
  email: string;
  mobile: string;
  whatsapp_number?: string;
  categories: string[];
  created_at: string;
  is_verified_by_admin: boolean;
  user_id: string;
  branches?: Record<string, unknown>[];
  products?: { id: string }[];
  vehicles?: { id: string; price: number }[];
  services?: { id: string }[];
  events?: { id: string }[];
  simProducts?: { id: string; price: number }[];
  simEvents?: { id: string }[];
  simLeagues?: { id: string }[];
  performanceMetrics?: {
    totalRevenue: number;
    monthlyGrowth: number;
    conversionRate: number;
    customerSatisfaction: number;
    responseTime: number;
    totalCustomers: number;
    repeatCustomers: number;
    avgOrderValue: number;
  };
}

// Helper function to get actual revenue data by month
const getVendorRevenueData = async (vendorUserId: string) => {
  try {
    const now = new Date();
    const monthsData = [];
    
    // Get last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Get products for this vendor
      const { data: vendorProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', vendorUserId);
      
      const productIds = vendorProducts?.map(p => p.id) || [];
      
      let monthlyRevenue = 0;
      
      if (productIds.length > 0) {
        // Get order items for vendor's products in this month
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('price, quantity, created_at')
          .in('product_id', productIds)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        if (orderItems) {
          monthlyRevenue = orderItems.reduce((sum, item) => {
            return sum + (Number(item.price) * item.quantity);
          }, 0);
        }
      }
      
      // Add event registrations revenue
      const { data: vendorEvents } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', vendorUserId);
      
      const eventIds = vendorEvents?.map(e => e.id) || [];
      
      if (eventIds.length > 0) {
        const { data: eventRegistrations } = await supabase
          .from('event_registrations')
          .select('payment_amount, created_at')
          .in('event_id', eventIds)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString())
          .eq('payment_status', 'completed');
        
        if (eventRegistrations) {
          const eventRevenue = eventRegistrations.reduce((sum, reg) => {
            return sum + (Number(reg.payment_amount) || 0);
          }, 0);
          monthlyRevenue += eventRevenue;
        }
      }
      
      monthsData.push({
        month: monthName,
        revenue: Math.round(monthlyRevenue)
      });
    }
    
    return monthsData;
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }
};

// Helper function to calculate category-specific performance metrics
const calculateCategoryPerformance = async (vendorUserId: string, vendorData: { products?: { id: string }[]; vehicles?: { id: string; price: number }[]; events?: { id: string }[]; simProducts?: { id: string; price: number }[]; services?: { id: string }[] }) => {
  try {
    const categoryMetrics: { category: string; value: number; revenue: number; itemCount: number }[] = [];
    
    // Calculate Shop category performance
    if (vendorData.products && vendorData.products.length > 0) {
      const productIds = vendorData.products.map((p: { id: string }) => p.id);
      let shopRevenue = 0;
      
      if (productIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('price, quantity')
          .in('product_id', productIds);
        
        if (orderItems) {
          shopRevenue = orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        }
      }
      
      const shopPerformance = Math.min((vendorData.products.length * 5) + (shopRevenue / 1000), 100);
      categoryMetrics.push({
        category: 'Shop',
        value: Math.round(shopPerformance),
        revenue: shopRevenue,
        itemCount: vendorData.products.length
      });
    }

    // Calculate Vehicle category performance
    if (vendorData.vehicles && vendorData.vehicles.length > 0) {
      const vehicleRevenue = vendorData.vehicles.reduce((sum: number, vehicle: { price: number }) => {
        return sum + (Number(vehicle.price) || 0);
      }, 0);
      
      const vehiclePerformance = Math.min((vendorData.vehicles.length * 8) + (vehicleRevenue / 10000), 100);
      categoryMetrics.push({
        category: 'Vehicle',
        value: Math.round(vehiclePerformance),
        revenue: vehicleRevenue,
        itemCount: vendorData.vehicles.length
      });
    }

    // Calculate Service category performance
    if (vendorData.services && vendorData.services.length > 0) {
      // Get service bookings for this vendor
      const { data: serviceBookings } = await supabase
        .from('service_bookings')
        .select('id, status')
        .eq('vendor_id', vendorUserId);
      
      const totalBookings = serviceBookings?.length || 0;
      const completedBookings = serviceBookings?.filter(booking => booking.status === 'completed')?.length || 0;
      
      const servicePerformance = Math.min((vendorData.services.length * 6) + (totalBookings * 3) + (completedBookings * 2), 100);
      categoryMetrics.push({
        category: 'Service',
        value: Math.round(servicePerformance),
        revenue: completedBookings * 500, // Estimate revenue per completed service
        itemCount: vendorData.services.length
      });
    }

    // Calculate Event category performance
    if (vendorData.events && vendorData.events.length > 0) {
      const eventIds = vendorData.events.map((e: { id: string }) => e.id);
      let eventRevenue = 0;
      let totalRegistrations = 0;
      
      if (eventIds.length > 0) {
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('payment_amount, status')
          .in('event_id', eventIds);
        
        if (registrations) {
          totalRegistrations = registrations.length;
          eventRevenue = registrations.reduce((sum, reg) => {
            return sum + (Number(reg.payment_amount) || 0);
          }, 0);
        }
      }
      
      const eventPerformance = Math.min((vendorData.events.length * 7) + (totalRegistrations * 2), 100);
      categoryMetrics.push({
        category: 'Event',
        value: Math.round(eventPerformance),
        revenue: eventRevenue,
        itemCount: vendorData.events.length
      });
    }

    // Calculate SimRacing category performance (if applicable)
    if (vendorData.simProducts && vendorData.simProducts.length > 0) {
      const simRevenue = vendorData.simProducts.reduce((sum: number, product: { price: number }) => {
        return sum + (Number(product.price) || 0);
      }, 0);
      
      const simPerformance = Math.min((vendorData.simProducts.length * 4) + (simRevenue / 2000), 100);
      categoryMetrics.push({
        category: 'SimRacing',
        value: Math.round(simPerformance),
        revenue: simRevenue,
        itemCount: vendorData.simProducts.length
      });
    }

    return categoryMetrics;
  } catch (error) {
    console.error('Error calculating category performance:', error);
    return [];
  }
};

// Helper function to calculate performance metrics from actual data
const calculatePerformanceMetrics = async (vendorUserId: string, vendorData: { products?: { id: string }[]; events?: { id: string }[]; services?: { id: string; created_at?: string }[]; vehicles?: { id: string; created_at?: string }[] }) => {
  try {
    // Get vendor's orders and revenue from order_items that match vendor's products
    const vendorProductIds = vendorData.products?.map((p: { id: string }) => p.id) || [];
    
    let totalRevenue = 0;
    let totalOrders = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    if (vendorProductIds.length > 0) {
      // Get order items for vendor's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('price, quantity, created_at, product_id')
        .in('product_id', vendorProductIds);

      if (orderItems) {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        orderItems.forEach(item => {
          const itemRevenue = Number(item.price) * item.quantity;
          totalRevenue += itemRevenue;
          totalOrders++;

          const itemDate = new Date(item.created_at);
          if (itemDate >= currentMonth) {
            currentMonthRevenue += itemRevenue;
          } else if (itemDate >= lastMonth && itemDate < currentMonth) {
            lastMonthRevenue += itemRevenue;
          }
        });
      }
    }

    // Calculate monthly growth
    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Get event registrations for vendor's events
    const vendorEventIds = vendorData.events?.map((e: { id: string }) => e.id) || [];
    let eventRegistrations = 0;
    
    if (vendorEventIds.length > 0) {
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id, user_id, status')
        .in('event_id', vendorEventIds);
      
      eventRegistrations = registrations?.length || 0;
    }

    // Get service bookings for vendor's services
    const { data: serviceBookings } = await supabase
      .from('service_bookings')
      .select('id, user_id, status')
      .eq('vendor_id', vendorUserId);

    const serviceBookingCount = serviceBookings?.length || 0;

    // Calculate unique customers
    const uniqueCustomerIds = new Set([
      ...(serviceBookings?.map(booking => booking.user_id) || [])
    ]);

    // Add event registration customers
    if (vendorEventIds.length > 0) {
      const { data: eventRegs } = await supabase
        .from('event_registrations')
        .select('user_id')
        .in('event_id', vendorEventIds);
      
      eventRegs?.forEach(reg => uniqueCustomerIds.add(reg.user_id));
    }

    const totalCustomers = uniqueCustomerIds.size;

    // Calculate conversion rate based on products vs orders
    const totalProducts = vendorData.products?.length || 0;
    const conversionRate = totalProducts > 0 ? Math.min((totalOrders / (totalProducts * 5)) * 100, 25) : 0;

    // Calculate customer satisfaction based on completed bookings/registrations
    const completedServices = serviceBookings?.filter(booking => booking.status === 'completed')?.length || 0;
    const totalServiceBookings = serviceBookingCount;
    
    let completedEvents = 0;
    let totalEventRegs = 0;
    
    if (vendorEventIds.length > 0) {
      const { data: eventRegs } = await supabase
        .from('event_registrations')
        .select('status')
        .in('event_id', vendorEventIds);
      
      totalEventRegs = eventRegs?.length || 0;
      completedEvents = eventRegs?.filter(reg => reg.status === 'confirmed')?.length || 0;
    }
    
    const totalCompleted = completedServices + completedEvents;
    const totalInteractions = totalServiceBookings + totalEventRegs;
    const customerSatisfaction = totalInteractions > 0 ? Math.min((totalCompleted / totalInteractions) * 5, 5) : 4.0;

    // Calculate response time based on recent activity
    const recentActivity = [
      ...(vendorData.products || []), 
      ...(vendorData.services || []), 
      ...(vendorData.events || []),
      ...(vendorData.vehicles || [])
    ].filter((item: { created_at?: string } & Record<string, unknown>) => {
      if (!item.created_at) return false;
      const created = new Date(item.created_at);
      const daysDiff = (new Date().getTime() - created.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });
    
    const responseTime = recentActivity.length > 5 ? 2 : recentActivity.length > 2 ? 6 : 12;

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Estimate repeat customers
    const repeatCustomers = Math.floor(totalCustomers * 0.25);

    return {
      totalRevenue,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
      responseTime,
      totalCustomers,
      repeatCustomers,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return {
      totalRevenue: 0,
      monthlyGrowth: 0,
      conversionRate: 0,
      customerSatisfaction: 4.0,
      responseTime: 24,
      totalCustomers: 0,
      repeatCustomers: 0,
      avgOrderValue: 0
    };
  }
};

export const vendorActivitiesApi = {
  // Get all vendors with their activity data
  getAllVendorsWithActivities: async (): Promise<{ data: VendorActivityData[] | null; error: Error | null }> => {
    try {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendor_registrations')
        .select('*')
        .eq('is_verified_by_admin', true);

      if (vendorError) throw vendorError;

      const enrichedVendors = await Promise.all(
        (vendors || []).map(async (vendor) => {
          // Fetch all vendor data in parallel
          const [products, vehicles, services, events, simProducts, simEvents, simLeagues] = await Promise.all([
            supabase.from('products').select('*').eq('seller_id', vendor.user_id),
            supabase.from('vehicles').select('*').eq('seller_id', vendor.user_id),
            supabase.from('services').select('*').eq('vendor_id', vendor.user_id),
            supabase.from('events').select('*').eq('organizer_id', vendor.user_id),
            supabase.from('sim_products').select('*').limit(5),
            supabase.from('sim_events').select('*').eq('created_by', vendor.user_id),
            supabase.from('sim_leagues').select('*').eq('organizer_id', vendor.user_id),
          ]);

          const vendorData = {
            products: products.data || [],
            vehicles: vehicles.data || [],
            services: services.data || [],
            events: events.data || [],
            simProducts: simProducts.data || [],
            simEvents: simEvents.data || [],
            simLeagues: simLeagues.data || []
          };

          // Calculate performance metrics with actual data
          const performanceMetrics = await calculatePerformanceMetrics(vendor.user_id, vendorData);

          return {
            ...vendor,
            business_name: vendor.business_name || '',
            personal_name: vendor.personal_name || '',
            email: vendor.email || '',
            mobile: vendor.mobile || '',
            ...vendorData,
            performanceMetrics
          } as VendorActivityData;
        })
      );

      return { data: enrichedVendors, error: null };
    } catch (error) {
      console.error('Error fetching vendor activities:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  // Get detailed vendor activity by ID
  getVendorActivityById: async (vendorId: string): Promise<{ data: VendorActivityData | null; error: Error | null }> => {
    try {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendor_registrations')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Fetch all vendor data in parallel
      const [products, vehicles, services, events, simProducts, simEvents, simLeagues] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', vendor.user_id),
        supabase.from('vehicles').select('*').eq('seller_id', vendor.user_id),
        supabase.from('services').select('*').eq('vendor_id', vendor.user_id),
        supabase.from('events').select('*').eq('organizer_id', vendor.user_id),
        supabase.from('sim_products').select('*').limit(10),
        supabase.from('sim_events').select('*').eq('created_by', vendor.user_id),
        supabase.from('sim_leagues').select('*').eq('organizer_id', vendor.user_id),
      ]);

      const vendorData = {
        products: products.data || [],
        vehicles: vehicles.data || [],
        services: services.data || [],
        events: events.data || [],
        simProducts: simProducts.data || [],
        simEvents: simEvents.data || [],
        simLeagues: simLeagues.data || []
      };

      // Calculate performance metrics with actual data
      const performanceMetrics = await calculatePerformanceMetrics(vendor.user_id, vendorData);

      const enrichedVendor = {
        ...vendor,
        business_name: vendor.business_name || '',
        personal_name: vendor.personal_name || '',
        email: vendor.email || '',
        mobile: vendor.mobile || '',
        ...vendorData,
        performanceMetrics
      } as VendorActivityData;

      return { data: enrichedVendor, error: null };
    } catch (error) {
      console.error('Error fetching vendor activity:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  // Get category performance data for a specific vendor
  getCategoryPerformanceById: async (vendorId: string) => {
    try {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendor_registrations')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Fetch all vendor data
      const [products, vehicles, services, events, simProducts] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', vendor.user_id),
        supabase.from('vehicles').select('*').eq('seller_id', vendor.user_id),
        supabase.from('services').select('*').eq('vendor_id', vendor.user_id),
        supabase.from('events').select('*').eq('organizer_id', vendor.user_id),
        supabase.from('sim_products').select('*').limit(10),
      ]);

      const vendorData = {
        products: products.data || [],
        vehicles: vehicles.data || [],
        services: services.data || [],
        events: events.data || [],
        simProducts: simProducts.data || []
      };

      // Calculate actual category performance
      const categoryPerformance = await calculateCategoryPerformance(vendor.user_id, vendorData);

      return { data: categoryPerformance, error: null };
    } catch (error) {
      console.error('Error fetching category performance:', error);
      return { data: [], error };
    }
  },

  // Get actual revenue data for a vendor
  getVendorRevenueData: async (vendorUserId: string) => {
    return await getVendorRevenueData(vendorUserId);
  },

  // Get vendor data by user ID
  getVendorDataByUserId: async (userId: string) => {
    try {
      const [products, vehicles, services, events, simProducts, simEvents, simLeagues, simGarages] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', userId),
        supabase.from('vehicles').select('*').eq('seller_id', userId),
        supabase.from('services').select('*').eq('vendor_id', userId),
        supabase.from('events').select('*').eq('organizer_id', userId),
        supabase.from('sim_products').select('*').limit(10),
        supabase.from('sim_events').select('*').eq('created_by', userId),
        supabase.from('sim_leagues').select('*').eq('organizer_id', userId),
        supabase.from('sim_garages').select('*').limit(5),
      ]);

      return {
        products: products.data || [],
        vehicles: vehicles.data || [],
        services: services.data || [],
        events: events.data || [],
        simProducts: simProducts.data || [],
        simEvents: simEvents.data || [],
        simLeagues: simLeagues.data || [],
        simGarages: simGarages.data || []
      };
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      return {
        products: [],
        vehicles: [],
        services: [],
        events: [],
        simProducts: [],
        simEvents: [],
        simLeagues: [],
        simGarages: []
      };
    }
  }
};
