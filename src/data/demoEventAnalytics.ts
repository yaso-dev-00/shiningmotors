// ─── Types ────────────────────────────────────────────────────────────────────

export type EventStatus   = "active" | "completed" | "cancelled"
export type EventCategory = "Race" | "Track Day" | "Workshop" | "Meetup" | "Expo" | "Rally"

export const EVENT_CATEGORIES: EventCategory[] = ["Race", "Track Day", "Workshop", "Meetup", "Expo", "Rally"]
export const EVENT_LOCATIONS = ["All Locations", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"]

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  Race:      "hsl(348 86% 65%)",
  "Track Day": "hsl(262 83% 70%)",
  Workshop:  "hsl(160 84% 60%)",
  Meetup:    "hsl(222 84% 60%)",
  Expo:      "hsl(28 92% 65%)",
  Rally:     "hsl(48 96% 58%)",
}

export type DemoEvent = {
  id:            string
  title:         string
  category:      EventCategory
  city:          string
  state:         string
  startDate:     string
  endDate:       string
  fee:           number    // 0 = free
  maxParticipants: number
  registrations:  number
  revenue:        number
  status:        EventStatus
  organizer:     string
  fillRate:      number    // %
  growth:        number    // MoM %
  avgRating:     number
}

export type AlertItem = {
  id: string; type: "warning" | "positive" | "info"; title: string; message: string
}

// ─── Events (24 events) ───────────────────────────────────────────────────────

