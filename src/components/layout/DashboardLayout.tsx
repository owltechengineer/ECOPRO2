"use client";

import { useAppStore } from "@/store/app.store";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <SupabaseProvider />
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header />
        <main className="flex-1 p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
