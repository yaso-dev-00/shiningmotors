"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Legend, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  ShoppingCart, DollarSign, Package, Clock, RotateCcw,
  Repeat, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Info, Star, MapPin, Truck,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  demoAlerts,
  demoKpis,
  salesTrend,
  orderStatusBreakdown,
  topProducts,
  lowProducts,
  mostReturnedProducts,
  categoryAnalytics,
  topLocations,
  customerTypeSplit,
  topCustomers,
  ordersByDayOfWeek,
  ordersByHour,
  courierPerformance,
  shippingCostVsRevenue,
  financialSummary,
  refundTrend,
  type AlertItem,
} from "@/data/demoAnalytics";

const C = {
  violet: "hsl(262 83% 70%)", blue: "hsl(222 84% 60%)", green: "hsl(160 84% 60%)",
  orange: "hsl(28 92% 65%)", rose: "hsl(348 86% 65%)", yellow: "hsl(48 96% 58%)",
  grid: "#1e293b", axis: "#475569",
}
const PIE = [C.violet, C.blue, C.green, C.orange, C.rose]
const AXIS = { tickLine: false, axisLine: false, stroke: C.axis, tick: { fill: C.axis, fontSize: 10 } }
const fmt = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
const compact = (v: number) => v >= 1_000_000 ? `₹${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `₹${(v / 1_000).toFixed(1)}K` : `₹${v}`

const PERIODS = ["7d", "30d", "90d", "1y"] as const
type Period = (typeof PERIODS)[number]
const PERIOD_LABELS: Record<Period, string> = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days", "1y": "1 Year" }

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales" },
  { id: "products", label: "Products" },
  { id: "segments", label: "Segments" },
  { id: "customers", label: "Customers" },
  { id: "operations", label: "Operations" },
] as const

const SectionTitle = ({ id, children }: { id: string; children: string }) => (
  <h2 id={id} className="text-lg font-semibold text-slate-100 mb-4">{children}</h2>
)
const SubTitle = ({ children }: { children: string }) => (
  <h3 className="text-sm font-medium text-slate-300 mb-3">{children}</h3>
)
const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`demo-card rounded-2xl p-5 demo-card-hover ${className}`}>{children}</div>
)
const Divider = () => <div className="my-8 border-t border-slate-800/80" />
const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.32 } }

const kpiIcon: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="h-4 w-4" />, orders: <ShoppingCart className="h-4 w-4" />,
  products_sold: <Package className="h-4 w-4" />, aov: <Star className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />, pending: <Clock className="h-4 w-4" />,
  cancelled: <TrendingDown className="h-4 w-4" />, return_rate: <RotateCcw className="h-4 w-4" />,
  avg_delivery: <Truck className="h-4 w-4" />, repeat_rate: <Repeat className="h-4 w-4" />,
}
const kpiAccent: Record<string, string> = {
  revenue: C.violet, orders: C.blue, products_sold: C.green, aov: C.yellow,
  delivered: C.green, pending: C.orange, cancelled: C.rose, return_rate: C.rose,
  avg_delivery: C.blue, repeat_rate: C.violet,
}

const AlertBannerItem = ({ alert }: { alert: AlertItem }) => {
  const cfg = {
    warning: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", icon: <AlertTriangle className="h-4 w-4 shrink-0" /> },
    positive: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", icon: <TrendingUp className="h-4 w-4 shrink-0" /> },
    info: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", icon: <Info className="h-4 w-4 shrink-0" /> },
  }[alert.type]
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg}`}>
      <span className={cfg.text}>{cfg.icon}</span>
      <div>
        <p className={`text-xs font-semibold ${cfg.text}`}>{alert.title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
    </div>
  )
}

