// ─── Types ────────────────────────────────────────────────────────────────────

export type VehicleStatus   = "listed" | "sold" | "reserved" | "inactive"
export type VehicleType     = "SUV" | "Sedan" | "Hatchback" | "Sports" | "Luxury" | "Commercial"
export type FuelType        = "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG"

export const VEHICLE_TYPES: VehicleType[]  = ["SUV","Sedan","Hatchback","Sports","Luxury","Commercial"]
export const FUEL_TYPES: FuelType[]        = ["Petrol","Diesel","Electric","Hybrid","CNG"]
export const VEHICLE_LOCATIONS             = ["All Cities","Mumbai","Delhi","Bangalore","Hyderabad","Pune","Chennai"]

export const TYPE_COLORS: Record<VehicleType, string> = {
  SUV:        "hsl(262 83% 70%)",
  Sedan:      "hsl(222 84% 60%)",
  Hatchback:  "hsl(160 84% 60%)",
  Sports:     "hsl(28 92% 65%)",
  Luxury:     "hsl(348 86% 65%)",
  Commercial: "hsl(48 96% 58%)",
}

export const FUEL_COLORS: Record<FuelType, string> = {
  Petrol:   "hsl(28 92% 65%)",
  Diesel:   "hsl(222 84% 60%)",
  Electric: "hsl(160 84% 60%)",
  Hybrid:   "hsl(262 83% 70%)",
  CNG:      "hsl(48 96% 58%)",
}

export type DemoVehicle = {
  id:          string
  title:       string   // make + model
  brand:       string
  year:        number
  type:        VehicleType
  fuel:        FuelType
  price:       number   // INR
  mileage:     number   // km
  city:        string
  status:      VehicleStatus
  views:       number
  inquiries:   number
  testDrives:  number
  daysListed:  number
  avgRating:   number
  growth:      number   // MoM views %
}

export type AlertItem = {
  id: string; type: "warning" | "positive" | "info"; title: string; message: string
}

// ─── Vehicle listings (28 vehicles) ──────────────────────────────────────────

