// ─── Types ────────────────────────────────────────────────────────────────────

export type Kpi = {
  id: string
  label: string
  value: number
  unit?: string
  prefix?: string
  suffix?: string
  wow: number  // week-over-week %
  mom: number  // month-over-month %
  yoy?: number
  formatAsCurrency?: boolean
  higher_is_better?: boolean  // false for metrics like return rate, delivery time
}

export type TrendPoint = { period: string; revenue: number; orders: number }
export type BreakdownItem = { name: string; value: number; color?: string }
export type ProductRow = {
  rank: number
  name: string
  category: string
  unitsSold: number
  revenue: number
  growth: number
  returnRate: number
  conversionRate: number
}
export type LocationRow = {
  rank: number
  city: string
  state: string
  orders: number
  revenue: number
  growth: number
}
export type CustomerRow = {
  rank: number
  name: string
  orders: number
  revenue: number
  lastOrder: string
  type: "new" | "returning"
}
export type CourierRow = {
  name: string
  deliveries: number
  avgDays: number
  onTime: number // %
  delayed: number // %
}
export type AlertItem = {
  id: string
  type: "warning" | "positive" | "info"
  title: string
  message: string
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

export const demoAlerts: AlertItem[] = [
  {
    id: "a1",
    type: "warning",
    title: "Return rate spike detected",
    message: "Return rate on Brake Pads jumped +4.2% this week vs last week. Possible quality or listing issue.",
  },
  {
    id: "a2",
    type: "positive",
    title: "Mumbai crossing ₹5L milestone",
    message: "Mumbai crossed ₹5,00,000 in cumulative revenue this month — fastest growing city for the third month running.",
  },
  {
    id: "a3",
    type: "info",
    title: "Peak hour opportunity",
    message: "78% of orders arrive between 7 PM – 10 PM. Consider scheduling flash sales and push notifications in this window.",
  },
]

// ─── Core KPIs ────────────────────────────────────────────────────────────────

export const demoKpis: Kpi[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: 2_485_600,
    formatAsCurrency: true,
    wow: 8.4,
    mom: 14.8,
    yoy: 62.3,
    higher_is_better: true,
  },
  {
    id: "orders",
    label: "Total Orders",
    value: 4_218,
    wow: 6.2,
    mom: 11.4,
    yoy: 48.7,
    higher_is_better: true,
  },
  {
    id: "products_sold",
    label: "Products Sold",
    value: 9_834,
    wow: 5.8,
    mom: 9.6,
    higher_is_better: true,
  },
  {
    id: "aov",
    label: "Avg Order Value",
    value: 1_349,
    formatAsCurrency: true,
    wow: 2.1,
    mom: 4.9,
    higher_is_better: true,
  },
  {
    id: "delivered",
    label: "Delivered",
    value: 3_680,
    wow: 7.1,
    mom: 13.2,
    higher_is_better: true,
  },
  {
    id: "pending",
    label: "Pending / In-Transit",
    value: 362,
    wow: -3.4,
    mom: -8.1,
    higher_is_better: false,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    value: 176,
    wow: -6.2,
    mom: -11.5,
    higher_is_better: false,
  },
  {
    id: "return_rate",
    label: "Return Rate",
    value: 4.2,
    suffix: "%",
    wow: -0.6,
    mom: -1.1,
    higher_is_better: false,
  },
  {
    id: "avg_delivery",
    label: "Avg Delivery Time",
    value: 3.4,
    suffix: " days",
    wow: -0.3,
    mom: -0.7,
    higher_is_better: false,
  },
  {
    id: "repeat_rate",
    label: "Repeat Purchase Rate",
    value: 38.6,
    suffix: "%",
    wow: 1.2,
    mom: 3.4,
    higher_is_better: true,
  },
]

// ─── Sales Trend (multi-period) ───────────────────────────────────────────────

