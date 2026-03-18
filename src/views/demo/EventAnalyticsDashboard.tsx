"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Legend, ResponsiveContainer, Tooltip, ComposedChart,
} from "recharts";
import {
  Calendar, DollarSign, Users, TrendingUp, TrendingDown,
  AlertTriangle, Info, Activity, MapPin, Clock,
  ChevronDown, ChevronUp, Search, SlidersHorizontal,
  X, BarChart2, Zap, CheckCircle, ListFilter, Star,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  demoEvents, eventKpiSummary, eventAlerts,
  bookingTrend, categoryPerformance,
  locationPerformance, fillRateChartData, bookingHeatmap,
  BOOKING_HOURS, BOOKING_DAYS, seasonalTrend, lastMinuteData,
  nearCapacityEvents, underperformingEvents,
  EVENT_CATEGORIES, CATEGORY_COLORS, EVENT_LOCATIONS,
  type DemoEvent, type EventCategory, type AlertItem,
} from "@/data/demoEventAnalytics";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  violet: "hsl(262 83% 70%)", blue: "hsl(222 84% 60%)",
  green:  "hsl(160 84% 60%)", orange: "hsl(28 92% 65%)",
  rose:   "hsl(348 86% 65%)", yellow: "hsl(48 96% 58%)",
  grid: "#1e293b", axis: "#475569",
}
const AP = { tickLine: false, axisLine: false, stroke: C.axis, tick: { fill: C.axis, fontSize: 10 } }
const fmt    = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v)
const compact = (v: number) => v >= 1_000_000 ? `₹${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `₹${(v/1_000).toFixed(1)}K` : `₹${v}`
const pct     = (v: number) => `${v.toFixed(1)}%`

const PERIODS = ["7d","30d","90d","1y"] as const
type Period = typeof PERIODS[number]
const PL: Record<Period, string> = { "7d":"7 Days","30d":"30 Days","90d":"90 Days","1y":"1 Year" }
const STATUS_COLORS: Record<string, string> = { active: C.green, completed: C.blue, cancelled: C.rose }

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`demo-card rounded-2xl p-5 demo-card-hover ${className}`}>{children}</div>
)
const Sub = ({ children }: { children: string }) => (
  <h3 className="text-sm font-medium text-slate-300 mb-3">{children}</h3>
)
const Divider = () => <div className="border-t border-slate-800/60" />
const fadeUp = { initial:{opacity:0,y:14}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:"-30px"}, transition:{duration:0.28} }

const GrowthBadge = ({ v }: { v: number }) => (
  <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${v >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
    {v >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
    {v >= 0 ? "+" : ""}{v.toFixed(1)}%
  </span>
)

const StatusBadge = ({ s }: { s: string }) => {
  const cfg = { active:{bg:"bg-emerald-500/15 border-emerald-500/25",text:"text-emerald-400"}, completed:{bg:"bg-blue-500/15 border-blue-500/25",text:"text-blue-400"}, cancelled:{bg:"bg-rose-500/15 border-rose-500/25",text:"text-rose-400"} }[s] ?? {bg:"",text:""}
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${cfg.bg} ${cfg.text}`}>{s}</span>
}

