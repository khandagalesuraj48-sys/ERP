"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, type NavItem } from "./nav";

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

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center justify-between px-3 py-1.5 mx-2 rounded-lg transition-all duration-150 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active
          ? "bg-blue-50/90 text-blue-700 font-semibold border border-blue-200/80 shadow-xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          name={item.icon}
          className={cn(
            "text-[18px] shrink-0 transition-colors duration-150",
            active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          )}
        />
        <span className="truncate">{item.label}</span>
      </div>
      {item.badge && (
        <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[230px] h-screen fixed left-0 top-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-md z-50 flex flex-col py-3 select-none">
      {/* Brand Header */}
      <div className="px-4 mb-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 transition-transform duration-150 group-hover:scale-105">
            <Icon name="construction" className="text-[18px]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[14px] font-bold text-slate-900 tracking-tight">
                MILESTONE
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium leading-none">
              Plant &amp; Machinery
            </p>
          </div>
        </Link>
      </div>

      {/* Top Dashboard Entry */}
      <div className="px-1 mb-2">
        <NavLink
          item={{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }}
          active={pathname === "/dashboard"}
        />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-1">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.section}>
            <div className="px-4 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {sec.section}
              </p>
            </div>
            <nav className="space-y-0.5">
              {sec.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isItemActive(pathname, item.href)}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* System Status Footer */}
      <div className="px-3 pt-2.5 border-t border-slate-200/80">
        <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="text-[11px] font-medium text-slate-700">Production Live</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v1.2</span>
        </div>
      </div>
    </aside>
  );
}