export const salesTrend: Record<string, TrendPoint[]> = {
  "7d": [
    { period: "Mon", revenue: 68_400, orders: 52 },
    { period: "Tue", revenue: 74_800, orders: 58 },
    { period: "Wed", revenue: 71_200, orders: 55 },
    { period: "Thu", revenue: 82_600, orders: 64 },
    { period: "Fri", revenue: 96_400, orders: 76 },
    { period: "Sat", revenue: 118_200, orders: 94 },
    { period: "Sun", revenue: 104_800, orders: 83 },
  ],
  "30d": [
    { period: "1 Jun", revenue: 58_000, orders: 44 },
    { period: "3 Jun", revenue: 63_400, orders: 49 },
    { period: "5 Jun", revenue: 71_200, orders: 55 },
    { period: "7 Jun", revenue: 68_800, orders: 53 },
    { period: "9 Jun", revenue: 79_600, orders: 61 },
    { period: "11 Jun", revenue: 88_400, orders: 68 },
    { period: "13 Jun", revenue: 84_200, orders: 65 },
    { period: "15 Jun", revenue: 96_600, orders: 75 },
    { period: "17 Jun", revenue: 102_400, orders: 80 },
    { period: "19 Jun", revenue: 94_800, orders: 73 },
    { period: "21 Jun", revenue: 108_600, orders: 84 },
    { period: "23 Jun", revenue: 116_200, orders: 90 },
    { period: "25 Jun", revenue: 122_400, orders: 96 },
    { period: "27 Jun", revenue: 118_800, orders: 93 },
    { period: "29 Jun", revenue: 134_600, orders: 104 },
  ],
  "90d": [
    { period: "Wk 1", revenue: 380_000, orders: 298 },
    { period: "Wk 2", revenue: 412_000, orders: 320 },
    { period: "Wk 3", revenue: 398_000, orders: 312 },
    { period: "Wk 4", revenue: 438_000, orders: 344 },
    { period: "Wk 5", revenue: 452_000, orders: 358 },
    { period: "Wk 6", revenue: 468_000, orders: 370 },
    { period: "Wk 7", revenue: 486_000, orders: 386 },
    { period: "Wk 8", revenue: 502_000, orders: 402 },
    { period: "Wk 9", revenue: 524_000, orders: 420 },
    { period: "Wk 10", revenue: 548_000, orders: 438 },
    { period: "Wk 11", revenue: 536_000, orders: 428 },
    { period: "Wk 12", revenue: 572_000, orders: 458 },
    { period: "Wk 13", revenue: 594_000, orders: 476 },
  ],
  "1y": [
    { period: "Jan", revenue: 1_480_000, orders: 1_180 },
    { period: "Feb", revenue: 1_620_000, orders: 1_290 },
    { period: "Mar", revenue: 1_780_000, orders: 1_420 },
    { period: "Apr", revenue: 1_860_000, orders: 1_480 },
    { period: "May", revenue: 1_940_000, orders: 1_560 },
    { period: "Jun", revenue: 2_080_000, orders: 1_680 },
    { period: "Jul", revenue: 2_160_000, orders: 1_740 },
    { period: "Aug", revenue: 2_280_000, orders: 1_840 },
    { period: "Sep", revenue: 2_180_000, orders: 1_760 },
    { period: "Oct", revenue: 2_380_000, orders: 1_920 },
    { period: "Nov", revenue: 2_520_000, orders: 2_040 },
    { period: "Dec", revenue: 2_780_000, orders: 2_240 },
  ],
}

// ─── Order status breakdown ────────────────────────────────────────────────────

export const orderStatusBreakdown: (BreakdownItem & { color: string })[] = [
  { name: "Delivered",    value: 3680, color: "#10b981" },
  { name: "In Transit",   value: 212,  color: "#3b82f6" },
  { name: "Pending",      value: 150,  color: "#f59e0b" },
  { name: "Cancelled",    value: 176,  color: "#ef4444" },
]

// ─── Product performance ──────────────────────────────────────────────────────