export const demoEvents: DemoEvent[] = [
  // ── RACES ─────────────────────────────────────────────────────────────────
  { id: "e01", title: "Shining Motors Grand Prix",      category: "Race",      city: "Mumbai",    state: "Maharashtra", startDate: "2025-08-14", endDate: "2025-08-15", fee: 800,  maxParticipants: 500, registrations: 482, revenue: 385_600, status: "active",    organizer: "Rahul Verma",    fillRate: 96.4, growth: 14.2,  avgRating: 4.8 },
  { id: "e02", title: "Drift Masters Championship",     category: "Race",      city: "Delhi",     state: "Delhi",       startDate: "2025-07-20", endDate: "2025-07-21", fee: 1_500,maxParticipants: 300, registrations: 268, revenue: 402_000, status: "completed", organizer: "Arjun Kapoor",   fillRate: 89.3, growth: 22.4,  avgRating: 4.7 },
  { id: "e03", title: "Quarter Mile Race Series",       category: "Race",      city: "Chennai",   state: "Tamil Nadu",  startDate: "2025-09-05", endDate: "2025-09-06", fee: 600,  maxParticipants: 400, registrations: 312, revenue: 187_200, status: "active",    organizer: "Suresh Kumar",   fillRate: 78.0, growth: 8.6,   avgRating: 4.5 },
  { id: "e04", title: "Speed Fest 2025",                category: "Race",      city: "Delhi",     state: "Delhi",       startDate: "2025-06-10", endDate: "2025-06-11", fee: 1_000,maxParticipants: 350, registrations: 218, revenue: 218_000, status: "completed", organizer: "Arjun Kapoor",   fillRate: 62.3, growth: -4.8,  avgRating: 4.2 },

  // ── TRACK DAYS ─────────────────────────────────────────────────────────────
  { id: "e05", title: "Hyderabad Track Day",            category: "Track Day", city: "Hyderabad", state: "Telangana",   startDate: "2025-08-02", endDate: "2025-08-02", fee: 1_200,maxParticipants: 120, registrations: 118, revenue: 141_600, status: "active",    organizer: "Vikram Reddy",   fillRate: 98.3, growth: 18.4,  avgRating: 4.9 },
  { id: "e06", title: "Pune Circuit Open Day",          category: "Track Day", city: "Pune",      state: "Maharashtra", startDate: "2025-07-15", endDate: "2025-07-15", fee: 900,  maxParticipants: 80,  registrations: 72,  revenue:  64_800, status: "completed", organizer: "Rahul Verma",    fillRate: 90.0, growth: 11.2,  avgRating: 4.7 },
  { id: "e07", title: "Bangalore Raceway Experience",   category: "Track Day", city: "Bangalore", state: "Karnataka",   startDate: "2025-09-20", endDate: "2025-09-20", fee: 1_400,maxParticipants: 100, registrations: 86,  revenue: 120_400, status: "active",    organizer: "Kiran Nair",     fillRate: 86.0, growth: 24.6,  avgRating: 4.8 },

  // ── WORKSHOPS ──────────────────────────────────────────────────────────────
  { id: "e08", title: "Car Photography Masterclass",   category: "Workshop",  city: "Bangalore", state: "Karnataka",   startDate: "2025-08-10", endDate: "2025-08-10", fee: 2_000,maxParticipants: 50,  registrations: 50,  revenue: 100_000, status: "active",    organizer: "Kiran Nair",     fillRate: 100.0,growth: 31.2,  avgRating: 4.9 },
  { id: "e09", title: "Defensive Driving Course",      category: "Workshop",  city: "Mumbai",    state: "Maharashtra", startDate: "2025-07-28", endDate: "2025-07-29", fee: 1_800,maxParticipants: 40,  registrations: 38,  revenue:  68_400, status: "completed", organizer: "Rahul Verma",    fillRate: 95.0, growth: 16.8,  avgRating: 4.8 },
  { id: "e10", title: "EV Technology Workshop",        category: "Workshop",  city: "Pune",      state: "Maharashtra", startDate: "2025-09-12", endDate: "2025-09-12", fee: 0,    maxParticipants: 200, registrations: 124, revenue:       0, status: "active",    organizer: "Vikram Reddy",   fillRate: 62.0, growth: 44.2,  avgRating: 4.6 },
  { id: "e11", title: "Car Maintenance for Beginners", category: "Workshop",  city: "Chennai",   state: "Tamil Nadu",  startDate: "2025-06-22", endDate: "2025-06-22", fee: 1_200,maxParticipants: 60,  registrations: 32,  revenue:  38_400, status: "completed", organizer: "Suresh Kumar",   fillRate: 53.3, growth: -6.2,  avgRating: 4.1 },

  // ── MEETUPS ────────────────────────────────────────────────────────────────
  { id: "e12", title: "Classic Car Owners Meetup",     category: "Meetup",    city: "Mumbai",    state: "Maharashtra", startDate: "2025-08-18", endDate: "2025-08-18", fee: 0,    maxParticipants: 300, registrations: 286, revenue:       0, status: "active",    organizer: "Priya Shah",     fillRate: 95.3, growth: 28.4,  avgRating: 4.7 },
  { id: "e13", title: "Sunday Morning Cruise",         category: "Meetup",    city: "Pune",      state: "Maharashtra", startDate: "2025-07-06", endDate: "2025-07-06", fee: 0,    maxParticipants: 150, registrations: 148, revenue:       0, status: "completed", organizer: "Rahul Verma",    fillRate: 98.7, growth: 12.1,  avgRating: 4.8 },
  { id: "e14", title: "EV Owners Community Drive",     category: "Meetup",    city: "Bangalore", state: "Karnataka",   startDate: "2025-09-01", endDate: "2025-09-01", fee: 0,    maxParticipants: 200, registrations: 168, revenue:       0, status: "active",    organizer: "Kiran Nair",     fillRate: 84.0, growth: 36.8,  avgRating: 4.6 },
  { id: "e15", title: "Night Drive Enthusiasts",       category: "Meetup",    city: "Hyderabad", state: "Telangana",   startDate: "2025-06-15", endDate: "2025-06-15", fee: 0,    maxParticipants: 100, registrations: 48,  revenue:       0, status: "cancelled", organizer: "Vikram Reddy",   fillRate: 48.0, growth: -24.0, avgRating: 3.8 },

  // ── EXPOS ──────────────────────────────────────────────────────────────────
  { id: "e16", title: "Auto Expo Weekend 2025",        category: "Expo",      city: "Delhi",     state: "Delhi",       startDate: "2025-08-22", endDate: "2025-08-24", fee: 500,  maxParticipants: 2000,registrations: 1842,revenue: 921_000, status: "active",    organizer: "Arjun Kapoor",   fillRate: 92.1, growth: 19.4,  avgRating: 4.7 },
  { id: "e17", title: "Moto Festival India",           category: "Expo",      city: "Bangalore", state: "Karnataka",   startDate: "2025-07-11", endDate: "2025-07-13", fee: 400,  maxParticipants: 1500,registrations: 1248,revenue: 499_200, status: "completed", organizer: "Kiran Nair",     fillRate: 83.2, growth: 14.6,  avgRating: 4.6 },
  { id: "e18", title: "Supercar Showcase",             category: "Expo",      city: "Mumbai",    state: "Maharashtra", startDate: "2025-06-28", endDate: "2025-06-29", fee: 1_200,maxParticipants: 400, registrations: 224, revenue: 268_800, status: "completed", organizer: "Priya Shah",     fillRate: 56.0, growth: -8.2,  avgRating: 4.0 },

  // ── RALLIES ────────────────────────────────────────────────────────────────
  { id: "e19", title: "Western Ghats Hill Rally",      category: "Rally",     city: "Pune",      state: "Maharashtra", startDate: "2025-09-08", endDate: "2025-09-09", fee: 2_500,maxParticipants: 200, registrations: 186, revenue: 465_000, status: "active",    organizer: "Rahul Verma",    fillRate: 93.0, growth: 26.8,  avgRating: 4.9 },
  { id: "e20", title: "Desert Storm Rally",            category: "Rally",     city: "Hyderabad", state: "Telangana",   startDate: "2025-07-24", endDate: "2025-07-26", fee: 3_000,maxParticipants: 150, registrations: 128, revenue: 384_000, status: "completed", organizer: "Vikram Reddy",   fillRate: 85.3, growth: 32.4,  avgRating: 4.8 },
  { id: "e21", title: "Coastal Highway Rally",         category: "Rally",     city: "Chennai",   state: "Tamil Nadu",  startDate: "2025-08-30", endDate: "2025-08-31", fee: 1_800,maxParticipants: 120, registrations: 68,  revenue: 122_400, status: "active",    organizer: "Suresh Kumar",   fillRate: 56.7, growth: 4.2,   avgRating: 4.3 },
  { id: "e22", title: "Himalaya Circuit Challenge",    category: "Rally",     city: "Delhi",     state: "Delhi",       startDate: "2025-06-05", endDate: "2025-06-08", fee: 4_000,maxParticipants: 80,  registrations: 34,  revenue: 136_000, status: "completed", organizer: "Arjun Kapoor",   fillRate: 42.5, growth: -12.4, avgRating: 4.1 },
  { id: "e23", title: "Karnataka Jungle Trail",        category: "Rally",     city: "Bangalore", state: "Karnataka",   startDate: "2025-05-18", endDate: "2025-05-20", fee: 2_200,maxParticipants: 100, registrations: 62,  revenue: 136_400, status: "cancelled", organizer: "Kiran Nair",     fillRate: 62.0, growth: -18.6, avgRating: 3.6 },
  { id: "e24", title: "Deccan Plate Off-Road Rally",   category: "Rally",     city: "Hyderabad", state: "Telangana",   startDate: "2025-09-28", endDate: "2025-09-29", fee: 2_000,maxParticipants: 160, registrations: 142, revenue: 284_000, status: "active",    organizer: "Vikram Reddy",   fillRate: 88.8, growth: 22.1,  avgRating: 4.7 },
]