export const demoVehicles: DemoVehicle[] = [
  // ── SUVs ─────────────────────────────────────────────────────────────────
  { id:"v01", title:"Toyota Fortuner 4WD Legender",brand:"Toyota",  year:2023,type:"SUV",      fuel:"Diesel",  price:42_50_000,mileage:18_400, city:"Mumbai",    status:"listed",   views:3_480,inquiries:142,testDrives:28,daysListed:18,avgRating:4.9,growth:14.2  },
  { id:"v02", title:"Hyundai Creta SX(O) Turbo",   brand:"Hyundai", year:2024,type:"SUV",      fuel:"Petrol",  price:19_60_000,mileage:6_200,  city:"Bangalore", status:"listed",   views:2_840,inquiries:114,testDrives:22,daysListed:12,avgRating:4.8,growth:22.4  },
  { id:"v03", title:"Mahindra XUV700 AX7",         brand:"Mahindra",year:2023,type:"SUV",      fuel:"Diesel",  price:24_80_000,mileage:21_000, city:"Delhi",     status:"listed",   views:2_620,inquiries:96, testDrives:18,daysListed:24,avgRating:4.7,growth:8.6   },
  { id:"v04", title:"Tata Safari Adventure Edition",brand:"Tata",   year:2022,type:"SUV",      fuel:"Diesel",  price:21_40_000,mileage:34_600, city:"Pune",      status:"sold",     views:1_940,inquiries:68, testDrives:14,daysListed:38,avgRating:4.5,growth:-2.4  },
  { id:"v05", title:"Kia Sonet HTX+ IVT",          brand:"Kia",     year:2024,type:"SUV",      fuel:"Petrol",  price:14_20_000,mileage:4_800,  city:"Chennai",   status:"listed",   views:1_680,inquiries:52, testDrives:9, daysListed:8, avgRating:4.6,growth:18.8  },

  // ── Sedans ────────────────────────────────────────────────────────────────
  { id:"v06", title:"Honda City 5th Gen ZX CVT",   brand:"Honda",   year:2023,type:"Sedan",    fuel:"Petrol",  price:15_80_000,mileage:12_400, city:"Mumbai",    status:"listed",   views:2_240,inquiries:86, testDrives:16,daysListed:21,avgRating:4.7,growth:6.2   },
  { id:"v07", title:"Maruti Ciaz ZXi+ AT",         brand:"Maruti",  year:2022,type:"Sedan",    fuel:"Petrol",  price:10_40_000,mileage:28_600, city:"Delhi",     status:"listed",   views:1_420,inquiries:48, testDrives:9, daysListed:44,avgRating:4.3,growth:-4.8  },
  { id:"v08", title:"Volkswagen Virtus GT DSG",     brand:"VW",      year:2023,type:"Sedan",    fuel:"Petrol",  price:17_20_000,mileage:9_800,  city:"Hyderabad", status:"sold",     views:1_860,inquiries:72, testDrives:14,daysListed:29,avgRating:4.6,growth:11.4  },
  { id:"v09", title:"Skoda Slavia Style TSI AT",   brand:"Skoda",   year:2024,type:"Sedan",    fuel:"Petrol",  price:18_50_000,mileage:3_200,  city:"Bangalore", status:"listed",   views:1_640,inquiries:62, testDrives:11,daysListed:15,avgRating:4.5,growth:16.8  },
  { id:"v10", title:"Toyota Camry Hybrid",         brand:"Toyota",  year:2022,type:"Sedan",    fuel:"Hybrid",  price:42_00_000,mileage:22_000, city:"Mumbai",    status:"reserved", views:1_240,inquiries:44, testDrives:8, daysListed:31,avgRating:4.8,growth:9.1   },

  // ── Hatchbacks ────────────────────────────────────────────────────────────
  { id:"v11", title:"Maruti Swift ZXi+ AGS",       brand:"Maruti",  year:2024,type:"Hatchback",fuel:"Petrol",  price:8_80_000, mileage:2_400,  city:"Pune",      status:"listed",   views:2_120,inquiries:74, testDrives:14,daysListed:6,  avgRating:4.6,growth:24.6  },
  { id:"v12", title:"Hyundai i20 Asta Turbo",      brand:"Hyundai", year:2023,type:"Hatchback",fuel:"Petrol",  price:10_80_000,mileage:11_200, city:"Chennai",   status:"listed",   views:1_740,inquiries:58, testDrives:10,daysListed:19,avgRating:4.5,growth:12.8  },
  { id:"v13", title:"Tata Punch Accomplished",     brand:"Tata",    year:2023,type:"Hatchback",fuel:"Petrol",  price:9_20_000, mileage:16_800, city:"Delhi",     status:"sold",     views:1_380,inquiries:48, testDrives:9, daysListed:36,avgRating:4.4,growth:2.1   },
  { id:"v14", title:"VW Polo GT TSI",              brand:"VW",      year:2021,type:"Hatchback",fuel:"Petrol",  price:11_60_000,mileage:42_400, city:"Mumbai",    status:"inactive", views:580,  inquiries:12, testDrives:2, daysListed:68,avgRating:3.8,growth:-18.6 },

  // ── Sports ────────────────────────────────────────────────────────────────
  { id:"v15", title:"Hyundai i20 N Line N6",       brand:"Hyundai", year:2023,type:"Sports",   fuel:"Petrol",  price:12_80_000,mileage:8_600,  city:"Bangalore", status:"listed",   views:2_680,inquiries:98, testDrives:18,daysListed:14,avgRating:4.8,growth:28.4  },
  { id:"v16", title:"Mini Cooper S Convertible",   brand:"Mini",    year:2022,type:"Sports",   fuel:"Petrol",  price:48_60_000,mileage:14_200, city:"Mumbai",    status:"listed",   views:2_140,inquiries:64, testDrives:12,daysListed:22,avgRating:4.9,growth:19.2  },
  { id:"v17", title:"Jeep Compass Trailhawk",      brand:"Jeep",    year:2023,type:"Sports",   fuel:"Diesel",  price:32_40_000,mileage:9_400,  city:"Delhi",     status:"listed",   views:1_680,inquiries:56, testDrives:10,daysListed:26,avgRating:4.6,growth:8.4   },
  { id:"v18", title:"Ford Mustang Mach-E GT",      brand:"Ford",    year:2023,type:"Sports",   fuel:"Electric",price:64_80_000,mileage:6_800,  city:"Bangalore", status:"reserved", views:2_960,inquiries:84, testDrives:16,daysListed:9, avgRating:4.9,growth:36.4  },

  // ── Luxury ────────────────────────────────────────────────────────────────
  { id:"v19", title:"BMW 3 Series 330i Sport",     brand:"BMW",     year:2023,type:"Luxury",   fuel:"Petrol",  price:62_90_000,mileage:11_400, city:"Mumbai",    status:"listed",   views:2_420,inquiries:88, testDrives:16,daysListed:28,avgRating:4.9,growth:11.6  },
  { id:"v20", title:"Mercedes C 300 4MATIC AMG",   brand:"Mercedes",year:2022,type:"Luxury",   fuel:"Petrol",  price:72_40_000,mileage:18_600, city:"Delhi",     status:"listed",   views:2_160,inquiries:72, testDrives:12,daysListed:34,avgRating:4.8,growth:6.8   },
  { id:"v21", title:"Audi A4 Premium Plus 45 TFSI",brand:"Audi",    year:2023,type:"Luxury",   fuel:"Petrol",  price:56_80_000,mileage:14_800, city:"Bangalore", status:"sold",     views:1_840,inquiries:60, testDrives:11,daysListed:42,avgRating:4.7,growth:4.2   },
  { id:"v22", title:"Volvo XC60 B5 Inscription",   brand:"Volvo",   year:2022,type:"Luxury",   fuel:"Hybrid",  price:68_20_000,mileage:16_200, city:"Mumbai",    status:"listed",   views:1_480,inquiries:48, testDrives:8, daysListed:39,avgRating:4.8,growth:14.4  },

  // ── Electric ──────────────────────────────────────────────────────────────
  { id:"v23", title:"Tata Nexon EV MAX LR",        brand:"Tata",    year:2024,type:"SUV",      fuel:"Electric",price:19_80_000,mileage:8_200,  city:"Bangalore", status:"listed",   views:3_120,inquiries:128,testDrives:24,daysListed:11,avgRating:4.8,growth:42.8  },
  { id:"v24", title:"MG ZS EV Exclusive",          brand:"MG",      year:2023,type:"SUV",      fuel:"Electric",price:23_40_000,mileage:12_400, city:"Pune",      status:"listed",   views:2_480,inquiries:96, testDrives:18,daysListed:17,avgRating:4.7,growth:38.4  },
  { id:"v25", title:"Hyundai Ioniq 5 AWD",         brand:"Hyundai", year:2023,type:"SUV",      fuel:"Electric",price:44_20_000,mileage:9_600,  city:"Mumbai",    status:"reserved", views:2_860,inquiries:88, testDrives:14,daysListed:8, avgRating:4.9,growth:31.2  },
  { id:"v26", title:"Ola S1 Pro Gen 2 (Bike)",     brand:"Ola",     year:2024,type:"Commercial",fuel:"Electric",price:1_40_000, mileage:3_400,  city:"Chennai",   status:"listed",   views:1_280,inquiries:62, testDrives:18,daysListed:7, avgRating:4.3,growth:28.6  },

  // ── Commercial ────────────────────────────────────────────────────────────
  { id:"v27", title:"Force Traveller 3350",        brand:"Force",   year:2022,type:"Commercial",fuel:"Diesel", price:18_60_000,mileage:48_600, city:"Hyderabad", status:"listed",   views:840,  inquiries:28, testDrives:6, daysListed:52,avgRating:4.1,growth:-8.4  },
  { id:"v28", title:"Tata Ace Gold CNG",           brand:"Tata",    year:2023,type:"Commercial",fuel:"CNG",    price:6_80_000, mileage:38_400, city:"Delhi",     status:"sold",     views:620,  inquiries:22, testDrives:4, daysListed:46,avgRating:4.0,growth:-2.1  },
]