export const topProducts: ProductRow[] = [
  { rank: 1, name: "K&N High-Flow Air Filter",      category: "Engine",      unitsSold: 842, revenue: 412_380, growth: 18.4, returnRate: 1.2, conversionRate: 14.8 },
  { rank: 2, name: "Bosch Platinum Spark Plugs",    category: "Engine",      unitsSold: 726, revenue: 312_180, growth: 12.1, returnRate: 0.8, conversionRate: 11.6 },
  { rank: 3, name: "Brembo Brake Pad Set (Front)",  category: "Brakes",      unitsSold: 618, revenue: 383_160, growth: 9.8,  returnRate: 2.1, conversionRate: 9.4 },
  { rank: 4, name: "Philips LED Headlight Kit",     category: "Electrical",  unitsSold: 594, revenue: 208_338, growth: 22.6, returnRate: 3.4, conversionRate: 13.2 },
  { rank: 5, name: "Amaron 75Ah Car Battery",       category: "Electrical",  unitsSold: 486, revenue: 336_114, growth: 7.3,  returnRate: 0.6, conversionRate: 8.8 },
  { rank: 6, name: "3M Car Dashboard Polish",       category: "Accessories", unitsSold: 1_124, revenue: 148_368, growth: 31.2, returnRate: 0.4, conversionRate: 22.8 },
  { rank: 7, name: "Moto 4-in-1 Alloy Wheel Set",  category: "Tyres",       unitsSold: 228, revenue: 456_000, growth: 4.6,  returnRate: 1.8, conversionRate: 6.2 },
]

export const lowProducts: ProductRow[] = [
  { rank: 1, name: "Generic Wiper Adapter Kit",     category: "Accessories", unitsSold: 18, revenue: 3_060,  growth: -22.4, returnRate: 14.8, conversionRate: 1.2 },
  { rank: 2, name: "Carburettor Cleaning Spray",    category: "Engine",      unitsSold: 24, revenue: 5_760,  growth: -18.6, returnRate: 6.2,  conversionRate: 1.8 },
  { rank: 3, name: "OEM Rear Drum Brake Shoe",      category: "Brakes",      unitsSold: 31, revenue: 7_130,  growth: -14.2, returnRate: 3.8,  conversionRate: 2.4 },
]

export const mostReturnedProducts = [
  { name: "Generic Wiper Adapter Kit",   returnCount: 28, returnRate: 14.8, reason: "Compatibility issue" },
  { name: "Philips LED Headlight Kit",   returnCount: 22, returnRate: 3.4,  reason: "Fitment mismatch" },
  { name: "Car Seat Cover Set (Beige)",  returnCount: 19, returnRate: 8.2,  reason: "Colour difference" },
]

// ─── Category analytics ───────────────────────────────────────────────────────

export const categoryAnalytics = [
  { name: "Engine & Drivetrain", revenue: 860_000, orders: 1_280, growth: 16.4, margin: 28.4 },
  { name: "Brakes & Safety",     revenue: 640_000, orders: 960,   growth: 9.8,  margin: 32.1 },
  { name: "Electrical & Lighting",revenue: 520_000,orders: 1_020, growth: 24.6, margin: 36.8 },
  { name: "Accessories",         revenue: 320_000, orders: 640,   growth: 31.2, margin: 44.2 },
  { name: "Tyres & Wheels",      revenue: 480_000, orders: 420,   growth: 6.2,  margin: 18.6 },
]

// ─── Location insights ────────────────────────────────────────────────────────

export const topLocations: LocationRow[] = [
  { rank: 1, city: "Mumbai",    state: "Maharashtra", orders: 642, revenue: 862_480, growth: 22.4 },
  { rank: 2, city: "Delhi",     state: "Delhi NCR",   orders: 584, revenue: 782_060, growth: 18.6 },
  { rank: 3, city: "Bangalore", state: "Karnataka",   orders: 498, revenue: 668_320, growth: 26.8 },
  { rank: 4, city: "Hyderabad", state: "Telangana",   orders: 412, revenue: 552_680, growth: 14.2 },
  { rank: 5, city: "Pune",      state: "Maharashtra", orders: 374, revenue: 502_040, growth: 19.4 },
  { rank: 6, city: "Chennai",   state: "Tamil Nadu",  orders: 318, revenue: 426_420, growth: 11.8 },
  { rank: 7, city: "Ahmedabad", state: "Gujarat",     orders: 286, revenue: 384_200, growth: 32.1 },
  { rank: 8, city: "Kolkata",   state: "West Bengal", orders: 248, revenue: 332_640, growth: 8.4 },
]

// ─── Customer insights ────────────────────────────────────────────────────────

export const customerTypeSplit: (BreakdownItem & { color: string })[] = [
  { name: "Returning",  value: 62, color: "hsl(262 83% 70%)" },
  { name: "New",        value: 38, color: "hsl(222 84% 60%)" },
]

