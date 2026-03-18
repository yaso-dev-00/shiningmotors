// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceCategory = "Maintenance" | "Repair" | "Cleaning" | "Inspection"

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Maintenance", "Repair", "Cleaning", "Inspection",
]

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  Maintenance: "hsl(262 83% 70%)",
  Repair:      "hsl(348 86% 65%)",
  Cleaning:    "hsl(160 84% 60%)",
  Inspection:  "hsl(222 84% 60%)",
}

export const LOCATIONS = ["All Locations", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"]

export type ServiceItem = {
  id:               string
  name:             string
  category:         ServiceCategory
  price:            number
  totalBookings:    number
  revenue:          number
  rating:           number
  utilizationRate:  number   // % of available slots used
  availableSlots:   number   // total slots this period
  usedSlots:        number
  growth:           number   // MoM %
  lastBooked:       string
  avgDuration:      number   // minutes
}

// ─── 32 services across 4 categories ─────────────────────────────────────────

export const allServices: ServiceItem[] = [
  // ── Maintenance (8) ──────────────────────────────────────────────────────
  { id: "m1", name: "Engine Oil Change",          category: "Maintenance", price: 799,   totalBookings: 624, revenue: 498_576, rating: 4.8, utilizationRate: 88, availableSlots: 710, usedSlots: 624, growth: 18.4, lastBooked: "Today",     avgDuration: 45  },
  { id: "m2", name: "Tyre Rotation",              category: "Maintenance", price: 399,   totalBookings: 512, revenue: 204_288, rating: 4.6, utilizationRate: 72, availableSlots: 710, usedSlots: 512, growth: 12.1, lastBooked: "Today",     avgDuration: 30  },
  { id: "m3", name: "Air Filter Replacement",     category: "Maintenance", price: 499,   totalBookings: 386, revenue: 192_614, rating: 4.7, utilizationRate: 54, availableSlots: 710, usedSlots: 386, growth: 9.8,  lastBooked: "Yesterday", avgDuration: 20  },
  { id: "m4", name: "Brake Fluid Top-Up",         category: "Maintenance", price: 349,   totalBookings: 298, revenue: 104_002, rating: 4.5, utilizationRate: 42, availableSlots: 710, usedSlots: 298, growth: 6.2,  lastBooked: "Yesterday", avgDuration: 25  },
  { id: "m5", name: "Coolant Flush",              category: "Maintenance", price: 649,   totalBookings: 224, revenue: 145_376, rating: 4.6, utilizationRate: 32, availableSlots: 700, usedSlots: 224, growth: 4.8,  lastBooked: "2 days ago", avgDuration: 40 },
  { id: "m6", name: "Spark Plug Replacement",     category: "Maintenance", price: 899,   totalBookings: 186, revenue: 167_214, rating: 4.7, utilizationRate: 26, availableSlots: 700, usedSlots: 186, growth: 7.6,  lastBooked: "2 days ago", avgDuration: 35 },
  { id: "m7", name: "Cabin Air Filter Change",    category: "Maintenance", price: 449,   totalBookings: 142, revenue:  63_758, rating: 4.4, utilizationRate: 20, availableSlots: 700, usedSlots: 142, growth: 3.2,  lastBooked: "3 days ago", avgDuration: 20 },
  { id: "m8", name: "Battery Health Check",       category: "Maintenance", price: 299,   totalBookings:  98, revenue:  29_302, rating: 4.3, utilizationRate: 14, availableSlots: 700, usedSlots:  98, growth: -1.4, lastBooked: "4 days ago", avgDuration: 15 },

  // ── Repair (8) ───────────────────────────────────────────────────────────
  { id: "r1", name: "Engine Diagnostics",         category: "Repair",      price: 1_299, totalBookings: 348, revenue: 452_052, rating: 4.7, utilizationRate: 78, availableSlots: 450, usedSlots: 348, growth: 22.1, lastBooked: "Today",     avgDuration: 60  },
  { id: "r2", name: "Brake Pad Replacement",      category: "Repair",      price: 2_499, totalBookings: 286, revenue: 714_714, rating: 4.8, utilizationRate: 64, availableSlots: 450, usedSlots: 286, growth: 14.6, lastBooked: "Today",     avgDuration: 90  },
  { id: "r3", name: "AC Repair & Recharge",       category: "Repair",      price: 1_999, totalBookings: 248, revenue: 495_752, rating: 4.6, utilizationRate: 55, availableSlots: 450, usedSlots: 248, growth: 28.4, lastBooked: "Yesterday", avgDuration: 120 },
  { id: "r4", name: "Suspension Overhaul",        category: "Repair",      price: 3_499, totalBookings: 124, revenue: 433_876, rating: 4.5, utilizationRate: 28, availableSlots: 450, usedSlots: 124, growth: 8.2,  lastBooked: "2 days ago", avgDuration: 180 },
  { id: "r5", name: "Exhaust System Repair",      category: "Repair",      price: 1_499, totalBookings:  98, revenue: 146_902, rating: 4.4, utilizationRate: 22, availableSlots: 450, usedSlots:  98, growth: 5.6,  lastBooked: "2 days ago", avgDuration: 90  },
  { id: "r6", name: "Timing Belt Replacement",    category: "Repair",      price: 4_999, totalBookings:  76, revenue: 379_924, rating: 4.9, utilizationRate: 17, availableSlots: 450, usedSlots:  76, growth: 11.2, lastBooked: "3 days ago", avgDuration: 240 },
  { id: "r7", name: "Fuel System Cleaning",       category: "Repair",      price: 999,   totalBookings:  62, revenue:  61_938, rating: 4.3, utilizationRate: 14, availableSlots: 450, usedSlots:  62, growth: -2.8, lastBooked: "4 days ago", avgDuration: 60  },
  { id: "r8", name: "Electrical Fault Diagnosis", category: "Repair",      price: 849,   totalBookings:  44, revenue:  37_356, rating: 4.2, utilizationRate: 10, availableSlots: 450, usedSlots:  44, growth: 3.4,  lastBooked: "5 days ago", avgDuration: 75  },

  // ── Cleaning (8) ─────────────────────────────────────────────────────────
  { id: "c1", name: "Full Car Detailing",          category: "Cleaning",    price: 3_499, totalBookings: 412, revenue: 1_441_488, rating: 4.9, utilizationRate: 82, availableSlots: 500, usedSlots: 412, growth: 31.2, lastBooked: "Today",     avgDuration: 300 },
  { id: "c2", name: "Exterior Wash & Polish",      category: "Cleaning",    price: 799,   totalBookings: 524, revenue: 418_676,   rating: 4.7, utilizationRate: 74, availableSlots: 710, usedSlots: 524, growth: 16.8, lastBooked: "Today",     avgDuration: 90  },
  { id: "c3", name: "Interior Deep Clean",         category: "Cleaning",    price: 1_299, totalBookings: 348, revenue: 452_052,   rating: 4.8, utilizationRate: 62, availableSlots: 560, usedSlots: 348, growth: 24.6, lastBooked: "Today",     avgDuration: 120 },
  { id: "c4", name: "Ceramic Coating",             category: "Cleaning",    price: 8_999, totalBookings:  86, revenue: 773_914,   rating: 4.9, utilizationRate: 43, availableSlots: 200, usedSlots:  86, growth: 42.8, lastBooked: "Yesterday", avgDuration: 480 },
  { id: "c5", name: "Engine Bay Cleaning",         category: "Cleaning",    price: 999,   totalBookings: 196, revenue: 195_804,   rating: 4.6, utilizationRate: 39, availableSlots: 500, usedSlots: 196, growth: 8.4,  lastBooked: "Yesterday", avgDuration: 60  },
  { id: "c6", name: "Seat & Upholstery Shampoo",  category: "Cleaning",    price: 1_499, totalBookings: 148, revenue: 221_852,   rating: 4.7, utilizationRate: 30, availableSlots: 500, usedSlots: 148, growth: 14.2, lastBooked: "2 days ago", avgDuration: 90 },
  { id: "c7", name: "Odour Elimination Treatment", category: "Cleaning",    price: 1_199, totalBookings:  94, revenue: 112_706,   rating: 4.5, utilizationRate: 19, availableSlots: 500, usedSlots:  94, growth: 6.8,  lastBooked: "3 days ago", avgDuration: 60 },
  { id: "c8", name: "Headlight Restoration",       category: "Cleaning",    price: 699,   totalBookings:  68, revenue:  47_532,   rating: 4.3, utilizationRate: 14, availableSlots: 500, usedSlots:  68, growth: -3.2, lastBooked: "4 days ago", avgDuration: 45 },

  // ── Inspection (8) ────────────────────────────────────────────────────────
  { id: "i1", name: "Pre-Purchase Inspection",    category: "Inspection",  price: 1_999, totalBookings: 286, revenue: 571_714, rating: 4.8, utilizationRate: 64, availableSlots: 450, usedSlots: 286, growth: 19.4, lastBooked: "Today",     avgDuration: 120 },
  { id: "i2", name: "Annual Roadworthiness Check",category: "Inspection",  price: 1_299, totalBookings: 248, revenue: 322_252, rating: 4.7, utilizationRate: 55, availableSlots: 450, usedSlots: 248, growth: 12.8, lastBooked: "Today",     avgDuration: 90  },
  { id: "i3", name: "Emissions Test",             category: "Inspection",  price: 499,   totalBookings: 384, revenue: 191_616, rating: 4.5, utilizationRate: 54, availableSlots: 710, usedSlots: 384, growth: 8.6,  lastBooked: "Today",     avgDuration: 30  },
  { id: "i4", name: "Pre-Trip Safety Check",      category: "Inspection",  price: 699,   totalBookings: 312, revenue: 218_088, rating: 4.6, utilizationRate: 44, availableSlots: 710, usedSlots: 312, growth: 22.4, lastBooked: "Yesterday", avgDuration: 45  },
  { id: "i5", name: "Tyre Depth & Pressure Check",category: "Inspection",  price: 299,   totalBookings: 428, revenue: 127_972, rating: 4.5, utilizationRate: 60, availableSlots: 710, usedSlots: 428, growth: 6.2,  lastBooked: "Today",     avgDuration: 20  },
  { id: "i6", name: "Brake System Inspection",    category: "Inspection",  price: 599,   totalBookings: 268, revenue: 160_532, rating: 4.7, utilizationRate: 38, availableSlots: 710, usedSlots: 268, growth: 9.8,  lastBooked: "Yesterday", avgDuration: 40  },
  { id: "i7", name: "Lights & Electricals Check", category: "Inspection",  price: 399,   totalBookings: 186, revenue:  74_214, rating: 4.4, utilizationRate: 26, availableSlots: 710, usedSlots: 186, growth: 4.2,  lastBooked: "2 days ago", avgDuration: 30 },
  { id: "i8", name: "Under-Body Inspection",      category: "Inspection",  price: 799,   totalBookings: 112, revenue:  89_488, rating: 4.6, utilizationRate: 16, availableSlots: 710, usedSlots: 112, growth: 7.6,  lastBooked: "3 days ago", avgDuration: 60 },
]

// ─── Category roll-ups (derived) ──────────────────────────────────────────────

export type CategorySummary = {
  category:     ServiceCategory
  services:     number
  bookings:     number
  revenue:      number
  avgRating:    number
  avgUtil:      number
  growth:       number
  color:        string
}

export const categoryRollups: CategorySummary[] = SERVICE_CATEGORIES.map((cat) => {
  const s = allServices.filter((x) => x.category === cat)
  return {
    category:  cat,
    services:  s.length,
    bookings:  s.reduce((a, x) => a + x.totalBookings, 0),
    revenue:   s.reduce((a, x) => a + x.revenue, 0),
    avgRating: +( s.reduce((a, x) => a + x.rating, 0) / s.length ).toFixed(1),
    avgUtil:   +( s.reduce((a, x) => a + x.utilizationRate, 0) / s.length ).toFixed(1),
    growth:    +( s.reduce((a, x) => a + x.growth, 0) / s.length ).toFixed(1),
    color:     CATEGORY_COLORS[cat],
  }
})

// ─── Revenue trend (period-keyed) ─────────────────────────────────────────────

export type RevenueTrendPoint = {
  period:      string
  Maintenance: number
  Repair:      number
  Cleaning:    number
  Inspection:  number
  total:       number
}

export const revenueTrend: Record<string, RevenueTrendPoint[]> = {
  "7d": [
    { period: "Mon", Maintenance:  68_400, Repair:  92_800, Cleaning: 128_400, Inspection:  54_200, total: 343_800 },
    { period: "Tue", Maintenance:  74_800, Repair:  98_600, Cleaning: 142_600, Inspection:  58_400, total: 374_400 },
    { period: "Wed", Maintenance:  71_200, Repair:  94_200, Cleaning: 134_800, Inspection:  56_100, total: 356_300 },
    { period: "Thu", Maintenance:  82_600, Repair: 112_400, Cleaning: 156_200, Inspection:  64_800, total: 416_000 },
    { period: "Fri", Maintenance:  96_400, Repair: 128_600, Cleaning: 182_400, Inspection:  76_200, total: 483_600 },
    { period: "Sat", Maintenance: 118_200, Repair: 148_400, Cleaning: 218_600, Inspection:  92_800, total: 578_000 },
    { period: "Sun", Maintenance: 104_800, Repair: 136_200, Cleaning: 198_400, Inspection:  82_600, total: 522_000 },
  ],
  "30d": Array.from({ length: 15 }, (_, i) => ({
    period:      `${i * 2 + 1} Jun`,
    Maintenance: 58_000 + i * 4_200,
    Repair:      82_000 + i * 5_600,
    Cleaning:    112_000 + i * 7_200,
    Inspection:  44_000 + i * 2_800,
    total:       296_000 + i * 19_800,
  })),
  "90d": Array.from({ length: 13 }, (_, i) => ({
    period:      `Wk ${i + 1}`,
    Maintenance: 380_000 + i * 12_000,
    Repair:      520_000 + i * 16_000,
    Cleaning:    680_000 + i * 22_000,
    Inspection:  280_000 + i *  9_000,
    total:      1_860_000 + i * 59_000,
  })),
  "1y": [
    { period: "Jan", Maintenance: 1_280_000, Repair: 1_820_000, Cleaning: 2_340_000, Inspection: 960_000, total:  6_400_000 },
    { period: "Feb", Maintenance: 1_360_000, Repair: 1_940_000, Cleaning: 2_480_000, Inspection: 1_020_000, total: 6_800_000 },
    { period: "Mar", Maintenance: 1_480_000, Repair: 2_120_000, Cleaning: 2_680_000, Inspection: 1_120_000, total: 7_400_000 },
    { period: "Apr", Maintenance: 1_560_000, Repair: 2_240_000, Cleaning: 2_840_000, Inspection: 1_160_000, total: 7_800_000 },
    { period: "May", Maintenance: 1_640_000, Repair: 2_360_000, Cleaning: 3_020_000, Inspection: 1_220_000, total: 8_240_000 },
    { period: "Jun", Maintenance: 1_760_000, Repair: 2_520_000, Cleaning: 3_240_000, Inspection: 1_320_000, total: 8_840_000 },
    { period: "Jul", Maintenance: 1_840_000, Repair: 2_640_000, Cleaning: 3_380_000, Inspection: 1_380_000, total: 9_240_000 },
    { period: "Aug", Maintenance: 1_960_000, Repair: 2_820_000, Cleaning: 3_580_000, Inspection: 1_480_000, total: 9_840_000 },
  ],
}

// ─── Booking trend ────────────────────────────────────────────────────────────

export const bookingTrend: Record<string, { period: string; bookings: number }[]> = {
  "7d": [
    { period: "Mon", bookings: 124 },
    { period: "Tue", bookings: 138 },
    { period: "Wed", bookings: 131 },
    { period: "Thu", bookings: 156 },
    { period: "Fri", bookings: 182 },
    { period: "Sat", bookings: 224 },
    { period: "Sun", bookings: 198 },
  ],
  "30d": Array.from({ length: 15 }, (_, i) => ({ period: `${i * 2 + 1} Jun`, bookings: 108 + i * 7 })),
  "90d": Array.from({ length: 13 }, (_, i) => ({ period: `Wk ${i + 1}`, bookings: 720 + i * 48 })),
  "1y": [
    { period: "Jan", bookings: 2_840 }, { period: "Feb", bookings: 3_120 },
    { period: "Mar", bookings: 3_480 }, { period: "Apr", bookings: 3_680 },
    { period: "May", bookings: 3_920 }, { period: "Jun", bookings: 4_240 },
    { period: "Jul", bookings: 4_440 }, { period: "Aug", bookings: 4_720 },
  ],
}

// ─── Slot heatmap data (timeSlot × dayOfWeek) ─────────────────────────────────

export const TIME_SLOTS = ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm"]
export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// bookings[dayIndex][slotIndex]
export const heatmapData: number[][] = [
  [12, 18, 22, 24, 20, 18, 16, 14, 18, 24, 28, 22, 14], // Mon
  [14, 20, 24, 26, 22, 20, 18, 16, 20, 26, 30, 24, 16], // Tue
  [13, 19, 23, 25, 21, 19, 17, 15, 19, 25, 29, 23, 15], // Wed
  [16, 22, 28, 30, 26, 24, 22, 20, 24, 32, 36, 28, 18], // Thu
  [20, 28, 34, 36, 32, 28, 26, 24, 28, 38, 44, 34, 22], // Fri
  [28, 38, 46, 48, 44, 40, 36, 32, 36, 48, 54, 42, 28], // Sat
  [24, 34, 42, 44, 40, 36, 32, 28, 32, 44, 50, 38, 24], // Sun
]

// ─── Underutilized services ───────────────────────────────────────────────────

export const underutilizedServices = allServices
  .filter((s) => s.utilizationRate < 25)
  .sort((a, b) => a.utilizationRate - b.utilizationRate)
  .slice(0, 6)

// ─── Overall KPIs ─────────────────────────────────────────────────────────────

export const serviceKpiSummary = {
  totalRevenue:      allServices.reduce((a, s) => a + s.revenue, 0),
  totalBookings:     allServices.reduce((a, s) => a + s.totalBookings, 0),
  activeServices:    allServices.length,
  avgUtilization:    +(allServices.reduce((a, s) => a + s.utilizationRate, 0) / allServices.length).toFixed(1),
  avgRating:         +(allServices.reduce((a, s) => a + s.rating, 0) / allServices.length).toFixed(2),
  revenueWoW:        16.8,
  revenueMoM:        28.4,
  bookingsWoW:       14.2,
  bookingsMoM:       22.6,
  utilizationWoW:    3.4,
  utilizationMoM:    7.2,
}