// ─── KPI summary ──────────────────────────────────────────────────────────────

const totalRevenue  = demoEvents.reduce((a, e) => a + e.revenue, 0)
const totalBookings = demoEvents.reduce((a, e) => a + e.registrations, 0)

export const eventKpiSummary = {
  totalEvents:        demoEvents.length,
  activeEvents:       demoEvents.filter((e) => e.status === "active").length,
  completedEvents:    demoEvents.filter((e) => e.status === "completed").length,
  cancelledEvents:    demoEvents.filter((e) => e.status === "cancelled").length,
  totalBookings,
  totalRevenue,
  avgParticipants:    Math.round(totalBookings / demoEvents.length),
  avgFillRate:        +(demoEvents.reduce((a, e) => a + e.fillRate, 0) / demoEvents.length).toFixed(1),
  paidEvents:         demoEvents.filter((e) => e.fee > 0).length,
  freeEvents:         demoEvents.filter((e) => e.fee === 0).length,
  eventsAtCapacity:   demoEvents.filter((e) => e.fillRate >= 90).length,
  // change metrics
  revenueWoW: 16.8, revenueMoM: 24.2,
  bookingsWoW: 12.4, bookingsMoM: 18.6,
  fillRateWoW: 2.8,  fillRateMoM: 5.4,
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

export const eventAlerts: AlertItem[] = [
  { id: "a1", type: "positive",
    title: "3 events near full capacity",
    message: "Hyderabad Track Day (98.3%), Car Photography Masterclass (100%), and Sunday Morning Cruise (98.7%) are near or at capacity. Consider opening a waitlist." },
  { id: "a2", type: "warning",
    title: "Low fill rate detected — 4 events underperforming",
    message: "Speed Fest 2025 (62.3%), Himalaya Circuit Challenge (42.5%), Supercar Showcase (56%) and Coastal Highway Rally (56.7%) are below 65% fill rate. Boost promotion." },
  { id: "a3", type: "info",
    title: "EV segment growing fast",
    message: "EV Technology Workshop registrations up +44.2% MoM. EV Owners Community Drive up +36.8% MoM. Strong demand signal for more EV-focused events." },
  { id: "a4", type: "warning",
    title: "2 events cancelled this period",
    message: "Night Drive Enthusiasts and Karnataka Jungle Trail were cancelled with 48 and 62 registrations respectively. Review cancellation reasons and communicate refunds." },
]

// ─── Booking trend (multi-period) ────────────────────────────────────────────

export const bookingTrend: Record<string, { period: string; bookings: number; revenue: number }[]> = {
  "7d": [
    { period: "Mon", bookings: 82,  revenue: 128_400 },
    { period: "Tue", bookings: 96,  revenue: 148_800 },
    { period: "Wed", bookings: 88,  revenue: 136_400 },
    { period: "Thu", bookings: 118, revenue: 186_400 },
    { period: "Fri", bookings: 148, revenue: 236_600 },
    { period: "Sat", bookings: 196, revenue: 312_000 },
    { period: "Sun", bookings: 172, revenue: 274_400 },
  ],
  "30d": Array.from({ length: 15 }, (_, i) => ({
    period: `${i * 2 + 1} Jun`,
    bookings: 68 + i * 9,
    revenue:  108_400 + i * 14_200,
  })),
  "90d": Array.from({ length: 13 }, (_, i) => ({
    period: `Wk ${i + 1}`,
    bookings: 420 + i * 48,
    revenue:  680_000 + i * 72_000,
  })),
  "1y": [
    { period: "Jan", bookings: 1_240, revenue: 1_980_000 },
    { period: "Feb", bookings: 1_380, revenue: 2_200_000 },
    { period: "Mar", bookings: 1_540, revenue: 2_460_000 },
    { period: "Apr", bookings: 1_680, revenue: 2_680_000 },
    { period: "May", bookings: 1_820, revenue: 2_920_000 },
    { period: "Jun", bookings: 1_960, revenue: 3_140_000 },
    { period: "Jul", bookings: 2_140, revenue: 3_420_000 },
    { period: "Aug", bookings: 2_320, revenue: 3_720_000 },
    { period: "Sep", bookings: 2_480, revenue: 3_960_000 },
    { period: "Oct", bookings: 2_640, revenue: 4_220_000 },
    { period: "Nov", bookings: 2_840, revenue: 4_540_000 },
    { period: "Dec", bookings: 3_120, revenue: 4_980_000 },
  ],
}

// ─── Revenue: free vs paid stacked trend ─────────────────────────────────────

export const freePaidRevenueTrend = [
  { month: "Jan", paid: 1_980_000, free: 0 },
  { month: "Feb", paid: 2_200_000, free: 0 },
  { month: "Mar", paid: 2_460_000, free: 0 },
  { month: "Apr", paid: 2_680_000, free: 0 },
  { month: "May", paid: 2_920_000, free: 0 },
  { month: "Jun", paid: 2_840_000, free: 0 },
  { month: "Jul", paid: 3_120_000, free: 0 },
  { month: "Aug", paid: 3_420_000, free: 0 },
]

// ─── Category performance ─────────────────────────────────────────────────────

export const categoryPerformance = EVENT_CATEGORIES.map((cat) => {
  const evts = demoEvents.filter((e) => e.category === cat)
  return {
    category:   cat,
    count:      evts.length,
    bookings:   evts.reduce((a, e) => a + e.registrations, 0),
    revenue:    evts.reduce((a, e) => a + e.revenue, 0),
    avgFillRate:+(evts.reduce((a, e) => a + e.fillRate, 0) / evts.length).toFixed(1),
    avgRating:  +(evts.reduce((a, e) => a + e.avgRating, 0) / evts.length).toFixed(1),
    growth:     +(evts.reduce((a, e) => a + e.growth, 0) / evts.length).toFixed(1),
    color:      CATEGORY_COLORS[cat],
  }
})

// ─── Location performance ─────────────────────────────────────────────────────

export const locationPerformance = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"].map((city) => {
  const evts = demoEvents.filter((e) => e.city === city)
  return {
    city,
    state:     evts[0]?.state ?? "",
    events:    evts.length,
    bookings:  evts.reduce((a, e) => a + e.registrations, 0),
    revenue:   evts.reduce((a, e) => a + e.revenue, 0),
    avgFillRate: +(evts.reduce((a, e) => a + e.fillRate, 0) / evts.length).toFixed(1),
    growth:    +(evts.reduce((a, e) => a + e.growth, 0) / evts.length).toFixed(1),
  }
}).sort((a, b) => b.revenue - a.revenue)

