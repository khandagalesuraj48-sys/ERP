"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getLogBooks,
  deleteLogBook,
  getMachinery,
  getProjects,
  getSites,
  getEngines,
  getFuelIssues,
  calculateMachineryEfficiency,
} from "@/lib/data/repository";
import type {
  LogBook,
  Machinery,
  Project,
  Site,
  Engine,
  MeterType,
  FuelIssue,
  MachineryEfficiencyRecord,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

export default function LogBookPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"logs" | "averages">("logs");

  // Master Data & Records
  const [logs, setLogs] = useState<LogBook[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [allEngines, setAllEngines] = useState<Engine[]>([]);
  const [fuelIssues, setFuelIssues] = useState<FuelIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Daily Logs Table (Requirement 9)
  const [searchTerm, setSearchTerm] = useState("");
  const [quickDatePreset, setQuickDatePreset] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedShift, setSelectedShift] = useState<"all" | "Day" | "Night">("all");
  const [selectedMachineId, setSelectedMachineId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [selectedEngineId, setSelectedEngineId] = useState("all");
  const [selectedMeterType, setSelectedMeterType] = useState<"all" | MeterType>("all");

  const handleQuickDateChange = (preset: string) => {
    setQuickDatePreset(preset);
    if (preset === "all" || preset === "custom") {
      if (preset === "all") {
        setFromDate("");
        setToDate("");
      }
      return;
    }
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (preset === "today") {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now);
      mon.setDate(diff);
      setFromDate(mon.toISOString().slice(0, 10));
      setToDate(todayStr);
    } else if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(start.toISOString().slice(0, 10));
      setToDate(todayStr);
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(start.toISOString().slice(0, 10));
      setToDate(end.toISOString().slice(0, 10));
    }
  };

  // Filters for Average & Fuel Efficiency Report
  const [avgFromDate, setAvgFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First of current month
    return d.toISOString().slice(0, 10);
  });
  const [avgToDate, setAvgToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [avgMachineId, setAvgMachineId] = useState<string>("all");
  const [avgEngineId, setAvgEngineId] = useState<string>("all");
  const [avgProjectId, setAvgProjectId] = useState<string>("all");
  const [avgSiteId, setAvgSiteId] = useState<string>("all");
  const [efficiencyRecords, setEfficiencyRecords] = useState<MachineryEfficiencyRecord[]>([]);
  const [efficiencyLoading, setEfficiencyLoading] = useState(false);

  // Load all master data and records efficiently (No N+1 queries)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, m, p, s, engs, fi] = await Promise.all([
        getLogBooks(),
        getMachinery(),
        getProjects(),
        getSites(),
        getEngines(),
        getFuelIssues(),
      ]);
      setLogs(l);
      setMachinery(m);
      setProjects(p);
      setSites(s);
      setAllEngines(engs);
      setFuelIssues(fi);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load log book records.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load efficiency records whenever average filters change or tab is activated
  const loadEfficiency = useCallback(async () => {
    setEfficiencyLoading(true);
    try {
      const res = await calculateMachineryEfficiency({
        machineryId: avgMachineId !== "all" ? avgMachineId : undefined,
        fromDate: avgFromDate || undefined,
        toDate: avgToDate || undefined,
        engineId: avgEngineId !== "all" ? avgEngineId : undefined,
        projectId: avgProjectId !== "all" ? avgProjectId : undefined,
        siteId: avgSiteId !== "all" ? avgSiteId : undefined,
      });
      setEfficiencyRecords(res);
    } catch (err: any) {
      console.error("Efficiency calculate error:", err);
    } finally {
      setEfficiencyLoading(false);
    }
  }, [avgMachineId, avgFromDate, avgToDate, avgEngineId, avgProjectId, avgSiteId]);

  useEffect(() => {
    if (activeTab === "averages") {
      loadEfficiency();
    }
  }, [activeTab, loadEfficiency]);

  // Delete log with confirmation
  async function handleDeleteSpecificLog(log: LogBook) {
    if (!window.confirm(`Are you sure you want to delete log book entry '${log.logNo}'?`)) return;
    try {
      await deleteLogBook(log.id);
      showToast("Deleted", `Log entry '${log.logNo}' deleted successfully.`);
      loadData();
      if (activeTab === "averages") loadEfficiency();
    } catch (e: any) {
      showToast("Error", e.message || "Failed to delete log entry", "error");
    }
  }

  // Filtered engines for engine filter dropdown
  const filteredEnginesForFilter = useMemo(() => {
    if (selectedMachineId === "all") return allEngines;
    return allEngines.filter((e) => e.machineryId === selectedMachineId);
  }, [allEngines, selectedMachineId]);

  // Cascading sites for filter dropdown
  const filteredSitesForFilter = useMemo(() => {
    if (selectedProjectId === "all") return sites;
    return sites.filter((s) => s.projectId === selectedProjectId);
  }, [sites, selectedProjectId]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((l) => {
      // Date range filter
      if (fromDate && l.date < fromDate) return false;
      if (toDate && l.date > toDate) return false;

      // Shift filter
      if (selectedShift !== "all" && l.shift !== selectedShift) return false;

      // Machinery filter
      if (selectedMachineId !== "all" && l.machineryId !== selectedMachineId) return false;

      // Project filter
      if (selectedProjectId !== "all" && l.projectId !== selectedProjectId) return false;

      // Site filter
      if (selectedSiteId !== "all" && l.siteId !== selectedSiteId) return false;

      // Engine filter
      if (selectedEngineId !== "all" && l.engineId !== selectedEngineId) return false;

      // Meter Type filter
      if (selectedMeterType !== "all") {
        const m = machinery.find((mac) => mac.id === l.machineryId);
        const eng = l.engineId ? allEngines.find((e) => e.id === l.engineId) : null;
        const currentMeter = eng?.meterType || m?.meterType;
        if (currentMeter !== selectedMeterType) return false;
      }

      // Search term
      if (q) {
        const m = machinery.find((mac) => mac.id === l.machineryId);
        const eng = l.engineId ? allEngines.find((e) => e.id === l.engineId) : null;
        const searchMatches =
          l.logNo.toLowerCase().includes(q) ||
          (l.operatorName && l.operatorName.toLowerCase().includes(q)) ||
          (m && m.assetCode.toLowerCase().includes(q)) ||
          (m && m.machineryName.toLowerCase().includes(q)) ||
          (m && m.registrationNo && m.registrationNo.toLowerCase().includes(q)) ||
          (eng && eng.engineName.toLowerCase().includes(q));
        if (!searchMatches) return false;
      }

      return true;
    });
  }, [
    logs,
    searchTerm,
    fromDate,
    toDate,
    selectedShift,
    selectedMachineId,
    selectedProjectId,
    selectedSiteId,
    selectedEngineId,
    selectedMeterType,
    machinery,
    allEngines,
  ]);

  return (
    <PageTransition className="space-y-5">
      <PageHeader
        title="Daily Equipment Log Book & Fuel Efficiency"
        subtitle="Automatic opening reading continuity, view-only diesel cross-reference, multi-engine independent meters, and standard variance tracking."
        action={
          <Link
            href="/machinery/log-book/new"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Icon name="add" size={16} />
            Record Daily Log
          </Link>
        }
      />

      {/* Segmented Tabs Navigation */}
      <div className="inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Icon name="menu_book" size={16} />
          Daily Running Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab("averages")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "averages"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Icon name="speed" size={16} className="text-blue-600" />
          Machinery Average &amp; Fuel Efficiency Engine
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          {/* FILTER STRIP (SOLID WHITE ENTERPRISE CARD) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Icon name="filter_alt" size={15} className="text-blue-600" />
                Filter Log Entries
              </span>
              
              {/* Quick Date Range Presets */}
              <div className="inline-flex items-center p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/70 text-[11px]">
                {[
                  { key: "all", label: "All Dates" },
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "this_week", label: "This Week" },
                  { key: "this_month", label: "This Month" },
                  { key: "last_month", label: "Last Month" },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleQuickDateChange(preset.key)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      quickDatePreset === preset.key
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {(searchTerm ||
                fromDate ||
                toDate ||
                selectedShift !== "all" ||
                selectedMachineId !== "all" ||
                selectedProjectId !== "all" ||
                selectedSiteId !== "all" ||
                selectedEngineId !== "all" ||
                selectedMeterType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setQuickDatePreset("all");
                    setFromDate("");
                    setToDate("");
                    setSelectedShift("all");
                    setSelectedMachineId("all");
                    setSelectedProjectId("all");
                    setSelectedSiteId("all");
                    setSelectedEngineId("all");
                    setSelectedMeterType("all");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {/* Search */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Search</label>
                <input
                  type="text"
                  placeholder="Log #, machine, op..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              {/* From Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setQuickDatePreset("custom");
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setQuickDatePreset("custom");
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              {/* Shift Filter (Requirement 9) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Shift</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Shifts</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              {/* Machinery Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Machinery</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => {
                    setSelectedMachineId(e.target.value);
                    setSelectedEngineId("all");
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All ({machinery.length})</option>
                  {machinery.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.registrationNo ? `${m.machineryName} — ${m.registrationNo}` : m.machineryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedSiteId("all");
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cascading Site Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Site</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Sites ({filteredSitesForFilter.length})</option>
                  {filteredSitesForFilter.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium text-right">
              Showing {filteredLogs.length} of {logs.length} entries
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading equipment log books...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title="No Log Book Entries Found"
              description={
                fromDate || toDate || selectedShift !== "all" || selectedMachineId !== "all" || searchTerm
                  ? "No daily log records matched your current filter criteria."
                  : "No daily running logs have been recorded yet. Click below to create your first equipment shift log."
              }
              actionLabel="Record Daily Log"
              actionHref="/machinery/log-book/new"
            />
          ) : (
            /* TABLE OF LOG BOOK ENTRIES (SOLID WHITE) */
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Log No</th>
                      <th className="px-4 py-3">Equipment</th>
                      <th className="px-4 py-3">Reg. / Name</th>
                      <th className="px-4 py-3">Engine</th>
                      <th className="px-4 py-3 text-right">Opening</th>
                      <th className="px-4 py-3 text-right">Closing</th>
                      <th className="px-4 py-3 text-right">Total Run</th>
                      <th className="px-4 py-3 text-right">Diesel</th>
                      <th className="px-4 py-3 text-right">Efficiency</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredLogs.map((l) => {
                      const m = machinery.find((mac) => mac.id === l.machineryId);
                      const eng = l.engineId ? allEngines.find((e) => e.id === l.engineId) : null;
                      const meterLabel = eng?.meterType || m?.meterType || "HR";

                      // Calculate Diesel on Date from Fuel Issues (Read-only cross-reference)
                      const dieselOnDate = fuelIssues
                        .filter(
                          (f) =>
                            f.machineryId === l.machineryId &&
                            f.issueDate === l.date &&
                            f.status !== "cancelled" &&
                            (!l.engineId || f.engineId === l.engineId || f.allocationMode === "shared")
                        )
                        .reduce((sum, f) => sum + (f.quantityLitres || 0), 0);

                      // Efficiency on Date
                      let efficiencyStr = "-";
                      if (l.totalKmHours > 0 && dieselOnDate > 0) {
                        if (meterLabel === "KM") {
                          efficiencyStr = `${(l.totalKmHours / dieselOnDate).toFixed(1)} KM/L`;
                        } else {
                          efficiencyStr = `${(dieselOnDate / l.totalKmHours).toFixed(1)} L/Hr`;
                        }
                      }

                      return (
                        <tr
                          key={l.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Date */}
                          <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                            {l.date}
                          </td>

                          {/* Shift */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {l.shift === "Day" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                <span className="material-symbols-outlined text-[12px]">light_mode</span>
                                Day
                              </span>
                            ) : l.shift === "Night" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                <span className="material-symbols-outlined text-[12px]">dark_mode</span>
                                Night
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Log No */}
                          <td className="px-4 py-3 font-mono font-semibold text-blue-700 whitespace-nowrap">
                            {l.logNo}
                          </td>

                          {/* Machinery Asset Code */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">
                              {m?.assetCode || "MCH"}
                            </span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {m?.make} {m?.model}
                            </p>
                          </td>

                          {/* Registration / Machinery Name */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">
                              {m?.registrationNo ? m.registrationNo : m?.machineryName || "—"}
                            </span>
                            {m?.registrationNo && (
                              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                {m?.machineryName}
                              </p>
                            )}
                          </td>

                          {/* Engine */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {eng ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                                {eng.engineName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Primary / Single</span>
                            )}
                          </td>

                          {/* Opening Reading */}
                          <td className="px-4 py-3 text-right font-mono text-slate-700">
                            {l.openingReading.toFixed(1)}
                            {l.isMeterReset && (
                              <span className="ml-1 text-[9px] text-amber-600 font-bold">(Reset)</span>
                            )}
                          </td>

                          {/* Closing Reading */}
                          <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">
                            {l.closingReading.toFixed(1)}
                          </td>

                          {/* Total Run */}
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 font-mono font-bold text-blue-700">
                              {l.totalKmHours.toFixed(1)} {meterLabel}
                            </span>
                          </td>

                          {/* Diesel Issued (Read-only) */}
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                            {dieselOnDate > 0 ? `${dieselOnDate.toFixed(1)} L` : "0.0 L"}
                          </td>

                          {/* Efficiency */}
                          <td className="px-4 py-3 text-right font-mono text-slate-700">
                            {efficiencyStr}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <StatusPill
                              tone={
                                l.status === "approved"
                                  ? "green"
                                  : l.status === "cancelled"
                                  ? "red"
                                  : "amber"
                              }
                            >
                              {l.status}
                            </StatusPill>
                          </td>

                          {/* Actions (View, Edit, Delete) */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View */}
                              <Link
                                href={`/machinery/log-book/${l.id}?view=true`}
                                title="View Details"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200"
                              >
                                <Icon name="visibility" size={15} />
                              </Link>

                              {/* Edit */}
                              <Link
                                href={`/machinery/log-book/${l.id}`}
                                title="Edit Transaction"
                                className="p-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200/80"
                              >
                                <Icon name="edit" size={15} />
                              </Link>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSpecificLog(l)}
                                title="Delete Entry"
                                className="p-1.5 rounded-lg bg-rose-50/60 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200/80"
                              >
                                <Icon name="delete" size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* TAB 2: MACHINERY AVERAGE & FUEL EFFICIENCY ENGINE (SOLID WHITE) */
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Icon name="tune" size={16} className="text-blue-600" />
                Select Period &amp; Equipment for Average Calculation
              </h3>
              <span className="text-xs text-slate-500 font-normal">
                Calculates from real database Log Books &amp; Fuel Issues
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">From Date *</label>
                <input
                  type="date"
                  value={avgFromDate}
                  onChange={(e) => setAvgFromDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">To Date *</label>
                <input
                  type="date"
                  value={avgToDate}
                  onChange={(e) => setAvgToDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Machinery</label>
                <select
                  value={avgMachineId}
                  onChange={(e) => {
                    setAvgMachineId(e.target.value);
                    setAvgEngineId("all");
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Machinery ({machinery.length})</option>
                  {machinery.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.assetCode} — {getMachineryDisplayName(m)} ({m.meterType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Project (Optional)</label>
                <select
                  value={avgProjectId}
                  onChange={(e) => setAvgProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Site (Optional)</label>
                <select
                  value={avgSiteId}
                  onChange={(e) => setAvgSiteId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="all">All Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={loadEfficiency}
                  disabled={efficiencyLoading}
                  className="w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {efficiencyLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icon name="refresh" size={16} /> Calculate Average
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Efficiency Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 border-l-4 border-l-blue-500 shadow-xs">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Run in Period</p>
              <p className="text-xl font-mono font-bold text-slate-900 mt-1">
                {efficiencyRecords.reduce((acc, r) => acc + r.totalKmHours, 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}{" "}
                <span className="text-xs text-slate-500">Units</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Fuel Issued</p>
              <p className="text-xl font-mono font-bold text-slate-900 mt-1">
                {efficiencyRecords.reduce((acc, r) => acc + r.totalDieselLitres, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs text-slate-500">Litres</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Within Standard</p>
              <p className="text-xl font-mono font-bold text-emerald-600 mt-1">
                {efficiencyRecords.filter((r) => r.status === "Within Standard" || r.status === "Lower Consumption").length} / {efficiencyRecords.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 border-l-4 border-l-rose-500 shadow-xs">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Higher Consumption</p>
              <p className="text-xl font-mono font-bold text-rose-600 mt-1">
                {efficiencyRecords.filter((r) => r.status === "Higher Consumption").length}
              </p>
            </div>
          </div>

          {/* Efficiency Table */}
          {efficiencyLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Computing average consumption &amp; standard variances...</p>
            </div>
          ) : efficiencyRecords.length === 0 ? (
            <EmptyState
              icon="speed"
              title="No Equipment Data in Period"
              description="No log book or fuel records were found in the selected date range for the specified equipment."
            />
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-3">Asset Code</th>
                      <th className="px-4 py-3">Equipment / Engine</th>
                      <th className="px-4 py-3">Meter Type</th>
                      <th className="px-4 py-3 text-right">Total Run</th>
                      <th className="px-4 py-3 text-right">Fuel Issued</th>
                      <th className="px-4 py-3 text-right">Actual Average</th>
                      <th className="px-4 py-3 text-right">Standard Efficiency</th>
                      <th className="px-4 py-3 text-right">Variance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {efficiencyRecords.map((r, i) => {
                      const isKm = r.meterType === "KM";
                      const avgUnit = isKm ? "KM/L" : "L/Hour";
                      return (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-700">
                            {r.assetCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{r.machineryName}</p>
                            {r.registrationNo && (
                              <p className="text-[10px] text-slate-500 font-mono">{r.registrationNo}</p>
                            )}
                            {r.engineName && (
                              <span className="text-[10px] text-purple-600 font-medium">
                                Engine: {r.engineName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {r.meterType}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-900 text-right font-bold">
                            {r.totalKmHours.toFixed(1)} {r.meterType}
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-600 text-right font-bold">
                            {r.totalDieselLitres.toFixed(2)} L
                          </td>
                          <td className="px-4 py-3 font-mono text-blue-700 text-right font-bold">
                            {r.actualAverage > 0 ? `${r.actualAverage.toFixed(2)} ${avgUnit}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-right">
                            {r.standardFuelEfficiency != null ? `${r.standardFuelEfficiency.toFixed(2)} ${avgUnit}` : "Not Set"}
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-semibold">
                            {r.variance != null ? (
                              <span
                                className={
                                  (isKm && r.variance >= 0) || (!isKm && r.variance <= 0)
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }
                              >
                                {r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}{" "}
                                {r.variancePercentage != null ? `(${r.variancePercentage > 0 ? "+" : ""}${r.variancePercentage.toFixed(0)}%)` : ""}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                r.status === "Within Standard"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : r.status === "Lower Consumption"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : r.status === "Higher Consumption"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  r.status === "Within Standard"
                                    ? "bg-emerald-500"
                                    : r.status === "Lower Consumption"
                                    ? "bg-blue-500"
                                    : r.status === "Higher Consumption"
                                    ? "bg-rose-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
