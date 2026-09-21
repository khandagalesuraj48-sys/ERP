"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  getLogBooks,
  createLogBook,
  updateLogBook,
  deleteLogBook,
  checkExistingLogBook,
  getMachinery,
  getProjects,
  getSites,
  getEngines,
  generateLogNumber,
  getLatestLogBookReading,
  getDailyFuelIssued,
  calculateMachineryEfficiency,
} from "@/lib/data/repository";
import type {
  LogBook,
  Machinery,
  Project,
  Site,
  Engine,
  MeterType,
  MachineryEfficiencyRecord,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

export default function LogBookPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"logs" | "averages">("logs");

  const [logs, setLogs] = useState<LogBook[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Daily Logs
  const [selectedMachineId, setSelectedMachineId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Filters for Average & Efficiency Report
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

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateLog, setDuplicateLog] = useState<LogBook | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReading, setLoadingReading] = useState(false);

  const [formLogNo, setFormLogNo] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formMachineryId, setFormMachineryId] = useState("");
  const [formEngineId, setFormEngineId] = useState<string>("");
  const [formAvailableEngines, setFormAvailableEngines] = useState<Engine[]>([]);
  const [formProjectId, setFormProjectId] = useState("");
  const [formSiteId, setFormSiteId] = useState("");

  // Auto Opening & Meter Reset state
  const [formPreviousClosing, setFormPreviousClosing] = useState<number>(0);
  const [formOpening, setFormOpening] = useState<string>("0");
  const [formClosing, setFormClosing] = useState<string>("0");
  const [formIsMeterReset, setFormIsMeterReset] = useState(false);
  const [hasPreviousEntry, setHasPreviousEntry] = useState(false);
  const [lastEntryLogDate, setLastEntryLogDate] = useState<string | null>(null);

  // Multi-Engine reading states
  const [engine1Opening, setEngine1Opening] = useState<string>("0");
  const [engine1Closing, setEngine1Closing] = useState<string>("0");
  const [engine1PreviousClosing, setEngine1PreviousClosing] = useState<number>(0);

  const [engine2Opening, setEngine2Opening] = useState<string>("0");
  const [engine2Closing, setEngine2Closing] = useState<string>("0");
  const [engine2PreviousClosing, setEngine2PreviousClosing] = useState<number>(0);

  // Daily Fuel Issue cross-reference (VIEW ONLY)
  const [dieselIssuedLitres, setDieselIssuedLitres] = useState<number>(0);
  const [fuelIssueCount, setFuelIssueCount] = useState<number>(0);
  const [dailyFuelIssues, setDailyFuelIssues] = useState<any[]>([]);

  // Operational fields
  const [formStartTime, setFormStartTime] = useState("08:00");
  const [formEndTime, setFormEndTime] = useState("18:00");
  const [formWorkingHours, setFormWorkingHours] = useState<string>("9");
  const [formBreakdownHours, setFormBreakdownHours] = useState<string>("0");
  const [formOperator, setFormOperator] = useState("");
  const [formTrips, setFormTrips] = useState<string>("0");
  const [formDescription, setFormDescription] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, m, p, s] = await Promise.all([
        getLogBooks(selectedMachineId !== "all" ? selectedMachineId : undefined),
        getMachinery(),
        getProjects(),
        getSites(),
      ]);
      setLogs(l);
      setMachinery(m);
      setProjects(p);
      setSites(s);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load log books.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId, showToast]);

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

  // When opening modal or machinery/date/engine changes, fetch auto reading and diesel issued
  const fetchReadingAndDiesel = useCallback(
    async (machineId: string, date: string, engineId?: string | null, skipDuplicateCheck = false) => {
      if (!machineId || !date) return;
      setLoadingReading(true);
      try {
        const [readingData, fuelData, existingLog, engs] = await Promise.all([
          getLatestLogBookReading(machineId, date, engineId),
          getDailyFuelIssued(machineId, date, engineId),
          skipDuplicateCheck ? null : checkExistingLogBook(machineId, date, engineId || null),
          getEngines(machineId),
        ]);

        setFormPreviousClosing(readingData.previousClosingReading);
        setFormOpening(readingData.suggestedOpeningReading.toString());
        setHasPreviousEntry(readingData.hasPreviousEntry);
        setLastEntryLogDate(readingData.lastLogDate);
        setFormClosing(readingData.suggestedOpeningReading.toString());

        // Multi-engine readings if configured
        if (engs.length > 0) {
          setFormAvailableEngines(engs);
          const [e1Data, e2Data] = await Promise.all([
            getLatestLogBookReading(machineId, date, engs[0].id),
            engs.length > 1 ? getLatestLogBookReading(machineId, date, engs[1].id) : null,
          ]);

          setEngine1PreviousClosing(e1Data.previousClosingReading);
          setEngine1Opening(e1Data.suggestedOpeningReading.toString());
          setEngine1Closing(e1Data.suggestedOpeningReading.toString());

          if (e2Data) {
            setEngine2PreviousClosing(e2Data.previousClosingReading);
            setEngine2Opening(e2Data.suggestedOpeningReading.toString());
            setEngine2Closing(e2Data.suggestedOpeningReading.toString());
          }
        }

        // Fuel data
        setDieselIssuedLitres(fuelData.totalLitres);
        setFuelIssueCount(fuelData.issueCount);
        setDailyFuelIssues(fuelData.issues || []);

        // Duplicate check runs ONLY when both machinery and date are chosen
        if (existingLog && !skipDuplicateCheck) {
          setDuplicateLog(existingLog);
          setDuplicateWarningOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch reading or fuel:", err);
      } finally {
        setLoadingReading(false);
      }
    },
    []
  );

  function handleEditSpecificLog(log: LogBook) {
    setEditingLogId(log.id);
    setFormLogNo(log.logNo);
    setFormDate(log.date);
    setFormMachineryId(log.machineryId);
    setFormEngineId(log.engineId || "");
    setFormOpening(log.openingReading.toString());
    setFormClosing(log.closingReading.toString());
    setFormIsMeterReset(log.isMeterReset || false);
    setFormStartTime(log.startTime || "08:00");
    setFormEndTime(log.endTime || "18:00");
    setFormWorkingHours(log.workingHours?.toString() || "9");
    setFormBreakdownHours(log.breakdownHours?.toString() || "0");
    setFormOperator(log.operatorName || "");
    setFormTrips(log.trips?.toString() || "0");
    setFormDescription(log.workDescription || "");
    setFormRemarks(log.remarks || "");
    setDuplicateWarningOpen(false);
    setIsModalOpen(true);
    fetchReadingAndDiesel(log.machineryId, log.date, log.engineId || null, true);
  }

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

  async function handleMachineChange(machineId: string) {
    setFormMachineryId(machineId);
    setFormEngineId("");

    const machine = machinery.find((m) => m.id === machineId);
    if (machine) {
      if (machine.currentProjectId || machine.projectId) {
        setFormProjectId(machine.currentProjectId || machine.projectId || "");
      }
      if (machine.currentSiteId || machine.siteId) {
        setFormSiteId(machine.currentSiteId || machine.siteId || "");
      }

      // Check engines if multi-engine
      const engs = await getEngines(machineId);
      setFormAvailableEngines(engs);

      // Duplicate check & reading fetch only if date is already chosen
      if (formDate) {
        if (!formLogNo) {
          const nextNo = await generateLogNumber(formDate, machineId);
          setFormLogNo(nextNo);
        }
        await fetchReadingAndDiesel(machineId, formDate, null, Boolean(editingLogId));
      }
    } else {
      setFormAvailableEngines([]);
    }
  }

  async function handleEngineChange(engId: string) {
    setFormEngineId(engId);
    if (formMachineryId && formDate) {
      await fetchReadingAndDiesel(formMachineryId, formDate, engId || null, Boolean(editingLogId));
    }
  }

  async function handleDateChange(date: string) {
    setFormDate(date);
    if (formMachineryId && date) {
      const nextNo = await generateLogNumber(date, formMachineryId);
      setFormLogNo(nextNo);
      await fetchReadingAndDiesel(formMachineryId, date, formEngineId || null, Boolean(editingLogId));
    }
  }

  async function handleOpenModal() {
    setEditingLogId(null);
    setDuplicateWarningOpen(false);
    setDuplicateLog(null);
    setFormLogNo("");
    setFormDate(""); // DATE MUST ALWAYS START BLANK!
    setFormMachineryId("");
    setFormEngineId("");
    setFormAvailableEngines([]);
    setFormProjectId("");
    setFormSiteId("");
    setFormIsMeterReset(false);
    setFormOpening("0");
    setFormClosing("0");
    setFormPreviousClosing(0);
    setHasPreviousEntry(false);
    setLastEntryLogDate(null);
    setDieselIssuedLitres(0);
    setFuelIssueCount(0);
    setDailyFuelIssues([]);
    setEngine1Opening("0");
    setEngine1Closing("0");
    setEngine1PreviousClosing(0);
    setEngine2Opening("0");
    setEngine2Closing("0");
    setEngine2PreviousClosing(0);
    setFormStartTime("08:00");
    setFormEndTime("18:00");
    setFormWorkingHours("9");
    setFormBreakdownHours("0");
    setFormOperator("");
    setFormTrips("0");
    setFormDescription("");
    setFormRemarks("");
    setIsModalOpen(true);
  }

  // Calculated diff
  const autoCalculatedTotal = Math.max(0, (parseFloat(formClosing) || 0) - (parseFloat(formOpening) || 0));
  const selectedFormMachine = machinery.find((m) => m.id === formMachineryId);
  const selectedFormEngine = formAvailableEngines.find((e) => e.id === formEngineId);
  const activeMeterType: MeterType = (selectedFormEngine?.meterType || selectedFormMachine?.meterType || "HOUR") as MeterType;

  const isMultiEngineMachine =
    (selectedFormMachine?.meterConfiguration === "multi_engine" ||
      selectedFormMachine?.engineConfig === "multi" ||
      formAvailableEngines.length >= 2) &&
    !editingLogId;

  // Real-time efficiency preview for today
  let todayEfficiencyText = "";
  let todayStatusText = "";
  const standardEff = selectedFormEngine?.standardFuelEfficiency != null && Number(selectedFormEngine.standardFuelEfficiency) > 0
    ? Number(selectedFormEngine.standardFuelEfficiency)
    : selectedFormMachine?.standardFuelEfficiency != null && Number(selectedFormMachine.standardFuelEfficiency) > 0
    ? Number(selectedFormMachine.standardFuelEfficiency)
    : null;

  if (dieselIssuedLitres > 0 && autoCalculatedTotal > 0) {
    if (activeMeterType === "KM") {
      const kml = autoCalculatedTotal / dieselIssuedLitres;
      const l100 = (dieselIssuedLitres / autoCalculatedTotal) * 100;
      todayEfficiencyText = `${kml.toFixed(2)} KM/L (${l100.toFixed(1)} L/100 KM)`;
      if (standardEff != null) {
        todayStatusText = kml >= standardEff ? "Within Standard" : "Higher Consumption";
      } else {
        todayStatusText = "No Standard Configured";
      }
    } else {
      const lph = dieselIssuedLitres / autoCalculatedTotal;
      todayEfficiencyText = `${lph.toFixed(2)} L/Hour`;
      if (standardEff != null) {
        todayStatusText = lph <= standardEff ? "Within Standard" : "Higher Consumption";
      } else {
        todayStatusText = "No Standard Configured";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMachineryId) {
      showToast("Validation Error", "Please select a machinery asset.", "error");
      return;
    }
    if (!formDate) {
      showToast("Validation Error", "Please select a date for the log book entry.", "error");
      return;
    }

    // MULTI-ENGINE SUBMISSION: Save independent records for Engine 1 & Engine 2
    if (isMultiEngineMachine && formAvailableEngines.length >= 2) {
      const e1Open = parseFloat(engine1Opening);
      const e1Close = parseFloat(engine1Closing);
      const e2Open = parseFloat(engine2Opening);
      const e2Close = parseFloat(engine2Closing);

      if (isNaN(e1Open) || isNaN(e1Close) || isNaN(e2Open) || isNaN(e2Close)) {
        showToast("Validation Error", "Both engines must have valid meter readings.", "error");
        return;
      }
      if (e1Open < 0 || e1Close < 0 || e2Open < 0 || e2Close < 0) {
        showToast("Validation Error", "Engine readings cannot be negative.", "error");
        return;
      }
      if (!formIsMeterReset) {
        if (e1Close < e1Open) {
          showToast(
            "Engine 1 Reading Error",
            `Engine 1 closing reading (${e1Close}) cannot be less than opening reading (${e1Open}).`,
            "error"
          );
          return;
        }
        if (e2Close < e2Open) {
          showToast(
            "Engine 2 Reading Error",
            `Engine 2 closing reading (${e2Close}) cannot be less than opening reading (${e2Open}).`,
            "error"
          );
          return;
        }
      }

      setSubmitting(true);
      try {
        const baseLogNo = formLogNo || (await generateLogNumber(formDate, formMachineryId));
        const sharedPayload = {
          date: formDate,
          machineryId: formMachineryId,
          isMeterReset: formIsMeterReset,
          projectId: formProjectId || null,
          siteId: formSiteId || null,
          startTime: formStartTime || null,
          endTime: formEndTime || null,
          workingHours: formWorkingHours ? parseFloat(formWorkingHours) : null,
          breakdownHours: formBreakdownHours ? parseFloat(formBreakdownHours) : 0,
          operatorName: formOperator.trim() || null,
          trips: formTrips ? parseInt(formTrips, 10) : 0,
          workDescription: formDescription.trim() || null,
          remarks: formRemarks.trim() || null,
          status: "approved" as const,
        };

        // Engine 1 Record
        await createLogBook({
          ...sharedPayload,
          logNo: `${baseLogNo}-E1`,
          engineId: formAvailableEngines[0].id,
          openingReading: e1Open,
          closingReading: e1Close,
        });

        // Engine 2 Record
        await createLogBook({
          ...sharedPayload,
          logNo: `${baseLogNo}-E2`,
          engineId: formAvailableEngines[1].id,
          openingReading: e2Open,
          closingReading: e2Close,
        });

        showToast("Success", `Multi-engine logs created for ${formAvailableEngines[0].engineName} and ${formAvailableEngines[1].engineName}.`);
        setIsModalOpen(false);
        setEditingLogId(null);
        loadData();
        if (activeTab === "averages") {
          loadEfficiency();
        }
      } catch (err: any) {
        showToast("Error", err.message || "Failed to record multi-engine log.", "error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // STANDARD / SINGLE-ENGINE SUBMISSION
    const openNum = parseFloat(formOpening);
    const closeNum = parseFloat(formClosing);

    if (isNaN(openNum) || isNaN(closeNum)) {
      showToast("Validation Error", "Opening and closing readings must be valid numbers.", "error");
      return;
    }

    if (openNum < 0 || closeNum < 0) {
      showToast("Validation Error", "Readings cannot be negative.", "error");
      return;
    }

    if (!formIsMeterReset && closeNum < openNum) {
      showToast(
        "Invalid Closing Reading",
        `Closing reading (${closeNum}) cannot be less than opening reading (${openNum}). If meter was replaced/reset, enable 'Meter Reset / Replacement'.`,
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        logNo: formLogNo || (await generateLogNumber(formDate, formMachineryId)),
        date: formDate,
        machineryId: formMachineryId,
        engineId: formEngineId || null,
        isMeterReset: formIsMeterReset,
        projectId: formProjectId || null,
        siteId: formSiteId || null,
        openingReading: openNum,
        closingReading: closeNum,
        startTime: formStartTime || null,
        endTime: formEndTime || null,
        workingHours: formWorkingHours ? parseFloat(formWorkingHours) : null,
        breakdownHours: formBreakdownHours ? parseFloat(formBreakdownHours) : 0,
        operatorName: formOperator.trim() || null,
        trips: formTrips ? parseInt(formTrips, 10) : 0,
        workDescription: formDescription.trim() || null,
        remarks: formRemarks.trim() || null,
        status: "approved" as const,
      };

      if (editingLogId) {
        await updateLogBook(editingLogId, payload);
        showToast("Success", `Log Book entry '${formLogNo}' updated successfully.`);
      } else {
        await createLogBook(payload);
        showToast("Success", `Log Book entry '${payload.logNo}' recorded successfully.`);
      }

      setIsModalOpen(false);
      setEditingLogId(null);
      loadData();
      if (activeTab === "averages") {
        loadEfficiency();
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to record log book.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLogs = logs.filter((l) => {
    const matchesDate = !selectedDate || l.date === selectedDate;
    return matchesDate;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Equipment Log Book & Fuel Efficiency"
        subtitle="Automatic opening reading continuity, view-only diesel cross-reference, dual-meter engine averages, and standard variance intelligence."
        action={
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" /> Record Daily Log
          </button>
        }
      />

      {/* Segmented Tabs Navigation */}
      <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="menu_book" className="text-base" />
          Daily Running Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab("averages")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "averages"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="speed" className="text-base text-amber-600" />
          Machinery Average &amp; Fuel Efficiency Engine
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          {/* Filter Strip */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Machine Filter */}
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

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input text-xs font-mono w-auto"
              />

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Date
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredLogs.length} entries
            </div>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading daily log books...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title="No Log Book Entries Found"
              description={
                selectedDate || selectedMachineId !== "all"
                  ? "No daily log records matched your filter criteria."
                  : "No daily running logs have been submitted. Record opening and closing meter readings to track operational utilization and fuel efficiency."
              }
              actionLabel="Record Daily Log"
              actionHref="#"
              onAction={handleOpenModal}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-5 py-3">Log No</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Machinery Asset</th>
                      <th className="px-5 py-3 text-right">Previous Closing</th>
                      <th className="px-5 py-3 text-right">Opening Reading</th>
                      <th className="px-5 py-3 text-right">Closing Reading</th>
                      <th className="px-5 py-3 text-right">Total Run</th>
                      <th className="px-5 py-3">Operator &amp; Shift</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((l) => {
                      const m = machinery.find((mac) => mac.id === l.machineryId);
                      const meterLabel = m ? m.meterType : "Units";
                      return (
                        <tr key={l.id} className="table-row">
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                            {l.logNo}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                            {l.date}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-900 text-xs">
                              {m ? `${m.assetCode} — ${getMachineryDisplayName(m)}` : l.machineryId}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {m?.make} {m?.model} &bull;{" "}
                              <span className="font-mono text-gray-700 font-semibold">
                                {meterLabel}
                              </span>
                            </p>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500 text-right">
                            {l.openingReading.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {l.openingReading.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              {l.isMeterReset ? (
                                <span className="text-[9px] text-amber-700 font-normal">(RESET)</span>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-normal">(AUTO)</span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-900 text-right font-semibold">
                            {l.closingReading.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="bg-gray-100 px-2.5 py-1 rounded text-xs border border-gray-200 font-mono font-semibold text-gray-900">
                              {l.totalKmHours.toLocaleString(undefined, { minimumFractionDigits: 2 })} {meterLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <p className="font-medium text-gray-900">{l.operatorName || "Unassigned"}</p>
                            <p className="text-[11px] text-gray-500">
                              {l.workingHours ? `${l.workingHours} hrs` : "—"} {l.trips ? `&bull; ${l.trips} trips` : ""}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusPill tone={l.status === "approved" ? "green" : l.status === "cancelled" ? "red" : "amber"}>
                              {l.status}
                            </StatusPill>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditSpecificLog(l)}
                                title="Edit Log Entry"
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Icon name="edit" className="text-[15px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSpecificLog(l)}
                                title="Delete Log Entry"
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Icon name="delete" className="text-[15px]" />
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
        /* TAB 2: MACHINERY AVERAGE & FUEL EFFICIENCY SECTION */
        <div className="space-y-6">
          {/* Average Filter Strip */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                <Icon name="tune" className="text-amber-600 text-base" />
                Select Period &amp; Equipment for Average Calculation
              </h3>
              <span className="text-xs text-gray-500 font-normal">
                Calculates from real database Log Books &amp; Fuel Issues
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">From Date *</label>
                <input
                  type="date"
                  value={avgFromDate}
                  onChange={(e) => setAvgFromDate(e.target.value)}
                  className="form-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">To Date *</label>
                <input
                  type="date"
                  value={avgToDate}
                  onChange={(e) => setAvgToDate(e.target.value)}
                  className="form-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Machinery</label>
                <select
                  value={avgMachineId}
                  onChange={(e) => {
                    setAvgMachineId(e.target.value);
                    setAvgEngineId("all");
                  }}
                  className="form-select text-xs font-medium"
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
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Project (Optional)</label>
                <select
                  value={avgProjectId}
                  onChange={(e) => setAvgProjectId(e.target.value)}
                  className="form-select text-xs"
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
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Site (Optional)</label>
                <select
                  value={avgSiteId}
                  onChange={(e) => setAvgSiteId(e.target.value)}
                  className="form-select text-xs"
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
                  onClick={loadEfficiency}
                  disabled={efficiencyLoading}
                  className="w-full btn-primary text-xs flex items-center justify-center gap-1.5"
                >
                  {efficiencyLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icon name="refresh" className="text-base" /> Calculate Average
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Efficiency Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-l-blue-500">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Run in Period</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {efficiencyRecords
                  .reduce((s, r) => s + r.totalKmHours, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Sum of KM &amp; Engine Hours</p>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Diesel Consumed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {efficiencyRecords
                  .reduce((s, r) => s + r.totalDieselLitres, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                <span className="text-sm font-normal text-gray-500">Litres</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Source: Fuel Issues in period</p>
            </div>

            <div className="card p-4 border-l-4 border-l-emerald-500">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Evaluated Units</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {efficiencyRecords.length}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Equipment &amp; multi-engine units</p>
            </div>

            <div className="card p-4 border-l-4 border-l-rose-500">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Over-Consumption Alerts</p>
              <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                {efficiencyRecords.filter((r) => r.status === "Higher Consumption").length}
              </p>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Consuming more than standard</p>
            </div>
          </div>

          {/* Detailed Efficiency & Variance Report Table */}
          {efficiencyLoading ? (
            <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Calculating database average metrics...</p>
            </div>
          ) : efficiencyRecords.length === 0 ? (
            <EmptyState
              icon="speed"
              title="No Machinery Average Data"
              description="No operational running logs or fuel issues found for the selected period and equipment."
              actionLabel="Recalculate"
              actionHref="#"
              onAction={loadEfficiency}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Equipment Fuel Efficiency &amp; Variance Engine
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Period: <span className="font-mono text-gray-800 font-semibold">{avgFromDate}</span> to{" "}
                    <span className="font-mono text-gray-800 font-semibold">{avgToDate}</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-5 py-3">Machinery Asset</th>
                      <th className="px-5 py-3">Engine Scope</th>
                      <th className="px-5 py-3">Meter</th>
                      <th className="px-5 py-3 text-right">Period Opening</th>
                      <th className="px-5 py-3 text-right">Period Closing</th>
                      <th className="px-5 py-3 text-right">Total Run</th>
                      <th className="px-5 py-3 text-right">Diesel Issued</th>
                      <th className="px-5 py-3 text-right font-bold text-gray-900">Actual Average</th>
                      <th className="px-5 py-3 text-right">Standard</th>
                      <th className="px-5 py-3 text-right">Variance</th>
                      <th className="px-5 py-3">Consumption Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {efficiencyRecords.map((r, idx) => {
                      const isKm = r.meterType === "KM";
                      const avgUnit = isKm ? "KM/L" : "L/Hour";
                      return (
                        <tr key={`${r.machineryId}-${r.engineId || "all"}-${idx}`} className="table-row">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-900 text-xs">
                              {r.assetCode} — {r.machineryName}
                            </p>
                            {r.registrationNo ? (
                              <p className="text-[11px] text-gray-500 font-mono">{r.registrationNo}</p>
                            ) : null}
                          </td>

                          <td className="px-5 py-3.5">
                            {r.engineName ? (
                              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                <Icon name="engineering" className="text-[12px]" />
                                {r.engineName}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Single Propulsion</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 font-mono font-semibold text-xs text-gray-700">
                            {r.meterType}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500 text-right">
                            {r.firstOpeningReading.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-gray-700 text-right font-medium">
                            {r.lastClosingReading.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-gray-900 text-right font-semibold">
                            {r.totalKmHours.toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.meterType}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-gray-900 text-right font-semibold">
                            {r.totalDieselLitres.toLocaleString(undefined, { minimumFractionDigits: 1 })} L
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <p className="font-mono text-xs font-bold text-gray-900">
                              {r.actualAverage > 0 ? `${r.actualAverage.toFixed(2)} ${avgUnit}` : "—"}
                            </p>
                            {isKm && r.consumptionLPer100Km ? (
                              <p className="text-[10px] text-gray-500 font-mono">
                                {r.consumptionLPer100Km.toFixed(1)} L/100 KM
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500 text-right">
                            {r.standardFuelEfficiency != null ? `${r.standardFuelEfficiency.toFixed(2)} ${avgUnit}` : "Not Set"}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-right font-semibold">
                            {r.variance != null ? (
                              <span
                                className={
                                  (isKm && r.variance >= 0) || (!isKm && r.variance <= 0)
                                    ? "text-emerald-700"
                                    : "text-rose-600"
                                }
                              >
                                {r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}{" "}
                                {r.variancePercentage != null ? `(${r.variancePercentage > 0 ? "+" : ""}${r.variancePercentage.toFixed(0)}%)` : ""}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                r.status === "Within Standard"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : r.status === "Lower Consumption"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : r.status === "Higher Consumption"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
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
                                    : "bg-gray-400"
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

      {/* Add / Edit Log Modal with Auto Opening Reading & Diesel Cross-Reference */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLogId(null);
        }}
        title={editingLogId ? `Edit Daily Equipment Log Book: ${formLogNo}` : "Record Daily Equipment Log Book"}
        subtitle="Automatic previous closing continuity, view-only diesel cross-reference, and real-time efficiency calculation."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Log No, Date, Machinery */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Log Number *</label>
              <input
                type="text"
                required
                value={formLogNo}
                onChange={(e) => setFormLogNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Machinery *</label>
              <select
                required
                value={formMachineryId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Select Machine --</option>
                {machinery.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.assetCode} — {getMachineryDisplayName(m)} ({m.meterType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Engine Selector if editing specific log or single engine selection */}
          {formAvailableEngines.length > 0 && !isMultiEngineMachine && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
              <label className="block text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                <Icon name="engineering" className="text-sm" /> Target Engine (Multi-Engine Machinery)
              </label>
              <select
                value={formEngineId}
                onChange={(e) => handleEngineChange(e.target.value)}
                className="form-select text-xs font-medium bg-white"
              >
                <option value="">Machine Overall / Main Propulsion Engine</option>
                {formAvailableEngines.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.engineCode} — {eng.engineName} ({eng.engineType}) &bull; Current: {eng.currentReading} {eng.meterType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multi-Engine Dual Reading Cards vs Standard Meter Continuity */}
          {isMultiEngineMachine && formAvailableEngines.length >= 2 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="engineering" className="text-blue-600 text-sm" />
                  Multi-Engine Independent Meters (Engine 1 &amp; Engine 2)
                </span>
                {/* Meter Reset / Replacement Toggle */}
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={formIsMeterReset}
                    onChange={(e) => setFormIsMeterReset(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span className={formIsMeterReset ? "text-amber-700 font-semibold" : "text-gray-600"}>
                    Meter Reset / Replacement
                  </span>
                </label>
              </div>

              {formIsMeterReset && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Icon name="warning" className="text-base text-amber-600 shrink-0" />
                  <span>Meter replacement / reset mode enabled. Opening readings can be manually recorded.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Engine 1 Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <span className="text-xs font-bold text-blue-950">
                      {formAvailableEngines[0].engineName || "Engine 1 (Propulsion)"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                      {formAvailableEngines[0].meterType} METER
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Previous Closing</label>
                      <div className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono">
                        {engine1PreviousClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {formAvailableEngines[0].meterType}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 mb-1 flex items-center justify-between">
                        <span>Opening *</span>
                        {!formIsMeterReset && engine1PreviousClosing > 0 && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">AUTO</span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        readOnly={!formIsMeterReset && engine1PreviousClosing > 0}
                        value={engine1Opening}
                        onChange={(e) => setEngine1Opening(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono ${
                          !formIsMeterReset && engine1PreviousClosing > 0
                            ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                            : "bg-white border-gray-200 text-gray-900 focus:border-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Closing *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={engine1Closing}
                        onChange={(e) => setEngine1Closing(e.target.value)}
                        className="form-input text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-600 font-medium">Engine 1 Run:</span>
                    <span className="font-mono font-bold text-blue-900">
                      {Math.max(0, (parseFloat(engine1Closing) || 0) - (parseFloat(engine1Opening) || 0)).toFixed(2)} {formAvailableEngines[0].meterType}
                    </span>
                  </div>
                </div>

                {/* Engine 2 Card */}
                <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                    <span className="text-xs font-bold text-amber-950">
                      {formAvailableEngines[1].engineName || "Engine 2 (Auxiliary / Deck)"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
                      {formAvailableEngines[1].meterType} METER
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Previous Closing</label>
                      <div className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono">
                        {engine2PreviousClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {formAvailableEngines[1].meterType}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 mb-1 flex items-center justify-between">
                        <span>Opening *</span>
                        {!formIsMeterReset && engine2PreviousClosing > 0 && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">AUTO</span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        readOnly={!formIsMeterReset && engine2PreviousClosing > 0}
                        value={engine2Opening}
                        onChange={(e) => setEngine2Opening(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono ${
                          !formIsMeterReset && engine2PreviousClosing > 0
                            ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                            : "bg-white border-gray-200 text-gray-900 focus:border-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Closing *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={engine2Closing}
                        onChange={(e) => setEngine2Closing(e.target.value)}
                        className="form-input text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-600 font-medium">Engine 2 Run:</span>
                    <span className="font-mono font-bold text-amber-900">
                      {Math.max(0, (parseFloat(engine2Closing) || 0) - (parseFloat(engine2Opening) || 0)).toFixed(2)} {formAvailableEngines[1].meterType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Meter Readings Card: Auto Opening Reading Continuity */
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <Icon name="speed" className="text-blue-600 text-base" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Meter Continuity &amp; Auto Opening ({activeMeterType})
                  </span>
                  {loadingReading && (
                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* Meter Reset / Replacement Toggle */}
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={formIsMeterReset}
                    onChange={(e) => setFormIsMeterReset(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span className={formIsMeterReset ? "text-amber-700 font-semibold" : "text-gray-600"}>
                    Meter Reset / Replacement
                  </span>
                </label>
              </div>

              {formIsMeterReset && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Icon name="warning" className="text-base text-amber-600 shrink-0" />
                  <span>
                    Meter replacement / reset mode enabled. Opening reading can be manually recorded.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Previous Closing Reading (Display only) */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Previous Closing Reading
                  </label>
                  <div className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 font-mono font-medium">
                    {formPreviousClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeMeterType}
                  </div>
                  {lastEntryLogDate ? (
                    <p className="text-[10px] text-gray-400 mt-1">From entry on {lastEntryLogDate}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">Initial asset baseline</p>
                  )}
                </div>

                {/* Auto Opening Reading */}
                <div>
                  <label className="block text-[11px] font-medium text-emerald-700 mb-1 flex items-center justify-between">
                    <span>Opening Reading *</span>
                    {!formIsMeterReset && hasPreviousEntry && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                        AUTO
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    readOnly={!formIsMeterReset && hasPreviousEntry}
                    value={formOpening}
                    onChange={(e) => setFormOpening(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                      !formIsMeterReset && hasPreviousEntry
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                        : "bg-white border-gray-200 text-gray-900 focus:border-blue-600"
                    }`}
                  />
                </div>

                {/* Closing Reading */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Closing Reading *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formClosing}
                    onChange={(e) => setFormClosing(e.target.value)}
                    className="form-input text-xs font-mono font-semibold"
                  />
                </div>

                {/* Total Run (Auto Calculated) */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Total Run (Closing - Opening)
                  </label>
                  <div className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-mono font-bold">
                    {autoCalculatedTotal.toFixed(2)} {activeMeterType}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View-Only Diesel Issue Cross-Reference */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="local_gas_station" className="text-amber-600 text-base" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Diesel Issued on {formDate} (VIEW ONLY — Source: Fuel Issue)
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Read-Only Cross-Reference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Diesel Issued</p>
                  <p className="text-xl font-bold text-gray-900 font-mono mt-0.5">
                    {dieselIssuedLitres.toFixed(2)} <span className="text-xs font-normal text-gray-500">Litres</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {fuelIssueCount > 0
                      ? `${fuelIssueCount} fuel issue transaction(s) recorded`
                      : "No diesel issued on this date"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Icon name="opacity" className="text-xl" />
                </div>
              </div>

              {/* Real-time Daily Efficiency Preview */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
                <p className="text-[11px] text-gray-500 uppercase font-semibold">Today&apos;s Fuel Efficiency</p>
                {todayEfficiencyText ? (
                  <div className="mt-0.5">
                    <p className="text-base font-bold text-gray-900 font-mono">{todayEfficiencyText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          todayStatusText === "Within Standard"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {todayStatusText}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Std: {standardEff != null ? standardEff.toFixed(2) : "Not Set"} {activeMeterType === "KM" ? "KM/L" : "L/Hr"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {dieselIssuedLitres === 0 ? "Awaiting diesel issue or zero consumption" : "Enter closing reading"}
                  </p>
                )}
              </div>
            </div>

            {/* Individual Slips Breakdown if any */}
            {dailyFuelIssues.length > 0 && (
              <div className="pt-2 border-t border-amber-100 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Issue Slips: </span>
                {dailyFuelIssues.map((iss, i) => (
                  <span key={iss.id || i} className="inline-block mr-3 font-mono">
                    #{iss.slipReference || iss.issueNo}: <strong className="text-amber-800">{iss.quantityLitres} L</strong> ({iss.fuelSource})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Timing, Hours, Trips */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Working Hours (0-24)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={formWorkingHours}
                onChange={(e) => setFormWorkingHours(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Breakdown Hours</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={formBreakdownHours}
                onChange={(e) => setFormBreakdownHours(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Operator & Trips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Operator Name</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                placeholder="e.g. Santosh Patil"
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Trips</label>
              <input
                type="number"
                min="0"
                value={formTrips}
                onChange={(e) => setFormTrips(e.target.value)}
                placeholder="0"
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Description & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Work Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Details of operation, chainage, material hauled, etc."
                className="form-input text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Observations, track conditions, minor issues"
                className="form-input text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving Log...</span>
                </>
              ) : (
                <>
                  <Icon name="check" className="text-sm" /> Save Log Book Entry
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Informational Duplicate Entry Warning Modal */}
      <Modal
        isOpen={duplicateWarningOpen}
        onClose={() => setDuplicateWarningOpen(false)}
        title="Existing Entry Found"
        subtitle={`A log book entry already exists for this equipment on ${duplicateLog?.date}. Multiple daily entries are allowed.`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Icon name="info" className="text-base text-amber-600" />
              <span>Existing Entry: {duplicateLog?.logNo}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-700 bg-white p-2.5 rounded-lg border border-amber-100 font-mono">
              <div>Opening: <strong>{duplicateLog?.openingReading}</strong></div>
              <div>Closing: <strong>{duplicateLog?.closingReading}</strong></div>
              <div>Run: <strong>{duplicateLog?.totalKmHours}</strong></div>
              <div>Operator: <strong>{duplicateLog?.operatorName || "N/A"}</strong></div>
            </div>
            <p className="text-[11px] text-amber-800">
              Multiple entries on the same date are permitted. Choose an action below:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Option 1: Continue New Entry */}
            <button
              type="button"
              onClick={async () => {
                if (!duplicateLog) return;
                setDuplicateWarningOpen(false);
                setEditingLogId(null);
                // Continuity: auto-fill opening reading from duplicateLog closing reading
                setFormOpening(duplicateLog.closingReading.toString());
                setFormClosing(duplicateLog.closingReading.toString());
                setFormPreviousClosing(duplicateLog.closingReading);
                showToast("Continue New Entry", `Opening reading initialized from previous closing (${duplicateLog.closingReading}).`);
              }}
              className="p-3 text-left border rounded-xl border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-start gap-2.5 group"
            >
              <Icon name="add_circle" className="text-lg text-emerald-700 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-800 text-xs">1. Continue New Entry</div>
                <p className="text-[11px] text-gray-600">
                  Proceed with creating a new entry. Opening reading is automatically initialized from previous closing ({duplicateLog?.closingReading}).
                </p>
              </div>
            </button>

            {/* Option 2: View Existing Entries */}
            <button
              type="button"
              onClick={() => {
                if (!duplicateLog) return;
                setDuplicateWarningOpen(false);
                setIsModalOpen(false);
                setSelectedMachineId(duplicateLog.machineryId);
                setSelectedDate(duplicateLog.date);
                setActiveTab("logs");
                showToast("Filtered", `Displaying entries for ${duplicateLog.date}.`);
              }}
              className="p-3 text-left border rounded-xl border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-colors flex items-start gap-2.5 group"
            >
              <Icon name="visibility" className="text-lg text-blue-700 mt-0.5" />
              <div>
                <div className="font-bold text-blue-800 text-xs">2. View Existing Entries</div>
                <p className="text-[11px] text-gray-600">
                  Inspect existing entries recorded for this machinery on {duplicateLog?.date}.
                </p>
              </div>
            </button>

            {/* Option 3: Cancel */}
            <button
              type="button"
              onClick={() => {
                setDuplicateWarningOpen(false);
                setIsModalOpen(false);
              }}
              className="p-3 text-left border rounded-xl border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-start gap-2.5"
            >
              <Icon name="close" className="text-lg text-gray-600 mt-0.5" />
              <div>
                <div className="font-bold text-gray-700 text-xs">3. Cancel</div>
                <p className="text-[11px] text-gray-500">
                  Close and return without saving.
                </p>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
