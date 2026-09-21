"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
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

  // Filters for Daily Logs Table (Requirement 11)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [selectedEngineId, setSelectedEngineId] = useState("all");
  const [selectedMeterType, setSelectedMeterType] = useState<"all" | MeterType>("all");

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

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((l) => {
      // Date filter
      if (selectedDate && l.date !== selectedDate) return false;

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
    selectedDate,
    selectedMachineId,
    selectedProjectId,
    selectedSiteId,
    selectedEngineId,
    selectedMeterType,
    machinery,
    allEngines,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Equipment Log Book & Fuel Efficiency"
        subtitle="Automatic opening reading continuity, view-only diesel cross-reference, multi-engine independent meters, and standard variance tracking."
        action={
          <Link
            href="/machinery/log-book/new"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Icon name="add" size={18} />
            Record Daily Log
          </Link>
        }
      />

      {/* Segmented Tabs Navigation */}
      <div className="inline-flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/80"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Icon name="menu_book" size={16} />
          Daily Running Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab("averages")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "averages"
              ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/80"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Icon name="speed" size={16} className="text-amber-400" />
          Machinery Average &amp; Fuel Efficiency Engine
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          {/* FILTER STRIP (REQUIREMENT 11) */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Icon name="filter_alt" size={15} className="text-amber-400" />
                Filter Log Entries
              </span>
              {(searchTerm ||
                selectedDate ||
                selectedMachineId !== "all" ||
                selectedProjectId !== "all" ||
                selectedSiteId !== "all" ||
                selectedEngineId !== "all" ||
                selectedMeterType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDate("");
                    setSelectedMachineId("all");
                    setSelectedProjectId("all");
                    setSelectedSiteId("all");
                    setSelectedEngineId("all");
                    setSelectedMeterType("all");
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {/* Search */}
              <div className="space-y-1 sm:col-span-2">
                <input
                  type="text"
                  placeholder="Search Log #, machine, operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Machinery Filter */}
              <div className="space-y-1">
                <select
                  value={selectedMachineId}
                  onChange={(e) => {
                    setSelectedMachineId(e.target.value);
                    setSelectedEngineId("all");
                  }}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="all">All Machinery ({machinery.length})</option>
                  {machinery.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.registrationNo ? `${m.machineryName} — ${m.registrationNo}` : m.machineryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="space-y-1">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Engine Filter */}
              <div className="space-y-1">
                <select
                  value={selectedEngineId}
                  onChange={(e) => setSelectedEngineId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="all">All Engines</option>
                  {filteredEnginesForFilter.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.engineName} ({e.meterType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Meter Type Filter */}
              <div className="space-y-1">
                <select
                  value={selectedMeterType}
                  onChange={(e) => setSelectedMeterType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="all">All Meters</option>
                  <option value="KM">KM Only</option>
                  <option value="HOUR">Hour Only</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 font-medium text-right">
              Showing {filteredLogs.length} of {logs.length} entries
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-3 bg-neutral-900/40 rounded-2xl border border-neutral-800">
              <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading equipment log books...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title="No Log Book Entries Found"
              description={
                selectedDate || selectedMachineId !== "all" || searchTerm
                  ? "No daily log records matched your current filter criteria."
                  : "No daily running logs have been recorded yet. Click below to create your first equipment shift log."
              }
              actionLabel="Record Daily Log"
              actionHref="/machinery/log-book/new"
            />
          ) : (
            /* TABLE OF LOG BOOK ENTRIES (REQUIREMENT 11) */
            <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/70 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="px-4 py-3">Date</th>
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
                  <tbody className="divide-y divide-neutral-800/60 text-xs font-medium">
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
                          className="hover:bg-neutral-800/40 transition-colors group"
                        >
                          {/* Date */}
                          <td className="px-4 py-3 font-mono text-neutral-300 whitespace-nowrap">
                            {l.date}
                          </td>

                          {/* Log No */}
                          <td className="px-4 py-3 font-mono font-semibold text-amber-400 whitespace-nowrap">
                            {l.logNo}
                          </td>

                          {/* Machinery Asset Code */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-white">
                              {m?.assetCode || "MCH"}
                            </span>
                            <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                              {m?.make} {m?.model}
                            </p>
                          </td>

                          {/* Registration / Machinery Name */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-neutral-200">
                              {m?.registrationNo ? m.registrationNo : m?.machineryName || "—"}
                            </span>
                            {m?.registrationNo && (
                              <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                                {m?.machineryName}
                              </p>
                            )}
                          </td>

                          {/* Engine */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {eng ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/60 border border-purple-800/60 text-purple-300">
                                {eng.engineName}
                              </span>
                            ) : (
                              <span className="text-neutral-500 text-[11px]">Primary / Single</span>
                            )}
                          </td>

                          {/* Opening Reading */}
                          <td className="px-4 py-3 text-right font-mono text-neutral-300">
                            {l.openingReading.toFixed(1)}
                            {l.isMeterReset && (
                              <span className="ml-1 text-[9px] text-amber-400">(Reset)</span>
                            )}
                          </td>

                          {/* Closing Reading */}
                          <td className="px-4 py-3 text-right font-mono text-white font-semibold">
                            {l.closingReading.toFixed(1)}
                          </td>

                          {/* Total Run */}
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 font-mono font-bold text-amber-400">
                              {l.totalKmHours.toFixed(1)} {meterLabel}
                            </span>
                          </td>

                          {/* Diesel Issued (Read-only) */}
                          <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                            {dieselOnDate > 0 ? `${dieselOnDate.toFixed(1)} L` : "0.0 L"}
                          </td>

                          {/* Efficiency */}
                          <td className="px-4 py-3 text-right font-mono text-neutral-300">
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
                                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                              >
                                <Icon name="visibility" size={15} />
                              </Link>

                              {/* Edit */}
                              <Link
                                href={`/machinery/log-book/${l.id}`}
                                title="Edit Transaction"
                                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-amber-500/20 text-neutral-400 hover:text-amber-300 transition-colors"
                              >
                                <Icon name="edit" size={15} />
                              </Link>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSpecificLog(l)}
                                title="Delete Entry"
                                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
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
        /* TAB 2: MACHINERY AVERAGE & FUEL EFFICIENCY ENGINE */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Icon name="tune" size={16} className="text-amber-400" />
                Select Period &amp; Equipment for Average Calculation
              </h3>
              <span className="text-xs text-neutral-400 font-normal">
                Calculates from real database Log Books &amp; Fuel Issues
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">From Date *</label>
                <input
                  type="date"
                  value={avgFromDate}
                  onChange={(e) => setAvgFromDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">To Date *</label>
                <input
                  type="date"
                  value={avgToDate}
                  onChange={(e) => setAvgToDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Machinery</label>
                <select
                  value={avgMachineId}
                  onChange={(e) => {
                    setAvgMachineId(e.target.value);
                    setAvgEngineId("all");
                  }}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
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
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Project (Optional)</label>
                <select
                  value={avgProjectId}
                  onChange={(e) => setAvgProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
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
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Site (Optional)</label>
                <select
                  value={avgSiteId}
                  onChange={(e) => setAvgSiteId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
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
                  className="w-full px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {efficiencyLoading ? (
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
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
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-blue-500">
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Total Run in Period</p>
              <p className="text-xl font-mono font-bold text-white mt-1">
                {efficiencyRecords.reduce((acc, r) => acc + r.totalKmHours, 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}{" "}
                <span className="text-xs text-neutral-400">Total Units</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-amber-500">
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Total Fuel Issued</p>
              <p className="text-xl font-mono font-bold text-white mt-1">
                {efficiencyRecords.reduce((acc, r) => acc + r.totalDieselLitres, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs text-neutral-400">Litres</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-emerald-500">
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Within Standard</p>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
                {efficiencyRecords.filter((r) => r.status === "Within Standard" || r.status === "Lower Consumption").length} / {efficiencyRecords.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-red-500">
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Higher Consumption</p>
              <p className="text-xl font-mono font-bold text-red-400 mt-1">
                {efficiencyRecords.filter((r) => r.status === "Higher Consumption").length}
              </p>
            </div>
          </div>

          {/* Efficiency Table */}
          {efficiencyLoading ? (
            <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-3 bg-neutral-900/40 rounded-2xl border border-neutral-800">
              <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Computing average consumption &amp; standard variances...</p>
            </div>
          ) : efficiencyRecords.length === 0 ? (
            <EmptyState
              icon="speed"
              title="No Equipment Data in Period"
              description="No log book or fuel records were found in the selected date range for the specified equipment."
            />
          ) : (
            <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/70 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
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
                  <tbody className="divide-y divide-neutral-800/60 text-xs font-medium">
                    {efficiencyRecords.map((r, i) => {
                      const isKm = r.meterType === "KM";
                      const avgUnit = isKm ? "KM/L" : "L/Hour";
                      return (
                        <tr key={i} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-amber-400">
                            {r.assetCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{r.machineryName}</p>
                            {r.registrationNo && (
                              <p className="text-[10px] text-neutral-400 font-mono">{r.registrationNo}</p>
                            )}
                            {r.engineName && (
                              <span className="text-[10px] text-purple-400 font-medium">
                                Engine: {r.engineName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-300">
                            {r.meterType}
                          </td>
                          <td className="px-4 py-3 font-mono text-white text-right font-bold">
                            {r.totalKmHours.toFixed(1)} {r.meterType}
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-400 text-right font-bold">
                            {r.totalDieselLitres.toFixed(2)} L
                          </td>
                          <td className="px-4 py-3 font-mono text-amber-300 text-right font-black">
                            {r.actualAverage > 0 ? `${r.actualAverage.toFixed(2)} ${avgUnit}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400 text-right">
                            {r.standardFuelEfficiency != null ? `${r.standardFuelEfficiency.toFixed(2)} ${avgUnit}` : "Not Set"}
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-semibold">
                            {r.variance != null ? (
                              <span
                                className={
                                  (isKm && r.variance >= 0) || (!isKm && r.variance <= 0)
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }
                              >
                                {r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}{" "}
                                {r.variancePercentage != null ? `(${r.variancePercentage > 0 ? "+" : ""}${r.variancePercentage.toFixed(0)}%)` : ""}
                              </span>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                r.status === "Within Standard"
                                  ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/80"
                                  : r.status === "Lower Consumption"
                                  ? "bg-blue-950/70 text-blue-400 border border-blue-800/80"
                                  : r.status === "Higher Consumption"
                                  ? "bg-red-950/70 text-red-400 border border-red-800/80"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  r.status === "Within Standard"
                                    ? "bg-emerald-400"
                                    : r.status === "Lower Consumption"
                                    ? "bg-blue-400"
                                    : r.status === "Higher Consumption"
                                    ? "bg-red-400"
                                    : "bg-neutral-500"
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
    </div>
  );
}
