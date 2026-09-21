"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  getMachinery,
  getMachineryById,
  getProjects,
  getSites,
  getEngines,
  getLogBooks,
  getLogBookById,
  createLogBook,
  updateLogBook,
  getLatestLogBookReading,
  getDailyFuelIssued,
  generateLogNumber,
} from "@/lib/data/repository";
import type {
  LogBook,
  Machinery,
  Project,
  Site,
  Engine,
  MeterType,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

interface EngineReadingState {
  engineId: string;
  engineName: string;
  meterType: MeterType;
  standardEfficiency: number | null;
  previousClosing: number;
  opening: string;
  closing: string;
  isMeterReset: boolean;
  hasPreviousEntry: boolean;
}

interface LogBookTransactionFormProps {
  mode: "create" | "edit" | "view";
  initialLogId?: string;
}

export function LogBookTransactionForm({
  mode: initialMode,
  initialLogId,
}: LogBookTransactionFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"create" | "edit" | "view">(initialMode);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [readingLoading, setReadingLoading] = useState(false);

  // Master Data
  const [machineryList, setMachineryList] = useState<Machinery[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [sitesList, setSitesList] = useState<Site[]>([]);

  // Transaction Fields
  const [formLogNo, setFormLogNo] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(""); // MUST start blank
  const [formMachineryId, setFormMachineryId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formSiteId, setFormSiteId] = useState<string>("");

  // Single-machine reading state
  const [singlePreviousClosing, setSinglePreviousClosing] = useState<number | null>(null);
  const [singleOpening, setSingleOpening] = useState<string>("");
  const [singleClosing, setSingleClosing] = useState<string>("");
  const [singleIsMeterReset, setSingleIsMeterReset] = useState<boolean>(false);
  const [singleHasPrevious, setSingleHasPrevious] = useState<boolean>(false);

  // Multi-engine readings state
  const [availableEngines, setAvailableEngines] = useState<Engine[]>([]);
  const [engineReadings, setEngineReadings] = useState<EngineReadingState[]>([]);

  // Diesel Cross Reference (READ ONLY from Fuel Issues)
  const [dieselIssuedLitres, setDieselIssuedLitres] = useState<number | null>(null);
  const [fuelIssueCount, setFuelIssueCount] = useState<number>(0);
  const [dailyFuelIssues, setDailyFuelIssues] = useState<any[]>([]);
  const [showFuelDetails, setShowFuelDetails] = useState<boolean>(false);

  // Same-date existing entries detection (NON-BLOCKING)
  const [sameDateLogs, setSameDateLogs] = useState<LogBook[]>([]);
  const [showSameDateDetails, setShowSameDateDetails] = useState<boolean>(false);
  const [sameDateNoticeDismissed, setSameDateNoticeDismissed] = useState<boolean>(false);

  // Operational Fields
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [workingHours, setWorkingHours] = useState<string>("");
  const [breakdownHours, setBreakdownHours] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("");
  const [trips, setTrips] = useState<string>("");
  const [workDescription, setWorkDescription] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Active selected machine
  const selectedMachine = useMemo(() => {
    return machineryList.find((m) => m.id === formMachineryId);
  }, [machineryList, formMachineryId]);

  const isMultiEngine = useMemo(() => {
    if (!selectedMachine) return false;
    return (
      selectedMachine.engineConfig === "multi" ||
      selectedMachine.meterConfiguration === "multi_engine" ||
      availableEngines.length >= 2
    );
  }, [selectedMachine, availableEngines]);

  // Filtered sites for current project
  const filteredSites = useMemo(() => {
    if (!formProjectId) return sitesList;
    return sitesList.filter((s) => s.projectId === formProjectId);
  }, [sitesList, formProjectId]);

  // Load initial master data and log if editing
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const [m, p, s] = await Promise.all([
          getMachinery(),
          getProjects(),
          getSites(),
        ]);
        if (!isMounted) return;
        setMachineryList(m);
        setProjectsList(p);
        setSitesList(s);

        if (initialLogId) {
          const existingLog = await getLogBookById(initialLogId);
          if (existingLog && isMounted) {
            setFormLogNo(existingLog.logNo);
            setFormDate(existingLog.date);
            setFormMachineryId(existingLog.machineryId);
            setFormProjectId(existingLog.projectId || "");
            setFormSiteId(existingLog.siteId || "");
            setSingleOpening(existingLog.openingReading.toString());
            setSingleClosing(existingLog.closingReading.toString());
            setSingleIsMeterReset(existingLog.isMeterReset || false);
            setStartTime(existingLog.startTime || "08:00");
            setEndTime(existingLog.endTime || "18:00");
            setWorkingHours(existingLog.workingHours != null ? existingLog.workingHours.toString() : "");
            setBreakdownHours(existingLog.breakdownHours != null ? existingLog.breakdownHours.toString() : "");
            setOperatorName(existingLog.operatorName || "");
            setTrips(existingLog.trips != null ? existingLog.trips.toString() : "");
            setWorkDescription(existingLog.workDescription || "");
            setRemarks(existingLog.remarks || "");

            // Load engines for this machine
            const engs = await getEngines(existingLog.machineryId);
            setAvailableEngines(engs);

            // Fetch fuel
            const fuel = await getDailyFuelIssued(existingLog.machineryId, existingLog.date);
            setDieselIssuedLitres(fuel.totalLitres);
            setFuelIssueCount(fuel.issueCount);
            setDailyFuelIssues(fuel.issues || []);
          }
        }
      } catch (err: any) {
        showToast("Error", err.message || "Failed to load transaction data", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [initialLogId, showToast]);

  // Fetch readings, engines, and fuel whenever machinery or date changes
  const fetchReadingAndFuelData = useCallback(
    async (machineId: string, date: string) => {
      if (!machineId || !date) return;
      setReadingLoading(true);
      setSameDateNoticeDismissed(false);

      try {
        const machine = await getMachineryById(machineId);
        const [engs, fuelData, allLogsForMachine] = await Promise.all([
          getEngines(machineId),
          getDailyFuelIssued(machineId, date),
          getLogBooks(machineId),
        ]);

        setAvailableEngines(engs);

        // Check same-date existing entries (exclude current log if editing)
        const sameDay = allLogsForMachine.filter(
          (l) => l.date === date && l.status !== "cancelled" && l.id !== initialLogId
        );
        setSameDateLogs(sameDay);

        // Diesel fuel cross reference
        setDieselIssuedLitres(fuelData.totalLitres);
        setFuelIssueCount(fuelData.issueCount);
        setDailyFuelIssues(fuelData.issues || []);

        const isMulti =
          machine?.engineConfig === "multi" ||
          machine?.meterConfiguration === "multi_engine" ||
          engs.length >= 2;

        if (isMulti && engs.length > 0) {
          const states: EngineReadingState[] = await Promise.all(
            engs.map(async (eng) => {
              const reading = await getLatestLogBookReading(machineId, date, eng.id);
              return {
                engineId: eng.id,
                engineName: eng.engineName || `Engine ${eng.engineNumber || ""}`,
                meterType: (eng.meterType || "HOUR") as MeterType,
                standardEfficiency: eng.standardFuelEfficiency ?? null,
                previousClosing: reading.previousClosingReading,
                opening: reading.suggestedOpeningReading > 0 ? reading.suggestedOpeningReading.toString() : "",
                closing: "",
                isMeterReset: false,
                hasPreviousEntry: reading.hasPreviousEntry,
              };
            })
          );
          setEngineReadings(states);
        } else {
          const primaryEngId = engs.length === 1 ? engs[0].id : null;
          const reading = await getLatestLogBookReading(machineId, date, primaryEngId);
          setSinglePreviousClosing(reading.previousClosingReading);
          setSingleOpening(reading.suggestedOpeningReading > 0 ? reading.suggestedOpeningReading.toString() : "");
          setSingleClosing("");
          setSingleHasPrevious(reading.hasPreviousEntry);
        }
      } catch (err: any) {
        console.error("Error fetching readings:", err);
      } finally {
        setReadingLoading(false);
      }
    },
    [initialLogId]
  );

  // Handle Date Selection (STEP 1)
  const handleDateChange = async (dateVal: string) => {
    setFormDate(dateVal);
    setErrors((prev) => ({ ...prev, date: "" }));

    if (formMachineryId && dateVal) {
      if (!initialLogId) {
        const nextNo = await generateLogNumber(dateVal, formMachineryId);
        setFormLogNo(nextNo);
      }
      await fetchReadingAndFuelData(formMachineryId, dateVal);
    }
  };

  // Handle Machinery Selection (STEP 2)
  const handleMachineryChange = async (machineId: string) => {
    setFormMachineryId(machineId);
    setErrors((prev) => ({ ...prev, machineryId: "" }));

    const machine = machineryList.find((m) => m.id === machineId);
    if (machine) {
      if (machine.currentProjectId || machine.projectId) {
        setFormProjectId(machine.currentProjectId || machine.projectId || "");
      }
      if (machine.currentSiteId || machine.siteId) {
        setFormSiteId(machine.currentSiteId || machine.siteId || "");
      }

      if (formDate) {
        if (!initialLogId) {
          const nextNo = await generateLogNumber(formDate, machineId);
          setFormLogNo(nextNo);
        }
        await fetchReadingAndFuelData(machineId, formDate);
      }
    } else {
      setSinglePreviousClosing(null);
      setSingleOpening("");
      setSingleClosing("");
      setEngineReadings([]);
      setAvailableEngines([]);
      setSameDateLogs([]);
      setDieselIssuedLitres(null);
      setFuelIssueCount(0);
    }
  };

  // Calculated Total Run for single engine
  const singleTotalRun = useMemo(() => {
    const op = parseFloat(singleOpening);
    const cl = parseFloat(singleClosing);
    if (isNaN(op) || isNaN(cl)) return null;
    return Math.max(0, cl - op);
  }, [singleOpening, singleClosing]);

  // Actual Efficiency for single engine
  const singleEfficiency = useMemo(() => {
    if (singleTotalRun == null || singleTotalRun <= 0) return null;
    if (dieselIssuedLitres == null || dieselIssuedLitres <= 0) return null;
    const meterType = selectedMachine?.meterType || "HOUR";
    if (meterType === "KM") {
      return Number((singleTotalRun / dieselIssuedLitres).toFixed(2));
    } else {
      return Number((dieselIssuedLitres / singleTotalRun).toFixed(2));
    }
  }, [singleTotalRun, dieselIssuedLitres, selectedMachine]);

  // Standard Efficiency for single engine
  const singleStandardEfficiency = useMemo(() => {
    if (!selectedMachine) return null;
    if (availableEngines.length === 1 && availableEngines[0].standardFuelEfficiency != null) {
      return availableEngines[0].standardFuelEfficiency;
    }
    return selectedMachine.standardFuelEfficiency ?? null;
  }, [selectedMachine, availableEngines]);

  // Single engine variance
  const singleVariance = useMemo(() => {
    if (singleEfficiency == null || singleStandardEfficiency == null || singleStandardEfficiency <= 0) return null;
    return Number((singleEfficiency - singleStandardEfficiency).toFixed(2));
  }, [singleEfficiency, singleStandardEfficiency]);

  // Update a specific engine reading in multi-engine mode
  const handleEngineReadingChange = (
    engineId: string,
    field: "opening" | "closing" | "isMeterReset",
    value: any
  ) => {
    setEngineReadings((prev) =>
      prev.map((eng) => {
        if (eng.engineId !== engineId) return eng;
        return {
          ...eng,
          [field]: value,
          ...(field === "isMeterReset" && !value
            ? { opening: eng.previousClosing > 0 ? eng.previousClosing.toString() : "" }
            : {}),
        };
      })
    );
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formDate || formDate.trim() === "") {
      newErrors.date = "Transaction Date is required. Please select a date.";
    }
    if (!formMachineryId || formMachineryId.trim() === "") {
      newErrors.machineryId = "Please select a Machinery / Equipment.";
    }

    if (isMultiEngine && engineReadings.length > 0) {
      engineReadings.forEach((eng) => {
        const op = parseFloat(eng.opening);
        const cl = parseFloat(eng.closing);
        if (isNaN(cl)) {
          newErrors[`engine_${eng.engineId}_closing`] = `Closing reading is required for ${eng.engineName}.`;
        } else if (cl < 0) {
          newErrors[`engine_${eng.engineId}_closing`] = "Closing reading cannot be negative.";
        } else if (!eng.isMeterReset && !isNaN(op) && cl < op) {
          newErrors[`engine_${eng.engineId}_closing`] = `Closing (${cl}) cannot be less than opening (${op}). Enable 'Meter Reset' if replaced.`;
        }
      });
    } else {
      const op = parseFloat(singleOpening);
      const cl = parseFloat(singleClosing);
      if (isNaN(cl)) {
        newErrors.closing = "Closing meter reading is required.";
      } else if (cl < 0) {
        newErrors.closing = "Closing reading cannot be negative.";
      } else if (!singleIsMeterReset && !isNaN(op) && cl < op) {
        newErrors.closing = `Closing reading (${cl}) cannot be less than opening reading (${op}). Enable 'Meter Reset' if replaced.`;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      showToast("Validation Error", newErrors[firstKey], "error");
      return false;
    }
    return true;
  };

  // Save Handler
  const handleSave = async (saveStatus: "draft" | "approved") => {
    if (mode === "view") return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (initialLogId) {
        const op = parseFloat(singleOpening) || 0;
        const cl = parseFloat(singleClosing) || 0;
        await updateLogBook(initialLogId, {
          logNo: formLogNo,
          date: formDate,
          machineryId: formMachineryId,
          projectId: formProjectId || null,
          siteId: formSiteId || null,
          openingReading: op,
          closingReading: cl,
          isMeterReset: singleIsMeterReset,
          startTime: startTime || null,
          endTime: endTime || null,
          workingHours: workingHours ? parseFloat(workingHours) : null,
          breakdownHours: breakdownHours ? parseFloat(breakdownHours) : 0,
          operatorName: operatorName || null,
          trips: trips ? parseInt(trips, 10) : 0,
          workDescription: workDescription || null,
          remarks: remarks || null,
          status: saveStatus,
        });

        showToast(
          "Success",
          `Log Book entry '${formLogNo}' saved successfully (${saveStatus === "draft" ? "Draft" : "Approved"}).`
        );
        router.push("/machinery/log-book");
      } else {
        if (isMultiEngine && engineReadings.length > 0) {
          for (let i = 0; i < engineReadings.length; i++) {
            const eng = engineReadings[i];
            const op = parseFloat(eng.opening) || 0;
            const cl = parseFloat(eng.closing) || 0;
            const suffix = engineReadings.length > 1 ? `-E${i + 1}` : "";
            const subLogNo = `${formLogNo}${suffix}`;

            await createLogBook({
              logNo: subLogNo,
              date: formDate,
              machineryId: formMachineryId,
              engineId: eng.engineId,
              isMeterReset: eng.isMeterReset,
              projectId: formProjectId || null,
              siteId: formSiteId || null,
              openingReading: op,
              closingReading: cl,
              startTime: startTime || null,
              endTime: endTime || null,
              workingHours: workingHours ? parseFloat(workingHours) : null,
              breakdownHours: breakdownHours ? parseFloat(breakdownHours) : 0,
              operatorName: operatorName || null,
              trips: trips ? parseInt(trips, 10) : 0,
              workDescription: workDescription || null,
              remarks: remarks || null,
              status: saveStatus,
            });
          }
          showToast(
            "Success",
            `Created ${engineReadings.length} engine log entries successfully (${saveStatus === "draft" ? "Draft" : "Approved"}).`
          );
        } else {
          const op = parseFloat(singleOpening) || 0;
          const cl = parseFloat(singleClosing) || 0;
          const primaryEngId = availableEngines.length === 1 ? availableEngines[0].id : null;

          await createLogBook({
            logNo: formLogNo,
            date: formDate,
            machineryId: formMachineryId,
            engineId: primaryEngId,
            isMeterReset: singleIsMeterReset,
            projectId: formProjectId || null,
            siteId: formSiteId || null,
            openingReading: op,
            closingReading: cl,
            startTime: startTime || null,
            endTime: endTime || null,
            workingHours: workingHours ? parseFloat(workingHours) : null,
            breakdownHours: breakdownHours ? parseFloat(breakdownHours) : 0,
            operatorName: operatorName || null,
            trips: trips ? parseInt(trips, 10) : 0,
            workDescription: workDescription || null,
            remarks: remarks || null,
            status: saveStatus,
          });

          showToast(
            "Success",
            `Log Book entry '${formLogNo}' recorded successfully (${saveStatus === "draft" ? "Draft" : "Approved"}).`
          );
        }

        router.push("/machinery/log-book");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save log book transaction.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading Transaction Screen...</p>
      </div>
    );
  }

  const isViewMode = mode === "view";

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 lg:pb-10">
      {/* 1. TOP TRANSACTION HEADER (Clean Light Glass Style) */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 lg:relative lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:border-none lg:backdrop-blur-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/machinery/log-book"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
              title="Back to Log Book"
            >
              <Icon name="arrow_back" size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon name="menu_book" size={16} />
                  </span>
                  {isViewMode
                    ? `Equipment Log: ${formLogNo || "Details"}`
                    : initialLogId
                    ? `Edit Equipment Log: ${formLogNo}`
                    : "Record Daily Equipment Log"}
                </h1>
                {selectedMachine && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedMachine.registrationNo
                      ? selectedMachine.registrationNo
                      : selectedMachine.machineryName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily operational shift readings, fuel cross-reference &amp; efficiency tracking
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isViewMode ? (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Icon name="edit" size={15} />
                Edit Transaction
              </button>
            ) : (
              <>
                <Link
                  href="/machinery/log-book"
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave("draft")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Icon name="drafts" size={15} />
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave("approved")}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="check_circle" size={15} />
                  )}
                  Save &amp; Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. TRANSACTION INFORMATION CARD (SOLID WHITE ENTERPRISE STYLE) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transaction Details
            </span>
          </div>
          {formLogNo ? (
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-blue-700 font-semibold">
              {formLogNo}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Log # auto-assigned upon date &amp; equipment selection
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STEP 1: DATE (MUST START BLANK) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>
                1. Shift Date <span className="text-red-500">*</span>
              </span>
              {!formDate && <span className="text-[10px] text-amber-600 font-medium">Required</span>}
            </label>
            <input
              type="date"
              disabled={isViewMode}
              value={formDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3 py-1.5 bg-white border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.date
                  ? "border-red-400 bg-red-50/20"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            />
            {errors.date && <p className="text-[11px] text-red-500">{errors.date}</p>}
          </div>

          {/* STEP 2: MACHINERY SELECTION */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>
                2. Select Equipment / Machinery <span className="text-red-500">*</span>
              </span>
              {selectedMachine && (
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedMachine.assetCode}
                </span>
              )}
            </label>
            <select
              disabled={isViewMode || Boolean(initialLogId)}
              value={formMachineryId}
              onChange={(e) => handleMachineryChange(e.target.value)}
              className={`w-full px-3 py-1.5 bg-white border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.machineryId
                  ? "border-red-400 bg-red-50/20"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <option value="">-- Select Machinery / Vehicle --</option>
              {machineryList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.registrationNo
                    ? `${m.machineryName} — ${m.registrationNo} (${m.assetCode})`
                    : `${m.machineryName} (Unregistered) (${m.assetCode})`}
                </option>
              ))}
            </select>
            {errors.machineryId && (
              <p className="text-[11px] text-red-500">{errors.machineryId}</p>
            )}
          </div>

          {/* METER CONFIGURATION BADGE */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">
              Meter Configuration
            </label>
            <div className="h-[34px] px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              {selectedMachine ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMultiEngine ? "bg-purple-500" : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {isMultiEngine
                      ? `Multi-Engine (${availableEngines.length || 2})`
                      : selectedMachine.meterType === "KM"
                      ? "Single KM Meter"
                      : "Single HOUR Meter"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Auto-detected</span>
              )}
            </div>
          </div>

          {/* PROJECT (AUTO-LOADED) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Project</label>
            <select
              disabled={isViewMode}
              value={formProjectId}
              onChange={(e) => {
                setFormProjectId(e.target.value);
                setFormSiteId("");
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Unassigned Project --</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* SITE (AUTO-LOADED) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Site</label>
            <select
              disabled={isViewMode}
              value={formSiteId}
              onChange={(e) => setFormSiteId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Unassigned Site --</option>
              {filteredSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* OPERATOR NAME */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Operator / Driver</label>
            <input
              type="text"
              disabled={isViewMode}
              placeholder="e.g. Ramesh Patil"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* TRIPS / HAULS */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Trips / Hauls</label>
            <input
              type="number"
              inputMode="numeric"
              disabled={isViewMode}
              placeholder="0"
              value={trips}
              onChange={(e) => setTrips(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* NON-BLOCKING SAME-DATE NOTICE (REQUIREMENT 5 & 11) */}
        {sameDateLogs.length > 0 && !sameDateNoticeDismissed && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-amber-100 text-amber-700 mt-0.5">
                <Icon name="info" size={16} />
              </span>
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Existing entries found for this machinery on this date ({sameDateLogs.length}{" "}
                  {sameDateLogs.length === 1 ? "entry" : "entries"}).
                </p>
                <p className="text-[11px] text-amber-700">
                  Multiple shifts or trips on the same date are allowed. You can continue recording
                  this new entry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowSameDateDetails(!showSameDateDetails)}
                className="px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Icon name={showSameDateDetails ? "expand_less" : "visibility"} size={14} />
                {showSameDateDetails ? "Hide Existing" : "View Existing"}
              </button>
              <button
                type="button"
                onClick={() => setSameDateNoticeDismissed(true)}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-semibold transition-colors"
              >
                Continue New Entry
              </button>
            </div>
          </div>
        )}

        {/* COLLAPSIBLE EXISTING ENTRIES PREVIEW */}
        {showSameDateDetails && sameDateLogs.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Existing Entries for {formDate}:
            </p>
            <div className="divide-y divide-slate-200 text-xs">
              {sameDateLogs.map((l) => (
                <div key={l.id} className="py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-slate-700">
                    <span className="text-blue-700 font-semibold">{l.logNo}</span>
                    <span className="text-slate-300">|</span>
                    <span>
                      {l.openingReading} → {l.closingReading} ({l.totalKmHours} Run)
                    </span>
                    {l.operatorName && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">Op: {l.operatorName}</span>
                      </>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. METER READINGS & ENGINE SECTION (SOLID WHITE) */}
      {readingLoading ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-3 text-slate-500 shadow-xs">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Fetching readings &amp; fuel cross-reference...</span>
        </div>
      ) : !formMachineryId ? (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Icon name="touch_app" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Please select an Equipment first</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose a date and machinery above to automatically load previous closing readings, engine
            meters, and fuel allocations.
          </p>
        </div>
      ) : isMultiEngine && engineReadings.length > 0 ? (
        /* MULTI-ENGINE INDEPENDENT CARDS (SOLID WHITE & CLEAN ACCENTS) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                <Icon name="memory" size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Multi-Engine Independent Meter Readings ({engineReadings.length} Engines)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Each engine operates on its own meter type and efficiency standard
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {engineReadings.map((eng, idx) => {
              const op = parseFloat(eng.opening);
              const cl = parseFloat(eng.closing);
              const totalRun = !isNaN(op) && !isNaN(cl) ? Math.max(0, cl - op) : null;
              const errKey = `engine_${eng.engineId}_closing`;

              return (
                <div
                  key={eng.engineId}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 font-mono">
                        E{idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{eng.engineName}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Meter: {eng.meterType} | Std:{" "}
                          {eng.standardEfficiency != null
                            ? eng.meterType === "KM"
                              ? `${eng.standardEfficiency} KM/L`
                              : `${eng.standardEfficiency} L/Hour`
                            : "Not Set"}
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                      <input
                        type="checkbox"
                        disabled={isViewMode}
                        checked={eng.isMeterReset}
                        onChange={(e) =>
                          handleEngineReadingChange(eng.engineId, "isMeterReset", e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-[11px] font-medium">Meter Reset</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Previous Closing */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Prev. Closing
                      </span>
                      <div className="h-[36px] px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs font-mono font-bold text-slate-700">
                        {eng.previousClosing > 0 ? eng.previousClosing.toFixed(1) : "-"}
                      </div>
                    </div>

                    {/* Opening */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                        Opening {eng.meterType}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        disabled={isViewMode || !eng.isMeterReset}
                        value={eng.opening}
                        placeholder={eng.previousClosing > 0 ? eng.previousClosing.toString() : "0"}
                        onChange={(e) =>
                          handleEngineReadingChange(eng.engineId, "opening", e.target.value)
                        }
                        className={`w-full h-[36px] px-3 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                          eng.isMeterReset
                            ? "bg-amber-50/50 border-amber-300 text-slate-900"
                            : "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    {/* Closing */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                        Closing {eng.meterType} *
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        disabled={isViewMode}
                        placeholder="Enter closing"
                        value={eng.closing}
                        onChange={(e) =>
                          handleEngineReadingChange(eng.engineId, "closing", e.target.value)
                        }
                        className={`w-full h-[36px] px-3 bg-white border rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors[errKey] ? "border-red-400 bg-red-50/20" : "border-slate-300"
                        }`}
                      />
                    </div>
                  </div>

                  {errors[errKey] && (
                    <p className="text-[11px] text-red-500">{errors[errKey]}</p>
                  )}

                  {/* Calculated Output Row */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        Total {eng.meterType} Run:
                      </span>
                      <p className="text-sm font-mono font-bold text-blue-700">
                        {totalRun != null ? `${totalRun.toFixed(1)} ${eng.meterType}` : "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        Standard Efficiency:
                      </span>
                      <p className="text-xs font-mono font-semibold text-slate-700">
                        {eng.standardEfficiency != null
                          ? eng.meterType === "KM"
                            ? `${eng.standardEfficiency} KM/L`
                            : `${eng.standardEfficiency} L/Hour`
                          : "Not Set"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE ENGINE SECTION (SOLID WHITE) */
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                <Icon name="speed" size={16} />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Meter Readings —{" "}
                {selectedMachine?.meterType === "KM"
                  ? "Kilometer (KM) Meter"
                  : "Engine Hour (HR) Meter"}
              </h2>
            </div>

            {/* Meter Reset Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                disabled={isViewMode}
                checked={singleIsMeterReset}
                onChange={(e) => {
                  setSingleIsMeterReset(e.target.checked);
                  if (!e.target.checked && singlePreviousClosing != null) {
                    setSingleOpening(singlePreviousClosing.toString());
                  }
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
              />
              <span className="text-xs font-medium">Meter Reset / Replacement</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Previous Closing Reading (READ ONLY) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Previous Closing</span>
                <span className="text-[10px] text-slate-400 font-normal">Read-only</span>
              </label>
              <div className="h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-sm font-mono font-bold text-slate-700">
                {singlePreviousClosing != null && singlePreviousClosing > 0
                  ? `${singlePreviousClosing.toFixed(1)} ${selectedMachine?.meterType || ""}`
                  : "-"}
              </div>
            </div>

            {/* Opening Reading */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>
                  Opening {selectedMachine?.meterType || "Reading"} <span className="text-red-500">*</span>
                </span>
                {singleIsMeterReset && (
                  <span className="text-[10px] text-amber-600 font-medium">Unlocked</span>
                )}
              </label>
              <input
                type="number"
                inputMode="decimal"
                disabled={isViewMode || !singleIsMeterReset}
                value={singleOpening}
                placeholder={singlePreviousClosing != null ? singlePreviousClosing.toString() : ""}
                onChange={(e) => setSingleOpening(e.target.value)}
                className={`w-full h-[38px] px-3 border rounded-xl text-sm font-mono font-bold focus:outline-none transition-all ${
                  singleIsMeterReset
                    ? "bg-amber-50/50 border-amber-300 text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Closing Reading */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center justify-between">
                <span>
                  Closing {selectedMachine?.meterType || "Reading"} <span className="text-red-500">*</span>
                </span>
                {!singleClosing && <span className="text-[10px] text-amber-600">Required</span>}
              </label>
              <input
                type="number"
                inputMode="decimal"
                disabled={isViewMode}
                placeholder="Enter closing meter reading"
                value={singleClosing}
                onChange={(e) => {
                  setSingleClosing(e.target.value);
                  setErrors((prev) => ({ ...prev, closing: "" }));
                }}
                className={`w-full h-[38px] px-3 bg-white border rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.closing
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              />
              {errors.closing && <p className="text-[11px] text-red-500">{errors.closing}</p>}
            </div>
          </div>

          {/* Instant Calculation Output */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white border border-slate-200 text-blue-600 shadow-xs">
                <Icon name="functions" size={16} />
              </span>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Shift Run
                </span>
                <p className="text-base font-mono font-bold text-blue-700">
                  {singleTotalRun != null
                    ? `${singleTotalRun.toFixed(1)} ${selectedMachine?.meterType || ""}`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                  Standard Efficiency
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {singleStandardEfficiency != null
                    ? selectedMachine?.meterType === "KM"
                      ? `${singleStandardEfficiency} KM/L`
                      : `${singleStandardEfficiency} L/Hour`
                    : "Standard Not Set"}
                </span>
              </div>

              {singleEfficiency != null && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Actual Today
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {selectedMachine?.meterType === "KM"
                      ? `${singleEfficiency} KM/L`
                      : `${singleEfficiency} L/Hour`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DIESEL CROSS REFERENCE & EFFICIENCY SUMMARY (READ ONLY - SOLID WHITE) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Icon name="local_gas_station" size={16} />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Fuel Cross-Reference (Sourced from Fuel Issues — Read Only)
            </h2>
          </div>
          {fuelIssueCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFuelDetails(!showFuelDetails)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              <Icon name={showFuelDetails ? "expand_less" : "expand_more"} size={16} />
              {showFuelDetails ? "Hide Slips" : `View ${fuelIssueCount} Slip(s)`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* DIESEL ISSUED TODAY */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Diesel Issued Today
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-emerald-600">
                {dieselIssuedLitres != null && dieselIssuedLitres > 0
                  ? dieselIssuedLitres.toFixed(2)
                  : "0.00"}
              </span>
              <span className="text-xs font-semibold text-slate-500">Litres</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {fuelIssueCount > 0
                ? `Sum of ${fuelIssueCount} Fuel Issue slips`
                : "No fuel issue entries for this equipment today"}
            </p>
          </div>

          {/* APPLICABLE STANDARD EFFICIENCY */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Configured Standard
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-slate-800">
                {singleStandardEfficiency != null ? singleStandardEfficiency : "-"}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {selectedMachine?.meterType === "KM" ? "KM/L" : "L/Hour"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">From Machinery / Engine Master</p>
          </div>

          {/* ACTUAL EFFICIENCY & VARIANCE */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Shift Efficiency &amp; Variance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-slate-900">
                {singleEfficiency != null ? singleEfficiency : "-"}
              </span>
              {singleVariance != null && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    singleVariance >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  ({singleVariance >= 0 ? `+${singleVariance}` : singleVariance})
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {singleEfficiency != null ? "Calculated from run and fuel" : "Requires valid run & fuel"}
            </p>
          </div>
        </div>

        {/* EXPANDABLE FUEL ISSUES LIST */}
        {showFuelDetails && dailyFuelIssues.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Fuel Issue Slips on {formDate}:
            </p>
            <div className="divide-y divide-slate-200 text-xs">
              {dailyFuelIssues.map((iss) => (
                <div key={iss.id} className="py-1.5 flex items-center justify-between">
                  <div className="font-mono text-slate-700">
                    <span className="text-blue-700 font-semibold">{iss.issueNo}</span>
                    {iss.slipReference && (
                      <span className="text-slate-500 ml-2">Slip: {iss.slipReference}</span>
                    )}
                    <span className="text-slate-500 ml-2">({iss.fuelSource})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600">
                      {iss.quantityLitres.toFixed(2)} L
                    </span>
                    {iss.operatorName && (
                      <span className="text-[11px] text-slate-500 ml-2">
                        Op: {iss.operatorName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. OPERATIONAL & SHIFT TIMING DETAILS (SOLID WHITE) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
            <Icon name="schedule" size={16} />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Operational Shift &amp; Working Hours
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Start Time</label>
            <input
              type="time"
              disabled={isViewMode}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">End Time</label>
            <input
              type="time"
              disabled={isViewMode}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Working Hours</label>
            <input
              type="number"
              inputMode="decimal"
              disabled={isViewMode}
              placeholder="e.g. 8.5"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Breakdown / Idle Hours</label>
            <input
              type="number"
              inputMode="decimal"
              disabled={isViewMode}
              placeholder="0"
              value={breakdownHours}
              onChange={(e) => setBreakdownHours(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Work Description</label>
            <input
              type="text"
              disabled={isViewMode}
              placeholder="e.g. Sub-grade excavation, Pier foundation work"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Remarks / Notes</label>
            <input
              type="text"
              disabled={isViewMode}
              placeholder="Operational remarks, weather delay, terrain details"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* 6. MOBILE STICKY BOTTOM ACTION BAR (CLEAN LIGHT) */}
      {!isViewMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between gap-2 lg:hidden shadow-lg">
          <Link
            href="/machinery/log-book"
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("draft")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Icon name="drafts" size={14} />
              Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("approved")}
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="check_circle" size={15} />
              )}
              Save &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
