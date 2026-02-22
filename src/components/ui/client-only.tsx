"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after the component mounts on the client.
 * Prevents SSR/client hydration mismatches with libraries like Recharts
 * that generate non-deterministic IDs (clipPath, etc.).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