// ─── KPI summary ──────────────────────────────────────────────────────────────

const total       = demoVehicles.length
const sold        = demoVehicles.filter(v => v.status === "sold").length
const listed      = demoVehicles.filter(v => v.status === "listed").length
const reserved    = demoVehicles.filter(v => v.status === "reserved").length
const inactive    = demoVehicles.filter(v => v.status === "inactive").length
const totalViews  = demoVehicles.reduce((a,v) => a+v.views, 0)
const totalInq    = demoVehicles.reduce((a,v) => a+v.inquiries, 0)
const totalTD     = demoVehicles.reduce((a,v) => a+v.testDrives, 0)
const soldRevenue = demoVehicles.filter(v => v.status === "sold").reduce((a,v) => a+v.price, 0)
const avgPrice    = Math.round(demoVehicles.reduce((a,v) => a+v.price, 0) / total)

export const vehicleKpiSummary = {
  totalListings:   total,
  activeListings:  listed,
  soldListings:    sold,
  reservedListings:reserved,
  inactiveListings:inactive,
  totalViews,
  totalInquiries:  totalInq,
  totalTestDrives: totalTD,
  soldRevenue,
  avgListingPrice: avgPrice,
  inquiryRate:     +((totalInq / totalViews) * 100).toFixed(1),
  conversionRate:  +((sold / totalInq) * 100).toFixed(1),
  avgDaysListed:   Math.round(demoVehicles.reduce((a,v) => a+v.daysListed, 0) / total),
  // growth
  viewsWoW: 12.4, viewsMoM: 22.8,
  inqWoW:   14.2, inqMoM:   18.6,
  soldWoW:   8.4, soldMoM:  12.1,
  revenueWoW:16.8,revenueMoM:24.2,
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

export const vehicleAlerts: AlertItem[] = [
  { id:"a1", type:"positive",
    title:"EV listings driving 38% of total views",
    message:"Tata Nexon EV, MG ZS EV, and Hyundai Ioniq 5 together account for 8,460 views this month — up 37.5% MoM. Add more EV inventory to capitalise on demand." },
  { id:"a2", type:"warning",
    title:"3 listings stale for 40+ days",
    message:"VW Polo GT (68 days), Force Traveller (52 days), and Maruti Ciaz (44 days) have low engagement. Reduce price or refresh listing photos to attract buyers." },
  { id:"a3", type:"info",
    title:"High inquiry-to-test-drive drop-off",
    message:"Only 16% of inquiries convert to a test drive (industry avg: 28%). Consider adding an in-listing 'Book Test Drive' call-to-action to shorten the funnel." },
  { id:"a4", type:"positive",
    title:"Sports & Luxury segment growing fast",
    message:"Sports category views up +22.1% MoM; Luxury up +9.4% MoM. High-margin segment — consider listing 2–3 more certified pre-owned sports cars." },
]

// ─── Listing trend (multi-period) ────────────────────────────────────────────

export const listingTrend: Record<string, { period: string; views: number; inquiries: number; testDrives: number; newListings: number }[]> = {
  "7d": [
    { period:"Mon", views:1_420, inquiries:48, testDrives:8,  newListings:1 },
    { period:"Tue", views:1_640, inquiries:56, testDrives:10, newListings:0 },
    { period:"Wed", views:1_580, inquiries:52, testDrives:9,  newListings:2 },
    { period:"Thu", views:1_860, inquiries:68, testDrives:12, newListings:0 },
    { period:"Fri", views:2_120, inquiries:82, testDrives:16, newListings:1 },
    { period:"Sat", views:2_840, inquiries:112,testDrives:22, newListings:3 },
    { period:"Sun", views:2_480, inquiries:96, testDrives:18, newListings:1 },
  ],
  "30d": Array.from({ length: 15 }, (_, i) => ({
    period:      `${i * 2 + 1} Jun`,
    views:       820 + i * 84,
    inquiries:   28 + i * 6,
    testDrives:  4 + i,
    newListings: [1,0,2,1,0,1,2,0,1,3,0,1,2,1,0][i],
  })),
  "90d": Array.from({ length: 13 }, (_, i) => ({
    period:      `Wk ${i+1}`,
    views:       4_800 + i * 480,
    inquiries:   168 + i * 18,
    testDrives:  24 + i * 3,
    newListings: [3,2,4,1,3,2,5,2,3,4,2,3,2][i],
  })),
  "1y": [
    { period:"Jan", views:7_800,  inquiries:268, testDrives:42, newListings:4  },
    { period:"Feb", views:8_400,  inquiries:296, testDrives:48, newListings:5  },
    { period:"Mar", views:9_200,  inquiries:328, testDrives:52, newListings:6  },
    { period:"Apr", views:10_100, inquiries:362, testDrives:58, newListings:5  },
    { period:"May", views:11_200, inquiries:402, testDrives:64, newListings:7  },
    { period:"Jun", views:12_400, inquiries:448, testDrives:72, newListings:6  },
    { period:"Jul", views:13_200, inquiries:480, testDrives:78, newListings:8  },
    { period:"Aug", views:14_820, inquiries:540, testDrives:86, newListings:9  },
  ],
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

export const conversionFunnel = [
  { stage:"Views",       value:totalViews,                 pct:100 },
  { stage:"Inquiries",   value:totalInq,                   pct:+((totalInq/totalViews)*100).toFixed(1) },
  { stage:"Test Drives", value:totalTD,                    pct:+((totalTD/totalViews)*100).toFixed(1)  },
  { stage:"Sales",       value:sold,                       pct:+((sold/totalViews)*100).toFixed(1)     },
]

// ─── Body type performance ────────────────────────────────────────────────────

export const bodyTypePerformance = VEHICLE_TYPES.map(t => {
  const vs = demoVehicles.filter(v => v.type === t)
  return {
    type:        t,
    count:       vs.length,
    listed:      vs.filter(v => v.status === "listed").length,
    sold:        vs.filter(v => v.status === "sold").length,
    views:       vs.reduce((a,v) => a+v.views, 0),
    inquiries:   vs.reduce((a,v) => a+v.inquiries, 0),
    avgPrice:    vs.length ? Math.round(vs.reduce((a,v) => a+v.price, 0)/vs.length) : 0,
    growth:      +(vs.reduce((a,v) => a+v.growth, 0) / (vs.length || 1)).toFixed(1),
    color:       TYPE_COLORS[t],
  }
})

// ─── Fuel type breakdown ──────────────────────────────────────────────────────

export const fuelTypeBreakdown = FUEL_TYPES.map(f => {
  const vs = demoVehicles.filter(v => v.fuel === f)
  return {
    fuel:       f,
    count:      vs.length,
    views:      vs.reduce((a,v) => a+v.views, 0),
    inquiries:  vs.reduce((a,v) => a+v.inquiries, 0),
    avgPrice:   vs.length ? Math.round(vs.reduce((a,v) => a+v.price, 0)/vs.length) : 0,
    growth:     +(vs.reduce((a,v) => a+v.growth, 0) / (vs.length || 1)).toFixed(1),
    color:      FUEL_COLORS[f],
  }
})

// ─── Brand performance ────────────────────────────────────────────────────────

export const brandPerformance = (() => {
  const brands: Record<string, { views:number; inquiries:number; count:number; sold:number; revenue:number }> = {}
  demoVehicles.forEach(v => {
    if (!brands[v.brand]) brands[v.brand] = { views:0, inquiries:0, count:0, sold:0, revenue:0 }
    brands[v.brand].views     += v.views
    brands[v.brand].inquiries += v.inquiries
    brands[v.brand].count     += 1
    if (v.status === "sold") { brands[v.brand].sold += 1; brands[v.brand].revenue += v.price }
  })
  return Object.entries(brands)
    .map(([brand,d]) => ({ brand, ...d, convRate: d.count ? +((d.sold/d.count)*100).toFixed(1) : 0 }))
    .sort((a,b) => b.views - a.views)
    .slice(0,8)
})()

// ─── Price distribution ───────────────────────────────────────────────────────

export const priceDistribution = [
  { range:"< ₹5L",    count:demoVehicles.filter(v=>v.price<500_000).length },
  { range:"₹5–10L",   count:demoVehicles.filter(v=>v.price>=500_000  && v.price<1_000_000).length },
  { range:"₹10–20L",  count:demoVehicles.filter(v=>v.price>=1_000_000 && v.price<2_000_000).length },
  { range:"₹20–40L",  count:demoVehicles.filter(v=>v.price>=2_000_000 && v.price<4_000_000).length },
  { range:"₹40–60L",  count:demoVehicles.filter(v=>v.price>=4_000_000 && v.price<6_000_000).length },
  { range:"> ₹60L",   count:demoVehicles.filter(v=>v.price>=6_000_000).length },
]

// ─── Location performance ─────────────────────────────────────────────────────

export const locationPerformance = ["Mumbai","Delhi","Bangalore","Hyderabad","Pune","Chennai"].map(city => {
  const vs = demoVehicles.filter(v => v.city === city)
  return {
    city,
    count:      vs.length,
    listed:     vs.filter(v => v.status === "listed").length,
    sold:       vs.filter(v => v.status === "sold").length,
    views:      vs.reduce((a,v) => a+v.views, 0),
    inquiries:  vs.reduce((a,v) => a+v.inquiries, 0),
    avgPrice:   vs.length ? Math.round(vs.reduce((a,v) => a+v.price, 0)/vs.length) : 0,
    growth:     +(vs.reduce((a,v) => a+v.growth, 0) / (vs.length||1)).toFixed(1),
  }
}).sort((a,b) => b.views - a.views)

// ─── Inventory health: aging listings ────────────────────────────────────────

export const AGING_BUCKETS = [
  { label:"< 14 days",  min:0,   max:13  },
  { label:"14–30 days", min:14,  max:30  },
  { label:"31–45 days", min:31,  max:45  },
  { label:"> 45 days",  min:46,  max:999 },
]

export const agingData = AGING_BUCKETS.map(b => ({
  label:    b.label,
  count:    demoVehicles.filter(v => v.daysListed >= b.min && v.daysListed <= b.max && v.status !== "sold").length,
}))

export const staleListing  = demoVehicles.filter(v => v.daysListed > 40 && v.status === "listed").sort((a,b) => b.daysListed - a.daysListed)
export const topByViews    = [...demoVehicles].sort((a,b) => b.views       - a.views).slice(0,5)
export const topByInquiry  = [...demoVehicles].sort((a,b) => b.inquiries   - a.inquiries).slice(0,5)
export const evListings    = demoVehicles.filter(v => v.fuel === "Electric")

// ─── Monthly views trend split by fuel ───────────────────────────────────────

export const fuelTrend = [
  { month:"Jan", Petrol:3_200, Diesel:2_400, Electric:800,  Hybrid:400, CNG:200 },
  { month:"Feb", Petrol:3_400, Diesel:2_520, Electric:980,  Hybrid:440, CNG:220 },
  { month:"Mar", Petrol:3_680, Diesel:2_640, Electric:1_240,Hybrid:480, CNG:240 },
  { month:"Apr", Petrol:3_840, Diesel:2_720, Electric:1_480,Hybrid:520, CNG:250 },
  { month:"May", Petrol:4_120, Diesel:2_840, Electric:1_820,Hybrid:560, CNG:260 },
  { month:"Jun", Petrol:4_280, Diesel:2_880, Electric:2_120,Hybrid:600, CNG:270 },
  { month:"Jul", Petrol:4_440, Diesel:2_960, Electric:2_480,Hybrid:640, CNG:280 },
  { month:"Aug", Petrol:4_620, Diesel:3_040, Electric:2_960,Hybrid:680, CNG:300 },
]
