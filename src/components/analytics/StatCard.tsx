import { ReactNode, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, animate } from "framer-motion";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  helperText?: string;
  trendDirection?: TrendDirection;
  trendText?: string;
  formatAsCurrency?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const StatCard = ({
  label,
  value,
  icon,
  helperText,
  trendDirection = "neutral",
  trendText,
  formatAsCurrency,
}: StatCardProps) => {
  const isNumber = typeof value === "number" && !Number.isNaN(value);
  const numericValue = typeof value === "number" ? value : 0;
  const [displayValue, setDisplayValue] = useState<number | string>(isNumber ? 0 : value);

  useEffect(() => {
    if (!isNumber) {
      setDisplayValue(value);
      return;
    }
    const controls = animate(0, numericValue, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [numericValue, isNumber, value]);

  const valueToShow = isNumber
    ? formatAsCurrency
      ? formatCurrency(displayValue as number)
      : String(displayValue)
    : value;

  const trendColor =
    trendDirection === "up"
      ? "text-emerald-500"
      : trendDirection === "down"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="analytics-stat-card"
    >
      <Card className="card-hover h-full border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {icon && (
            <div className="rounded-full bg-muted p-2 text-muted-foreground">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            <span>{valueToShow}</span>
          </div>
          {(helperText || trendText) && (
            <p className={`mt-1 text-xs ${trendText ? trendColor : "text-muted-foreground"}`}>
              {trendText ?? helperText}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;

