"use client";

import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { FinancialReminderDisplay } from "@/actions/financial";
import { Bell, User, ShoppingCart, Calendar, FileText } from "lucide-react";

const icons = {
  person_to_pay: User,
  thing_to_buy: ShoppingCart,
  payment_due: Calendar,
  other: FileText,
};

interface ReminderPanelProps {
  reminders: FinancialReminderDisplay[];
  activityNames: Record<string, string>;
  limit?: number;
}

export function ReminderPanel({ reminders, activityNames, limit }: ReminderPanelProps) {
  const displayed = limit ? reminders.slice(0, limit) : reminders;

  if (displayed.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider px-1">
        Promemoria finanziari
      </p>
      {displayed.map((r) => {
        const Icon = icons[r.reminderType] ?? Bell;
        const activityName = activityNames[r.activityId] ?? "Attività";
        return (
          <Link
            key={r.id}
            href={`/dashboard/${r.activityId}/finance`}
            className={cn(
              "flex gap-3 rounded-lg border p-3 transition-all",
              "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/50",
              "ring-1 ring-amber-500/20"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {r.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {r.message}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-bold text-foreground">
                  {formatCurrency(r.amount, r.currency)}
                </span>
                {r.dueDate && (
                  <span className="text-[10px] text-muted-foreground">
                    · {formatDate(r.dueDate, "short")}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground truncate">
                  · {activityName}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