export const topCustomers: CustomerRow[] = [
  { rank: 1, name: "Rohan Mehta",    orders: 38, revenue: 52_480,  lastOrder: "Today",     type: "returning" },
  { rank: 2, name: "Priya Sharma",   orders: 31, revenue: 41_860,  lastOrder: "2 days ago", type: "returning" },
  { rank: 3, name: "Aarav Singh",    orders: 28, revenue: 38_640,  lastOrder: "Yesterday", type: "returning" },
  { rank: 4, name: "Kiran Rao",      orders: 22, revenue: 30_220,  lastOrder: "3 days ago", type: "returning" },
  { rank: 5, name: "Divya Nair",     orders: 18, revenue: 24_840,  lastOrder: "Today",     type: "new"       },
]

// ─── Time-based behaviour ─────────────────────────────────────────────────────

export const ordersByDayOfWeek = [
  { day: "Mon", orders: 480 },
  { day: "Tue", orders: 524 },
  { day: "Wed", orders: 498 },
  { day: "Thu", orders: 568 },
  { day: "Fri", orders: 682 },
  { day: "Sat", orders: 848 },
  { day: "Sun", orders: 742 },
]

// Hourly buckets grouped for chart (showing 4-hr blocks labelled by start)
export const ordersByHour = [
  { hour: "12am", orders: 42 },
  { hour: "2am",  orders: 24 },
  { hour: "4am",  orders: 18 },
  { hour: "6am",  orders: 56 },
  { hour: "8am",  orders: 148 },
  { hour: "10am", orders: 224 },
  { hour: "12pm", orders: 312 },
  { hour: "2pm",  orders: 286 },
  { hour: "4pm",  orders: 348 },
  { hour: "6pm",  orders: 482 },
  { hour: "7pm",  orders: 584 },
  { hour: "8pm",  orders: 628 },
  { hour: "9pm",  orders: 596 },
  { hour: "10pm", orders: 468 },
  { hour: "11pm", orders: 284 },
]

// ─── Shipping & Logistics ─────────────────────────────────────────────────────

export const courierPerformance: CourierRow[] = [
  { name: "BlueDart",   deliveries: 1_240, avgDays: 2.1, onTime: 96.4, delayed: 3.6 },
  { name: "Delhivery",  deliveries: 1_680, avgDays: 3.2, onTime: 88.6, delayed: 11.4 },
  { name: "Ekart",      deliveries: 840,   avgDays: 3.8, onTime: 84.2, delayed: 15.8 },
  { name: "DTDC",       deliveries: 460,   avgDays: 4.4, onTime: 78.6, delayed: 21.4 },
]

export const shippingCostVsRevenue = [
  { month: "Jan", revenue: 1_480_000, shippingCost: 118_400 },
  { month: "Feb", revenue: 1_620_000, shippingCost: 126_360 },
  { month: "Mar", revenue: 1_780_000, shippingCost: 134_480 },
  { month: "Apr", revenue: 1_860_000, shippingCost: 138_900 },
  { month: "May", revenue: 1_940_000, shippingCost: 143_560 },
  { month: "Jun", revenue: 2_080_000, shippingCost: 149_760 },
  { month: "Jul", revenue: 2_160_000, shippingCost: 154_800 },
  { month: "Aug", revenue: 2_280_000, shippingCost: 159_600 },
]

// ─── Financial ────────────────────────────────────────────────────────────────

export const financialSummary = {
  grossMargin: 28.4,
  netMargin: 18.2,
  discountImpact: 4.8,   // % of revenue lost to discounts
  refundRate: 3.1,        // % of revenue refunded
  cancellationRate: 4.2,  // % of orders cancelled
}

export const refundTrend = [
  { month: "Jan", refunds: 42_000, cancellations: 58_000 },
  { month: "Feb", refunds: 48_600, cancellations: 61_200 },
  { month: "Mar", refunds: 44_200, cancellations: 54_800 },
  { month: "Apr", refunds: 38_800, cancellations: 48_400 },
  { month: "May", refunds: 34_600, cancellations: 44_800 },
  { month: "Jun", refunds: 31_200, cancellations: 40_600 },
  { month: "Jul", refunds: 28_600, cancellations: 37_200 },
  { month: "Aug", refunds: 26_400, cancellations: 34_800 },
]

