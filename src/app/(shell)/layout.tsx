"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";
import { cn } from "@/lib/utils";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="h-screen flex bg-[#F5F7FA] text-slate-900 antialiased overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          "flex-1 h-screen flex flex-col min-w-0 bg-[#F5F7FA] overflow-hidden transition-all duration-200 ease-in-out ml-0",
          isCollapsed ? "lg:ml-[68px]" : "lg:ml-[232px]"
        )}
      >
        <Topbar />
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>
          <SidebarProvider>
            <ShellInner>{children}</ShellInner>
          </SidebarProvider>
        </AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
