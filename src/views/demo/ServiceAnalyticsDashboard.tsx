"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Legend, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Wrench, Star, Activity,
  AlertTriangle, ChevronRight, ArrowUpDown, BarChart2, X, SlidersHorizontal,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  allServices, categoryRollups, revenueTrend, bookingTrend,
  heatmapData, TIME_SLOTS, DAYS_OF_WEEK, underutilizedServices,
  serviceKpiSummary, SERVICE_CATEGORIES, CATEGORY_COLORS, LOCATIONS,
  type ServiceItem, type ServiceCategory,
} from "@/data/demoServiceAnalytics";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  violet: "hsl(262 83% 70%)",
  blue:   "hsl(222 84% 60%)",
  green:  "hsl(160 84% 60%)",
  orange: "hsl(28 92% 65%)",
  rose:   "hsl(348 86% 65%)",
  yellow: "hsl(48 96% 58%)",
  grid:   "#1e293b",
  axis:   "#475569",
}
const AXIS_PROPS = {
  tickLine: false, axisLine: false,
  stroke: C.axis, tick: { fill: C.axis, fontSize: 10 },
}
const CAT_PIE = Object.values(CATEGORY_COLORS)

const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const compact = (v: number) =>
  v >= 1_000_000 ? `₹${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000    ? `₹${(v / 1_000).toFixed(1)}K`
  : `₹${v}`

const PERIODS = ["7d", "30d", "90d", "1y"] as const
type Period = typeof PERIODS[number]
const PERIOD_LABELS: Record<Period, string> = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days", "1y": "1 Year" }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GrowthBadge = ({ v, inverse = false }: { v: number; inverse?: boolean }) => {
  const pos = inverse ? v <= 0 : v >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${pos ? "text-emerald-400" : "text-rose-400"}`}>
      {v >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {v >= 0 ? "+" : ""}{v.toFixed(1)}%
    </span>
  )
}

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`demo-card rounded-2xl p-5 demo-card-hover ${className}`}>{children}</div>
)

const SubTitle = ({ children }: { children: string }) => (
  <h3 className="text-sm font-medium text-slate-300 mb-3">{children}</h3>
)

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { duration: 0.28 },
}

