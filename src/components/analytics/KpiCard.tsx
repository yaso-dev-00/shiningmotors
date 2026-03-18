import { useEffect, useState, ReactNode } from "react"
import { motion, animate } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  label: string
  value: number
  formatAsCurrency?: boolean
  suffix?: string
  wow?: number    // week-over-week % change
  mom?: number    // month-over-month % change
  icon?: ReactNode
  higher_is_better?: boolean  // false → lower is better (return rate, delivery time)
  accentColor?: string
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)

const formatCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}

const ChangeBadge = ({
  value,
  label,
  higher_is_better = true,
}: {
  value: number
  label: string
  higher_is_better?: boolean
}) => {
  const positive = higher_is_better ? value >= 0 : value <= 0
  const color = positive ? "text-emerald-400" : "text-rose-400"
  const bg    = positive ? "bg-emerald-400/10" : "bg-rose-400/10"
  const sign  = value > 0 ? "+" : ""
  const Icon  = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown

  return (
    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${bg} border border-slate-700/60`}>
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={`text-[10px] font-medium ${color}`}>
        {sign}{Math.abs(value).toFixed(1)}%
      </span>
      <span className="text-[9px] text-slate-500">{label}</span>
    </div>
  )
}

export const KpiCard = ({
  label,
  value,
  formatAsCurrency,
  suffix = "",
  wow,
  mom,
  icon,
  higher_is_better = true,
  accentColor = "hsl(262 83% 70%)",
}: KpiCardProps) => {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const ctrl = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v * 10) / 10),
    })
    return () => ctrl.stop()
  }, [value])

  const formatted = formatAsCurrency
    ? formatCurrency(display)
    : `${display % 1 !== 0 ? display.toFixed(1) : formatCompact(Math.round(display))}${suffix}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="demo-card demo-card-hover rounded-2xl overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 truncate">{label}</p>
          <p
            className="mt-1 text-2xl font-bold text-slate-50 tracking-tight leading-tight"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatted}
          </p>
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${accentColor}22` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>
      {(wow !== undefined || mom !== undefined) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {wow !== undefined && (
            <ChangeBadge value={wow} label="WoW" higher_is_better={higher_is_better} />
          )}
          {mom !== undefined && (
            <ChangeBadge value={mom} label="MoM" higher_is_better={higher_is_better} />
          )}
        </div>
      )}
    </motion.div>
  )
}

export default KpiCard