// ─── Fill rate per event (for chart) ─────────────────────────────────────────

export const fillRateChartData = [...demoEvents]
  .sort((a, b) => b.fillRate - a.fillRate)
  .map((e) => ({
    name:        e.title.length > 28 ? e.title.slice(0, 26) + "…" : e.title,
    fullName:    e.title,
    fillRate:    e.fillRate,
    remaining:   +(100 - e.fillRate).toFixed(1),
    category:    e.category,
    color:       CATEGORY_COLORS[e.category],
  }))

// ─── Peak booking heatmap (hour × day) ───────────────────────────────────────

export const BOOKING_HOURS  = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm"]
export const BOOKING_DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const bookingHeatmap: number[][] = [
  [8,  12, 16, 18, 14, 12, 10, 14, 18, 22, 28, 20], // Mon
  [10, 14, 18, 20, 16, 14, 12, 16, 20, 26, 32, 24], // Tue
  [9,  13, 17, 19, 15, 13, 11, 15, 19, 24, 30, 22], // Wed
  [12, 16, 22, 24, 20, 18, 16, 20, 24, 30, 38, 28], // Thu
  [16, 22, 28, 32, 26, 22, 20, 24, 28, 36, 46, 36], // Fri
  [24, 32, 40, 44, 38, 34, 30, 32, 36, 46, 56, 44], // Sat
  [20, 28, 36, 40, 34, 28, 24, 28, 32, 42, 52, 40], // Sun
]

