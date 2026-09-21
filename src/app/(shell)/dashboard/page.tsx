"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getDashboardStats,
  getMachinery,
  getProjects,
  getSites,
  getFuelIssues,
  getLogBooks,
  getBreakdowns,
  getMaintenanceRecords,
  isDatabaseConnected,
} from "@/lib/data/repository";
import { money, fmt } from "@/lib/utils";
import type { DashboardStats, Machinery, Project, Site, FuelIssue, Breakdown, MaintenanceRecord, LogBook } from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  active: "#16A34A",
  under_repair: "#DC2626",
  inactive: "#D97706",
  archived: "#64748B",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [logs, setLogs] = useState<LogBook[]>([]);
  const [recentFuels, setRecentFuels] = useState<FuelIssue[]>([]);
  const [recentBreakdowns, setRecentBreakdowns] = useState<Breakdown[]>([]);
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  async function loadData() {
    setLoading(true);
    try {
      const [st, m, prj, stList, f, b, mnt, l] = await Promise.all([
        getDashboardStats(),
        getMachinery(),
        getProjects(),
        getSites(),
        getFuelIssues(),
        getBreakdowns(),
        getMaintenanceRecords(),
        getLogBooks(),
      ]);
      setStats(st);
      setMachinery(m);
      setProjects(prj);
      setSites(stList);
      setRecentFuels(f.slice(0, 8));
      setRecentBreakdowns(b.filter((x) => x.status !== "completed" && x.status !== "cancelled").slice(0, 5));
      setRecentMaintenance(mnt.slice(0, 5));
      setLogs(l);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered machinery list for Today's Machinery table
  const filteredMachinery = useMemo(() => {
    return machinery.filter((m) => {
      if (selectedProject !== "all" && m.currentProjectId !== selectedProject) return false;
      if (selectedSite !== "all" && m.currentSiteId !== selectedSite) return false;
      return true;
    });
  }, [machinery, selectedProject, selectedSite]);

  // Today's fuel by machinery lookup
  const todayFuelMap = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const map = new Map<string, number>();
    recentFuels.forEach((f) => {
      if (f.issueDate === todayStr) {
        map.set(f.machineryId, (map.get(f.machineryId) || 0) + Number(f.quantityLitres || 0));
      }
    });
    return map;
  }, [recentFuels]);

  // Machinery status distribution data for donut
  const statusData = useMemo(() => {
    const active = filteredMachinery.filter((m) => m.status === "active").length;
    const repair = filteredMachinery.filter((m) => m.status === "under_repair").length;
    const inactive = filteredMachinery.filter((m) => m.status === "archived" || (m.status as string) === "standby").length;
    const other = Math.max(0, filteredMachinery.length - active - repair - inactive);
    return [
      { name: "Active", value: active, color: "#16A34A" },
      { name: "Under Repair", value: repair, color: "#DC2626" },
      { name: "Standby / Idle", value: inactive, color: "#D97706" },
      ...(other > 0 ? [{ name: "Other", value: other, color: "#94A3B8" }] : []),
    ].filter((d) => d.value > 0);
  }, [filteredMachinery]);

  // Operational totals for today
  const { todayHours, todayKM } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let hours = 0;
    let km = 0;
    logs.forEach((log) => {
      if (log.date === todayStr) {
        const m = machinery.find((mac) => mac.id === log.machineryId);
        const meter = m?.meterType || "HOUR";
        if (meter === "KM") {
          km += Number(log.totalKmHours || 0);
        } else {
          hours += Number(log.workingHours ?? log.totalKmHours ?? 0);
        }
      }
    });
    return { todayHours: hours, todayKM: km };
  }, [logs, machinery]);

  const s = stats || {
    totalMachinery: 0,
    activeMachinery: 0,
    underRepairMachinery: 0,
    inactiveMachinery: 0,
    openBreakdowns: 0,
    todayFuelLitres: 0,
    todayFuelAmount: 0,
    monthFuelLitres: 0,
    monthFuelAmount: 0,
    monthMaintenanceCost: 0,
    totalMaintenanceCost: 0,
    expiringDocumentsCount: 0,
    expiredDocumentsCount: 0,
    totalItems: 0,
    totalStockValue: 0,
    lowStockItemsCount: 0,
    totalAssets: 0,
    activeAssets: 0,
    assetsUnderRepair: 0,
    totalStores: 0,
    todayInwardAmount: 0,
    todayInwardCount: 0,
    todayOutwardAmount: 0,
    todayOutwardCount: 0,
    monthMaterialConsumption: 0,
    fuelTrend: [],
    utilizationHours: [],
    maintenanceCostsByCategory: [],
    breakdownsByStatus: [],
  };

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2.5">
        <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[13px]">Loading operations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200/80 gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
            MILESTONE ERP — Construction Machinery Operations
          </h1>
          <p className="text-[13px] text-gray-500 font-normal mt-0.5">
            Executive Control &amp; Fleet Operations Dashboard
          </p>
        </div>

        {/* Compact Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedSite("all");
            }}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-40 bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          {/* Site Filter */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            disabled={selectedProject === "all"}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-36 bg-white disabled:opacity-50"
          >
            <option value="all">All Sites</option>
            {sites
              .filter((st) => selectedProject === "all" || st.projectId === selectedProject)
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-32 bg-white"
          >
            <option value="today">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last Quarter</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh metrics"
            className="btn-secondary h-8 px-2.5"
          >
            <Icon name="refresh" className="text-[16px] text-gray-600" />
            <span className="text-[12px] hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 7 KPI Cards per spec */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard
          label="Total Machinery"
          value={fmt(filteredMachinery.length || s.totalMachinery)}
          sub="Registered Equipment"
          icon="precision_manufacturing"
          accent="blue"
        />
        <StatCard
          label="Active Machinery"
          value={fmt(filteredMachinery.filter(m => m.status === "active").length)}
          sub="Operational on Sites"
          icon="check_circle"
          accent="green"
        />
        <StatCard
          label="Under Repair"
          value={fmt(filteredMachinery.filter(m => m.status === "under_repair").length)}
          sub="Service &amp; Breakdown"
          icon="build_circle"
          accent="red"
        />
        <StatCard
          label="Open Breakdowns"
          value={fmt(s.openBreakdowns)}
          sub="Unresolved Tickets"
          icon="warning"
          accent={s.openBreakdowns > 0 ? "red" : "green"}
        />
        <StatCard
          label="Today's Fuel"
          value={`${fmt(s.todayFuelLitres)} L`}
          sub={money(s.todayFuelAmount)}
          icon="local_gas_station"
          accent="blue"
        />
        <StatCard
          label="Today's Hours"
          value={`${fmt(todayHours)} Hrs`}
          sub="Operational Runtime"
          icon="schedule"
          accent="blue"
        />
        <StatCard
          label="Today's KM"
          value={`${fmt(todayKM)} KM`}
          sub="Fleet Distance"
          icon="route"
          accent="amber"
        />
      </div>

      {/* Analytics Row: Fuel & Utilization Trend + Machinery Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Fuel & Utilization Trend Chart */}
        <div className="card p-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">Fuel &amp; Utilization Trend</h2>
              <p className="text-[11px] text-gray-500">Daily fuel dispensed and equipment runtime</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Fuel (L)
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            {s.fuelTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                No fuel discharge records in period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.fuelTrend} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={4} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
                      fontSize: "12px",
                      color: "#1E293B",
                    }}
                    formatter={(val) => [`${val} L`, "Fuel Dispensed"]}
                  />
                  <Area type="monotone" dataKey="litres" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#fuelGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Machinery Status Distribution */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="pb-3 mb-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">Machinery Status</h2>
              <p className="text-[11px] text-gray-500">Live operational readiness</p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-gray-500">
              {filteredMachinery.length} Units
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {statusData.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No machinery registered</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600 font-medium">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-900 font-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Today's Machinery + Right-side Compact Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Columns: Today's Machinery Table */}
        <div className="card xl:col-span-2 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200/80 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-[13px] font-bold text-gray-900">Today&apos;s Machinery</h3>
              <p className="text-[11px] text-gray-500">Live fleet deployment &amp; readings</p>
            </div>
            <Link
              href="/machinery"
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              All Machinery <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          </div>

          {filteredMachinery.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">No machinery matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="table-head">
                    <th className="py-2.5 px-3.5">Asset Code</th>
                    <th className="py-2.5 px-3.5">Machinery</th>
                    <th className="py-2.5 px-3.5">Project / Site</th>
                    <th className="py-2.5 px-3.5">Meter</th>
                    <th className="py-2.5 px-3.5">Current Reading</th>
                    <th className="py-2.5 px-3.5">Fuel Today</th>
                    <th className="py-2.5 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMachinery.slice(0, 7).map((m) => {
                    const prj = projects.find((p) => p.id === m.currentProjectId);
                    const st = sites.find((s) => s.id === m.currentSiteId);
                    const fuelToday = todayFuelMap.get(m.id) || 0;

                    return (
                      <tr key={m.id} className="table-row">
                        <td className="py-2 px-3.5 font-mono font-bold text-blue-600">
                          <Link href={`/machinery/${m.id}`} className="hover:underline">
                            {m.assetCode}
                          </Link>
                        </td>
                        <td className="py-2 px-3.5">
                          <div className="font-semibold text-gray-900 leading-tight truncate max-w-[200px]">
                            {getMachineryDisplayName(m)}
                          </div>
                          <div className="text-[11px] text-gray-500 capitalize">{m.category ? m.category.toUpperCase() : "Machinery"}</div>
                        </td>
                        <td className="py-2 px-3.5 text-gray-600 truncate max-w-[160px]">
                          <div>{prj ? prj.code : "Unassigned"}</div>
                          {st && <div className="text-[11px] text-gray-400 truncate">{st.name}</div>}
                        </td>
                        <td className="py-2 px-3.5 font-mono text-gray-500 text-[11px]">
                          {m.meterType}
                        </td>
                        <td className="py-2 px-3.5 font-mono font-semibold text-gray-900">
                          {fmt(m.currentReading)} {m.meterType}
                        </td>
                        <td className="py-2 px-3.5 font-mono">
                          {fuelToday > 0 ? (
                            <span className="font-bold text-blue-700">{fuelToday} L</span>
                          ) : (
                            <span className="text-gray-400">0 L</span>
                          )}
                        </td>
                        <td className="py-2 px-3.5">
                          <StatusPill
                            tone={
                              m.status === "active"
                                ? "green"
                                : m.status === "under_repair"
                                ? "red"
                                : "amber"
                            }
                          >
                            {m.status.replace("_", " ")}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right-Side Compact Panels (Activity, Compliance, Maintenance) */}
        <div className="space-y-4">
          {/* Panel 1: Recent Activity / Fuel Issues */}
          <div className="card overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[12px] font-bold text-gray-900">Recent Activity</span>
              <Link href="/machinery/fuel" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Fuel Register
              </Link>
            </div>
            {recentFuels.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No recent activity</div>
            ) : (
              <div className="divide-y divide-gray-100 text-[12px]">
                {recentFuels.slice(0, 4).map((f) => {
                  const m = machinery.find((mac) => mac.id === f.machineryId);
                  return (
                    <div key={f.id} className="p-2.5 hover:bg-gray-50/60 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-gray-900">{f.issueNo}</div>
                        <div className="text-[11px] text-gray-500">
                          {m?.assetCode || "Unit"} · {f.issueDate}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-gray-900">{f.quantityLitres} L</div>
                        <div className="text-[11px] text-emerald-600">{money(f.amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel 2: Upcoming Compliance */}
          <div className="card overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[12px] font-bold text-gray-900">Upcoming Compliance</span>
              <Link href="/compliance" className="text-[11px] font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[12px] p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Icon name="hourglass_bottom" className="text-amber-600 text-[16px]" />
                  <span className="text-gray-700 font-medium">Expiring in 30 Days</span>
                </div>
                <span className="font-bold text-amber-700 font-mono">{s.expiringDocumentsCount}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] p-2 rounded-lg bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-2">
                  <Icon name="gpp_bad" className="text-red-600 text-[16px]" />
                  <span className="text-gray-700 font-medium">Expired Certificates</span>
                </div>
                <span className="font-bold text-red-700 font-mono">{s.expiredDocumentsCount}</span>
              </div>
            </div>
          </div>

          {/* Panel 3: Upcoming Maintenance & Breakdowns */}
          <div className="card overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[12px] font-bold text-gray-900">Upcoming Maintenance</span>
              <Link href="/machinery/maintenance" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Schedule
              </Link>
            </div>
            {recentMaintenance.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No scheduled maintenance</div>
            ) : (
              <div className="divide-y divide-gray-100 text-[12px]">
                {recentMaintenance.slice(0, 3).map((mnt) => {
                  const m = machinery.find((mac) => mac.id === mnt.machineryId);
                  return (
                    <div key={mnt.id} className="p-2.5 hover:bg-gray-50/60 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-gray-900 truncate">
                          {m?.assetCode || "Equipment"} — {mnt.maintenanceType}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {mnt.serviceDate || mnt.date || "Upcoming"}
                        </div>
                      </div>
                      <StatusPill tone="blue">{mnt.status}</StatusPill>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
