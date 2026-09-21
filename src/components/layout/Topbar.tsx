"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { getComplianceAlerts } from "@/lib/data/repository";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { useSidebar } from "./SidebarContext";

export function Topbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const { toggleCollapse, toggleMobile } = useSidebar();
  const [alertCount, setAlertCount] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getComplianceAlerts(30)
      .then((res) => {
        if (isMounted) {
          setAlertCount(res.expired.length + res.expiringSoon.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OP";

  // Derive human-readable page context
  const pathParts = pathname.split("/").filter(Boolean);
  const currentTitle =
    pathParts.length > 0
      ? pathParts[pathParts.length - 1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Dashboard";

  return (
    <>
      <header className="h-[60px] flex items-center justify-between px-4 sm:px-6 border-b border-white/60 bg-white/70 backdrop-blur-xl z-40 shrink-0 select-none shadow-xs">
        {/* Left: Hamburger Menu (☰) + Breadcrumb Context */}
        <div className="flex items-center gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                toggleMobile();
              } else {
                toggleCollapse();
              }
            }}
            className="p-1.5 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Navigation (☰)"
            aria-label="Toggle navigation menu"
          >
            <Icon name="menu" size={22} />
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:inline"
            >
              Milestone
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-none">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Center Search Trigger (Global Command Palette) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center bg-white/80 hover:bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl px-3 py-1.5 w-80 max-w-[35vw] transition-all duration-150 shadow-xs group cursor-pointer text-left"
        >
          <Icon
            name="search"
            size={18}
            className="text-slate-400 group-hover:text-blue-500 mr-2 shrink-0 transition-colors"
          />
          <span className="text-[13px] text-slate-400 flex-1 truncate">
            Search machinery, registration, items...
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100/90 border border-slate-200/80 rounded px-1.5 py-0.5 font-mono shadow-xs">
            CTRL K
          </kbd>
        </button>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Button */}
          <Link
            href="/machinery"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[12px] font-medium transition-all shadow-xs"
          >
            <Icon name="add" size={16} />
            <span>New Machine</span>
          </Link>

          {/* Search Icon on mobile */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
            title="Global Search"
          >
            <Icon name="search" size={20} />
          </button>

          {/* Notifications Icon & Compliance Link */}
          <Link
            href="/compliance"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-xl transition-colors inline-flex items-center justify-center"
            title={
              alertCount > 0
                ? `${alertCount} compliance alerts require attention`
                : "Statutory Compliance & Alerts"
            }
          >
            <Icon name="notifications" size={20} />
            {alertCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-rose-600 text-white text-[10px] font-bold rounded-full px-1 flex items-center justify-center shadow-xs animate-pulse">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </Link>

          <div className="h-5 w-px bg-slate-200/80" />

          {/* User Identity & Logout */}
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight hidden lg:block">
              <p className="text-[13px] font-semibold text-slate-900">
                {user?.name || "Operations Lead"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {user?.department || "P&M Department"}
              </p>
            </div>

            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-700 border border-blue-200/60 font-bold text-[12px] flex items-center justify-center shadow-xs">
              {initials}
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Instant Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
