"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, type NavItem } from "./nav";
import { useSidebar } from "./SidebarContext";

function isItemActive(pathname: string, href: string) {
  const [baseHref, query] = href.split("?");
  if (query) {
    if (typeof window !== "undefined") {
      const currentQuery = window.location.search.replace("?", "");
      if (pathname === baseHref && currentQuery.includes(query)) return true;
    }
  }
  if (baseHref === "/dashboard") return pathname === "/dashboard";
  return pathname === baseHref || (baseHref !== "/machinery" && pathname.startsWith(baseHref + "/"));
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  // Collapsible section state (all expanded by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const renderNavItem = (item: NavItem, isRail: boolean) => {
    const active = isItemActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeMobile}
        title={isRail ? item.label : undefined}
        className={cn(
          "group relative flex items-center rounded-xl transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isRail
            ? "justify-center w-10 h-10 mx-auto"
            : "justify-between px-3 py-1.5 mx-2 text-[13px]",
          active
            ? "bg-blue-50/90 text-blue-700 font-semibold border border-blue-200/80 shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
        )}
      >
        <div className={cn("flex items-center min-w-0", isRail ? "justify-center" : "gap-2.5")}>
          <Icon
            name={item.icon}
            size={18}
            className={cn(
              "shrink-0 transition-colors duration-150",
              active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )}
          />
          {!isRail && <span className="truncate">{item.label}</span>}
        </div>

        {!isRail && item.badge && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
            {item.badge}
          </span>
        )}

        {/* Hover tooltip when in collapsed rail mode */}
        {isRail && (
          <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={cn(
          "h-screen fixed left-0 top-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-md z-50 flex flex-col py-3 select-none transition-all duration-200 ease-in-out",
          // Desktop sizing
          isCollapsed ? "lg:w-[68px]" : "lg:w-[232px]",
          // Mobile drawer: off-canvas unless opened
          isMobileOpen ? "translate-x-0 w-[240px] shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className={cn("mb-3 flex items-center", isCollapsed ? "px-2 justify-center" : "px-4 justify-between")}>
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 transition-transform duration-150 group-hover:scale-105 shrink-0">
              <Icon name="construction" size={18} />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[14px] font-bold text-slate-900 tracking-tight">
                    MILESTONE
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                    ERP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-none truncate">
                  Plant &amp; Machinery
                </p>
              </div>
            )}
          </Link>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Dashboard Top Item */}
        <div className="px-1 mb-2">
          {renderNavItem(
            { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
            isCollapsed
          )}
        </div>

        {/* Grouped Navigation Sections with Expand/Collapse */}
        <div className="flex-1 overflow-y-auto space-y-3 px-1 py-1 scrollbar-none">
          {NAV_SECTIONS.map((sec) => {
            const isSectionCollapsed = Boolean(collapsedSections[sec.section]);

            return (
              <div key={sec.section} className="space-y-0.5">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.section)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors rounded-lg group"
                  >
                    <span>{sec.section}</span>
                    <Icon
                      name={isSectionCollapsed ? "expand_more" : "expand_less"}
                      size={14}
                      className="text-slate-400 group-hover:text-slate-600 transition-transform"
                    />
                  </button>
                ) : (
                  <div className="h-px bg-slate-200/60 my-2 mx-2" />
                )}

                {!isSectionCollapsed && (
                  <nav className="space-y-0.5">
                    {sec.items.map((item) => renderNavItem(item, isCollapsed))}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        {/* System Status Footer */}
        <div className={cn("pt-2.5 border-t border-slate-200/80", isCollapsed ? "px-1 text-center" : "px-3")}>
          {!isCollapsed ? (
            <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="text-[11px] font-medium text-slate-700">Production Live</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v1.2</span>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="Production Live">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
