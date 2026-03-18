import { DemoTrendingItem } from "@/data/demoAnalytics"
// DemoTrendingItem.symbol renamed to .tag in data module; keep backward compat via union prop
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

interface TrendingListCardProps {
  title: string
  items: DemoTrendingItem[]
}

export const TrendingListCard = ({ title, items }: TrendingListCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="demo-card demo-card-hover h-full"
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-slate-100">
              {title}
            </CardTitle>
            <span className="text-[11px] text-slate-400">Live snapshot</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[260px] overflow-y-auto demo-scroll pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-100">
                    {(item as any).tag ?? (item as any).symbol}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-100">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.value}
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-3">
                  <div className="h-8 w-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={item.sparkline.map((v, i) => ({ i, v }))}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={item.trend === "up" ? "#4ade80" : "#fb7185"}
                          strokeWidth={1.4}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {item.trend === "up" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    <span
                      className={
                        item.trend === "up" ? "demo-trend-up" : "demo-trend-down"
                      }
                    >
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default TrendingListCard

