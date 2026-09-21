"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { MachineryModal } from "@/components/machinery/MachineryModal";
import { useToast } from "@/components/ui/Toast";
import {
  getMachineryById,
  getFuelIssues,
  getLogBooks,
  getBreakdowns,
  getMaintenanceRecords,
  getAttachments,
  getProjects,
  getSites,
  getEngines,
  createEngine,
  deactivateEngine,
  getVendors,
} from "@/lib/data/repository";
import { Modal } from "@/components/ui/Modal";
import { money, fmt } from "@/lib/utils";
import type {
  Machinery,
  FuelIssue,
  LogBook,
  Breakdown,
  MaintenanceRecord,
  Attachment,
  Project,
  Site,
  Engine,
  Vendor,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

type TabKey =
  | "overview"
  | "engines"
  | "fuel-tanks"
  | "logs"
  | "fuel"
  | "breakdowns"
  | "maintenance"
  | "documents"
  | "cost";

export default function MachineryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();

  const [machine, setMachine] = useState<Machinery | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [fuel, setFuel] = useState<FuelIssue[]>([]);
  const [logs, setLogs] = useState<LogBook[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Add Engine modal state
  const [isAddEngineOpen, setIsAddEngineOpen] = useState(false);
  const [engineName, setEngineName] = useState("");
  const [engineMeterType, setEngineMeterType] = useState<"KM" | "HOUR">("HOUR");
  const [engineMake, setEngineMake] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [engineSerial, setEngineSerial] = useState("");
  const [engineOpening, setEngineOpening] = useState("0");
  const [engineStandardEff, setEngineStandardEff] = useState("");
  const [savingEngine, setSavingEngine] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const m = await getMachineryById(id);
      if (!m) {
        setMachine(null);
        return;
      }
      setMachine(m);

      const [f, l, b, mnt, att, prjs, stes, engs] = await Promise.all([
        getFuelIssues(m.id),
        getLogBooks(m.id),
        getBreakdowns(m.id),
        getMaintenanceRecords(m.id),
        getAttachments("machinery", m.id),
        getProjects(),
        getSites(),
        getEngines(m.id),
      ]);

      setFuel(f);
      setLogs(l);
      setBreakdowns(b);
      setMaintenance(mnt);
      setAttachments(att);
      setEngines(engs);

      if (m.currentProjectId || m.projectId) {
        const foundP = prjs.find((p) => p.id === (m.currentProjectId || m.projectId));
        setProject(foundP || null);
      }
      if (m.currentSiteId || m.siteId) {
        const foundS = stes.find((s) => s.id === (m.currentSiteId || m.siteId));
        setSite(foundS || null);
      }
      if (m.vendorId) {
        const vnds = await getVendors();
        const foundV = vnds.find((v) => v.id === m.vendorId);
        setVendor(foundV || null);
      } else {
        setVendor(null);
      }
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load machinery details.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeactivateEngine(eng: Engine) {
    if (!window.confirm(`Are you sure you want to deactivate engine '${eng.engineName}'?`)) return;
    try {
      await deactivateEngine(eng.id);
      showToast("Engine Deactivated", `Engine '${eng.engineName}' set to inactive.`);
      if (machine) {
        const updated = await getEngines(machine.id);
        setEngines(updated);
      }
    } catch (e: any) {
      showToast("Error", e.message || "Failed to deactivate engine", "error");
    }
  }

  async function handleSaveEngine(e: React.FormEvent) {
    e.preventDefault();
    if (!engineName.trim()) {
      showToast("Validation Error", "Engine name is required.", "error");
      return;
    }
    if (!machine) return;

    setSavingEngine(true);
    try {
      await createEngine({
        machineryId: machine.id,
        engineName: engineName.trim(),
        meterType: engineMeterType,
        make: engineMake.trim() || undefined,
        model: engineModel.trim() || undefined,
        serialNumber: engineSerial.trim() || undefined,
        openingReading: parseFloat(engineOpening) || 0,
        currentReading: parseFloat(engineOpening) || 0,
        standardFuelEfficiency: engineStandardEff ? parseFloat(engineStandardEff) : null,
        status: "active",
      });
      showToast("Success", `Engine '${engineName}' added successfully.`);
      setIsAddEngineOpen(false);
      setEngineName("");
      setEngineMake("");
      setEngineModel("");
      setEngineSerial("");
      setEngineOpening("0");
      setEngineStandardEff("");
      const updatedEngs = await getEngines(machine.id);
      setEngines(updatedEngs);
    } catch (err: any) {
      showToast("Operation Failed", err.message || "Could not save engine.", "error");
    } finally {
      setSavingEngine(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
        <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[13px]">Loading machinery details...</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto mt-10">
        <Icon name="error" className="text-amber-500 text-[36px] mb-2 mx-auto" />
        <h3 className="text-[16px] font-bold text-gray-900 mb-1">Machinery Not Found</h3>
        <p className="text-[12px] text-gray-500 mb-5">
          The requested equipment ID does not exist in the database.
        </p>
        <Link
          href="/machinery"
          className="btn-primary"
        >
          <Icon name="arrow_back" className="text-[16px]" /> Back to Machinery
        </Link>
      </div>
    );
  }

  const totalFuelLitres = fuel.reduce((s, f) => s + Number(f.quantityLitres || 0), 0);
  const totalFuelCost = fuel.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalMaintCost = maintenance.reduce((s, m) => s + Number(m.actualCost || m.estimatedCost || 0), 0);
  const totalOperatingCost = totalFuelCost + totalMaintCost;
  const totalLoggedUnits = logs.reduce((s, l) => s + Number(l.totalKmHours || 0), 0);

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "engines", label: "Engines", count: engines.length },
    { key: "fuel-tanks", label: "Fuel Tanks" },
    { key: "logs", label: "Log Book", count: logs.length },
    { key: "fuel", label: "Fuel", count: fuel.length },
    { key: "breakdowns", label: "Breakdowns", count: breakdowns.length },
    { key: "maintenance", label: "Maintenance", count: maintenance.length },
    { key: "documents", label: "Documents", count: attachments.length },
    { key: "cost", label: "Cost" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Back Navigation & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/machinery"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[12px] font-medium transition-colors"
        >
          <Icon name="arrow_back" className="text-[16px]" /> Back to Machinery
        </Link>

        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="btn-secondary h-8"
        >
          <Icon name="edit" className="text-[14px]" /> Edit Specifications
        </button>
      </div>

      {/* Machinery Header Profile Card */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Icon name="precision_manufacturing" className="text-[26px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">
                {getMachineryDisplayName(machine)}
              </h1>
              <StatusPill
                tone={
                  machine.status === "active"
                    ? "green"
                    : machine.status === "under_repair"
                    ? "red"
                    : machine.status === "archived"
                    ? "amber"
                    : "slate"
                }
              >
                {machine.status.replace("_", " ")}
              </StatusPill>
              {machine.ownership === "rental" ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Rental {vendor ? `(${vendor.name})` : ""}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Company Owned
                </span>
              )}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                {machine.meterConfiguration ? machine.meterConfiguration.toUpperCase().replace("_", " ") : machine.meterType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 flex-wrap font-medium">
              <span className="font-mono font-bold text-blue-600">{machine.assetCode}</span>
              <span>·</span>
              <span className="font-mono text-gray-700 font-medium">
                {machine.registrationNo ? machine.registrationNo : "Unregistered"}
              </span>
              <span>·</span>
              <span>{machine.make} {machine.model}</span>
              <span>·</span>
              <span className="text-gray-600">
                {project ? `${project.code} (${site?.name || "Site"})` : "Central Yard"}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Right KPIs */}
        <div className="flex items-center gap-6 border-l border-gray-100 pl-4 shrink-0">
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Current Reading</p>
            <p className="text-[18px] font-mono font-bold text-gray-900 leading-tight">
              {fmt(machine.currentReading)}{" "}
              <span className="text-[11px] text-blue-600 font-semibold">{machine.meterType}</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-gray-400 font-medium">Operating Spend</p>
            <p className="text-[18px] font-mono font-bold text-emerald-600 leading-tight">
              {money(totalOperatingCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-4 flex items-center gap-1 overflow-x-auto text-[13px] font-medium select-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600 font-semibold bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                  activeTab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-200/70 text-gray-600"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-4 text-[12px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Technical Specifications */}
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-2.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Technical Profile</p>
                <div className="space-y-1.5 text-gray-700">
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Ownership:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {machine.ownership === "rental" ? `Rental (${vendor?.name || "External"})` : "Company Owned"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-semibold text-gray-900">{machine.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Machinery Type:</span>
                    <span className="font-semibold text-gray-900">{machine.machineryType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Meter Config:</span>
                    <span className="font-bold text-blue-600 uppercase">
                      {machine.meterConfiguration?.replace("_", " ") || machine.meterType}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Fuel Tank:</span>
                    <span className="font-mono font-semibold text-gray-900">{machine.fuelTankCapacity || 300} L</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Capacity / Rating:</span>
                    <span className="font-semibold text-gray-900">{machine.capacity || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Std Efficiency:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {machine.standardFuelEfficiency ? `${machine.standardFuelEfficiency} ${machine.meterType === "KM" ? "KM/L" : "L/Hr"}` : "Not Set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Assignment */}
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-2.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assignment &amp; Dept</p>
                <div className="space-y-1.5 text-gray-700">
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Project:</span>
                    <span className="font-semibold text-gray-900">
                      {project ? `${project.code} — ${project.name}` : "Central Yard"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Site:</span>
                    <span className="font-semibold text-gray-900">
                      {site ? site.name : "Central Yard / Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-semibold text-gray-900">{machine.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Opening Reading:</span>
                    <span className="font-mono font-semibold text-gray-900">{fmt(machine.openingReading)} {machine.meterType}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Year of Mfg:</span>
                    <span className="font-semibold text-gray-900">{machine.yearOfManufacture || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Compliance Documents & Expiry Dates */}
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-2.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statutory Compliance</p>
                <div className="space-y-1.5 text-gray-700">
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Insurance:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{machine.insuranceExpiry || "Not Set"}</span>
                      {machine.insuranceDocNo && <div className="text-[10px] text-gray-400 font-mono">Doc: {machine.insuranceDocNo}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Fitness:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{machine.fitnessExpiry || "Not Set"}</span>
                      {machine.fitnessDocNo && <div className="text-[10px] text-gray-400 font-mono">Doc: {machine.fitnessDocNo}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">PUC:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{machine.pucExpiry || "Not Set"}</span>
                      {machine.pucDocNo && <div className="text-[10px] text-gray-400 font-mono">Doc: {machine.pucDocNo}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/50">
                    <span className="text-gray-500">Road Tax:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{machine.roadTaxExpiry || "Not Set"}</span>
                      {machine.roadTaxDocNo && <div className="text-[10px] text-gray-400 font-mono">Doc: {machine.roadTaxDocNo}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Permit:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{machine.permitExpiry || "Not Set"}</span>
                      {machine.permitDocNo && <div className="text-[10px] text-gray-400 font-mono">Doc: {machine.permitDocNo}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {machine.remarks && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-700">
                <span className="font-bold text-gray-500 mr-2">Remarks:</span>
                {machine.remarks}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Engines */}
        {activeTab === "engines" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-gray-900">Engines &amp; Auxiliary Meters ({engines.length})</h4>
                <p className="text-[11px] text-gray-500">Sub-engines for multi-engine equipment</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEngineName(engines.length === 0 ? "Main Propulsion Engine" : `Auxiliary Engine ${engines.length + 1}`);
                  setEngineMeterType(machine.meterType);
                  setEngineMake(machine.make || "");
                  setEngineModel(machine.model || "");
                  setEngineSerial("");
                  setEngineOpening(machine.openingReading.toString());
                  setIsAddEngineOpen(true);
                }}
                className="btn-primary h-8 text-[12px]"
              >
                <Icon name="add" className="text-[14px]" /> Add Engine
              </button>
            </div>

            {engines.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">
                No auxiliary engines registered. Equipment is operating in single engine configuration.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="table-head">
                      <th className="py-2.5 px-3.5">Engine Designation</th>
                      <th className="py-2.5 px-3.5">Meter Type</th>
                      <th className="py-2.5 px-3.5">Make / Model</th>
                      <th className="py-2.5 px-3.5">Serial No</th>
                      <th className="py-2.5 px-3.5">Opening</th>
                      <th className="py-2.5 px-3.5">Current</th>
                      <th className="py-2.5 px-3.5">Standard Eff</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {engines.map((eng) => (
                      <tr key={eng.id} className="table-row">
                        <td className="py-2.5 px-3.5 font-semibold text-gray-900">{eng.engineName}</td>
                        <td className="py-2.5 px-3.5 font-mono text-blue-600 font-semibold">{eng.meterType}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{eng.make || eng.model ? `${eng.make || ""} ${eng.model || ""}` : "—"}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-500">{eng.serialNumber || "—"}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-600">{fmt(eng.openingReading)}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-gray-900">{fmt(eng.currentReading)}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-700 text-xs font-semibold">
                          {eng.standardFuelEfficiency != null && Number(eng.standardFuelEfficiency) > 0 ? (
                            <span>{Number(eng.standardFuelEfficiency).toFixed(2)} {eng.meterType === "KM" ? "KM/L" : "L/Hr"}</span>
                          ) : (
                            <span className="text-gray-400">Not Set</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <StatusPill tone={eng.status === "active" ? "green" : "amber"}>{eng.status}</StatusPill>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          {eng.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleDeactivateEngine(eng)}
                              title="Deactivate Engine"
                              className="text-[11px] text-red-600 hover:text-red-800 font-medium px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Fuel Tanks */}
        {activeTab === "fuel-tanks" && (
          <div className="p-4 space-y-3">
            <h4 className="text-[13px] font-bold text-gray-900">Fuel Tank Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Primary Fuel Tank</span>
                <p className="text-[20px] font-mono font-bold text-gray-900 mt-1">
                  {machine.fuelTankCapacity || 300} L
                </p>
                <span className="text-[11px] text-gray-400">Standard OEM diesel tank</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Fuel Source Policy</span>
                <p className="text-[14px] font-semibold text-gray-900 mt-1">Direct Dispense</p>
                <span className="text-[11px] text-gray-400">Site Bowser / Retail Pump</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Allocation Mode</span>
                <p className="text-[14px] font-semibold text-gray-900 mt-1">
                  {machine.engineConfig === "multi" ? "Engine-Wise Tracking" : "Single Equipment Tank"}
                </p>
                <span className="text-[11px] text-gray-400">Automatic slip cross-reference</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Daily Log Book */}
        {activeTab === "logs" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-gray-900">Daily Running Logs ({logs.length})</h4>
              <Link
                href={`/machinery/log-book?machineryId=${machine.id}`}
                className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Full Log Book <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No daily logs recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="table-head">
                      <th className="py-2.5 px-3.5">Log No</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Opening</th>
                      <th className="py-2.5 px-3.5">Closing</th>
                      <th className="py-2.5 px-3.5">Run ({machine.meterType})</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((l) => (
                      <tr key={l.id} className="table-row">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{l.logNo}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{l.date}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-600">{fmt(l.openingReading)}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-900 font-semibold">{fmt(l.closingReading)}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700">{fmt(l.totalKmHours)}</td>
                        <td className="py-2.5 px-3.5">
                          <StatusPill tone="green">{l.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Fuel Issues */}
        {activeTab === "fuel" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-gray-900">Direct Fuel Issues ({fuel.length})</h4>
              <Link
                href={`/machinery/fuel?machineryId=${machine.id}`}
                className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Issue Fuel <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </div>

            {fuel.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No fuel issues recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="table-head">
                      <th className="py-2.5 px-3.5">Issue No</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Meter Reading</th>
                      <th className="py-2.5 px-3.5">Quantity</th>
                      <th className="py-2.5 px-3.5">Rate/L</th>
                      <th className="py-2.5 px-3.5">Amount</th>
                      <th className="py-2.5 px-3.5">Source</th>
                      <th className="py-2.5 px-3.5">Slip Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fuel.map((f) => (
                      <tr key={f.id} className="table-row">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{f.issueNo}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{f.issueDate}</td>
                        <td className="py-2.5 px-3.5 font-mono">{fmt(f.meterReading)} {machine.meterType}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-gray-900">{f.quantityLitres} L</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-500">₹{f.ratePerLitre}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600">{money(f.amount)}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{f.fuelSource}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-400">{f.slipReference || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Breakdowns */}
        {activeTab === "breakdowns" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-gray-900">Breakdown Records ({breakdowns.length})</h4>
              <Link
                href={`/machinery/breakdowns?machineryId=${machine.id}`}
                className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Report Breakdown <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </div>

            {breakdowns.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No breakdowns reported. Equipment is running fine.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="table-head">
                      <th className="py-2.5 px-3.5">Ticket</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Issue Description</th>
                      <th className="py-2.5 px-3.5">Priority</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {breakdowns.map((b) => (
                      <tr key={b.id} className="table-row">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{b.breakdownNo}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{b.breakdownDate}</td>
                        <td className="py-2.5 px-3.5 text-gray-800 font-medium">{b.problemDescription}</td>
                        <td className="py-2.5 px-3.5">
                          <StatusPill tone={b.priority === "critical" ? "red" : "amber"}>{b.priority}</StatusPill>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <StatusPill tone={b.status === "completed" ? "green" : "blue"}>{b.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Maintenance */}
        {activeTab === "maintenance" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-gray-900">Service &amp; Maintenance ({maintenance.length})</h4>
              <Link
                href={`/machinery/maintenance?machineryId=${machine.id}`}
                className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Schedule Service <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </div>

            {maintenance.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No maintenance history recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="table-head">
                      <th className="py-2.5 px-3.5">Service No</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Service Type</th>
                      <th className="py-2.5 px-3.5">Description</th>
                      <th className="py-2.5 px-3.5">Cost</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenance.map((m) => (
                      <tr key={m.id} className="table-row">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{m.maintenanceNo}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{m.serviceDate || m.date || "—"}</td>
                        <td className="py-2.5 px-3.5 font-medium text-gray-900">{m.maintenanceType}</td>
                        <td className="py-2.5 px-3.5 text-gray-600 max-w-xs truncate">{m.workPerformed || m.complaint || "—"}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-gray-900">
                          {money(m.actualCost || m.estimatedCost || 0)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <StatusPill tone={m.status === "completed" ? "green" : "blue"}>{m.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Documents */}
        {activeTab === "documents" && (
          <div className="p-4 space-y-3">
            <h4 className="text-[13px] font-bold text-gray-900">Compliance &amp; Equipment Documents ({attachments.length})</h4>
            {attachments.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No attached documents uploaded yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {attachments.map((att: Attachment) => (
                  <div key={att.id} className="py-2.5 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <Icon name="description" className="text-gray-400 text-[18px]" />
                      <span className="font-medium text-gray-900">{att.fileName}</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">{att.documentType || "Document"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Cost Analysis */}
        {activeTab === "cost" && (
          <div className="p-4 space-y-4">
            <h4 className="text-[13px] font-bold text-gray-900">Life-to-Date Operating Cost</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Direct Fuel Expenditure</span>
                <p className="text-[20px] font-mono font-bold text-blue-700 mt-1">{money(totalFuelCost)}</p>
                <span className="text-[11px] text-gray-400">{fmt(totalFuelLitres)} Litres dispensed</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Maintenance &amp; Repairs</span>
                <p className="text-[20px] font-mono font-bold text-amber-700 mt-1">{money(totalMaintCost)}</p>
                <span className="text-[11px] text-gray-400">{maintenance.length} work orders logged</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">Total Cost of Ownership</span>
                <p className="text-[20px] font-mono font-bold text-emerald-700 mt-1">{money(totalOperatingCost)}</p>
                <span className="text-[11px] text-gray-400">
                  {totalLoggedUnits > 0
                    ? `₹${(totalOperatingCost / totalLoggedUnits).toFixed(2)} per ${machine.meterType}`
                    : "Awaiting run data"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Machinery Modal */}
      <MachineryModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
        machineryToEdit={machine}
      />

      {/* Add Engine Modal */}
      <Modal
        isOpen={isAddEngineOpen}
        onClose={() => setIsAddEngineOpen(false)}
        title="Add Engine / Sub-Meter"
        subtitle="Register auxiliary engine, mixer drum, or independent hour meter"
      >
        <form onSubmit={handleSaveEngine} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Engine Designation *</label>
            <input
              type="text"
              required
              value={engineName}
              onChange={(e) => setEngineName(e.target.value)}
              placeholder="e.g. Transit Mixer Drum Auxiliary Engine"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Meter Type</label>
              <select
                value={engineMeterType}
                onChange={(e) => setEngineMeterType(e.target.value as "KM" | "HOUR")}
                className="form-select"
              >
                <option value="HOUR">Hour Meter (L/Hour)</option>
                <option value="KM">KM Odometer (KM/L)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Opening Reading</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={engineOpening}
                onChange={(e) => setEngineOpening(e.target.value)}
                className="form-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Make / Brand</label>
              <input
                type="text"
                value={engineMake}
                onChange={(e) => setEngineMake(e.target.value)}
                placeholder="e.g. Kirloskar"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Model / Serial</label>
              <input
                type="text"
                value={engineModel}
                onChange={(e) => setEngineModel(e.target.value)}
                placeholder="e.g. HA394"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Standard Fuel Efficiency ({engineMeterType === "KM" ? "KM/L" : "L/Hour"})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={engineStandardEff}
              onChange={(e) => setEngineStandardEff(e.target.value)}
              placeholder={engineMeterType === "KM" ? "e.g. 3.0" : "e.g. 4.0"}
              className="form-input font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-0.5">
              Engine-specific benchmark for theoretical fuel consumption calculation
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddEngineOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEngine}
              className="btn-primary"
            >
              {savingEngine ? "Saving..." : "Add Engine"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