// ─── Collapsible section ──────────────────────────────────────────────────────
const CollapsibleSection = ({
  id, icon, title, badge, defaultOpen = true, children,
}: {
  id: string; icon: React.ReactNode; title: string; badge?: string;
  defaultOpen?: boolean; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className="space-y-4">
      <button
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-5 py-3.5 text-left transition hover:bg-slate-800/50"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-violet-400">{icon}</span>
          <span className="text-base font-semibold text-slate-100">{title}</span>
          {badge && (
            <span className="rounded-full bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-300">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── Top-N + Others helper ────────────────────────────────────────────────────
function topNWithOthers<T extends Record<string, any>>(
  data: T[], key: keyof T, n: number, labelKey: keyof T = "name"
): Array<T & { isOthers?: boolean }> {
  if (data.length <= n) return data
  const sorted = [...data].sort((a, b) => (b[key] as number) - (a[key] as number))
  const top = sorted.slice(0, n)
  const rest = sorted.slice(n)
  const othersVal = rest.reduce((s, d) => s + (d[key] as number), 0)
  return [
    ...top,
    { ...rest[0], [labelKey]: "Others", [key]: othersVal, isOthers: true } as T & { isOthers: boolean },
  ]
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl min-w-[140px]">
      <p className="font-semibold text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 mb-0.5" style={{ color: p.color }}>
          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          {p.name ?? p.dataKey}: {typeof p.value === "number" && p.value > 1000 ? compact(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Service search dropdown ──────────────────────────────────────────────────
const ServiceSearch = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const matches = allServices.filter((s) =>
    s.name.toLowerCase().includes(value.toLowerCase()) ||
    s.category.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8)

  return (
    <div ref={ref} className="relative w-full md:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        placeholder="Search service…"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-9 w-full rounded-full border border-slate-700 bg-slate-900/80 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/80"
        aria-label="Search services"
        aria-autocomplete="list"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X className="h-3 w-3 text-slate-500 hover:text-slate-300" />
        </button>
      )}
      {open && value.length > 0 && matches.length > 0 && (
        <div className="absolute top-full z-50 mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {matches.map((s) => (
            <button
              key={s.id}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors"
              onMouseDown={() => { onChange(s.name); setOpen(false) }}
            >
              <span className="text-slate-200 truncate">{s.name}</span>
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: `${CATEGORY_COLORS[s.category]}22`, color: CATEGORY_COLORS[s.category] }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ServiceAnalyticsDashboard() {
  const [period, setPeriod]               = useState<Period>("30d")
  const [selectedCategory, setCategory]   = useState<ServiceCategory | "all">("all")
  const [searchQuery, setSearch]           = useState("")
  const [location, setLocation]            = useState("All Locations")
  const [showAllServices, setShowAll]      = useState(false)
  const [sortBy, setSortBy]               = useState<keyof ServiceItem>("revenue")
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("desc")

  // Filtered services
  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      const catMatch = selectedCategory === "all" || s.category === selectedCategory
      const q = searchQuery.toLowerCase()
      const searchMatch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      return catMatch && searchMatch
    })
  }, [selectedCategory, searchQuery])

  // Sorted for table
  const sortedServices = useMemo(() =>
    [...filteredServices].sort((a, b) =>
      sortDir === "desc"
        ? (b[sortBy] as number) - (a[sortBy] as number)
        : (a[sortBy] as number) - (b[sortBy] as number)
    ),
  [filteredServices, sortBy, sortDir])

  // Top 5 by revenue and bookings (+ Others)
  const topRevServices   = topNWithOthers(filteredServices, "revenue", 5)
  const topBkgServices   = topNWithOthers(filteredServices, "totalBookings", 5)

  // Category data for current filter
  const catData = selectedCategory === "all"
    ? categoryRollups
    : categoryRollups.filter((c) => c.category === selectedCategory)

  const trendRevData = revenueTrend[period]
  const trendBkgData = bookingTrend[period]

  // Derived KPIs from filtered set
  const filtRev      = filteredServices.reduce((a, s) => a + s.revenue, 0)
  const filtBkg      = filteredServices.reduce((a, s) => a + s.totalBookings, 0)
  const filtUtil     = filteredServices.length ? +(filteredServices.reduce((a, s) => a + s.utilizationRate, 0) / filteredServices.length).toFixed(1) : 0
  const filtRating   = filteredServices.length ? +(filteredServices.reduce((a, s) => a + s.rating, 0) / filteredServices.length).toFixed(2) : 0

  const toggleSort = (key: keyof ServiceItem) => {
    if (sortBy === key) setSortDir((d) => d === "desc" ? "asc" : "desc")
    else { setSortBy(key); setSortDir("desc") }
  }

  return (
    <main className="demo-analytics-page" role="main" aria-label="Service analytics dashboard">
      <div className="demo-shell">

        {/* ── Header ── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <span className="demo-pill">Vehicle Service Platform · Vendor Analytics</span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              Service Analytics
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Scalable service intelligence across all categories. Filter, drill down,
              and spot opportunities — without the clutter.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-full border border-slate-700 bg-slate-900/60 p-1">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={["rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  period === p ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-slate-200"].join(" ")}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </header>

        {/* ── Filters bar ── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500 mr-1">Filters:</span>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategory("all")}
              className={["rounded-full border px-3 py-1 text-xs font-medium transition-all",
                selectedCategory === "all" ? "border-violet-500 bg-violet-600/20 text-violet-300" : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"].join(" ")}
            >All</button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={["rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "border-violet-500 bg-violet-600/20 text-violet-300"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"].join(" ")}
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                {cat}
              </button>
            ))}
          </div>

          {/* Location */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/80"
            aria-label="Filter by location"
          >
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Service search */}
          <ServiceSearch value={searchQuery} onChange={setSearch} />

          {/* Active filter summary */}
          {(selectedCategory !== "all" || searchQuery || location !== "All Locations") && (
            <button onClick={() => { setCategory("all"); setSearch(""); setLocation("All Locations") }}
              className="ml-auto flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total Revenue"      value={filtRev}    formatAsCurrency wow={serviceKpiSummary.revenueWoW}     mom={serviceKpiSummary.revenueMoM}     icon={<DollarSign className="h-4 w-4" />} accentColor={C.violet} />
          <KpiCard label="Total Bookings"     value={filtBkg}    wow={serviceKpiSummary.bookingsWoW}    mom={serviceKpiSummary.bookingsMoM}    icon={<ShoppingCart className="h-4 w-4" />} accentColor={C.blue} />
          <KpiCard label="Active Services"    value={filteredServices.length} wow={5.6} mom={11.8} icon={<Wrench className="h-4 w-4" />} accentColor={C.green} />
          <KpiCard label="Slot Utilisation"   value={filtUtil}   suffix="%" wow={serviceKpiSummary.utilizationWoW} mom={serviceKpiSummary.utilizationMoM} icon={<Activity className="h-4 w-4" />} accentColor={C.orange} />
          <KpiCard label="Avg Rating"         value={filtRating} suffix="★" wow={0.2} mom={0.5} icon={<Star className="h-4 w-4" />} accentColor={C.yellow} />
        </div>

        {/* ══════════════════ REVENUE ══════════════════════════════════════ */}
        <CollapsibleSection id="revenue" icon={<DollarSign className="h-4 w-4" />} title="Revenue Analytics" badge={compact(filtRev)}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Stacked area trend */}
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <SubTitle>Revenue trend by category</SubTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendRevData}>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <defs key={cat}>
                        <linearGradient id={`grad_${cat}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%"  stopColor={CATEGORY_COLORS[cat]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CATEGORY_COLORS[cat]} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                    ))}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="period" {...AXIS_PROPS} />
                    <YAxis {...AXIS_PROPS} tickFormatter={(v) => compact(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    {SERVICE_CATEGORIES.filter((cat) =>
                      selectedCategory === "all" || cat === selectedCategory
                    ).map((cat) => (
                      <Area key={cat} type="monotone" dataKey={cat} stroke={CATEGORY_COLORS[cat]}
                        fill={`url(#grad_${cat})`} strokeWidth={2} stackId="1" />
                    ))}
                    <Legend formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            {/* Pie: category revenue share */}
            <motion.div {...fadeUp}>
              <Panel className="h-full">
                <SubTitle>Revenue by category</SubTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2}>
                      {catData.map((c) => <Cell key={c.category} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs shadow-xl">
                          <p style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                          <p className="text-slate-200">{compact(payload[0].value as number)}</p>
                        </div>
                      ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-1 space-y-1.5">
                  {catData.map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />{c.category}
                      </span>
                      <span className="font-medium text-slate-200">{compact(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Top 5 services by revenue (bar) */}
          <motion.div {...fadeUp}>
            <Panel>
              <SubTitle>Top 5 services by revenue (+ others)</SubTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topRevServices} layout="vertical">
                  <CartesianGrid horizontal={false} stroke={C.grid} />
                  <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => compact(v)} />
                  <YAxis type="category" dataKey="name" width={180} {...AXIS_PROPS} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={4}>
                    {topRevServices.map((s, i) => (
                      <Cell key={i} fill={(s as any).isOthers ? "#334155" : CATEGORY_COLORS[(s as ServiceItem).category] ?? C.violet} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-1">
                Remaining {allServices.length - 5} services grouped as "Others"
              </p>
            </Panel>
          </motion.div>

        </CollapsibleSection>

        {/* ══════════════════ BOOKINGS ══════════════════════════════════════ */}
        <CollapsibleSection id="bookings" icon={<ShoppingCart className="h-4 w-4" />} title="Booking Analytics" badge={`${filtBkg.toLocaleString()} bookings`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <SubTitle>Booking volume trend</SubTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendBkgData}>
                    <defs>
                      <linearGradient id="bkgGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="period" {...AXIS_PROPS} />
                    <YAxis {...AXIS_PROPS} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="bookings" stroke={C.blue} fill="url(#bkgGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            {/* Category booking breakdown stacked bar */}
            <motion.div {...fadeUp}>
              <Panel className="h-full">
                <SubTitle>Bookings by category</SubTitle>
                <div className="space-y-2.5">
                  {catData.map((c) => {
                    const maxBk = Math.max(...catData.map((x) => x.bookings))
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-slate-400">{c.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{c.bookings.toLocaleString()}</span>
                            <GrowthBadge v={c.growth} />
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: c.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.bookings / maxBk) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-800/60 p-2">
                    <p className="text-slate-500">WoW growth</p>
                    <p className="text-emerald-400 font-semibold text-base">+14.2%</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-2">
                    <p className="text-slate-500">MoM growth</p>
                    <p className="text-emerald-400 font-semibold text-base">+22.6%</p>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Top 5 by bookings */}
          <motion.div {...fadeUp}>
            <Panel>
              <SubTitle>Top 5 services by bookings (+ others)</SubTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topBkgServices}>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="name" {...AXIS_PROPS} tick={{ ...AXIS_PROPS.tick, width: 80, textAnchor: "middle" }} interval={0} />
                  <YAxis {...AXIS_PROPS} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalBookings" radius={[4,4,0,0]}>
                    {topBkgServices.map((s, i) => (
                      <Cell key={i} fill={(s as any).isOthers ? "#334155" : CATEGORY_COLORS[(s as ServiceItem).category] ?? C.blue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </motion.div>

        </CollapsibleSection>

        {/* ══════════════════ SLOT UTILISATION ═════════════════════════════ */}
        <CollapsibleSection id="slots" icon={<Activity className="h-4 w-4" />} title="Slot Utilisation" badge={`${filtUtil}% avg`}>

          {/* Heatmap */}
          <motion.div {...fadeUp}>
            <Panel>
              <SubTitle>Booking intensity — time of day × day of week</SubTitle>
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  {/* Header row */}
                  <div className="grid mb-1" style={{ gridTemplateColumns: `60px repeat(${TIME_SLOTS.length}, 1fr)` }}>
                    <div />
                    {TIME_SLOTS.map((t) => (
                      <div key={t} className="text-center text-[10px] text-slate-500">{t}</div>
                    ))}
                  </div>
                  {/* Rows */}
                  {DAYS_OF_WEEK.map((day, di) => (
                    <div key={day} className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: `60px repeat(${TIME_SLOTS.length}, 1fr)` }}>
                      <div className="text-[11px] text-slate-400 flex items-center">{day}</div>
                      {TIME_SLOTS.map((_, si) => {
                        const val = heatmapData[di][si]
                        const maxVal = 54
                        const intensity = val / maxVal
                        const bg = intensity > 0.8 ? "hsl(262 83% 60%)"
                                 : intensity > 0.6 ? "hsl(262 70% 45%)"
                                 : intensity > 0.4 ? "hsl(262 60% 32%)"
                                 : intensity > 0.2 ? "hsl(262 50% 22%)"
                                 : "#1e293b"
                        return (
                          <div key={si} title={`${day} ${TIME_SLOTS[si]}: ${val} bookings`}
                            className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110"
                            style={{ background: bg }} />
                        )
                      })}
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                    <span>Low</span>
                    {["#1e293b", "hsl(262 50% 22%)", "hsl(262 60% 32%)", "hsl(262 70% 45%)", "hsl(262 83% 60%)"].map((c, i) => (
                      <div key={i} className="h-3 w-6 rounded-sm" style={{ background: c }} />
                    ))}
                    <span>High</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Peak: <span className="text-violet-300">Fri–Sat, 4–7 PM</span>. Consider extending slots or adding express options.
              </p>
            </Panel>
          </motion.div>

          {/* Category utilisation + underutilised alerts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Utilisation by category</SubTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={catData}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="category" {...AXIS_PROPS} />
                    <YAxis {...AXIS_PROPS} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                          <p className="font-semibold text-slate-200 mb-1">{label}</p>
                          <p style={{ color: payload[0].payload.color }}>Utilisation: {payload[0].value}%</p>
                        </div>
                      ) : null} />
                    <Bar dataKey="avgUtil" radius={[4,4,0,0]} maxBarSize={56}>
                      {catData.map((c) => <Cell key={c.category} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp}>
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-slate-300">Underutilised services</h3>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] text-amber-400">Action needed</span>
                </div>
                <div className="space-y-2">
                  {underutilizedServices.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl border border-amber-800/20 bg-amber-900/10 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.category} · {s.usedSlots}/{s.availableSlots} slots used</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-amber-400 font-semibold">{s.utilizationRate}%</p>
                        <div className="h-1 w-16 rounded-full bg-slate-800 overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${s.utilizationRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>

        </CollapsibleSection>

        {/* ══════════════════ SERVICE PERFORMANCE ══════════════════════════ */}
        <CollapsibleSection id="performance" icon={<BarChart2 className="h-4 w-4" />} title="Service Performance" badge={`${filteredServices.length} services`}>

          {/* Top 5 rank cards */}
          <motion.div {...fadeUp}>
            <SubTitle>Top 5 by revenue</SubTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[...filteredServices].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((s, i) => (
                <div key={s.id} className="demo-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-2xl font-bold text-slate-600">#{i + 1}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${CATEGORY_COLORS[s.category]}22`, color: CATEGORY_COLORS[s.category] }}>
                      {s.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 leading-snug mb-1 line-clamp-2">{s.name}</p>
                  <p className="text-lg font-bold text-violet-300">{compact(s.revenue)}</p>
                  <p className="text-[11px] text-slate-500">{s.totalBookings} bookings · ★ {s.rating}</p>
                  <GrowthBadge v={s.growth} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Least used */}
          <motion.div {...fadeUp}>
            <Panel>
              <SubTitle>Least booked services (needs attention)</SubTitle>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...filteredServices].sort((a, b) => a.totalBookings - b.totalBookings).slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 rounded-xl bg-slate-800/40 p-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${CATEGORY_COLORS[s.category]}22`, color: CATEGORY_COLORS[s.category] }}>
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.totalBookings} bookings · {fmt(s.price)}</p>
                    </div>
                    <GrowthBadge v={s.growth} />
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          {/* View All table */}
          <motion.div {...fadeUp}>
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <SubTitle>All services</SubTitle>
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {showAllServices ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showAllServices ? "Collapse" : `View all ${filteredServices.length} services`}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {(showAllServices ? sortedServices : sortedServices.slice(0, 8)).length > 0 && (
                  <motion.div
                    key={showAllServices ? "full" : "preview"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-left">
                            {(["name", "category", "price", "totalBookings", "revenue", "rating", "utilizationRate", "growth"] as (keyof ServiceItem)[]).map((col) => (
                              <th key={col} className="pb-2 pr-4 font-medium whitespace-nowrap">
                                <button
                                  className={`flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors ${sortBy === col ? "text-violet-400" : ""}`}
                                  onClick={() => toggleSort(col)}
                                >
                                  {col === "totalBookings" ? "Bookings"
                                   : col === "utilizationRate" ? "Util %"
                                   : col.charAt(0).toUpperCase() + col.slice(1)}
                                  <ArrowUpDown className="h-2.5 w-2.5 opacity-60" />
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(showAllServices ? sortedServices : sortedServices.slice(0, 8)).map((s) => (
                            <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 pr-4 font-medium text-slate-100 max-w-[160px] truncate">{s.name}</td>
                              <td className="py-2.5 pr-4">
                                <span className="rounded-full px-2 py-0.5 text-[10px]"
                                  style={{ background: `${CATEGORY_COLORS[s.category]}22`, color: CATEGORY_COLORS[s.category] }}>
                                  {s.category}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-slate-300 whitespace-nowrap">{fmt(s.price)}</td>
                              <td className="py-2.5 pr-4 text-slate-200">{s.totalBookings}</td>
                              <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">{compact(s.revenue)}</td>
                              <td className="py-2.5 pr-4 text-yellow-400">★ {s.rating}</td>
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-12 rounded-full bg-slate-700 overflow-hidden">
                                    <div className="h-full rounded-full"
                                      style={{ width: `${s.utilizationRate}%`, background: s.utilizationRate > 70 ? C.green : s.utilizationRate > 40 ? C.orange : C.rose }} />
                                  </div>
                                  <span className="text-slate-300">{s.utilizationRate}%</span>
                                </div>
                              </td>
                              <td className="py-2.5"><GrowthBadge v={s.growth} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!showAllServices && filteredServices.length > 8 && (
                      <button onClick={() => setShowAll(true)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show {filteredServices.length - 8} more services
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.div>

        </CollapsibleSection>

      </div>
    </main>
  )
}