// ─── Vehicle Analytics ────────────────────────────────────────────────────────

export const vehicleKpis: Kpi[] = [
  { id: "veh_listed",    label: "Vehicles Listed",   value: 62,        wow: 4.8,  mom: 10.7, higher_is_better: true },
  { id: "veh_views",     label: "Total Views",       value: 14_820,    wow: 9.2,  mom: 22.4, higher_is_better: true },
  { id: "veh_inquiries", label: "Total Inquiries",   value: 683,       wow: 11.4, mom: 18.2, higher_is_better: true },
  { id: "veh_revenue",   label: "Vehicle Revenue",   value: 684_500,   wow: 14.6, mom: 22.1, higher_is_better: true, formatAsCurrency: true },
  { id: "veh_sold",      label: "Vehicles Sold",     value: 38,        wow: 5.6,  mom: 12.4, higher_is_better: true },
  { id: "veh_avg_price", label: "Avg Listing Price", value: 11_040,    wow: 2.1,  mom: 3.8,  higher_is_better: true, formatAsCurrency: true },
  { id: "veh_inq_rate",  label: "Inquiry Rate",      value: 4.6, suffix: "%", wow: 1.2, mom: 2.8, higher_is_better: true },
  { id: "veh_conv",      label: "Sale Conversion",   value: 5.6, suffix: "%", wow: 0.8, mom: 1.6, higher_is_better: true },
]

export const vehicleViewsTrend = [
  { month: "Jan", views: 840,   inquiries: 42,  sold: 3 },
  { month: "Feb", views: 920,   inquiries: 56,  sold: 4 },
  { month: "Mar", views: 1_040, inquiries: 68,  sold: 5 },
  { month: "Apr", views: 1_180, inquiries: 74,  sold: 5 },
  { month: "May", views: 1_320, inquiries: 89,  sold: 6 },
  { month: "Jun", views: 1_450, inquiries: 102, sold: 7 },
  { month: "Jul", views: 1_580, inquiries: 118, sold: 8 },
  { month: "Aug", views: 1_720, inquiries: 134, sold: 9 },
]

export const vehicleCategoryBreakdown: (BreakdownItem & { color: string })[] = [
  { name: "SUV",       value: 35, color: "hsl(262 83% 70%)" },
  { name: "Sedan",     value: 28, color: "hsl(222 84% 60%)" },
  { name: "Hatchback", value: 18, color: "hsl(160 84% 60%)" },
  { name: "Sports",    value: 12, color: "hsl(28 92% 65%)" },
  { name: "Luxury",    value: 7,  color: "hsl(348 86% 65%)" },
]

export const vehicleBodyTypeSales = [
  { name: "SUV",       sold: 14, revenue: 280_000 },
  { name: "Sedan",     sold: 10, revenue: 148_000 },
  { name: "Hatchback", sold: 7,  revenue: 63_000 },
  { name: "Sports",    sold: 4,  revenue: 140_000 },
  { name: "Luxury",    sold: 3,  revenue: 187_500 },
]

export const topVehicles = [
  { rank: 1, name: "Toyota Fortuner 4WD",  type: "SUV",       price: 38_50_000, views: 2_840, inquiries: 118, growth: 6.2 },
  { rank: 2, name: "Honda City i-VTEC",    type: "Sedan",     price: 14_20_000, views: 2_240, inquiries: 94,  growth: 3.8 },
  { rank: 3, name: "BMW 3 Series 330i",    type: "Luxury",    price: 62_90_000, views: 1_680, inquiries: 72,  growth: 9.1 },
  { rank: 4, name: "Maruti Swift VXi",     type: "Hatchback", price: 7_80_000,  views: 1_520, inquiries: 62,  growth: -1.4 },
  { rank: 5, name: "Hyundai Creta SX",     type: "SUV",       price: 19_60_000, views: 1_460, inquiries: 58,  growth: 14.8 },
]

export const vehiclePriceDistribution = [
  { range: "< ₹5L",       count: 4 },
  { range: "₹5–10L",      count: 11 },
  { range: "₹10–20L",     count: 18 },
  { range: "₹20–40L",     count: 16 },
  { range: "₹40–60L",     count: 8 },
  { range: "> ₹60L",      count: 5 },
]