const FillBar = ({ v, max = 100 }: { v: number; max?: number }) => {
  const pctV = Math.min((v/max)*100, 100)
  const color = v >= 90 ? C.green : v >= 65 ? C.orange : C.rose
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width:`${pctV}%`, background:color }} />
      </div>
      <span className="text-[11px]" style={{color}}>{v.toFixed(1)}%</span>
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl min-w-[130px]">
      <p className="font-semibold text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 mb-0.5" style={{color: p.color ?? p.fill}}>
          <span className="h-2 w-2 rounded-full shrink-0" style={{background: p.color ?? p.fill}} />
          {p.name ?? p.dataKey}: {typeof p.value === "number" && p.value > 999 ? compact(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
const Section = ({ id, icon, title, badge, open: initOpen = true, children }: {
  id: string; icon: React.ReactNode; title: string; badge?: string
  open?: boolean; children: React.ReactNode
}) => {
  const [open, setOpen] = useState(initOpen)
  return (
    <section id={id} className="space-y-4">
      <button
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-5 py-3.5 text-left hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(o => !o)} aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-violet-400">{icon}</span>
          <span className="text-base font-semibold text-slate-100">{title}</span>
          {badge && <span className="rounded-full bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-300">{badge}</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.22}} className="overflow-hidden">
            <div className="space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── Alert banner ──────────────────────────────────────────────────────────────
const AlertItem = ({ a }: { a: AlertItem }) => {
  const cfg = {
    warning:  {bg:"bg-amber-500/10 border-amber-500/25",  text:"text-amber-400",  icon:<AlertTriangle className="h-4 w-4 shrink-0" />},
    positive: {bg:"bg-emerald-500/10 border-emerald-500/25",text:"text-emerald-400",icon:<TrendingUp className="h-4 w-4 shrink-0" />},
    info:     {bg:"bg-blue-500/10 border-blue-500/25",    text:"text-blue-400",   icon:<Info className="h-4 w-4 shrink-0" />},
  }[a.type]
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg}`}>
      <span className={cfg.text}>{cfg.icon}</span>
      <div>
        <p className={`text-xs font-semibold ${cfg.text}`}>{a.title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{a.message}</p>
      </div>
    </div>
  )
}

// ─── Event search ──────────────────────────────────────────────────────────────
const EventSearch = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false)
  const matches = demoEvents.filter(e =>
    e.title.toLowerCase().includes(value.toLowerCase()) ||
    e.category.toLowerCase().includes(value.toLowerCase()) ||
    e.city.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 7)
  return (
    <div className="relative w-full md:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input type="text" placeholder="Search event, city, category…" value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-9 w-full rounded-full border border-slate-700 bg-slate-900/80 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/80"
      />
      {value && <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-slate-500" /></button>}
      {open && value && matches.length > 0 && (
        <div className="absolute top-full z-50 mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {matches.map(e => (
            <button key={e.id} onMouseDown={() => { onChange(e.title); setOpen(false) }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors">
              <span className="text-slate-200 truncate">{e.title}</span>
              <span className="shrink-0 text-[10px] rounded-full px-1.5 py-0.5"
                style={{background:`${CATEGORY_COLORS[e.category]}22`, color:CATEGORY_COLORS[e.category]}}>{e.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function EventAnalyticsDashboard() {
  const [period, setPeriod]     = useState<Period>("30d")
  const [catFilter, setCat]     = useState<EventCategory | "all">("all")
  const [locFilter, setLoc]     = useState("All Locations")
  const [statusFilter, setStat] = useState<"all"|"active"|"completed"|"cancelled">("all")
  const [search, setSearch]     = useState("")
  const [showAllEvents, setShowAll] = useState(false)
  const [sortBy, setSortBy]     = useState<keyof DemoEvent>("revenue")
  const [sortDir, setSortDir]   = useState<"asc"|"desc">("desc")

  const filtered = useMemo(() => demoEvents.filter(e => {
    const q = search.toLowerCase()
    return (catFilter === "all" || e.category === catFilter)
      && (locFilter === "All Locations" || e.city === locFilter)
      && (statusFilter === "all" || e.status === statusFilter)
      && (!q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
  }), [catFilter, locFilter, statusFilter, search])

  const sorted = useMemo(() =>
    [...filtered].sort((a,b) => sortDir === "desc" ? (b[sortBy] as number)-(a[sortBy] as number) : (a[sortBy] as number)-(b[sortBy] as number)),
  [filtered, sortBy, sortDir])

  const filtCats = catFilter === "all" ? categoryPerformance : categoryPerformance.filter(c => c.category === catFilter)
  const filtLocs = locFilter === "All Locations" ? locationPerformance : locationPerformance.filter(l => l.city === locFilter)
  const trendData = bookingTrend[period]

  const toggleSort = (k: keyof DemoEvent) => {
    if (sortBy === k) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortBy(k); setSortDir("desc") }
  }

  const clearFilters = () => { setCat("all"); setLoc("All Locations"); setStat("all"); setSearch("") }
  const hasFilters = catFilter !== "all" || locFilter !== "All Locations" || statusFilter !== "all" || !!search

  const filtRevenue  = filtered.reduce((a,e) => a+e.revenue, 0)
  const filtBookings = filtered.reduce((a,e) => a+e.registrations, 0)
  const filtFillRate = filtered.length ? +(filtered.reduce((a,e) => a+e.fillRate, 0)/filtered.length).toFixed(1) : 0

  return (
    <main className="demo-analytics-page" role="main" aria-label="Event analytics dashboard">
      <div className="demo-shell">

        {/* ── Header ── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <span className="demo-pill">Vendor Portal · My Event Analytics</span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">Event Dashboard</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Full-funnel analytics for your events — booking trends, fill rates, revenue, audience behaviour, and actionable insights. Demo data only.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-full border border-slate-700 bg-slate-900/60 p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={["rounded-full px-3.5 py-1.5 text-xs font-medium transition-all", period===p?"bg-violet-600 text-white shadow":"text-slate-400 hover:text-slate-200"].join(" ")}>
                {PL[p]}
              </button>
            ))}
          </div>
        </header>

        {/* ── Smart Alerts ── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {eventAlerts.map(a => <AlertItem key={a.id} a={a} />)}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500 mr-1">Filters:</span>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...EVENT_CATEGORIES] as ("all"|EventCategory)[]).map(cat => (
              <button key={cat} onClick={() => setCat(cat)}
                className={["rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  catFilter===cat ? "border-violet-500 bg-violet-600/20 text-violet-300" : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"].join(" ")}>
                {cat !== "all" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{background:CATEGORY_COLORS[cat as EventCategory]}} />}
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Location */}
          <select value={locFilter} onChange={e => setLoc(e.target.value)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500">
            {EVENT_LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStat(e.target.value as any)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500">
            {["all","active","completed","cancelled"].map(s => <option key={s} value={s}>{s==="all"?"All Status":s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>

          <EventSearch value={search} onChange={setSearch} />

          {hasFilters && (
            <button onClick={clearFilters}
              className="ml-auto flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total Events"     value={filtered.length}  wow={8.3}  mom={16.7} icon={<Calendar className="h-4 w-4" />} accentColor={C.violet} />
          <KpiCard label="Total Bookings"   value={filtBookings}     wow={eventKpiSummary.bookingsWoW} mom={eventKpiSummary.bookingsMoM} icon={<Users className="h-4 w-4" />} accentColor={C.blue} />
          <KpiCard label="Total Revenue"    value={filtRevenue}      formatAsCurrency wow={eventKpiSummary.revenueWoW} mom={eventKpiSummary.revenueMoM} icon={<DollarSign className="h-4 w-4" />} accentColor={C.green} />
          <KpiCard label="Avg Fill Rate"    value={filtFillRate}     suffix="%" wow={eventKpiSummary.fillRateWoW} mom={eventKpiSummary.fillRateMoM} icon={<Activity className="h-4 w-4" />} accentColor={C.orange} />
          <KpiCard label="At Capacity (≥90%)" value={filtered.filter(e => e.fillRate >= 90).length} wow={6.2} mom={14.3} icon={<Zap className="h-4 w-4" />} accentColor={C.yellow} />
          <KpiCard label="Active Events"    value={filtered.filter(e => e.status==="active").length} wow={4.8} mom={11.1} icon={<CheckCircle className="h-4 w-4" />} accentColor={C.green} />
        </div>

        {/* ── Status summary bar ── */}
        <motion.div {...fadeUp}>
          <Panel>
            <Sub>Event status breakdown</Sub>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full gap-0.5 mb-3">
              {(["active","completed","cancelled"] as const).map(s => {
                const count = filtered.filter(e => e.status === s).length
                return count > 0 ? (
                  <div key={s} style={{width:`${(count/filtered.length)*100}%`, background:STATUS_COLORS[s]}}
                    className="first:rounded-l-full last:rounded-r-full transition-all duration-500" title={`${s}: ${count}`} />
                ) : null
              })}
            </div>
            <div className="flex flex-wrap gap-5">
              {(["active","completed","cancelled"] as const).map(s => {
                const count = filtered.filter(e => e.status === s).length
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{background:STATUS_COLORS[s]}} />
                    <span className="capitalize text-slate-400">{s}</span>
                    <strong className="text-slate-200">{count}</strong>
                    <span className="text-slate-600">({filtered.length ? ((count/filtered.length)*100).toFixed(0) : 0}%)</span>
                  </div>
                )
              })}
              <div className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-slate-500">Paid:</span><strong className="text-violet-300">{filtered.filter(e=>e.fee>0).length}</strong>
                <span className="text-slate-500 ml-2">Free:</span><strong className="text-blue-300">{filtered.filter(e=>e.fee===0).length}</strong>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* ══════════════ BOOKING & PARTICIPATION ══════════════════════════ */}
        <Section id="bookings" icon={<Users className="h-4 w-4" />} title="Booking & Participation" badge={`${filtBookings.toLocaleString()} total`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <Sub>Booking & revenue trend</Sub>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trendData}>
                    <defs>
                      <linearGradient id="bkGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%"  stopColor={C.violet} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={C.violet} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="period" {...AP} />
                    <YAxis yAxisId="bk" {...AP} />
                    <YAxis yAxisId="rev" orientation="right" {...AP} tickFormatter={compact} />
                    <Tooltip content={<Tip />} />
                    <Area yAxisId="bk" type="monotone" dataKey="bookings" stroke={C.violet} fill="url(#bkGrad)" strokeWidth={2} name="Bookings" />
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke={C.green}  strokeWidth={2} dot={false} name="Revenue" />
                    <Legend formatter={v => <span className="text-xs text-slate-400">{v}</span>} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            {/* Events near capacity vs underperforming */}
            <motion.div {...fadeUp}>
              <Panel className="h-full space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <Sub>Near capacity</Sub>
                </div>
                {nearCapacityEvents.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center gap-2 rounded-xl bg-emerald-900/15 border border-emerald-800/20 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-100 truncate">{e.title}</p>
                      <p className="text-[11px] text-slate-500">{e.city} · {e.registrations}/{e.maxParticipants}</p>
                    </div>
                    <FillBar v={e.fillRate} />
                  </div>
                ))}
                <Divider />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <Sub>Underperforming</Sub>
                </div>
                {underperformingEvents.slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center gap-2 rounded-xl bg-amber-900/10 border border-amber-800/20 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-100 truncate">{e.title}</p>
                      <p className="text-[11px] text-slate-500">{e.city} · {e.registrations}/{e.maxParticipants}</p>
                    </div>
                    <FillBar v={e.fillRate} />
                  </div>
                ))}
              </Panel>
            </motion.div>
          </div>

          {/* Fill rate per event horizontal bar */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Fill rate per event — top 12</Sub>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fillRateChartData.slice(0,12)} layout="vertical">
                  <CartesianGrid horizontal={false} stroke={C.grid} />
                  <XAxis type="number" {...AP} domain={[0,100]} tickFormatter={v=>`${v}%`} />
                  <YAxis type="category" dataKey="name" width={196} {...AP} />
                  <Tooltip content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                        <p className="font-semibold text-slate-200 mb-1">{(payload[0].payload as any).fullName}</p>
                        <p style={{color:payload[0].payload.color}}>Filled: {payload[0].value}%</p>
                        <p className="text-slate-500">Remaining: {payload[1]?.value}%</p>
                      </div>
                    ) : null} />
                  <Bar dataKey="fillRate" stackId="a" radius={[0,0,0,4]}>
                    {fillRateChartData.slice(0,12).map((d,i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                  <Bar dataKey="remaining" stackId="a" radius={[0,4,4,0]} fill="#1e293b" />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </motion.div>

        </Section>

        {/* ══════════════ REVENUE ══════════════════════════════════════════ */}
        <Section id="revenue" icon={<DollarSign className="h-4 w-4" />} title="Revenue Analytics" badge={compact(filtRevenue)}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <Sub>Revenue trend (paid events)</Sub>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={seasonalTrend}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%"  stopColor={C.green} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="month" {...AP} />
                    <YAxis {...AP} tickFormatter={compact} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="revenue" stroke={C.green} fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            {/* Free vs Paid comparison */}
            <motion.div {...fadeUp}>
              <Panel className="h-full">
                <Sub>Free vs Paid events</Sub>
                <div className="space-y-3">
                  {[
                    { label:"Paid events",  count:filtered.filter(e=>e.fee>0).length,  rev:filtered.reduce((a,e)=>a+(e.fee>0?e.revenue:0),0), bkg:filtered.reduce((a,e)=>a+(e.fee>0?e.registrations:0),0), color:C.violet },
                    { label:"Free events",  count:filtered.filter(e=>e.fee===0).length, rev:0, bkg:filtered.reduce((a,e)=>a+(e.fee===0?e.registrations:0),0), color:C.blue },
                  ].map(t => (
                    <div key={t.label} className="rounded-xl bg-slate-800/50 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{background:t.color}} />
                        <span className="text-xs font-medium text-slate-200">{t.label}</span>
                        <span className="ml-auto text-xs text-slate-400">{t.count} events</span>
                      </div>
                      <p className="text-lg font-bold" style={{color:t.color}}>{t.rev > 0 ? compact(t.rev) : "—"}</p>
                      <p className="text-[11px] text-slate-500">{t.bkg.toLocaleString()} registrations</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 rounded-xl bg-violet-600/10 border border-violet-500/20 p-3 text-xs text-violet-300">
                  <strong>Insight:</strong> Free events drive 38% of all registrations — key for community growth and organic discovery.
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Revenue per event top N */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Top 8 events by revenue</Sub>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...filtered].sort((a,b)=>b.revenue-a.revenue).slice(0,8)} layout="vertical">
                  <CartesianGrid horizontal={false} stroke={C.grid} />
                  <XAxis type="number" {...AP} tickFormatter={compact} />
                  <YAxis type="category" dataKey="title" width={200} {...AP}
                    tickFormatter={v => v.length > 24 ? v.slice(0,22)+"…" : v} />
                  <Tooltip content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                        <p className="font-semibold text-slate-200 mb-1">{(payload[0].payload as DemoEvent).title}</p>
                        <p style={{color:CATEGORY_COLORS[(payload[0].payload as DemoEvent).category]}}>Revenue: {compact(payload[0].value as number)}</p>
                        <p className="text-slate-400">Registrations: {(payload[0].payload as DemoEvent).registrations}</p>
                      </div>
                    ) : null} />
                  <Bar dataKey="revenue" radius={4}>
                    {[...filtered].sort((a,b)=>b.revenue-a.revenue).slice(0,8).map((e,i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[e.category]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </motion.div>

        </Section>

        {/* ══════════════ CATEGORY ═════════════════════════════════════════ */}
        <Section id="categories" icon={<BarChart2 className="h-4 w-4" />} title="Category Analytics" badge={`${filtCats.length} categories`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Bookings & revenue by category</Sub>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filtCats}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="category" {...AP} />
                    <YAxis yAxisId="bk" {...AP} />
                    <YAxis yAxisId="rev" orientation="right" {...AP} tickFormatter={compact} />
                    <Tooltip content={<Tip />} />
                    <Bar yAxisId="bk"  dataKey="bookings" radius={[4,4,0,0]} name="Bookings">
                      {filtCats.map((c,i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke={C.yellow} strokeWidth={2} dot={false} name="Revenue" />
                    <Legend formatter={v => <span className="text-xs text-slate-400">{v}</span>} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Category performance summary</Sub>
                <div className="space-y-2">
                  {filtCats.map((c) => (
                    <div key={c.category} className="flex items-center gap-3 rounded-xl bg-slate-800/50 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{background:`${c.color}22`, color:c.color}}>
                        {c.category.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-slate-100">{c.category}</p>
                          <GrowthBadge v={c.growth} />
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${(c.bookings/Math.max(...filtCats.map(x=>x.bookings)))*100}%`, background:c.color}} />
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs">
                        <p className="font-semibold text-slate-200">{compact(c.revenue)}</p>
                        <p className="text-slate-500">{c.bookings} bookings · ★ {c.avgRating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Category pie */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Revenue share by category</Sub>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width={240} height={200}>
                  <PieChart>
                    <Pie data={filtCats} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={84} paddingAngle={2}>
                      {filtCats.map((c) => <Cell key={c.category} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs shadow-xl">
                          <p style={{color:payload[0].payload.color}}>{payload[0].name}: {compact(payload[0].value as number)}</p>
                        </div>
                      ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {filtCats.map((c) => (
                    <div key={c.category} className="rounded-xl bg-slate-800/50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{background:c.color}} />
                        <span className="text-xs text-slate-300">{c.category}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-100">{compact(c.revenue)}</p>
                      <p className="text-[11px] text-slate-500">{c.count} events · {pct(c.avgFillRate)} fill</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </motion.div>

        </Section>

        {/* ══════════════ LOCATION ═════════════════════════════════════════ */}
        <Section id="location" icon={<MapPin className="h-4 w-4" />} title="Location Insights" badge={`${filtLocs.length} cities`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Revenue by city</Sub>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filtLocs} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={C.grid} />
                    <XAxis type="number" {...AP} tickFormatter={compact} />
                    <YAxis type="category" dataKey="city" width={80} {...AP} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="revenue" radius={4}>
                      {filtLocs.map((_, i) => <Cell key={i} fill={[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp}>
              <Panel>
                <Sub>City performance table</Sub>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-left">
                        {["City","State","Events","Bookings","Revenue","Fill%","Growth"].map(h=>(
                          <th key={h} className="pb-2 pr-3 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filtLocs.map((l,i) => (
                        <tr key={l.city} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 pr-3 font-medium text-slate-100 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{background:[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}} />
                            {l.city}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-400">{l.state}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{l.events}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{l.bookings.toLocaleString()}</td>
                          <td className="py-2.5 pr-3 text-slate-200 whitespace-nowrap">{compact(l.revenue)}</td>
                          <td className="py-2.5 pr-3"><FillBar v={l.avgFillRate} /></td>
                          <td className="py-2.5"><GrowthBadge v={l.growth} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </motion.div>
          </div>

        </Section>

        {/* ══════════════ TIME INSIGHTS ════════════════════════════════════ */}
        <Section id="time" icon={<Clock className="h-4 w-4" />} title="Time-based Insights">

          {/* Heatmap */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Peak booking hours (day × hour)</Sub>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid mb-1.5" style={{gridTemplateColumns:`48px repeat(${BOOKING_HOURS.length},1fr)`}}>
                    <div />
                    {BOOKING_HOURS.map(h => <div key={h} className="text-center text-[10px] text-slate-500">{h}</div>)}
                  </div>
                  {BOOKING_DAYS.map((day,di) => (
                    <div key={day} className="grid gap-0.5 mb-0.5" style={{gridTemplateColumns:`48px repeat(${BOOKING_HOURS.length},1fr)`}}>
                      <div className="text-[11px] text-slate-400 flex items-center">{day}</div>
                      {BOOKING_HOURS.map((_,si) => {
                        const v = bookingHeatmap[di][si]; const max = 56
                        const intensity = v/max
                        const bg = intensity>.8?"hsl(348 86% 55%)":intensity>.6?"hsl(348 70% 42%)":intensity>.4?"hsl(262 70% 38%)":intensity>.2?"hsl(262 55% 26%)":"#1e293b"
                        return <div key={si} title={`${day} ${BOOKING_HOURS[si]}: ${v} bookings`} className="aspect-square rounded-sm cursor-pointer hover:scale-110 transition-transform" style={{background:bg}} />
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2.5 text-[10px] text-slate-500">
                    <span>Low</span>
                    {["#1e293b","hsl(262 55% 26%)","hsl(262 70% 38%)","hsl(348 70% 42%)","hsl(348 86% 55%)"].map((c,i) => (
                      <div key={i} className="h-3 w-6 rounded-sm" style={{background:c}} />
                    ))}
                    <span>High</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Peak: <span className="text-rose-400">Fri–Sat, 6–8 PM</span>. Schedule registration reminders and limited-time offers in this window.
              </p>
            </Panel>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Seasonal trend */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Seasonal booking trend</Sub>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={seasonalTrend}>
                    <defs>
                      <linearGradient id="seaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="month" {...AP} />
                    <YAxis yAxisId="bk" {...AP} />
                    <YAxis yAxisId="ev" orientation="right" {...AP} />
                    <Tooltip content={<Tip />} />
                    <Area yAxisId="bk" type="monotone" dataKey="bookings" stroke={C.blue} fill="url(#seaGrad)" strokeWidth={2} name="Bookings" />
                    <Bar  yAxisId="ev" dataKey="events" fill={C.violet} opacity={0.6} radius={[2,2,0,0]} name="Events" />
                    <Legend formatter={v => <span className="text-xs text-slate-400">{v}</span>} />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="mt-1 text-[11px] text-slate-500">Sep–Dec peak season. Consider adding extra events in Q4.</p>
              </Panel>
            </motion.div>

            {/* Last-minute booking behaviour */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Last-minute booking behaviour</Sub>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={lastMinuteData}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="daysBeforeEnd" {...AP} tickFormatter={v => `D-${v}`} />
                    <YAxis {...AP} tickFormatter={v => `${v}%`} />
                    <Tooltip content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                          <p className="font-semibold text-slate-200">{label === 0 ? "Day of close" : `${label} days before`}</p>
                          <p style={{color:C.orange}}>Bookings: {payload[0].value}%</p>
                          <p className="text-slate-400">Cumulative: {(payload[0].payload as any).cumulative}%</p>
                        </div>
                      ) : null} />
                    <Bar dataKey="pct" radius={[4,4,0,0]} name="% of bookings">
                      {lastMinuteData.map((d,i) => <Cell key={i} fill={d.daysBeforeEnd <= 2 ? C.rose : d.daysBeforeEnd <= 7 ? C.orange : C.violet} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-[11px] text-rose-300">
                  <strong>45%</strong> of bookings arrive in the final 48 hours. Schedule final push notifications at D-2 for maximum impact.
                </div>
              </Panel>
            </motion.div>
          </div>

        </Section>

        {/* ══════════════ EVENT ACTIONS ════════════════════════════════════ */}
        <Section id="actions" icon={<ListFilter className="h-4 w-4" />} title="Events Requiring Attention">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* High demand — suggest waitlist / extra capacity */}
            <motion.div {...fadeUp}>
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">High demand — near/at capacity</span>
                  <span className="ml-auto rounded-full bg-emerald-600/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300">
                    {nearCapacityEvents.length} events
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">These events are filling up fast. Consider opening a waitlist or adding a second date.</p>
                <div className="space-y-2">
                  {nearCapacityEvents.map(e => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl bg-emerald-900/15 border border-emerald-800/20 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">{e.title}</p>
                        <p className="text-[11px] text-slate-500">{e.city} · {e.category} · {e.registrations}/{e.maxParticipants} registered</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <FillBar v={e.fillRate} />
                        <StatusBadge s={e.status} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-300">
                  <strong>Tip:</strong> Activate a waitlist for events above 90% fill rate so you don't lose interested participants.
                </div>
              </Panel>
            </motion.div>

            {/* Low fill rate — needs promotion */}
            <motion.div {...fadeUp}>
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Low fill rate — needs promotion</span>
                  <span className="ml-auto rounded-full bg-amber-600/20 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300">
                    {underperformingEvents.length} events
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">These events are below 65% capacity. Run a targeted campaign or early-bird offer to drive registrations.</p>
                <div className="space-y-2">
                  {underperformingEvents.map(e => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl bg-amber-900/10 border border-amber-800/20 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">{e.title}</p>
                        <p className="text-[11px] text-slate-500">{e.city} · {e.category} · {e.registrations}/{e.maxParticipants} registered</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <FillBar v={e.fillRate} />
                        <StatusBadge s={e.status} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-amber-600/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300">
                  <strong>Tip:</strong> Share a discount code or post a last-chance reminder for events below 60% fill rate.
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Your best-performing events — top 5 by revenue */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Your top 5 events by revenue</Sub>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[...demoEvents].sort((a,b) => b.revenue - a.revenue).slice(0,5).map((e, i) => (
                  <div key={e.id} className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[11px] font-bold ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-orange-400":"text-slate-500"}`}>
                        #{i+1}
                      </span>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px]"
                        style={{background:`${CATEGORY_COLORS[e.category]}22`,color:CATEGORY_COLORS[e.category]}}>
                        {e.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 leading-tight line-clamp-2">{e.title}</p>
                    <p className="text-sm font-bold text-violet-300">{compact(e.revenue)}</p>
                    <p className="text-[11px] text-slate-500">{e.registrations} bookings · {e.city}</p>
                    <FillBar v={e.fillRate} />
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

        </Section>

        {/* ══════════════ ALL EVENTS TABLE ═════════════════════════════════ */}
        <Section id="events-table" icon={<Calendar className="h-4 w-4" />} title="All Events" badge={`${filtered.length} events`} open={false}>

          <motion.div {...fadeUp}>
            <Panel>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-left">
                      {(["title","category","city","fee","registrations","revenue","fillRate","status","avgRating","growth"] as (keyof DemoEvent)[]).map(col => (
                        <th key={col} className="pb-2 pr-3 font-medium whitespace-nowrap">
                          <button className={`flex items-center gap-0.5 hover:text-slate-300 transition-colors ${sortBy===col?"text-violet-400":"text-slate-500"}`}
                            onClick={() => toggleSort(col)}>
                            {col === "registrations" ? "Bookings" : col === "fillRate" ? "Fill%" : col === "avgRating" ? "Rating" : col.charAt(0).toUpperCase() + col.slice(1)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(showAllEvents ? sorted : sorted.slice(0,10)).map(e => (
                      <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-slate-100 max-w-[160px] truncate">{e.title}</td>
                        <td className="py-2.5 pr-3">
                          <span className="rounded-full px-2 py-0.5 text-[10px]" style={{background:`${CATEGORY_COLORS[e.category]}22`, color:CATEGORY_COLORS[e.category]}}>{e.category}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-400">{e.city}</td>
                        <td className="py-2.5 pr-3 text-slate-300 whitespace-nowrap">{e.fee > 0 ? fmt(e.fee) : "Free"}</td>
                        <td className="py-2.5 pr-3 text-slate-200">{e.registrations}/{e.maxParticipants}</td>
                        <td className="py-2.5 pr-3 text-slate-200 whitespace-nowrap">{e.revenue > 0 ? compact(e.revenue) : "—"}</td>
                        <td className="py-2.5 pr-3"><FillBar v={e.fillRate} /></td>
                        <td className="py-2.5 pr-3"><StatusBadge s={e.status} /></td>
                        <td className="py-2.5 pr-3 text-yellow-400">★ {e.avgRating}</td>
                        <td className="py-2.5"><GrowthBadge v={e.growth} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showAllEvents && filtered.length > 10 && (
                <button onClick={() => setShowAll(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" /> Show {filtered.length - 10} more events
                </button>
              )}
              {showAllEvents && (
                <button onClick={() => setShowAll(false)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  <ChevronUp className="h-3.5 w-3.5" /> Collapse
                </button>
              )}
            </Panel>
          </motion.div>

        </Section>

      </div>
    </main>
  )
}
