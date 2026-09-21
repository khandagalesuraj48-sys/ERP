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
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getDashboardStats,
  getMachinery,
  getProjects,
  getSites,
  getFuelIssues,
  getLogBooks,
  getBreakdowns,
  getMaintenanceRecords,
} from "@/lib/data/repository";
import { money, fmt, cn } from "@/lib/utils";
import type {
  DashboardStats,
  Machinery,
  Project,
  Site,
  FuelIssue,
  Breakdown,
  MaintenanceRecord,
  LogBook,
} from "@/lib/types";
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
      setRecentBreakdowns(
        b.filter((x) => x.status !== "completed" && x.status !== "cancelled").slice(0, 5)
      );
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

  // Filtered machinery list
  const filteredMachinery = useMemo(() => {
    return machinery.filter((m) => {
      if (selectedProject !== "all" && m.currentProjectId !== selectedProject) return false;
      if (selectedSite !== "all" && m.currentSiteId !== selectedSite) return false;
      return true;
    });
  }, [machinery, selectedProject, selectedSite]);

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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2.5 shadow-xs">
        <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[13px] font-medium">Loading operations dashboard...</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* 1. TOP HEADER & FILTER STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            MILESTONE ERP — Construction Machinery Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Executive Control, Fleet Operations &amp; Fuel Compliance
          </p>
        </div>

        {/* Compact Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedSite("all");
            }}
            className="form-select text-xs h-8 py-0 pl-2.5 pr-7 w-36 bg-white border border-slate-300 rounded-xl"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            disabled={selectedProject === "all"}
            className="form-select text-xs h-8 py-0 pl-2.5 pr-7 w-36 bg-white border border-slate-300 rounded-xl disabled:opacity-50"
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

          <button
            type="button"
            onClick={loadData}
            title="Refresh metrics"
            className="h-8 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Icon name="refresh" size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CONTROL STRIP (7 PRIMARY KPIS) */}
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
          value={fmt(filteredMachinery.filter((m) => m.status === "active").length)}
          sub="Operational on Sites"
          icon="check_circle"
          accent="green"
        />
        <StatCard
          label="Under Repair"
          value={fmt(filteredMachinery.filter((m) => m.status === "under_repair").length)}
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

      {/* 3. EXECUTIVE OPERATIONS OVERVIEW — CONTAINER SCROLL ANIMATION (REQUIREMENT 12) */}
      <ContainerScroll
        titleComponent={
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
              <Icon name="verified" size={14} />
              Operations Overview
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              MILESTONE ERP — Construction Machinery Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              Real-time control across machinery, projects, fuel, maintenance and inventory.
            </p>
          </div>
        }
      >
        {/* Real Supabase Operations Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* A. Machinery Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Icon name="precision_manufacturing" size={16} className="text-blue-600" />
                Machinery Status
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {filteredMachinery.length} Total
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active on Sites:
                </span>
                <span className="font-mono font-bold text-emerald-600">
                  {filteredMachinery.filter((m) => m.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Under Repair:
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {filteredMachinery.filter((m) => m.status === "under_repair").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Inactive / Standby:
                </span>
                <span className="font-mono font-bold text-amber-600">
                  {
                    filteredMachinery.filter(
                      (m) => m.status === "inactive" || m.status === "archived"
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* B. Fuel Operations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Icon name="local_gas_station" size={16} className="text-amber-600" />
                Fuel Operations
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {fmt(s.todayFuelLitres)} L
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Today&apos;s Dispensed:</span>
                <span className="font-mono font-bold text-slate-900">
                  {fmt(s.todayFuelLitres)} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Today&apos;s Fuel Cost:</span>
                <span className="font-mono font-bold text-slate-900">
                  {money(s.todayFuelAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Month Fuel Total:</span>
                <span className="font-mono font-bold text-slate-700">
                  {fmt(s.monthFuelLitres)} L
                </span>
              </div>
            </div>
          </div>

          {/* C. Daily Operations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Icon name="speed" size={16} className="text-blue-600" />
                Today&apos;s Runtime
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {s.openBreakdowns > 0 ? `${s.openBreakdowns} Breakdown(s)` : "Normal"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Equipment Hours:</span>
                <span className="font-mono font-bold text-blue-600">{fmt(todayHours)} Hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Distance Run:</span>
                <span className="font-mono font-bold text-amber-600">{fmt(todayKM)} KM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Open Breakdowns:</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    s.openBreakdowns > 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {s.openBreakdowns}
                </span>
              </div>
            </div>
          </div>

          {/* D. Statutory Compliance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Icon name="verified" size={16} className="text-emerald-600" />
                Compliance Matrix
              </span>
              <Link href="/compliance" className="text-[11px] text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Expiring in 30 Days:</span>
                <span className="font-mono font-bold text-amber-600">
                  {s.expiringDocumentsCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Expired Documents:</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    s.expiredDocumentsCount > 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {s.expiredDocumentsCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Compliance Status:</span>
                <span className="font-semibold text-emerald-600">
                  {s.expiredDocumentsCount === 0
                    ? "100% Compliant"
                    : `${s.expiredDocumentsCount} Actionable`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>

      {/* 4. QUICK ACTIONS STRIP (REQUIREMENT 16) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Icon name="bolt" size={16} className="text-amber-500" />
          Immediate Operational Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <Link
            href="/machinery"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="precision_manufacturing" size={16} className="text-blue-600" />
            <span>+ Machine</span>
          </Link>
          <Link
            href="/machinery/log-book/new"
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <Icon name="menu_book" size={16} className="text-blue-700" />
            <span>+ Daily Log</span>
          </Link>
          <Link
            href="/machinery/fuel"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 text-slate-700 hover:text-amber-800 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="local_gas_station" size={16} className="text-amber-600" />
            <span>+ Fuel Issue</span>
          </Link>
          <Link
            href="/machinery/breakdowns"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-slate-700 hover:text-rose-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="warning" size={16} className="text-rose-600" />
            <span>+ Breakdown</span>
          </Link>
          <Link
            href="/machinery/maintenance"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="handyman" size={16} className="text-blue-600" />
            <span>+ Service</span>
          </Link>
          <Link
            href="/store?tab=inward"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="move_to_inbox" size={16} className="text-emerald-600" />
            <span>+ Inward GRN</span>
          </Link>
          <Link
            href="/store?tab=outward"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Icon name="outbox" size={16} className="text-purple-600" />
            <span>+ Outward Issue</span>
          </Link>
        </div>
      </div>

      {/* 5. OPERATIONAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Fuel & Utilization Trend */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fuel &amp; Utilization Trend</h2>
              <p className="text-xs text-slate-500">Daily fuel dispensed and equipment runtime</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Fuel (L)
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            {s.fuelTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No fuel discharge records in period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={s.fuelTrend}
                  margin={{ top: 8, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={4}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="litres"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#fuelGrad)"
                    name="Litres"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Machinery Status Donut */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="pb-3 mb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Fleet Deployment Status</h2>
            <p className="text-xs text-slate-500">Active vs Under Repair vs Standby</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {filteredMachinery.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No equipment registered.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Active",
                        value: filteredMachinery.filter((m) => m.status === "active").length,
                        color: "#16A34A",
                      },
                      {
                        name: "Under Repair",
                        value: filteredMachinery.filter((m) => m.status === "under_repair").length,
                        color: "#DC2626",
                      },
                      {
                        name: "Standby / Inactive",
                        value: filteredMachinery.filter(
                          (m) => m.status === "inactive" || m.status === "archived"
                        ).length,
                        color: "#D97706",
                      },
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {[
                      { color: "#16A34A" },
                      { color: "#DC2626" },
                      { color: "#D97706" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6. OPERATIONAL MACHINERY & ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Machinery Activity List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs lg:col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Equipment Fleet Activity</h3>
              <p className="text-xs text-slate-500">Live machinery deployment across projects</p>
            </div>
            <Link
              href="/machinery"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All ({filteredMachinery.length})
            </Link>
          </div>

          {filteredMachinery.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No equipment found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-2.5">Asset Code</th>
                    <th className="px-4 py-2.5">Equipment</th>
                    <th className="px-4 py-2.5">Reg. / Name</th>
                    <th className="px-4 py-2.5 text-right">Current Reading</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredMachinery.slice(0, 6).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-semibold text-blue-700">
                        {m.assetCode}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-slate-900">{m.machineryName}</span>
                        <p className="text-[10px] text-slate-500">
                          {m.make} {m.model}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {m.registrationNo ? (
                          <span className="font-mono font-medium">{m.registrationNo}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unregistered</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-900">
                        {m.currentReading.toFixed(1)} {m.meterType}
                      </td>
                      <td className="px-4 py-2.5 text-center">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side Cards: Recent Fuel & Breakdowns */}
        <div className="space-y-4">
          {/* Recent Fuel Issues */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Recent Fuel Dispensed</span>
              <Link href="/machinery/fuel" className="text-xs text-blue-600 hover:underline">
                Fuel Register
              </Link>
            </div>
            {recentFuels.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No recent fuel issues
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentFuels.slice(0, 4).map((f) => (
                  <div key={f.id} className="p-3 hover:bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold text-slate-900">{f.issueNo}</div>
                      <div className="text-[11px] text-slate-500">{f.issueDate}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900">{f.quantityLitres.toFixed(1)} L</div>
                      <div className="text-[10px] text-emerald-600">{money(f.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Breakdown Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Open Breakdown Tickets</span>
              <Link href="/machinery/breakdowns" className="text-xs text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {recentBreakdowns.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-600 font-medium flex items-center justify-center gap-1.5">
                <Icon name="check_circle" size={16} /> Zero open breakdown tickets
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentBreakdowns.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-3 hover:bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{b.breakdownNo}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {b.problemDescription}
                      </div>
                    </div>
                    <StatusPill tone={b.priority === "critical" ? "red" : "amber"}>
                      {b.priority || b.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