// ─── Service Analytics ────────────────────────────────────────────────────────

export const serviceKpis: Kpi[] = [
  { id: "svc_count",   label: "Services Offered",  value: 38,        wow: 5.6,  mom: 11.8, higher_is_better: true },
  { id: "svc_bookings",label: "Total Bookings",    value: 1_124,     wow: 14.2, mom: 21.4, higher_is_better: true },
  { id: "svc_revenue", label: "Service Revenue",   value: 808_520,   wow: 16.8, mom: 28.4, higher_is_better: true, formatAsCurrency: true },
  { id: "svc_aov",     label: "Avg Booking Value", value: 719,       wow: 2.3,  mom: 5.7,  higher_is_better: true, formatAsCurrency: true },
  { id: "svc_rating",  label: "Avg Rating",        value: 4.6, suffix: "★",  wow: 0.2,  mom: 0.4,  higher_is_better: true },
  { id: "svc_repeat",  label: "Rebooking Rate",    value: 42.8, suffix: "%", wow: 1.8,  mom: 4.2,  higher_is_better: true },
  { id: "svc_cancel",  label: "Cancellation Rate", value: 3.2, suffix: "%",  wow: -0.4, mom: -1.2, higher_is_better: false },
  { id: "svc_complete",label: "Completion Rate",   value: 96.8, suffix: "%", wow: 0.4,  mom: 1.2,  higher_is_better: true },
]

export const serviceBookingTrend = [
  { month: "Jan", bookings: 68,  revenue: 48_920,  cancellations: 4 },
  { month: "Feb", bookings: 82,  revenue: 59_020,  cancellations: 5 },
  { month: "Mar", bookings: 98,  revenue: 70_520,  cancellations: 4 },
  { month: "Apr", bookings: 112, revenue: 80_640,  cancellations: 3 },
  { month: "May", bookings: 128, revenue: 92_080,  cancellations: 3 },
  { month: "Jun", bookings: 148, revenue: 106_520, cancellations: 2 },
  { month: "Jul", bookings: 162, revenue: 116_580, cancellations: 2 },
  { month: "Aug", bookings: 188, revenue: 135_280, cancellations: 1 },
]

export const serviceCategoryPerformance = [
  { name: "AC Service",      bookings: 314, revenue: 228_180, rating: 4.7, growth: 28.4 },
  { name: "Engine Repair",   bookings: 248, revenue: 223_200, rating: 4.5, growth: 22.1 },
  { name: "Oil Change",      bookings: 226, revenue: 90_400,  rating: 4.8, growth: 18.6 },
  { name: "Full Detailing",  bookings: 182, revenue: 145_600, rating: 4.9, growth: 31.2 },
  { name: "Tyre Rotation",   bookings: 154, revenue: 61_600,  rating: 4.6, growth: 14.8 },
]

export const topServices = [
  { rank: 1, name: "Full Car Detailing",      category: "Detailing",   bookings: 182, revenue: 145_600, rating: 4.9, growth: 31.2 },
  { rank: 2, name: "AC Gas Refill & Service", category: "AC Service",  bookings: 226, revenue: 135_600, rating: 4.7, growth: 28.4 },
  { rank: 3, name: "Engine Oil Change",       category: "Oil Change",  bookings: 226, revenue: 90_400,  rating: 4.8, growth: 18.6 },
  { rank: 4, name: "Wheel Alignment",         category: "Tyres",       bookings: 154, revenue: 61_600,  rating: 4.6, growth: 14.8 },
  { rank: 5, name: "Engine Diagnostics",      category: "Engine",      bookings: 112, revenue: 100_800, rating: 4.5, growth: 22.1 },
]

export const serviceHourDistribution = [
  { slot: "8–10am", bookings: 124 },
  { slot: "10–12",  bookings: 186 },
  { slot: "12–2pm", bookings: 148 },
  { slot: "2–4pm",  bookings: 212 },
  { slot: "4–6pm",  bookings: 278 },
  { slot: "6–8pm",  bookings: 176 },
]

// ─── Event Analytics ──────────────────────────────────────────────────────────

