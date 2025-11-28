
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Simple, self-contained calendar props (no react-day-picker)
export interface CalendarProps {
  className?: string;
  /** Selected date for single-date selection */
  selected?: Date;
  /** Called when user selects a date */
  onSelect?: (date: Date | undefined) => void;
  /** Disable specific dates */
  disabled?: (date: Date) => boolean;
  /** Compatibility props used in existing code (kept optional) */
  mode?: "single";
  initialFocus?: boolean;
  /** Optional DayPicker-style modifier support for custom styling */
  modifiersClassNames?: Record<string, string>;
  modifiers?: Record<string, (date: Date) => boolean>;
  modifiersStyles?: Record<string, React.CSSProperties>;
  /** Legacy prop from previous calendar usage (ignored) */
  required?: boolean;
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(currentMonth: Date): Date[] {
  const days: Date[] = [];
  const firstOfMonth = startOfMonth(currentMonth);
  const firstWeekday = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  // Start from the Sunday of the first week in the grid
  const gridStart = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
    firstOfMonth.getDate() - firstWeekday
  );

  // 6 weeks * 7 days = 42 cells
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return days;
}

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  modifiers,
  modifiersClassNames,
  modifiersStyles,
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(
    selected ? new Date(selected) : new Date()
  );

  const today = React.useMemo(() => new Date(), []);
  const days = React.useMemo(() => getCalendarDays(month), [month]);

  const handlePrevMonth = () => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className={cn("p-3 pointer-events-auto", className)}>
      {/* Header with month / year and navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1 gap-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const isDisabled = disabled ? disabled(day) : false;

          let dayClasses =
            "h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors";
          let dayStyle: React.CSSProperties | undefined;

          if (!isCurrentMonth) {
            dayClasses += " text-muted-foreground opacity-40";
          } else {
            dayClasses += " text-foreground";
          }

          if (isToday && !isSelected) {
            dayClasses += " border border-accent";
          }

          if (isSelected) {
            dayClasses += " bg-primary text-primary-foreground";
          }
          // Allow overriding selected style through modifiersClassNames.selected
          if (isSelected && modifiersClassNames?.selected) {
            dayClasses += " " + modifiersClassNames.selected;
          }

          if (isDisabled) {
            dayClasses += " opacity-40 cursor-not-allowed";
          } else {
            dayClasses += " hover:bg-accent hover:text-accent-foreground cursor-pointer";
          }

          // Apply DayPicker-style modifiers (pending/confirmed/etc)
          if (modifiers) {
            for (const [name, predicate] of Object.entries(modifiers)) {
              try {
                if (predicate(day)) {
                  const extraClass = modifiersClassNames?.[name];
                  if (extraClass) dayClasses += " " + extraClass;
                  const extraStyle = modifiersStyles?.[name];
                  if (extraStyle) {
                    dayStyle = { ...(dayStyle || {}), ...extraStyle };
                  }
                }
              } catch {
                // ignore modifier errors to avoid breaking calendar
              }
            }
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={dayClasses}
              style={dayStyle}
              onClick={() => {
                if (isDisabled) return;
                onSelect?.(day);
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
