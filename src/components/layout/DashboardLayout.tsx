"use client";

import { useAppStore } from "@/store/app.store";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <SupabaseProvider />
      <Sidebar />

      {/* Main content: full width on mobile, sidebar margin on desktop */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          "ml-0 md:transition-[margin]",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