export const eventKpis: Kpi[] = [
  { id: "evt_total",    label: "Total Events",         value: 29,        wow: 10.3, mom: 20.8, higher_is_better: true },
  { id: "evt_reg",      label: "Total Registrations",  value: 4_812,     wow: 18.4, mom: 26.4, higher_is_better: true },
  { id: "evt_revenue",  label: "Event Revenue",        value: 1_924_800, wow: 24.2, mom: 31.5, higher_is_better: true, formatAsCurrency: true },
  { id: "evt_avg_fee",  label: "Avg Registration Fee", value: 400,       wow: 3.2,  mom: 4.2,  higher_is_better: true, formatAsCurrency: true },
  { id: "evt_upcoming", label: "Upcoming Events",      value: 7,         wow: 16.7, mom: 40.0, higher_is_better: true },
  { id: "evt_ongoing",  label: "Ongoing Events",       value: 4,         wow: 0.0,  mom: 0.0,  higher_is_better: true },
  { id: "evt_fill",     label: "Avg Fill Rate",        value: 74.2, suffix: "%", wow: 2.4,  mom: 6.8, higher_is_better: true },
  { id: "evt_nps",      label: "Attendee NPS",         value: 68,        wow: 2.1,  mom: 5.6,  higher_is_better: true },
]

export const eventRegistrationTrend = [
  { month: "Jan", registrations: 320,  revenue: 128_000,  events: 3 },
  { month: "Feb", registrations: 386,  revenue: 154_400,  events: 4 },
  { month: "Mar", registrations: 468,  revenue: 187_200,  events: 5 },
  { month: "Apr", registrations: 524,  revenue: 209_600,  events: 6 },
  { month: "May", registrations: 612,  revenue: 244_800,  events: 7 },
  { month: "Jun", registrations: 698,  revenue: 279_200,  events: 8 },
  { month: "Jul", registrations: 742,  revenue: 296_800,  events: 9 },
  { month: "Aug", registrations: 862,  revenue: 344_800,  events: 10 },
]

export const eventStatusBreakdown: (BreakdownItem & { color: string })[] = [
  { name: "Completed", value: 18, color: "#6b7280" },
  { name: "Ongoing",   value: 4,  color: "#3b82f6" },
  { name: "Upcoming",  value: 7,  color: "#10b981" },
]

export const eventRegistrationBreakdown: (BreakdownItem & { color: string })[] = [
  { name: "Paid",  value: 3_416, color: "hsl(262 83% 70%)" },
  { name: "Free",  value: 1_396, color: "hsl(222 84% 60%)" },
]

export const topEvents = [
  { rank: 1, name: "Shining Motors Grand Rally",   type: "Rally",       registrations: 842,  revenue: 336_800, fillRate: 94.2, growth: 14.2 },
  { rank: 2, name: "Hyderabad Track Day",           type: "Track Day",   registrations: 624,  revenue: 249_600, fillRate: 88.6, growth: 18.4 },
  { rank: 3, name: "Auto Expo Community Meet",      type: "Expo",        registrations: 512,  revenue: 102_400, fillRate: 76.2, growth: 6.7 },
  { rank: 4, name: "Night Drive Club",              type: "Night Drive", registrations: 384,  revenue: 76_800,  fillRate: 68.4, growth: -2.8 },
  { rank: 5, name: "Motorbike Hill Climb",          type: "Racing",      registrations: 296,  revenue: 118_400, fillRate: 82.4, growth: 22.6 },
]

export const eventTypeBreakdown = [
  { name: "Track Day",    count: 6,  revenue: 412_000 },
  { name: "Rally",        count: 5,  revenue: 368_000 },
  { name: "Expo / Meet",  count: 8,  revenue: 296_000 },
  { name: "Night Drive",  count: 6,  revenue: 184_000 },
  { name: "Racing",       count: 4,  revenue: 248_000 },
]

export const eventMonthlyGrowth = [
  { month: "Jan", paid: 240, free: 80 },
  { month: "Feb", paid: 290, free: 96 },
  { month: "Mar", paid: 352, free: 116 },
  { month: "Apr", paid: 394, free: 130 },
  { month: "May", paid: 462, free: 150 },
  { month: "Jun", paid: 524, free: 174 },
  { month: "Jul", paid: 558, free: 184 },
  { month: "Aug", paid: 648, free: 214 },
]
