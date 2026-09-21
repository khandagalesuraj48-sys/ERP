"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getFuelIssues,
  createFuelIssue,
  getMachinery,
  getProjects,
  getSites,
  generateFuelIssueNumber,
  getLogBooks,
  getEngines,
  getTheoreticalFuelBalance,
} from "@/lib/data/repository";
import { QuickCreateModal } from "@/components/ui/QuickCreateModal";
import { money, fmt } from "@/lib/utils";
import type {
  FuelIssue,
  Machinery,
  Project,
  Site,
  FuelSource,
  FuelType,
  Engine,
  TheoreticalFuelBalance,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

const FUEL_SOURCES: FuelSource[] = [
  "Site Bowser",
  "Retail Pump",
  "Mobile Tanker",
  "Barrel",
  "Other",
];

const FUEL_TYPES: FuelType[] = [
  "Diesel",
  "Petrol",
  "CNG",
  "Electric",
  "Other",
];

export default function FuelIssuePage() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<FuelIssue[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Efficiency KPI calculations
  const [kmStats, setKmStats] = useState({ km: 0, litres: 0, kmPerL: 0, lPer100Km: 0 });
  const [hrStats, setHrStats] = useState({ hrs: 0, litres: 0, lPerHr: 0 });

  // Filters
  const [selectedMachineId, setSelectedMachineId] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookBalance, setBookBalance] = useState<TheoreticalFuelBalance | null>(null);

  // Multi-engine & Quick Create state
  const [machineEngines, setMachineEngines] = useState<Engine[]>([]);
  const [allocationMode, setAllocationMode] = useState<"shared" | "engine_wise">("shared");
  const [engineAllocations, setEngineAllocations] = useState<{ [engineId: string]: string }>({});
  const [isQcOpen, setIsQcOpen] = useState(false);
  const [qcType, setQcType] = useState<"project" | "site">("project");

  const [formIssueNo, setFormIssueNo] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("10:00");
  const [formMachineryId, setFormMachineryId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formSiteId, setFormSiteId] = useState("");
  const [formMeterReading, setFormMeterReading] = useState<string>("0");
  const [formIsMeterReset, setFormIsMeterReset] = useState(false);
  const [formFuelType, setFormFuelType] = useState<string>("Diesel");
  const [formQuantity, setFormQuantity] = useState<string>("100");
  const [formRate, setFormRate] = useState<string>("92.50");
  const [formFuelSource, setFormFuelSource] = useState<FuelSource>("Site Bowser");
  const [formSlipRef, setFormSlipRef] = useState("");
  const [formOperator, setFormOperator] = useState("");
  const [formIssuedBy, setFormIssuedBy] = useState("Site P&M Supervisor");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, m, p, s, logs] = await Promise.all([
        getFuelIssues(selectedMachineId !== "all" ? selectedMachineId : undefined),
        getMachinery(),
        getProjects(),
        getSites(),
        getLogBooks(),
      ]);
      setIssues(f);
      setMachinery(m);
      setProjects(p);
      setSites(s);

      // Calculate KM vs HOUR efficiency
      let kmTotalRun = 0;
      let kmTotalLitres = 0;
      let hrTotalRun = 0;
      let hrTotalLitres = 0;

      m.forEach((mac) => {
        const macFuels = f.filter((x) => x.machineryId === mac.id && x.status === "confirmed");
        const macLogs = logs.filter((x) => x.machineryId === mac.id);
        const lts = macFuels.reduce((sum, x) => sum + x.quantityLitres, 0);
        const units = macLogs.reduce((sum, x) => sum + x.totalKmHours, 0);

        if (mac.meterType === "KM") {
          kmTotalRun += units;
          kmTotalLitres += lts;
        } else {
          hrTotalRun += units;
          hrTotalLitres += lts;
        }
      });

      setKmStats({
        km: kmTotalRun,
        litres: kmTotalLitres,
        kmPerL: kmTotalLitres > 0 ? Number((kmTotalRun / kmTotalLitres).toFixed(2)) : 0,
        lPer100Km: kmTotalRun > 0 ? Number(((kmTotalLitres / kmTotalRun) * 100).toFixed(2)) : 0,
      });

      setHrStats({
        hrs: hrTotalRun,
        litres: hrTotalLitres,
        lPerHr: hrTotalRun > 0 ? Number((hrTotalLitres / hrTotalRun).toFixed(2)) : 0,
      });
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load fuel records.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMachineChange(machineId: string) {
    setFormMachineryId(machineId);
    const m = machinery.find((mac) => mac.id === machineId);
    if (m) {
      setFormMeterReading(m.currentReading.toString());
      setFormFuelType(m.fuelType);
      if (m.currentProjectId || m.projectId) {
        setFormProjectId(m.currentProjectId || m.projectId || "");
      }
      if (m.currentSiteId || m.siteId) {
        setFormSiteId(m.currentSiteId || m.siteId || "");
      }

      getTheoreticalFuelBalance(machineId, formDate).then(setBookBalance).catch(console.error);

      try {
        const engs = await getEngines(m.id);
        setMachineEngines(engs);
        if (engs.length > 0 && m.engineConfig === "multi") {
          const initAlloc: { [k: string]: string } = {};
          engs.forEach((e) => {
            initAlloc[e.id] = "0";
          });
          initAlloc[engs[0].id] = formQuantity;
          setEngineAllocations(initAlloc);
        } else {
          setEngineAllocations({});
        }
      } catch (err) {
        console.error("Failed to load engines", err);
      }
    } else {
      setMachineEngines([]);
      setEngineAllocations({});
      setBookBalance(null);
    }
  }

  async function handleOpenModal() {
    const today = new Date().toISOString().slice(0, 10);
    const nextNo = await generateFuelIssueNumber(today);
    setFormIssueNo(nextNo);
    setFormDate(today);
    setFormTime(new Date().toTimeString().slice(0, 5));
    setAllocationMode("shared");

    if (machinery.length > 0) {
      const defaultM = machinery[0];
      setFormMachineryId(defaultM.id);
      setFormMeterReading(defaultM.currentReading.toString());
      setFormFuelType(defaultM.fuelType);
      setFormProjectId(defaultM.currentProjectId || defaultM.projectId || "");
      setFormSiteId(defaultM.currentSiteId || defaultM.siteId || "");

      getTheoreticalFuelBalance(defaultM.id, today).then(setBookBalance).catch(console.error);

      getEngines(defaultM.id)
        .then((engs) => {
          setMachineEngines(engs);
          if (engs.length > 0 && defaultM.engineConfig === "multi") {
            const initAlloc: { [k: string]: string } = {};
            engs.forEach((e) => {
              initAlloc[e.id] = "0";
            });
            initAlloc[engs[0].id] = "100";
            setEngineAllocations(initAlloc);
          }
        })
        .catch(console.error);
    } else {
      setBookBalance(null);
    }
    setFormIsMeterReset(false);
    setFormQuantity("100");
    setFormRate("92.50");
    setFormFuelSource("Site Bowser");
    setFormSlipRef("");
    setFormOperator("");
    setFormIssuedBy("Site P&M Supervisor");
    setFormRemarks("");
    setIsModalOpen(true);
  }

  const calculatedAmount = (parseFloat(formQuantity) || 0) * (parseFloat(formRate) || 0);
  const selectedFormMachine = machinery.find((m) => m.id === formMachineryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMachineryId) {
      showToast("Validation Error", "Please select a machinery asset.", "error");
      return;
    }
    const qty = parseFloat(formQuantity) || 0;
    const rate = parseFloat(formRate) || 0;
    const reading = parseFloat(formMeterReading) || 0;

    if (qty <= 0) {
      showToast("Validation Error", "Fuel quantity must be greater than zero.", "error");
      return;
    }
    if (rate < 0) {
      showToast("Validation Error", "Fuel rate cannot be negative.", "error");
      return;
    }

    let allocationsPayload: any[] | undefined = undefined;
    if (allocationMode === "engine_wise" && machineEngines.length > 0) {
      const totalAllocated = Object.values(engineAllocations).reduce(
        (sum, v) => sum + (parseFloat(v) || 0),
        0
      );
      if (totalAllocated > qty + 0.01) {
        showToast(
          "Allocation Exceeds Quantity",
          `Sum of engine allocations (${totalAllocated.toFixed(2)} L) cannot exceed total issue quantity (${qty.toFixed(2)} L).`,
          "error"
        );
        return;
      }
      allocationsPayload = Object.entries(engineAllocations).map(([engineId, lts]) => ({
        engineId,
        allocatedLitres: parseFloat(lts) || 0,
      }));
    }

    setSubmitting(true);
    try {
      await createFuelIssue({
        issueNo: formIssueNo,
        issueDate: formDate,
        issueTime: formTime || null,
        machineryId: formMachineryId,
        projectId: formProjectId || null,
        siteId: formSiteId || null,
        allocationMode: machineEngines.length > 0 ? allocationMode : "shared",
        allocations: allocationsPayload,
        meterReading: reading,
        isMeterReset: formIsMeterReset,
        fuelType: formFuelType,
        quantityLitres: qty,
        ratePerLitre: rate,
        fuelSource: formFuelSource,
        slipReference: formSlipRef.trim() || null,
        operatorName: formOperator.trim() || null,
        issuedBy: formIssuedBy.trim() || null,
        remarks: formRemarks.trim() || null,
        status: "confirmed",
      });

      showToast("Success", `Direct fuel issue '${formIssueNo}' recorded successfully.`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to record fuel issue.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const totalLitres = issues.reduce((s, i) => s + i.quantityLitres, 0);
  const totalAmount = issues.reduce((s, i) => s + i.amount, 0);

  const filteredIssues = issues.filter((i) => {
    const matchesSource = selectedSource === "all" || i.fuelSource === selectedSource;
    return matchesSource;
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Direct Machine Fuel Issue"
        subtitle="Direct fuel issuance to construction equipment & haulage trucks. (Zero stock/inward holding)."
        action={
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="local_gas_station" className="text-[18px]" /> Direct Issue Fuel
          </button>
        }
      />

      {/* Fuel Consumption Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Total Fuel Issued</p>
            <p className="text-2xl text-gray-900 font-bold font-mono mt-1">
              {fmt(totalLitres)} <span className="text-xs font-normal text-gray-500">Litres</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Icon name="local_gas_station" className="text-xl" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Total Fuel Spend</p>
            <p className="text-2xl text-emerald-600 font-bold mt-1 font-mono">
              {money(totalAmount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Icon name="payments" className="text-xl" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Discharge Transactions</p>
            <p className="text-2xl text-gray-900 font-bold font-mono mt-1">
              {issues.length} <span className="text-xs font-normal text-gray-500">Slips</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Icon name="receipt_long" className="text-xl" />
          </div>
        </div>
      </div>

      {/* Strict Meter Efficiency KPI Cards: KM vs HOUR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KM Machinery Card */}
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="speed" className="text-blue-600 text-base" /> KM Machinery Fleet
            </span>
            <span className="text-[11px] font-mono text-gray-500">Tippers &amp; Tankers</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500 text-[11px]">Total Run:</span>
              <p className="font-mono text-gray-900 font-semibold text-xs mt-0.5">{kmStats.km.toLocaleString()} KM</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Total Fuel:</span>
              <p className="font-mono text-gray-900 font-semibold text-xs mt-0.5">{kmStats.litres.toLocaleString()} L</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Average KM / L:</span>
              <p className="font-mono text-blue-600 font-bold text-xs mt-0.5">
                {kmStats.kmPerL > 0 ? `${kmStats.kmPerL} km/L` : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">L / 100 KM:</span>
              <p className="font-mono text-emerald-600 font-bold text-xs mt-0.5">
                {kmStats.lPer100Km > 0 ? `${kmStats.lPer100Km} L` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* HOUR Machinery Card */}
        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="timer" className="text-amber-600 text-base" /> HOUR Machinery Fleet
            </span>
            <span className="text-[11px] font-mono text-gray-500">Excavators &amp; Compactors</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-500 text-[11px]">Total Hours Run:</span>
              <p className="font-mono text-gray-900 font-semibold text-xs mt-0.5">{hrStats.hrs.toLocaleString()} Hrs</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Total Fuel:</span>
              <p className="font-mono text-gray-900 font-semibold text-xs mt-0.5">{hrStats.litres.toLocaleString()} L</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Burn Rate (L / Hr):</span>
              <p className="font-mono text-amber-700 font-bold text-xs mt-0.5">
                {hrStats.lPerHr > 0 ? `${hrStats.lPerHr} L/Hr` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Machinery ({machinery.length})</option>
            {machinery.map((m) => (
              <option key={m.id} value={m.id}>
                {m.assetCode} — {getMachineryDisplayName(m)} ({m.meterType})
              </option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Fuel Sources</option>
            {FUEL_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing {filteredIssues.length} issues
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading fuel records...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon="local_gas_station"
          title="No Fuel Issue Transactions"
          description="No fuel issues found matching your selection. Fuel is issued directly to machinery assets without inventory holding."
          actionLabel="Direct Issue Fuel"
          actionHref="#"
          onAction={handleOpenModal}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Issue No</th>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Machinery Asset</th>
                  <th className="px-5 py-3">Meter Reading</th>
                  <th className="px-5 py-3 text-right">Quantity (L)</th>
                  <th className="px-5 py-3 text-right">Rate / L</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                  <th className="px-5 py-3">Source &amp; Slip</th>
                  <th className="px-5 py-3">Operator / Issuer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIssues.map((i) => {
                  const m = machinery.find((mac) => mac.id === i.machineryId);
                  return (
                    <tr key={i.id} className="table-row">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                        {i.issueNo}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-gray-900 font-medium">{i.issueDate}</p>
                        {i.issueTime && <p className="text-[11px] text-gray-500">{i.issueTime}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-xs">
                          {m ? `${m.assetCode} — ${getMachineryDisplayName(m)}` : i.machineryId}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {m?.make} {m?.model} ({m?.meterType})
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                        {i.meterReading.toLocaleString()} {m?.meterType || "KM"}
                        {i.isMeterReset && (
                          <span className="ml-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">(Reset)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900 text-right">
                        {i.quantityLitres.toLocaleString()} L
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600 text-right">
                        ₹{i.ratePerLitre.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-emerald-600 text-right">
                        {money(i.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-gray-900 font-medium">{i.fuelSource}</p>
                        {i.slipReference && (
                          <p className="text-[11px] font-mono text-gray-500">Ref: {i.slipReference}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-gray-900 font-medium">{i.operatorName || "—"}</p>
                        <p className="text-[11px] text-gray-500">By: {i.issuedBy || "P&M"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Fuel Issue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Direct Machinery Fuel Issue"
        subtitle="Fuel is dispensed directly to equipment. No fuel stock or depot holding."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Number *</label>
              <input
                type="text"
                required
                value={formIssueNo}
                onChange={(e) => setFormIssueNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Time</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Project & Site Assignment with Quick Create */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Charging Project</label>
                <button
                  type="button"
                  onClick={() => {
                    setQcType("project");
                    setIsQcOpen(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <Icon name="add" className="text-xs" /> New Project
                </button>
              </div>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- No Project (Central / Unallocated) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Charging Site</label>
                {formProjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setQcType("site");
                      setIsQcOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Icon name="add" className="text-xs" /> New Site
                  </button>
                )}
              </div>
              <select
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- No Specific Site --</option>
                {sites
                  .filter((s) => !formProjectId || s.projectId === formProjectId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Machine & Meter reading */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Machinery *</label>
                <select
                  required
                  value={formMachineryId}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  className="form-select text-xs font-semibold"
                >
                  <option value="">-- Select Equipment --</option>
                  {machinery.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.assetCode} — {getMachineryDisplayName(m)} ({m.meterType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Meter Reading ({selectedFormMachine?.meterType || "KM/Hrs"}) *
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-amber-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={formIsMeterReset}
                      onChange={(e) => setFormIsMeterReset(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-0"
                    />
                    Meter Replacement/Reset
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formMeterReading}
                  onChange={(e) => setFormMeterReading(e.target.value)}
                  className="form-input text-xs font-mono font-semibold"
                />
              </div>
            </div>

            {/* Theoretical / Book Fuel Balance Card */}
            {bookBalance && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="local_gas_station" className="text-amber-700 text-sm" />
                    Theoretical / Book Fuel Balance
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">
                    As of {bookBalance.asOfDate}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-gray-900">
                    {bookBalance.theoreticalClosingBalanceLitres.toFixed(1)} L
                  </span>
                  <span className="text-[11px] text-gray-600 font-mono">
                    (Issued: {bookBalance.totalFuelIssuedLitres} L — Standard Consumed: {bookBalance.totalConsumptionLitres} L)
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  ℹ️ <em>Disclaimer:</em> {bookBalance.disclaimer}
                </p>
              </div>
            )}

            {/* Multi-Engine Allocation Mode Selector & Breakdown */}
            {machineEngines.length > 0 && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-800">Multi-Engine Equipment Detected</p>
                    <p className="text-[11px] text-gray-500">
                      This machine has {machineEngines.length} attached engines/meters. Choose fuel allocation mode:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllocationMode("shared")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        allocationMode === "shared"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:text-gray-900"
                      }`}
                    >
                      Shared Tank (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationMode("engine_wise")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        allocationMode === "engine_wise"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:text-gray-900"
                      }`}
                    >
                      Engine-Wise Breakdown
                    </button>
                  </div>
                </div>

                {allocationMode === "engine_wise" && (
                  <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm space-y-2">
                    <p className="text-[11px] text-gray-700 font-medium">
                      Allocate quantity across individual engines (Total must equal {formQuantity || 0} L):
                    </p>
                    <div className="space-y-2">
                      {machineEngines.map((eng) => (
                        <div key={eng.id} className="flex items-center justify-between gap-3 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                          <div>
                            <span className="font-semibold text-gray-900">{eng.engineName}</span>
                            <span className="ml-2 font-mono text-[10px] text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                              {eng.meterType} (Cur: {eng.currentReading})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={engineAllocations[eng.id] || "0"}
                              onChange={(e) =>
                                setEngineAllocations((prev) => ({
                                  ...prev,
                                  [eng.id]: e.target.value,
                                }))
                              }
                              className="w-24 form-input text-xs font-mono text-right py-1"
                            />
                            <span className="text-gray-500 font-mono">L</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-gray-500">Total Allocated:</span>
                      <span
                        className={`font-mono font-bold ${
                          Math.abs(
                            Object.values(engineAllocations).reduce(
                              (s, v) => s + (parseFloat(v) || 0),
                              0
                            ) - (parseFloat(formQuantity) || 0)
                          ) < 0.01
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {Object.values(engineAllocations)
                          .reduce((s, v) => s + (parseFloat(v) || 0), 0)
                          .toFixed(2)}{" "}
                        / {parseFloat(formQuantity) || 0} L
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fuel Quantity, Rate, Amount (Auto calculated) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200/80">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Type</label>
              <select
                value={formFuelType}
                onChange={(e) => setFormFuelType(e.target.value)}
                className="form-select text-xs font-medium"
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (Litres) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="form-input text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rate / Litre (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Total Amount (₹)</label>
              <div className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-mono font-bold flex items-center">
                {money(calculatedAmount)}
              </div>
            </div>
          </div>

          {/* Source, Slip Ref, Operator, Issuer */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Source *</label>
              <select
                value={formFuelSource}
                onChange={(e) => setFormFuelSource(e.target.value as FuelSource)}
                className="form-select text-xs"
              >
                {FUEL_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slip / Indent Ref</label>
              <input
                type="text"
                value={formSlipRef}
                onChange={(e) => setFormSlipRef(e.target.value)}
                placeholder="e.g. SLIP-8849"
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Operator</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                placeholder="e.g. Santosh"
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issued By</label>
              <input
                type="text"
                value={formIssuedBy}
                onChange={(e) => setFormIssuedBy(e.target.value)}
                placeholder="e.g. Bowser Operator"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
            <input
              type="text"
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Night shift tank full; Bowser #2"
              className="form-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save Fuel Issue
            </button>
          </div>
        </form>
      </Modal>

      <QuickCreateModal
        isOpen={isQcOpen}
        onClose={() => setIsQcOpen(false)}
        entityType={qcType}
        defaultProjectId={formProjectId}
        onCreated={(created: any) => {
          if (qcType === "project") {
            getProjects().then((prjs) => {
              setProjects(prjs);
              setFormProjectId(created.id);
            });
          } else if (qcType === "site") {
            getSites().then((st) => {
              setSites(st);
              setFormSiteId(created.id);
            });
          }
        }}
      />
    </PageTransition>
  );
}
