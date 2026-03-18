"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Legend, ResponsiveContainer, Tooltip, ComposedChart,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  Car, DollarSign, Eye, MessageSquare, TrendingUp, TrendingDown,
  AlertTriangle, Info, Activity, MapPin, Clock, Zap,
  ChevronDown, ChevronUp, Search, SlidersHorizontal, X,
  BarChart2, CheckCircle, Tag, Gauge,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  demoVehicles, vehicleKpiSummary, vehicleAlerts,
  listingTrend, conversionFunnel, bodyTypePerformance,
  fuelTypeBreakdown, brandPerformance, priceDistribution,
  locationPerformance, agingData, staleListing,
  topByViews, topByInquiry, fuelTrend,
  VEHICLE_TYPES, FUEL_TYPES, TYPE_COLORS, FUEL_COLORS, VEHICLE_LOCATIONS,
  type DemoVehicle, type VehicleType, type FuelType, type AlertItem,
} from "@/data/demoVehicleAnalytics";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  violet: "hsl(262 83% 70%)", blue: "hsl(222 84% 60%)",
  green:  "hsl(160 84% 60%)", orange: "hsl(28 92% 65%)",
  rose:   "hsl(348 86% 65%)", yellow: "hsl(48 96% 58%)",
  grid: "#1e293b", axis: "#475569",
}
const AP  = { tickLine:false, axisLine:false, stroke:C.axis, tick:{fill:C.axis,fontSize:10} }
const compact = (v: number) => v >= 1_00_00_000 ? `₹${(v/1_00_00_000).toFixed(1)}Cr` : v >= 1_00_000 ? `₹${(v/1_00_000).toFixed(1)}L` : v >= 1_000 ? `₹${(v/1_000).toFixed(1)}K` : `₹${v}`
const fmtINR  = (v: number) => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(v)
const num     = (v: number) => v.toLocaleString("en-IN")
const pct     = (v: number | string) => `${v}%`

const PERIODS = ["7d","30d","90d","1y"] as const
type Period = typeof PERIODS[number]
const PL: Record<Period,string> = { "7d":"7 Days","30d":"30 Days","90d":"90 Days","1y":"1 Year" }

const STATUS_COLORS: Record<string,string> = {
  listed:"hsl(160 84% 60%)", sold:"hsl(222 84% 60%)",
  reserved:"hsl(48 96% 58%)", inactive:"hsl(348 86% 65%)"
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
const Panel = ({ children, className="" }: { children:React.ReactNode; className?:string }) => (
  <div className={`demo-card rounded-2xl p-5 demo-card-hover ${className}`}>{children}</div>
)
const Sub = ({ children }: { children:string }) => (
  <h3 className="text-sm font-medium text-slate-300 mb-3">{children}</h3>
)
const Divider = () => <div className="border-t border-slate-800/60 my-1" />
const fadeUp = { initial:{opacity:0,y:14}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:"-30px"}, transition:{duration:0.28} }

const GrowthBadge = ({ v }: { v:number }) => (
  <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${v>=0?"text-emerald-400":"text-rose-400"}`}>
    {v>=0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
    {v>=0?"+":""}{v.toFixed(1)}%
  </span>
)

const StatusPill = ({ s }: { s:string }) => {
  const cfg = {
    listed:   { bg:"bg-emerald-500/15 border-emerald-500/25", tx:"text-emerald-400" },
    sold:     { bg:"bg-blue-500/15   border-blue-500/25",     tx:"text-blue-400"    },
    reserved: { bg:"bg-yellow-500/15 border-yellow-500/25",   tx:"text-yellow-400"  },
    inactive: { bg:"bg-rose-500/15   border-rose-500/25",     tx:"text-rose-400"    },
  }[s] ?? { bg:"", tx:"" }
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${cfg.bg} ${cfg.tx}`}>{s}</span>
}

const FuelChip = ({ f }: { f:FuelType }) => (
  <span className="rounded-full px-1.5 py-0.5 text-[10px]"
    style={{ background:`${FUEL_COLORS[f]}22`, color:FUEL_COLORS[f] }}>{f}</span>
)

