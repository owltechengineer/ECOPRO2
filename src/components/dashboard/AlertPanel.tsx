"use client";

import { cn, formatDate, getSeverityBg, getSeverityColor } from "@/lib/utils";
import type { Alert } from "@/types";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";

const icons = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

interface AlertPanelProps {
  alerts: Alert[];
  compact?: boolean;
  limit?: number;
}

export function AlertPanel({ alerts, compact = false, limit }: AlertPanelProps) {
  const displayed = limit ? alerts.slice(0, limit) : alerts;

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
        <p className="text-sm text-muted-foreground">Nessun alert attivo</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((alert) => {
        const Icon = icons[alert.severity as keyof typeof icons] ?? Info;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex gap-3 rounded-lg border p-3 transition-opacity",
              getSeverityBg(alert.severity),
              alert.isRead && "opacity-60"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                getSeverityColor(alert.severity)
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold",
                  getSeverityColor(alert.severity)
                )}
              >
                {alert.title}
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {alert.message}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {formatDate(alert.createdAt, "relative")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
