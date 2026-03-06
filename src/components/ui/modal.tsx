"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative w-full flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-slide-up",
          "rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card shadow-2xl",
          "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-3xl",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id="modal-title" className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h2>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-3 shrink-0 touch-manipulation"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 sm:px-6 pb-2 flex-1 overscroll-contain">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 shrink-0 safe-area-pb">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