// ─── Seasonal trend (monthly participation) ──────────────────────────────────

export const seasonalTrend = [
  { month: "Jan", bookings: 1_240, events: 2, revenue: 1_980_000 },
  { month: "Feb", bookings: 1_380, events: 2, revenue: 2_200_000 },
  { month: "Mar", bookings: 1_540, events: 3, revenue: 2_460_000 },
  { month: "Apr", bookings: 1_680, events: 3, revenue: 2_680_000 },
  { month: "May", bookings: 1_820, events: 4, revenue: 2_920_000 },
  { month: "Jun", bookings: 1_960, events: 5, revenue: 3_140_000 },
  { month: "Jul", bookings: 2_140, events: 6, revenue: 3_420_000 },
  { month: "Aug", bookings: 2_320, events: 7, revenue: 3_720_000 },
  { month: "Sep", bookings: 2_480, events: 8, revenue: 3_960_000 },
  { month: "Oct", bookings: 2_640, events: 7, revenue: 4_220_000 },
  { month: "Nov", bookings: 2_840, events: 6, revenue: 4_540_000 },
  { month: "Dec", bookings: 3_120, events: 5, revenue: 4_980_000 },
]

// ─── Last-minute booking behaviour ───────────────────────────────────────────

export const lastMinuteData = [
  { daysBeforeEnd: 30, pct: 8,  cumulative: 8  },
  { daysBeforeEnd: 21, pct: 6,  cumulative: 14 },
  { daysBeforeEnd: 14, pct: 9,  cumulative: 23 },
  { daysBeforeEnd: 7,  pct: 14, cumulative: 37 },
  { daysBeforeEnd: 3,  pct: 18, cumulative: 55 },
  { daysBeforeEnd: 2,  pct: 16, cumulative: 71 },
  { daysBeforeEnd: 1,  pct: 18, cumulative: 89 },
  { daysBeforeEnd: 0,  pct: 11, cumulative: 100 },
]

// ─── Events near capacity / underperforming ───────────────────────────────────

export const nearCapacityEvents  = demoEvents.filter((e) => e.fillRate >= 85  && e.status !== "cancelled").sort((a, b) => b.fillRate - a.fillRate)
export const underperformingEvents = demoEvents.filter((e) => e.fillRate < 65 && e.status !== "cancelled").sort((a, b) => a.fillRate - b.fillRate)
