"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { getMachinery, getProjects, getSites, getVendors, getItems } from "@/lib/data/repository";
import type { Machinery, Project, Site, Vendor, Item } from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

interface SearchResult {
  id: string;
  category: "Machinery" | "Projects" | "Sites" | "Vendors" | "Items" | "Quick Actions";
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  icon: string;
}

const STATIC_ACTIONS: SearchResult[] = [
  { id: "act-new-machine", category: "Quick Actions", title: "Add New Machinery", subtitle: "Register new vehicle or plant equipment", href: "/machinery?action=new", icon: "add_circle" },
  { id: "act-new-log", category: "Quick Actions", title: "Create Daily Log Book Entry", subtitle: "Record equipment shift hours and KM", href: "/machinery/log-book/new", icon: "menu_book" },
  { id: "act-new-fuel", category: "Quick Actions", title: "Issue Diesel / Fuel", subtitle: "Dispense fuel with theoretical balance check", href: "/machinery/fuel?action=new", icon: "local_gas_station" },
  { id: "act-report", category: "Quick Actions", title: "Generate Operations Report", subtitle: "Open ERP reporting & print engine", href: "/reports", icon: "assessment" },
  { id: "act-compliance", category: "Quick Actions", title: "Statutory Compliance Matrix", subtitle: "Check Road Tax, Fitness, Insurance, PUC", href: "/compliance", icon: "verified" },
  { id: "act-store", category: "Quick Actions", title: "Store & Inventory Stock Ledger", subtitle: "Check stock balances, inward, outward, transfers", href: "/store", icon: "inventory_2" },
];

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cached masters
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load data once when opened
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      getMachinery(),
      getProjects(),
      getSites(),
      getVendors(),
      getItems(),
    ]).then(([m, p, s, v, itms]) => {
      setMachinery(m);
      setProjects(p);
      setSites(s);
      setVendors(v);
      setItems(itms);
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Compute filtered search results
  const results: SearchResult[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_ACTIONS;

    const matched: SearchResult[] = [];

    // Search Machinery
    for (const m of machinery) {
      if (
        m.assetCode.toLowerCase().includes(q) ||
        m.machineryName.toLowerCase().includes(q) ||
        (m.registrationNo && m.registrationNo.toLowerCase().includes(q)) ||
        m.make.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q)
      ) {
        matched.push({
          id: `mch-${m.id}`,
          category: "Machinery",
          title: getMachineryDisplayName(m),
          subtitle: `${m.assetCode} • ${m.category} • ${m.meterType} Equipment`,
          badge: m.status.toUpperCase(),
          href: `/machinery/${m.id}`,
          icon: "precision_manufacturing",
        });
      }
    }

    // Search Items
    for (const itm of items) {
      if (
        itm.itemCode.toLowerCase().includes(q) ||
        itm.itemName.toLowerCase().includes(q) ||
        (itm.subCategory && itm.subCategory.toLowerCase().includes(q)) ||
        (itm.description && itm.description.toLowerCase().includes(q)) ||
        itm.category.toLowerCase().includes(q)
      ) {
        matched.push({
          id: `itm-${itm.id}`,
          category: "Items",
          title: `${itm.itemCode} — ${itm.itemName}`,
          subtitle: `Category: ${itm.category} • UOM: ${itm.uom}`,
          href: `/store/items`,
          icon: "category",
        });
      }
    }

    // Search Projects
    for (const p of projects) {
      if (p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) {
        matched.push({
          id: `prj-${p.id}`,
          category: "Projects",
          title: `${p.code} — ${p.name}`,
          subtitle: p.clientName ? `Client: ${p.clientName}` : "Infrastructure Project",
          href: `/projects`,
          icon: "location_city",
        });
      }
    }

    // Search Sites
    for (const s of sites) {
      if (s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) {
        matched.push({
          id: `sit-${s.id}`,
          category: "Sites",
          title: `${s.code} — ${s.name}`,
          subtitle: s.inChargePerson ? `In-Charge: ${s.inChargePerson}` : "Project Site",
          href: `/projects?tab=sites`,
          icon: "explore",
        });
      }
    }

    // Search Vendors
    for (const v of vendors) {
      if (v.name.toLowerCase().includes(q) || v.vendorCode.toLowerCase().includes(q)) {
        matched.push({
          id: `vnd-${v.id}`,
          category: "Vendors",
          title: v.name,
          subtitle: `Code: ${v.vendorCode} • ${v.contactPerson || "Vendor Partner"}`,
          href: `/vendors`,
          icon: "storefront",
        });
      }
    }

    // Add matching static actions
    for (const act of STATIC_ACTIONS) {
      if (act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
        matched.push(act);
      }
    }

    return matched.slice(0, 15);
  }, [query, machinery, items, projects, sites, vendors]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onClose();
      router.push(result.href);
    },
    [onClose, router]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-20 px-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Glass Command Palette Card */}
      <div
        className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200/80 gap-3 bg-white/60">
          <Icon name="search" className="text-slate-400 text-[20px]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
            placeholder="Type a command or search machinery, registration, projects, items..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
          <kbd className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Icon name="manage_search" className="text-[36px] mb-2 mx-auto text-slate-300" />
              <p className="text-[13px] font-medium text-slate-600">No matching records found</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Try searching by asset code, plate number, project, or item</p>
            </div>
          ) : (
            results.map((r, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-blue-50/90 text-blue-900 border border-blue-200/70"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon name={r.icon} className="text-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold truncate leading-tight">
                          {r.title}
                        </span>
                        {r.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                            {r.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-none">
                        {r.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 ml-3">
                    {r.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 mr-1">↑</kbd>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 mr-1">↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>MILESTONE ERP Fast Command Palette</span>
        </div>
      </div>
    </div>
  );
}
