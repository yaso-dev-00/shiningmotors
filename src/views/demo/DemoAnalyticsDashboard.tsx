"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingCart, DollarSign, Car, Wrench, Calendar,
  TrendingUp, AlertTriangle, Info, ChevronRight,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  demoAlerts,
  demoKpis,
  vehicleKpis,
  serviceKpis,
  eventKpis,
  type AlertItem,
} from "@/data/demoAnalytics";

const C = {
  violet: "hsl(262 83% 70%)",
  blue: "hsl(222 84% 60%)",
  green: "hsl(160 84% 60%)",
  orange: "hsl(28 92% 65%)",
  rose: "hsl(348 86% 65%)",
}

const SubTitle = ({ children }: { children: string }) => (
  <h3 className="text-sm font-medium text-slate-300 mb-3">{children}</h3>
)

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.32 },
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

const categoryCards = [
  {
    id: "shop",
    title: "Shop Analytics",
    description: "Sales, orders, products, categories, customers, logistics and financials.",
    href: "/shop/analytics",
    icon: <ShoppingCart className="h-5 w-5" />,
    accent: C.violet,
    kpi: demoKpis.find((k) => k.id === "revenue")!,
  },
  {
    id: "vehicles",
    title: "Vehicle Analytics",
    description: "Listings, views, inquiries, test drives, inventory health and revenue.",
    href: "/demo/vehicle-analytics",
    icon: <Car className="h-5 w-5" />,
    accent: C.blue,
    kpi: vehicleKpis.find((k) => k.id === "veh_revenue")!,
  },
  {
    id: "services",
    title: "Service Analytics",
    description: "Bookings, slot utilisation, service performance and revenue by category.",
    href: "/demo/service-analytics",
    icon: <Wrench className="h-5 w-5" />,
    accent: C.green,
    kpi: serviceKpis.find((k) => k.id === "svc_revenue")!,
  },
  {
    id: "events",
    title: "Event Analytics",
    description: "Registrations, fill rates, revenue, locations and organizer performance.",
    href: "/demo/event-analytics",
    icon: <Calendar className="h-5 w-5" />,
    accent: C.rose,
    kpi: eventKpis.find((k) => k.id === "evt_revenue")!,
  },
]

export default function DemoAnalyticsDashboard() {
  return (
    <main className="demo-analytics-page" role="main" aria-label="Analytics overview">
      <div className="demo-shell">
        <header className="space-y-1.5">
          <span className="demo-pill">Shining Motors · Analytics Overview</span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            Analytics
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Important metrics across all categories. Open a category below for full dashboards, filters and drill-downs. Demo data only.
          </p>
        </header>

        <motion.section {...fadeUp} aria-label="Smart alerts" className="mt-6">
          <SubTitle>Smart insights</SubTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {demoAlerts.map((a) => (
              <AlertBannerItem key={a.id} alert={a} />
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} aria-label="At a glance" className="mt-10">
          <SubTitle>At a glance</SubTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categoryCards.map((card) => (
              <div
                key={card.id}
                className="demo-card rounded-2xl p-5 demo-card-hover border border-slate-800/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${card.accent}22`, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <span className="text-xs text-slate-500">
                    +{card.kpi.mom}% MoM
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{card.kpi.label}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-50 tracking-tight">
                  {card.kpi.formatAsCurrency
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(card.kpi.value)
                    : card.kpi.value.toLocaleString("en-IN")}
                  {card.kpi.suffix ?? ""}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} aria-label="Category analytics" className="mt-10">
          <SubTitle>Category analytics</SubTitle>
          <p className="text-xs text-slate-500 mb-4">
            Open a category for full dashboards with filters, trends, tables and insights.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categoryCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 transition-colors hover:border-violet-500/50 hover:bg-slate-800/50 no-underline"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ background: `${card.accent}22`, color: card.accent }}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {card.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