const GrowthBadge = ({ v, inverse = false }: { v: number; inverse?: boolean }) => {
  const pos = inverse ? v <= 0 : v >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${pos ? "text-emerald-400" : "text-rose-400"}`}>
      {v >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {v >= 0 ? "+" : ""}{v.toFixed(1)}%
    </span>
  )
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.dataKey === "revenue" ? fmt(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  )
}

const GenericTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>
      ))}
    </div>
  )
}

export default function ShopAnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("30d")
  const trendData = salesTrend[period]

  return (
    <main className="demo-analytics-page" role="main" aria-label="Shop analytics dashboard">
      <div className="demo-shell">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <span className="demo-pill">Shop · Product Analytics</span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">Shop Analytics</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Sales, products, categories, customers, logistics and financials for your store. Demo data only.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start rounded-full border border-slate-700 bg-slate-900/60 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={["rounded-full px-3.5 py-1.5 text-xs font-medium transition-all", period === p ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-slate-200"].join(" ")}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </header>

        <nav aria-label="Dashboard sections" className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="demo-pill shrink-0 hover:border-violet-500 hover:text-violet-300 transition-colors no-underline">
              {label}
            </a>
          ))}
        </nav>

        <motion.section {...fadeUp} aria-label="Smart alerts">
          <SubTitle>Smart insights</SubTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {demoAlerts.map((a) => <AlertBannerItem key={a.id} alert={a} />)}
          </div>
        </motion.section>

        <Divider />

        <section id="overview">
          <SectionTitle id="overview-title">Overview KPIs</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
            {demoKpis.slice(0, 4).map((k) => (
              <KpiCard key={k.id} label={k.label} value={k.value} formatAsCurrency={k.formatAsCurrency} suffix={k.suffix} wow={k.wow} mom={k.mom} higher_is_better={k.higher_is_better} icon={kpiIcon[k.id] ?? <Star className="h-4 w-4" />} accentColor={kpiAccent[k.id] ?? C.violet} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {demoKpis.slice(4).map((k) => (
              <KpiCard key={k.id} label={k.label} value={k.value} formatAsCurrency={k.formatAsCurrency} suffix={k.suffix} wow={k.wow} mom={k.mom} higher_is_better={k.higher_is_better} icon={kpiIcon[k.id] ?? <Star className="h-4 w-4" />} accentColor={kpiAccent[k.id] ?? C.violet} />
            ))}
          </div>
          <motion.div {...fadeUp} className="mt-4">
            <Panel>
              <SubTitle>Order status distribution</SubTitle>
              <div className="flex h-4 w-full overflow-hidden rounded-full gap-0.5">
                {orderStatusBreakdown.map((s) => (
                  <div key={s.name} style={{ width: `${(s.value / 4218) * 100}%`, background: s.color }} className="transition-all duration-500 first:rounded-l-full last:rounded-r-full" title={`${s.name}: ${s.value}`} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {orderStatusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span>{s.name}</span>
                    <span className="font-semibold text-slate-200">{s.value.toLocaleString()}</span>
                    <span>({((s.value / 4218) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>
        </section>

        <Divider />

        <section id="sales">
          <SectionTitle id="sales-title">Sales Analytics</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div {...fadeUp} className="lg:col-span-2">
              <Panel>
                <SubTitle>Revenue & order volume</SubTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={C.violet} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.violet} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="period" {...AXIS} />
                    <YAxis yAxisId="rev" {...AXIS} tickFormatter={(v) => compact(v)} />
                    <YAxis yAxisId="ord" orientation="right" {...AXIS} />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke={C.violet} fill="url(#revGrad)" strokeWidth={2} />
                    <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={C.green} strokeWidth={2} dot={false} />
                    <Legend formatter={(v) => <span className="text-xs text-slate-400">{v === "revenue" ? "Revenue" : "Orders"}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>
            <motion.div {...fadeUp}>
              <Panel className="h-full flex flex-col justify-between">
                <SubTitle>Growth snapshot</SubTitle>
                <div className="space-y-3">
                  {[{ label: "Revenue WoW", v: 8.4 }, { label: "Revenue MoM", v: 14.8 }, { label: "Revenue YoY", v: 62.3 }, { label: "Orders WoW", v: 6.2 }, { label: "Orders MoM", v: 11.4 }, { label: "AOV MoM", v: 4.9 }].map(({ label, v }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">{label}</span>
                    <GrowthBadge v={v} />
                  </div>
                ))}
                </div>
                <div className="mt-4 rounded-xl bg-violet-600/10 border border-violet-500/20 p-3 text-xs text-violet-300">
                  <strong>Peak period:</strong> Saturday–Sunday accounts for 42% of weekly revenue.
                </div>
              </Panel>
            </motion.div>
          </div>
        </section>

        <Divider />

        <section id="products">
          <SectionTitle id="products-title">Product Performance</SectionTitle>
          <div className="space-y-4">
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Top selling products</SubTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-left">
                        {["#", "Product", "Category", "Units", "Revenue", "Growth", "Return %", "Conv. %"].map((h) => (
                          <th key={h} className="pb-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {topProducts.map((p) => (
                        <tr key={p.rank} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 pr-4 text-slate-500">{p.rank}</td>
                          <td className="py-2.5 pr-4 text-slate-100 font-medium max-w-[160px] truncate">{p.name}</td>
                          <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">{p.category}</td>
                          <td className="py-2.5 pr-4 text-slate-200">{p.unitsSold.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">{fmt(p.revenue)}</td>
                          <td className="py-2.5 pr-4"><GrowthBadge v={p.growth} /></td>
                          <td className="py-2.5 pr-4 text-rose-400">{p.returnRate}%</td>
                          <td className="py-2.5 text-emerald-400">{p.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <motion.div {...fadeUp}>
                <Panel className="h-full">
                  <SubTitle>Low performing products</SubTitle>
                  <div className="space-y-2">
                    {lowProducts.map((p) => (
                      <div key={p.rank} className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/50 p-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-500">{p.category} · {p.unitsSold} units</p>
                        </div>
                        <GrowthBadge v={p.growth} />
                      </div>
                    ))}
                  </div>
                </Panel>
              </motion.div>
              <motion.div {...fadeUp}>
                <Panel className="h-full">
                  <SubTitle>Most returned products</SubTitle>
                  <div className="space-y-2">
                    {mostReturnedProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-rose-900/20 border border-rose-800/30 p-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-500">{p.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-rose-400 font-medium">{p.returnCount} returns</p>
                          <p className="text-[11px] text-rose-500">{p.returnRate}% rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </motion.div>
            </div>
          </div>
        </section>

        <Divider />

        <section id="segments">
          <SectionTitle id="segments-title">Category & Location Insights</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Category performance</SubTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryAnalytics} layout="vertical">
                    <CartesianGrid horizontal={false} stroke={C.grid} />
                    <XAxis type="number" {...AXIS} tickFormatter={(v) => compact(v)} />
                    <YAxis type="category" dataKey="name" width={140} {...AXIS} />
                    <Tooltip content={({ active, payload, label }: any) => active && payload?.length ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                        <p className="font-semibold text-slate-200 mb-1">{label}</p>
                        <p style={{ color: C.violet }}>Revenue: {fmt(payload[0].value as number)}</p>
                        <p className="text-emerald-400">Growth: +{categoryAnalytics.find(c => c.name === label)?.growth}%</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="revenue" radius={4} fill={C.violet} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-1 gap-1.5">
                  {categoryAnalytics.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE[i % PIE.length] }} />
                        {c.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300">{fmt(c.revenue)}</span>
                        <GrowthBadge v={c.growth} />
                        <span className="text-slate-500">{c.margin}% margin</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Top cities by revenue</SubTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-left">
                        {["#", "City", "State", "Orders", "Revenue", "Growth"].map((h) => (
                          <th key={h} className="pb-2 pr-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {topLocations.map((loc) => (
                        <tr key={loc.rank} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 pr-3 text-slate-500">{loc.rank}</td>
                          <td className="py-2 pr-3 font-medium text-slate-100 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />{loc.city}
                          </td>
                          <td className="py-2 pr-3 text-slate-400">{loc.state}</td>
                          <td className="py-2 pr-3 text-slate-200">{loc.orders}</td>
                          <td className="py-2 pr-3 text-slate-200 whitespace-nowrap">{compact(loc.revenue)}</td>
                          <td className="py-2"><GrowthBadge v={loc.growth} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </motion.div>
          </div>
        </section>

        <Divider />

        <section id="customers">
          <SectionTitle id="customers-title">Customer Insights</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <motion.div {...fadeUp}>
              <Panel className="h-full flex flex-col">
                <SubTitle>New vs returning</SubTitle>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={customerTypeSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={2}>
                        {customerTypeSplit.map((e, i) => <Cell key={e.name} fill={PIE[i]} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs shadow-xl">
                          <p style={{ color: payload[0].payload.color }}>{payload[0].name}: {payload[0].value}%</p>
                        </div>
                      ) : null} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-xs text-slate-400">
                    {customerTypeSplit.map((e, i) => (
                      <span key={e.name} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE[i] }} />
                        {e.name} <strong className="text-slate-200">{e.value}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-800/60 p-2">
                    <p className="text-slate-500">Repeat rate</p>
                    <p className="text-emerald-400 font-semibold text-base">38.6%</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-2">
                    <p className="text-slate-500">Avg CLV</p>
                    <p className="text-violet-300 font-semibold text-base">₹8,420</p>
                  </div>
                </div>
              </Panel>
            </motion.div>
            <motion.div {...fadeUp} className="md:col-span-2">
              <Panel className="h-full">
                <SubTitle>Top customers</SubTitle>
                <div className="space-y-2">
                  {topCustomers.map((c) => (
                    <div key={c.rank} className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-semibold text-violet-300">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.orders} orders · last: {c.lastOrder}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-slate-200">{fmt(c.revenue)}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.type === "returning" ? "bg-violet-500/20 text-violet-300" : "bg-blue-500/20 text-blue-300"}`}>{c.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>
        </section>

        <Divider />

        <section id="operations" className="space-y-4 pb-12">
          <SectionTitle id="operations-title">Operations & Financial</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Orders by day of week</SubTitle>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ordersByDayOfWeek}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="day" {...AXIS} />
                    <YAxis {...AXIS} />
                    <Tooltip content={<GenericTooltip />} />
                    <Bar dataKey="orders" radius={6}>
                      {ordersByDayOfWeek.map((d, i) => (
                        <Cell key={i} fill={d.orders >= 700 ? C.violet : d.orders >= 550 ? C.blue : C.grid} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[11px] text-slate-500">Peak days: Fri–Sun account for <span className="text-violet-300">52%</span> of weekly orders</p>
              </Panel>
            </motion.div>
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Orders by hour of day</SubTitle>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ordersByHour}>
                    <defs>
                      <linearGradient id="hourGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="hour" {...AXIS} />
                    <YAxis {...AXIS} />
                    <Tooltip content={<GenericTooltip />} />
                    <Area type="monotone" dataKey="orders" stroke={C.blue} fill="url(#hourGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[11px] text-slate-500">Peak window: <span className="text-blue-300">7 PM – 10 PM</span> (78% of evening traffic)</p>
              </Panel>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Courier performance</SubTitle>
                <div className="space-y-2">
                  {courierPerformance.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-200">{c.name.slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-100">{c.name}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.onTime}%` }} />
                          </div>
                          <span className="text-[10px] text-emerald-400 shrink-0">{c.onTime}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs">
                        <p className="text-slate-200">{c.avgDays}d avg</p>
                        <p className="text-slate-500">{c.deliveries.toLocaleString()} deliveries</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
            <motion.div {...fadeUp}>
              <Panel>
                <SubTitle>Shipping cost vs revenue</SubTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={shippingCostVsRevenue}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="month" {...AXIS} />
                    <YAxis {...AXIS} tickFormatter={(v) => compact(v)} />
                    <Tooltip content={({ active, payload, label }: any) => active && payload?.length ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                        <p className="font-semibold text-slate-200 mb-1">{label}</p>
                        <p style={{ color: C.violet }}>Revenue: {compact(payload[0]?.value as number)}</p>
                        <p style={{ color: C.rose }}>Shipping: {compact(payload[1]?.value as number)}</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill={C.violet} />
                    <Bar dataKey="shippingCost" radius={[4, 4, 0, 0]} fill={C.rose} />
                    <Legend formatter={(v) => <span className="text-xs text-slate-400">{v === "revenue" ? "Revenue" : "Shipping Cost"}</span>} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </motion.div>
          </div>
          <motion.div {...fadeUp}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Panel>
                <SubTitle>Financial summary</SubTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Gross Margin", v: `${financialSummary.grossMargin}%`, color: "text-emerald-400" },
                    { label: "Net Margin", v: `${financialSummary.netMargin}%`, color: "text-violet-300" },
                    { label: "Discount Impact", v: `${financialSummary.discountImpact}%`, color: "text-amber-400" },
                    { label: "Refund Rate", v: `${financialSummary.refundRate}%`, color: "text-rose-400" },
                    { label: "Cancellation Rate", v: `${financialSummary.cancellationRate}%`, color: "text-orange-400" },
                  ].map(({ label, v, color }) => (
                    <div key={label} className="rounded-xl bg-slate-800/60 p-3">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p className={`text-xl font-bold ${color}`}>{v}</p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 p-3">
                    <p className="text-[11px] text-violet-400">Insight</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Discounts erode <strong className="text-amber-400">₹1.19L/mo</strong>. A/B test smaller coupon tiers.</p>
                  </div>
                </div>
              </Panel>
              <Panel>
                <SubTitle>Refund & cancellation trend</SubTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={refundTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
                    <XAxis dataKey="month" {...AXIS} />
                    <YAxis {...AXIS} tickFormatter={(v) => compact(v)} />
                    <Tooltip content={({ active, payload, label }: any) => active && payload?.length ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl">
                        <p className="font-semibold text-slate-200 mb-1">{label}</p>
                        <p style={{ color: C.rose }}>Refunds: {compact(payload[0]?.value as number)}</p>
                        <p style={{ color: C.orange }}>Cancellations: {compact(payload[1]?.value as number)}</p>
                      </div>
                    ) : null} />
                    <Line type="monotone" dataKey="refunds" stroke={C.rose} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cancellations" stroke={C.orange} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                    <Legend formatter={(v) => <span className="text-xs text-slate-400 capitalize">{v}</span>} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-slate-500 mt-1">Both trends declining — healthy signal</p>
              </Panel>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