const TypeChip = ({ t }: { t:VehicleType }) => (
  <span className="rounded-full px-1.5 py-0.5 text-[10px]"
    style={{ background:`${TYPE_COLORS[t]}22`, color:TYPE_COLORS[t] }}>{t}</span>
)

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl min-w-[130px]">
      <p className="font-semibold text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 mb-0.5" style={{color:p.color??p.fill}}>
          <span className="h-2 w-2 rounded-full shrink-0" style={{background:p.color??p.fill}}/>
          {p.name??p.dataKey}: {typeof p.value==="number"&&p.value>9999 ? p.value.toLocaleString("en-IN") : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
const AlertBanner = ({ a }: { a:AlertItem }) => {
  const cfg = {
    warning:  { bg:"bg-amber-500/10 border-amber-500/25",   tx:"text-amber-400",  icon:<AlertTriangle className="h-4 w-4 shrink-0"/> },
    positive: { bg:"bg-emerald-500/10 border-emerald-500/25",tx:"text-emerald-400",icon:<TrendingUp    className="h-4 w-4 shrink-0"/> },
    info:     { bg:"bg-blue-500/10 border-blue-500/25",     tx:"text-blue-400",   icon:<Info          className="h-4 w-4 shrink-0"/> },
  }[a.type]
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg}`}>
      <span className={cfg.tx}>{cfg.icon}</span>
      <div>
        <p className={`text-xs font-semibold ${cfg.tx}`}>{a.title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{a.message}</p>
      </div>
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
const Section = ({ id, icon, title, badge, open:initOpen=true, children }: {
  id:string; icon:React.ReactNode; title:string; badge?:string; open?:boolean; children:React.ReactNode
}) => {
  const [open, setOpen] = useState(initOpen)
  return (
    <section id={id} className="space-y-4">
      <button className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-5 py-3.5 text-left hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(o=>!o)} aria-expanded={open}>
        <div className="flex items-center gap-2.5">
          <span className="text-violet-400">{icon}</span>
          <span className="text-base font-semibold text-slate-100">{title}</span>
          {badge && <span className="rounded-full bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-300">{badge}</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500"/> : <ChevronDown className="h-4 w-4 text-slate-500"/>}
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

// ─── Vehicle search ───────────────────────────────────────────────────────────
const VehicleSearch = ({ value, onChange }: { value:string; onChange:(v:string)=>void }) => {
  const [open, setOpen] = useState(false)
  const matches = demoVehicles.filter(v =>
    v.title.toLowerCase().includes(value.toLowerCase()) ||
    v.brand.toLowerCase().includes(value.toLowerCase()) ||
    v.city.toLowerCase().includes(value.toLowerCase())
  ).slice(0,7)
  return (
    <div className="relative w-full md:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"/>
      <input type="text" placeholder="Search vehicle, brand, city…" value={value}
        onChange={e=>{onChange(e.target.value);setOpen(true)}}
        onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)}
        className="h-9 w-full rounded-full border border-slate-700 bg-slate-900/80 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/80"/>
      {value && <button onClick={()=>onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-slate-500"/></button>}
      {open && value && matches.length > 0 && (
        <div className="absolute top-full z-50 mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {matches.map(v => (
            <button key={v.id} onMouseDown={()=>{onChange(v.title);setOpen(false)}}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors">
              <span className="text-slate-200 truncate">{v.title}</span>
              <TypeChip t={v.type}/>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function VehicleAnalyticsDashboard() {
  const [period, setPeriod]     = useState<Period>("30d")
  const [typeFilter, setType]   = useState<VehicleType|"all">("all")
  const [fuelFilter, setFuel]   = useState<FuelType|"all">("all")
  const [locFilter, setLoc]     = useState("All Cities")
  const [statusFilter, setStat] = useState<"all"|"listed"|"sold"|"reserved"|"inactive">("all")
  const [search, setSearch]     = useState("")
  const [showAll, setShowAll]   = useState(false)
  const [sortBy, setSortBy]     = useState<keyof DemoVehicle>("views")
  const [sortDir, setSortDir]   = useState<"asc"|"desc">("desc")

  const filtered = useMemo(() => demoVehicles.filter(v => {
    const q = search.toLowerCase()
    return (typeFilter==="all"  || v.type   === typeFilter)
        && (fuelFilter==="all"  || v.fuel   === fuelFilter)
        && (locFilter==="All Cities" || v.city === locFilter)
        && (statusFilter==="all" || v.status === statusFilter)
        && (!q || v.title.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) || v.city.toLowerCase().includes(q))
  }), [typeFilter, fuelFilter, locFilter, statusFilter, search])

  const sorted = useMemo(() =>
    [...filtered].sort((a,b) => sortDir==="desc" ? (b[sortBy] as number)-(a[sortBy] as number) : (a[sortBy] as number)-(b[sortBy] as number)),
  [filtered, sortBy, sortDir])

  const toggleSort = (k: keyof DemoVehicle) => {
    if (sortBy===k) setSortDir(d=>d==="desc"?"asc":"desc")
    else { setSortBy(k); setSortDir("desc") }
  }

  const clearFilters = () => { setType("all"); setFuel("all"); setLoc("All Cities"); setStat("all"); setSearch("") }
  const hasFilters = typeFilter!=="all" || fuelFilter!=="all" || locFilter!=="All Cities" || statusFilter!=="all" || !!search

  const trendData    = listingTrend[period]
  const filtViews    = filtered.reduce((a,v)=>a+v.views, 0)
  const filtInq      = filtered.reduce((a,v)=>a+v.inquiries, 0)
  const filtSold     = filtered.filter(v=>v.status==="sold").length
  const filtRevenue  = filtered.filter(v=>v.status==="sold").reduce((a,v)=>a+v.price, 0)

  return (
    <main className="demo-analytics-page" role="main" aria-label="Vehicle analytics dashboard">
      <div className="demo-shell">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <span className="demo-pill">Vendor Portal · My Vehicle Listings</span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">Vehicle Analytics</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Track listing performance, buyer funnel, inventory health, and revenue across all your vehicle listings. Demo data only.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-full border border-slate-700 bg-slate-900/60 p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={()=>setPeriod(p)}
                className={["rounded-full px-3.5 py-1.5 text-xs font-medium transition-all", period===p?"bg-violet-600 text-white shadow":"text-slate-400 hover:text-slate-200"].join(" ")}>
                {PL[p]}
              </button>
            ))}
          </div>
        </header>

        {/* ── Smart Alerts ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {vehicleAlerts.map(a => <AlertBanner key={a.id} a={a}/>)}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0"/>
          <span className="text-xs text-slate-500 mr-1">Filters:</span>

          {/* Vehicle type */}
          <div className="flex flex-wrap gap-1.5">
            {(["all",...VEHICLE_TYPES] as ("all"|VehicleType)[]).map(t => (
              <button key={t} onClick={()=>setType(t)}
                className={["rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  typeFilter===t?"border-violet-500 bg-violet-600/20 text-violet-300":"border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"].join(" ")}>
                {t!=="all" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{background:TYPE_COLORS[t as VehicleType]}}/>}
                {t==="all"?"All Types":t}
              </button>
            ))}
          </div>

          {/* Fuel */}
          <select value={fuelFilter} onChange={e=>setFuel(e.target.value as any)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500">
            <option value="all">All Fuels</option>
            {FUEL_TYPES.map(f=><option key={f}>{f}</option>)}
          </select>

          {/* Location */}
          <select value={locFilter} onChange={e=>setLoc(e.target.value)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500">
            {VEHICLE_LOCATIONS.map(l=><option key={l}>{l}</option>)}
          </select>

          {/* Status */}
          <select value={statusFilter} onChange={e=>setStat(e.target.value as any)}
            className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500">
            {["all","listed","sold","reserved","inactive"].map(s=><option key={s} value={s}>{s==="all"?"All Status":s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>

          <VehicleSearch value={search} onChange={setSearch}/>

          {hasFilters && (
            <button onClick={clearFilters}
              className="ml-auto flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors">
              <X className="h-3 w-3"/> Clear
            </button>
          )}
        </div>

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total Listings"  value={filtered.length}    wow={4.8}  mom={10.7} icon={<Car className="h-4 w-4"/>}          accentColor={C.violet}/>
          <KpiCard label="Total Views"     value={filtViews}          wow={vehicleKpiSummary.viewsWoW} mom={vehicleKpiSummary.viewsMoM} icon={<Eye className="h-4 w-4"/>} accentColor={C.blue}/>
          <KpiCard label="Total Inquiries" value={filtInq}            wow={vehicleKpiSummary.inqWoW}   mom={vehicleKpiSummary.inqMoM}   icon={<MessageSquare className="h-4 w-4"/>} accentColor={C.green}/>
          <KpiCard label="Vehicles Sold"   value={filtSold}           wow={vehicleKpiSummary.soldWoW}  mom={vehicleKpiSummary.soldMoM}  icon={<CheckCircle className="h-4 w-4"/>} accentColor={C.orange}/>
          <KpiCard label="Sales Revenue"   value={filtRevenue}        formatAsCurrency wow={vehicleKpiSummary.revenueWoW} mom={vehicleKpiSummary.revenueMoM} icon={<DollarSign className="h-4 w-4"/>} accentColor={C.yellow}/>
          <KpiCard label="Inquiry Rate"    value={filtViews ? +((filtInq/filtViews)*100).toFixed(1):0} suffix="%" wow={1.4} mom={2.8} icon={<Activity className="h-4 w-4"/>} accentColor={C.rose}/>
        </div>

        {/* ── Status summary bar ───────────────────────────────────────────── */}
        <motion.div {...fadeUp}>
          <Panel>
            <Sub>Inventory status breakdown</Sub>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full gap-0.5 mb-3">
              {(["listed","reserved","sold","inactive"] as const).map(s => {
                const count = filtered.filter(v=>v.status===s).length
                return count > 0 ? (
                  <div key={s} style={{width:`${(count/filtered.length)*100}%`,background:STATUS_COLORS[s]}}
                    className="first:rounded-l-full last:rounded-r-full transition-all duration-500" title={`${s}: ${count}`}/>
                ) : null
              })}
            </div>
            <div className="flex flex-wrap gap-5">
              {(["listed","reserved","sold","inactive"] as const).map(s => {
                const count = filtered.filter(v=>v.status===s).length
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{background:STATUS_COLORS[s]}}/>
                    <span className="capitalize text-slate-400">{s}</span>
                    <strong className="text-slate-200">{count}</strong>
                    <span className="text-slate-600">({filtered.length?((count/filtered.length)*100).toFixed(0):0}%)</span>
                  </div>
                )
              })}
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-slate-500">EV listings:</span>
                <strong className="text-emerald-400">{filtered.filter(v=>v.fuel==="Electric").length}</strong>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* ══════════════ LISTING PERFORMANCE ══════════════════════════════ */}
        <Section id="performance" icon={<Eye className="h-4 w-4"/>} title="Listing Performance" badge={`${num(filtViews)} views`}>

          {/* Trend chart */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Views · Inquiries · Test Drives trend</Sub>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="vGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%"  stopColor={C.violet} stopOpacity={0.28}/>
                      <stop offset="95%" stopColor={C.violet} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid}/>
                  <XAxis dataKey="period" {...AP}/>
                  <YAxis yAxisId="v"  {...AP}/>
                  <YAxis yAxisId="i"  orientation="right" {...AP}/>
                  <Tooltip content={<Tip/>}/>
                  <Area  yAxisId="v" type="monotone" dataKey="views"      stroke={C.violet} fill="url(#vGrad)" strokeWidth={2} name="Views"/>
                  <Line  yAxisId="i" type="monotone" dataKey="inquiries"  stroke={C.green}  strokeWidth={2}    dot={false}     name="Inquiries"/>
                  <Line  yAxisId="i" type="monotone" dataKey="testDrives" stroke={C.orange} strokeWidth={2}    dot={false}     name="Test Drives"/>
                  <Legend formatter={v=><span className="text-xs text-slate-400">{v}</span>}/>
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </motion.div>

          {/* Conversion funnel + top by views */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Funnel */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Buyer conversion funnel</Sub>
                <div className="space-y-2">
                  {conversionFunnel.map((s,i) => {
                    const colors = [C.violet, C.blue, C.orange, C.green]
                    const widths = [100, 12.8, 1.8, 0.13]
                    return (
                      <div key={s.stage} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{s.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{num(s.value)}</span>
                            <span className="text-slate-500">{i > 0 ? `(${pct(s.pct)})` : ""}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: colors[i] }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${widths[i] || s.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                          />
                        </div>
                        {i < conversionFunnel.length - 1 && (
                          <p className="text-[10px] text-slate-600 pl-1">
                            ↓ {((conversionFunnel[i+1].value / s.value) * 100).toFixed(1)}% proceed to {conversionFunnel[i+1].stage.toLowerCase()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300">
                  <strong>Tip:</strong> Only 16% of inquiries convert to test drives. Add a prominent "Book Test Drive" button to each listing.
                </div>
              </Panel>
            </motion.div>

            {/* Top by views */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Top 5 listings by views</Sub>
                <div className="space-y-2 mb-4">
                  {topByViews.map((v,i) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl bg-slate-800/50 px-3 py-2.5">
                      <span className={`text-sm font-bold shrink-0 w-4 ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-orange-400":"text-slate-600"}`}>
                        {i+1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">{v.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TypeChip t={v.type}/>
                          <FuelChip f={v.fuel}/>
                          <span className="text-[10px] text-slate-500">{v.city}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-slate-200">{num(v.views)} views</p>
                        <p className="text-[11px] text-slate-500">{v.inquiries} inq · {v.testDrives} drives</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Divider/>
                <Sub>Top 5 by inquiries</Sub>
                <div className="space-y-2">
                  {topByInquiry.map((v,i) => (
                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-800/50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 w-3 shrink-0">{i+1}</span>
                        <span className="text-xs text-slate-200 truncate">{v.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold" style={{color:TYPE_COLORS[v.type]}}>{v.inquiries} inq</span>
                        <GrowthBadge v={v.growth}/>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>
        </Section>

        {/* ══════════════ INVENTORY BREAKDOWN ══════════════════════════════ */}
        <Section id="inventory" icon={<BarChart2 className="h-4 w-4"/>} title="Inventory Breakdown">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Body type */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Performance by body type</Sub>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bodyTypePerformance}>
                    <CartesianGrid vertical={false} stroke={C.grid}/>
                    <XAxis dataKey="type" {...AP}/>
                    <YAxis yAxisId="v" {...AP}/>
                    <YAxis yAxisId="i" orientation="right" {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar yAxisId="v" dataKey="views"     radius={[4,4,0,0]} name="Views">
                      {bodyTypePerformance.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Bar>
                    <Bar yAxisId="i" dataKey="inquiries" radius={[4,4,0,0]} fill={C.blue} opacity={0.6} name="Inquiries"/>
                    <Legend formatter={v=><span className="text-xs text-slate-400">{v}</span>}/>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            {/* Fuel type */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Fuel type distribution & views</Sub>
                <div className="flex flex-col gap-3">
                  {fuelTypeBreakdown.filter(f=>f.count>0).map(f=>(
                    <div key={f.fuel} className="flex items-center gap-3">
                      <FuelChip f={f.fuel as FuelType}/>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">{f.count} listings · {num(f.views)} views</span>
                          <GrowthBadge v={f.growth}/>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${(f.views/vehicleKpiSummary.totalViews)*100}%`,background:f.color}}/>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-300 shrink-0 w-12 text-right">{((f.views/vehicleKpiSummary.totalViews)*100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>

          {/* Fuel trend + price distribution */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <Sub>Monthly views by fuel type</Sub>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fuelTrend}>
                    <defs>
                      {FUEL_TYPES.map(f=>(
                        <linearGradient key={f} id={`g${f}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%"  stopColor={FUEL_COLORS[f]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={FUEL_COLORS[f]} stopOpacity={0.03}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid}/>
                    <XAxis dataKey="month" {...AP}/>
                    <YAxis {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    {FUEL_TYPES.map(f=>(
                      <Area key={f} type="monotone" dataKey={f} stroke={FUEL_COLORS[f]} fill={`url(#g${f})`} strokeWidth={1.5} name={f}/>
                    ))}
                    <Legend formatter={v=><span className="text-xs text-slate-400">{v}</span>}/>
                  </AreaChart>
                </ResponsiveContainer>
                <p className="mt-1 text-[11px] text-slate-500">Electric views growing +42.8% MoM — fastest growing segment in your inventory.</p>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Price range distribution</Sub>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priceDistribution} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={C.grid}/>
                    <XAxis type="number" {...AP}/>
                    <YAxis type="category" dataKey="range" width={72} {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="count" radius={4} name="Listings">
                      {priceDistribution.map((_,i)=><Cell key={i} fill={[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>
          </div>

          {/* Body type summary table */}
          <motion.div {...fadeUp}>
            <Panel>
              <Sub>Body type summary</Sub>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-left">
                      {["Type","Listings","Listed","Sold","Views","Inquiries","Avg Price","Growth"].map(h=>(
                        <th key={h} className="pb-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bodyTypePerformance.filter(t=>t.count>0).map(t=>(
                      <tr key={t.type} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{background:t.color}}/>
                            <span className="font-medium text-slate-100">{t.type}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-200">{t.count}</td>
                        <td className="py-2.5 pr-4 text-emerald-400">{t.listed}</td>
                        <td className="py-2.5 pr-4 text-blue-400">{t.sold}</td>
                        <td className="py-2.5 pr-4 text-slate-200">{num(t.views)}</td>
                        <td className="py-2.5 pr-4 text-slate-200">{num(t.inquiries)}</td>
                        <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">{compact(t.avgPrice)}</td>
                        <td className="py-2.5"><GrowthBadge v={t.growth}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </motion.div>
        </Section>

        {/* ══════════════ BRAND ANALYTICS ══════════════════════════════════ */}
        <Section id="brands" icon={<Tag className="h-4 w-4"/>} title="Brand Analytics" badge={`${brandPerformance.length} brands`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Views by brand</Sub>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={brandPerformance} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={C.grid}/>
                    <XAxis type="number" {...AP}/>
                    <YAxis type="category" dataKey="brand" width={72} {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="views" radius={4} name="Views">
                      {brandPerformance.map((_,i)=><Cell key={i} fill={[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Brand performance table</Sub>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-left">
                        {["Brand","Listings","Views","Inquiries","Sold","Conv%"].map(h=>(
                          <th key={h} className="pb-2 pr-3 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {brandPerformance.map((b,i)=>(
                        <tr key={b.brand} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 pr-3 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{background:[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}}/>
                            <span className="font-medium text-slate-100">{b.brand}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-200">{b.count}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{num(b.views)}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{b.inquiries}</td>
                          <td className="py-2.5 pr-3 text-blue-400">{b.sold}</td>
                          <td className="py-2.5 text-violet-300">{b.convRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </motion.div>
          </div>
        </Section>

        {/* ══════════════ LOCATION ═════════════════════════════════════════ */}
        <Section id="location" icon={<MapPin className="h-4 w-4"/>} title="Location Insights" badge={`${locationPerformance.length} cities`}>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Views by city</Sub>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={locationPerformance} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={C.grid}/>
                    <XAxis type="number" {...AP}/>
                    <YAxis type="category" dataKey="city" width={80} {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="views" radius={4} name="Views">
                      {locationPerformance.map((_,i)=><Cell key={i} fill={[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}/>)}
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
                        {["City","Listings","Listed","Sold","Views","Inquiries","Avg Price","Growth"].map(h=>(
                          <th key={h} className="pb-2 pr-3 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {locationPerformance.map((l,i)=>(
                        <tr key={l.city} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 pr-3 font-medium text-slate-100 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{background:[C.violet,C.blue,C.green,C.orange,C.rose,C.yellow][i%6]}}/>
                            {l.city}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-200">{l.count}</td>
                          <td className="py-2.5 pr-3 text-emerald-400">{l.listed}</td>
                          <td className="py-2.5 pr-3 text-blue-400">{l.sold}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{num(l.views)}</td>
                          <td className="py-2.5 pr-3 text-slate-200">{l.inquiries}</td>
                          <td className="py-2.5 pr-3 text-slate-200 whitespace-nowrap">{compact(l.avgPrice)}</td>
                          <td className="py-2.5"><GrowthBadge v={l.growth}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </motion.div>
          </div>
        </Section>

        {/* ══════════════ INVENTORY HEALTH ══════════════════════════════════ */}
        <Section id="health" icon={<Gauge className="h-4 w-4"/>} title="Inventory Health">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Aging chart */}
            <motion.div {...fadeUp}>
              <Panel>
                <Sub>Listing age breakdown</Sub>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={agingData}>
                    <CartesianGrid vertical={false} stroke={C.grid}/>
                    <XAxis dataKey="label" {...AP} tick={{fill:C.axis,fontSize:9}}/>
                    <YAxis {...AP}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="count" radius={[4,4,0,0]} name="Listings">
                      {agingData.map((d,i)=><Cell key={i} fill={i===3?C.rose:i===2?C.orange:i===1?C.yellow:C.green}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[11px] text-slate-500">
                  {agingData[3].count > 0 && <><span className="text-rose-400">{agingData[3].count} listing{agingData[3].count>1?"s":""}</span> stale for 45+ days. Refresh now.</>}
                </p>
              </Panel>
            </motion.div>

            {/* Stale listings */}
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400"/>
                  <span className="text-sm font-medium text-slate-300">Stale listings (40+ days)</span>
                  <span className="ml-auto rounded-full bg-amber-600/20 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300">{staleListing.length} listings</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">These vehicles have been listed for a long time with low engagement. Consider a price drop or photo refresh.</p>
                <div className="space-y-2">
                  {staleListing.map(v=>(
                    <div key={v.id} className="flex items-center gap-3 rounded-xl bg-amber-900/10 border border-amber-800/20 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">{v.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TypeChip t={v.type}/>
                          <span className="text-[10px] text-slate-500">{v.city} · {compact(v.price)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs space-y-1">
                        <p className="text-amber-400 font-semibold">{v.daysListed} days</p>
                        <p className="text-slate-500">{num(v.views)} views · {v.inquiries} inq</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-amber-600/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300">
                  <strong>Tip:</strong> Reducing price by 5–10% on stale listings typically boosts views by 35–50% within the first week.
                </div>
              </Panel>
            </motion.div>
          </div>
        </Section>

        {/* ══════════════ ALL LISTINGS TABLE ════════════════════════════════ */}
        <Section id="listings" icon={<Car className="h-4 w-4"/>} title="All Listings" badge={`${filtered.length} vehicles`} open={false}>
          <motion.div {...fadeUp}>
            <Panel>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-left">
                      {(["title","type","fuel","city","price","views","inquiries","testDrives","daysListed","status","growth"] as (keyof DemoVehicle)[]).map(col=>(
                        <th key={col} className="pb-2 pr-3 font-medium whitespace-nowrap">
                          <button className={`flex items-center gap-0.5 hover:text-slate-300 transition-colors ${sortBy===col?"text-violet-400":"text-slate-500"}`}
                            onClick={()=>toggleSort(col)}>
                            {col==="testDrives"?"Test Drives":col==="daysListed"?"Age":col.charAt(0).toUpperCase()+col.slice(1)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(showAll?sorted:sorted.slice(0,12)).map(v=>(
                      <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-slate-100 max-w-[180px] truncate">{v.title}</td>
                        <td className="py-2.5 pr-3"><TypeChip t={v.type}/></td>
                        <td className="py-2.5 pr-3"><FuelChip f={v.fuel}/></td>
                        <td className="py-2.5 pr-3 text-slate-400">{v.city}</td>
                        <td className="py-2.5 pr-3 text-slate-200 whitespace-nowrap">{compact(v.price)}</td>
                        <td className="py-2.5 pr-3 text-slate-200">{num(v.views)}</td>
                        <td className="py-2.5 pr-3 text-slate-200">{v.inquiries}</td>
                        <td className="py-2.5 pr-3 text-slate-200">{v.testDrives}</td>
                        <td className="py-2.5 pr-3">
                          <span className={v.daysListed>40?"text-rose-400":v.daysListed>20?"text-amber-400":"text-slate-300"}>
                            {v.daysListed}d
                          </span>
                        </td>
                        <td className="py-2.5 pr-3"><StatusPill s={v.status}/></td>
                        <td className="py-2.5"><GrowthBadge v={v.growth}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showAll && filtered.length > 12 && (
                <button onClick={()=>setShowAll(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
                  <ChevronDown className="h-3.5 w-3.5"/> Show {filtered.length-12} more
                </button>
              )}
              {showAll && (
                <button onClick={()=>setShowAll(false)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/60 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  <ChevronUp className="h-3.5 w-3.5"/> Collapse
                </button>
              )}
            </Panel>
          </motion.div>
        </Section>

      </div>
    </main>
  )
}
