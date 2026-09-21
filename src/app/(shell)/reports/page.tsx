"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getMachinery,
  getLogBooks,
  getFuelIssues,
  getBreakdowns,
  getMaintenanceRecords,
  getAttachments,
  getProjects,
  getSites,
  getVendors,
  getEngines,
  calculateDailyFuelConsumptionRecords,
} from "@/lib/data/repository";
import { money, fmt } from "@/lib/utils";
import { PrintPreviewModal } from "@/components/reports/PrintPreviewModal";
import { exportReportToExcel } from "@/lib/exportExcel";
import type { ReportColumn } from "@/components/reports/PrintableReportDocument";
import type {
  Machinery,
  LogBook,
  FuelIssue,
  Breakdown,
  MaintenanceRecord,
  Attachment,
  Project,
  Site,
  Vendor,
  Engine,
  DailyFuelConsumptionRecord,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

export default function ReportsPage() {
  const { showToast } = useToast();

  // Active Report
  const [activeReportKey, setActiveReportKey] = useState<
    | "machinery-register"
    | "daily-log"
    | "fuel-consumption"
    | "fuel-efficiency"
    | "machinery-fuel"
    | "project-fuel"
    | "breakdowns"
    | "maintenance-cost"
    | "maintenance-history"
    | "compliance-expiry"
  >("fuel-efficiency");

  // Data
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [logs, setLogs] = useState<LogBook[]>([]);
  const [fuels, setFuels] = useState<FuelIssue[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [groupingInterval, setGroupingInterval] = useState<"Day" | "Week" | "Month" | "Total">("Total");

  // Daily Consumption & Theoretical Fuel Balance records
  const [dailyConsumptionRecords, setDailyConsumptionRecords] = useState<DailyFuelConsumptionRecord[]>([]);
  const [loadingDailyConsumption, setLoadingDailyConsumption] = useState(false);

  // ERP Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, l, f, b, mnt, att, p, s, v] = await Promise.all([
        getMachinery(),
        getLogBooks(),
        getFuelIssues(),
        getBreakdowns(),
        getMaintenanceRecords(),
        getAttachments(),
        getProjects(),
        getSites(),
        getVendors(),
      ]);
      setMachinery(m);
      setLogs(l);
      setFuels(f);
      setBreakdowns(b);
      setMaintenances(mnt);
      setAttachments(att);
      setProjects(p);
      setSites(s);
      setVendors(v);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load report datasets.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadDailyConsumption = useCallback(async () => {
    setLoadingDailyConsumption(true);
    try {
      const recs = await calculateDailyFuelConsumptionRecords({
        machineryId: filterMachine !== "all" ? filterMachine : undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
        projectId: filterProject !== "all" ? filterProject : undefined,
      });
      setDailyConsumptionRecords(recs);
    } catch (e: any) {
      console.error("Failed to load daily fuel consumption records:", e);
    } finally {
      setLoadingDailyConsumption(false);
    }
  }, [filterMachine, startDate, endDate, filterProject]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (activeReportKey === "fuel-consumption" || activeReportKey === "fuel-efficiency") {
      loadDailyConsumption();
    }
  }, [activeReportKey, loadDailyConsumption]);

  // Generic CSV Downloader
  function downloadCsv(headers: string[], rows: (string | number)[][], filename: string) {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported", `Report downloaded as ${filename}.csv`);
  }

  // 10 Reports Definitions
  const REPORT_MENU = [
    { key: "machinery-register", title: "1. Machinery Register", icon: "precision_manufacturing" },
    { key: "daily-log", title: "2. Daily Log Book", icon: "menu_book" },
    { key: "fuel-consumption", title: "3. Fuel Consumption", icon: "local_gas_station" },
    { key: "fuel-efficiency", title: "4. Fuel Efficiency (KM/L vs L/Hr)", icon: "speed" },
    { key: "machinery-fuel", title: "5. Machinery-wise Fuel", icon: "equalizer" },
    { key: "project-fuel", title: "6. Project-wise Fuel", icon: "location_city" },
    { key: "breakdowns", title: "7. Breakdown Analysis", icon: "build_circle" },
    { key: "maintenance-cost", title: "8. Maintenance Cost Summary", icon: "payments" },
    { key: "maintenance-history", title: "9. Equipment Service History", icon: "handyman" },
    { key: "compliance-expiry", title: "10. Compliance Expiry Schedule", icon: "verified" },
  ];

  function handleExportCsv() {
    if (activeReportKey === "machinery-register") {
      const headers = ["Asset Code", "Registration", "Name", "Type", "Make", "Model", "Meter Type", "Current Reading", "Project", "Status"];
      const rows = machinery.map((m) => [
        m.assetCode,
        m.registrationNo || "Non-Road",
        m.machineryName,
        m.machineryType,
        m.make,
        m.model,
        m.meterType,
        m.currentReading,
        projects.find((p) => p.id === m.currentProjectId)?.code || "Unassigned",
        m.status,
      ]);
      downloadCsv(headers, rows, "Machinery_Register");
    } else if (activeReportKey === "fuel-consumption") {
      const headers = [
        "Date",
        "Asset Code",
        "Machinery Name",
        "Engine",
        "Meter",
        "Opening Reading",
        "Closing Reading",
        "Run",
        "Standard",
        "Opening Balance (L)",
        "Fuel Issued (L)",
        "Consumption (L)",
        "Closing Balance (L)",
        "Status",
      ];
      const rows: (string | number)[][] = dailyConsumptionRecords.map((r) => [
        r.date,
        r.assetCode || "—",
        r.machineryName,
        r.engineName || "Main Propulsion",
        r.meterType,
        r.openingReading,
        r.closingReading,
        r.totalRun,
        r.standardFuelEfficiency,
        r.openingFuelBalance.toFixed(2),
        r.fuelIssuedToday.toFixed(2),
        r.theoreticalConsumption.toFixed(2),
        r.closingFuelBalance.toFixed(2),
        r.status,
      ]);
      downloadCsv(headers, rows, "Daily_Fuel_Consumption_Ledger");
    } else if (activeReportKey === "fuel-efficiency") {
      const headers = ["Asset Code", "Name", "Meter", "Total Run", "Fuel Litres", "Actual Average", "Standard", "Variance", "Status", "Fuel Cost"];
      const rows = machinery
        .filter((m) => filterMachine === "all" || m.id === filterMachine)
        .map((m) => {
          const mFuels = fuels.filter((f) => f.machineryId === m.id && f.status === "confirmed");
          const mLogs = logs.filter((l) => l.machineryId === m.id && l.status !== "cancelled");
          const lts = mFuels.reduce((s, f) => s + f.quantityLitres, 0);
          const amt = mFuels.reduce((s, f) => s + f.amount, 0);
          const units = mLogs.reduce((s, l) => s + l.totalKmHours, 0);
          const std = m.standardFuelEfficiency != null && Number(m.standardFuelEfficiency) > 0 ? Number(m.standardFuelEfficiency) : null;
          const eff = m.meterType === "KM" ? (lts > 0 ? (units / lts).toFixed(2) : "0") : (units > 0 ? (lts / units).toFixed(2) : "0");
          const effUnit = m.meterType === "KM" ? "KM/L" : "L/Hr";
          const variance = std != null && Number(eff) > 0 ? (Number(eff) - std).toFixed(2) : "—";
          return [
            m.assetCode,
            getMachineryDisplayName(m),
            m.meterType,
            units,
            lts,
            `${eff} ${effUnit}`,
            std != null ? `${std} ${effUnit}` : "Not Set",
            variance,
            m.status,
            amt,
          ];
        });
      downloadCsv(headers, rows, "Fuel_Efficiency_Audit");
    } else if (activeReportKey === "breakdowns") {
      const headers = ["Breakdown No", "Date", "Asset Code", "Reading", "Problem", "Priority", "Status", "Downtime Hrs", "Reported By"];
      const rows = breakdowns.map((b) => {
        const m = machinery.find((mac) => mac.id === b.machineryId);
        return [
          b.breakdownNo,
          b.breakdownDate,
          m?.assetCode || b.machineryId,
          b.currentReading,
          b.problemDescription,
          b.priority,
          b.status,
          b.downtimeHours || 0,
          b.reportedBy,
        ];
      });
      downloadCsv(headers, rows, "Breakdown_Analysis_Report");
    } else if (activeReportKey === "maintenance-cost") {
      const headers = ["Maintenance No", "Date", "Asset Code", "Type", "Estimated Cost", "Parts Cost", "Labour Cost", "Actual Cost", "Vendor", "Status"];
      const rows = maintenances.map((mnt) => {
        const m = machinery.find((mac) => mac.id === mnt.machineryId);
        const v = vendors.find((vnd) => vnd.id === mnt.vendorId);
        return [
          mnt.maintenanceNo,
          mnt.serviceDate,
          m?.assetCode || mnt.machineryId,
          mnt.maintenanceType,
          mnt.estimatedCost,
          mnt.partsCost,
          mnt.labourCost,
          mnt.actualCost,
          v?.name || "Internal Workshop",
          mnt.status,
        ];
      });
      downloadCsv(headers, rows, "Maintenance_Cost_Report");
    } else {
      showToast("Notice", "Export ready for this report table.");
    }
  }

  function handleExportExcel() {
    try {
      const data = getPrintData();
      exportReportToExcel({
        reportTitle: data.reportTitle,
        companyName: "MILESTONE INFRASTRUCTURE ERP",
        periodText: data.periodText,
        filters: data.filters,
        columns: data.columns,
        rows: data.rows,
        totals: data.totals,
        filename: activeReportKey,
      });
      showToast("Excel Exported", `${data.reportTitle} downloaded as Excel spreadsheet (.xlsx).`);
    } catch (err: any) {
      showToast("Export Failed", err.message || "Failed to generate Excel file.", "error");
    }
  }

  const getPrintData = (): {
    reportTitle: string;
    periodText?: string;
    filters: { label: string; value: string }[];
    columns: ReportColumn[];
    rows: (string | number)[][];
    totals?: (string | number | null)[];
    defaultOrientation: "portrait" | "landscape" | "auto";
  } => {
    const periodText =
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : startDate
        ? `From ${startDate}`
        : endDate
        ? `Up to ${endDate}`
        : "All Recorded Operations";

    const activeFilters = [
      { label: "Reporting Period", value: periodText },
      {
        label: "Machinery Scope",
        value:
          filterMachine !== "all"
            ? machinery.find((m) => m.id === filterMachine)?.assetCode || filterMachine
            : "All Equipment",
      },
      {
        label: "Project Scope",
        value:
          filterProject !== "all"
            ? projects.find((p) => p.id === filterProject)?.code || filterProject
            : "All Projects",
      },
    ];

    if (activeReportKey === "machinery-register") {
      const columns: ReportColumn[] = [
        { header: "Asset Code", width: "12%" },
        { header: "Registration", width: "14%" },
        { header: "Machinery Name", width: "24%" },
        { header: "Category", width: "14%" },
        { header: "Meter", width: "8%" },
        { header: "Std Eff", width: "10%", align: "right" },
        { header: "Reading", width: "10%", align: "right" },
        { header: "Status", width: "8%" },
      ];
      const rows = machinery.map((m) => [
        m.assetCode,
        m.registrationNo || "Non-Road",
        getMachineryDisplayName(m),
        m.category || m.machineryType || "General",
        m.meterType,
        m.standardFuelEfficiency
          ? `${m.standardFuelEfficiency} ${m.meterType === "KM" ? "KM/L" : "L/Hr"}`
          : "—",
        m.currentReading,
        m.status.toUpperCase(),
      ]);
      return {
        reportTitle: "Machinery Asset Master Register",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "daily-log") {
      const columns: ReportColumn[] = [
        { header: "Log No", width: "16%" },
        { header: "Date", width: "10%" },
        { header: "Machinery / Equipment", width: "24%" },
        { header: "Operator", width: "16%" },
        { header: "Opening", width: "9%", align: "right" },
        { header: "Closing", width: "9%", align: "right" },
        { header: "Run", width: "8%", align: "right" },
        { header: "Work Hrs", width: "8%", align: "right" },
      ];
      const filteredLogs = logs.filter((l) => {
        if (filterMachine !== "all" && l.machineryId !== filterMachine) return false;
        if (startDate && l.date < startDate) return false;
        if (endDate && l.date > endDate) return false;
        return l.status !== "cancelled";
      });
      const rows = filteredLogs.map((l) => {
        const m = machinery.find((mac) => mac.id === l.machineryId);
        return [
          l.logNo,
          l.date,
          m ? getMachineryDisplayName(m) : l.machineryId,
          l.operatorName || "—",
          l.openingReading,
          l.closingReading,
          l.totalKmHours,
          l.workingHours || 0,
        ];
      });
      const totalRun = filteredLogs.reduce((s, l) => s + (l.totalKmHours || 0), 0);
      const totalWork = filteredLogs.reduce((s, l) => s + (l.workingHours || 0), 0);
      return {
        reportTitle: "Daily Log Book Operational Ledger",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Total", "", "", "", "", "", totalRun.toFixed(1), totalWork.toFixed(1)],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "fuel-consumption") {
      const columns: ReportColumn[] = [
        { header: "Date", width: "9%" },
        { header: "Asset Code", width: "10%" },
        { header: "Machinery Name", width: "20%" },
        { header: "Engine", width: "11%" },
        { header: "Meter", width: "6%" },
        { header: "Run", width: "7%", align: "right" },
        { header: "Std", width: "7%", align: "right" },
        { header: "Open (L)", width: "8%", align: "right" },
        { header: "Fuel (L)", width: "8%", align: "right" },
        { header: "Cons (L)", width: "8%", align: "right" },
        { header: "Close (L)", width: "8%", align: "right" },
        { header: "Status", width: "8%" },
      ];
      const rows = dailyConsumptionRecords.map((r) => [
        r.date,
        r.assetCode || "—",
        r.machineryName,
        r.engineName || "Main",
        r.meterType,
        r.totalRun,
        r.standardFuelEfficiency || "—",
        r.openingFuelBalance.toFixed(2),
        r.fuelIssuedToday.toFixed(2),
        r.theoreticalConsumption.toFixed(2),
        r.closingFuelBalance.toFixed(2),
        r.status,
      ]);
      const totalFuelIssued = dailyConsumptionRecords.reduce((s, r) => s + r.fuelIssuedToday, 0);
      const totalCons = dailyConsumptionRecords.reduce((s, r) => s + r.theoreticalConsumption, 0);
      return {
        reportTitle: "Daily Fuel Consumption & Book Balance Ledger",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", "", "", "", "", "", "", totalFuelIssued.toFixed(2), totalCons.toFixed(2), "", ""],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "fuel-efficiency") {
      const columns: ReportColumn[] = [
        { header: "Asset Code", width: "10%" },
        { header: "Machinery Name", width: "22%" },
        { header: "Meter", width: "7%" },
        { header: "Total Run", width: "10%", align: "right" },
        { header: "Fuel Issued (L)", width: "11%", align: "right" },
        { header: "Actual Average", width: "11%", align: "right" },
        { header: "Standard", width: "9%", align: "right" },
        { header: "Variance", width: "9%", align: "right" },
        { header: "Status", width: "11%" },
      ];
      const targetMachines = machinery.filter(
        (m) => filterMachine === "all" || m.id === filterMachine
      );
      let totalRunSum = 0;
      let totalFuelSum = 0;
      const rows = targetMachines.map((m) => {
        const mFuels = fuels.filter((f) => {
          if (f.machineryId !== m.id || f.status !== "confirmed") return false;
          if (startDate && f.issueDate < startDate) return false;
          if (endDate && f.issueDate > endDate) return false;
          return true;
        });
        const mLogs = logs.filter((l) => {
          if (l.machineryId !== m.id || l.status === "cancelled") return false;
          if (startDate && l.date < startDate) return false;
          if (endDate && l.date > endDate) return false;
          return true;
        });
        const lts = mFuels.reduce((s, f) => s + f.quantityLitres, 0);
        const units = mLogs.reduce((s, l) => s + l.totalKmHours, 0);
        totalRunSum += units;
        totalFuelSum += lts;
        const std =
          m.standardFuelEfficiency != null && Number(m.standardFuelEfficiency) > 0
            ? Number(m.standardFuelEfficiency)
            : null;
        const eff =
          m.meterType === "KM"
            ? lts > 0
              ? (units / lts).toFixed(2)
              : "0"
            : units > 0
            ? (lts / units).toFixed(2)
            : "0";
        const effUnit = m.meterType === "KM" ? "KM/L" : "L/Hr";
        const variance =
          std != null && Number(eff) > 0 ? (Number(eff) - std).toFixed(2) : "—";
        let status = "No Data";
        if (lts > 0 && units > 0) {
          if (std != null && std > 0) {
            status =
              m.meterType === "KM"
                ? Number(eff) >= std
                  ? "Within Standard"
                  : "Higher Consumption"
                : Number(eff) <= std
                ? "Within Standard"
                : "Higher Consumption";
          } else {
            status = "No Standard Set";
          }
        }
        return [
          m.assetCode,
          getMachineryDisplayName(m),
          m.meterType,
          units.toFixed(1),
          lts.toFixed(1),
          `${eff} ${effUnit}`,
          std != null ? `${std} ${effUnit}` : "Not Set",
          variance,
          status,
        ];
      });
      return {
        reportTitle: "Machinery Fuel Efficiency & Audit Report",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", "", totalRunSum.toFixed(1), totalFuelSum.toFixed(1), "", "", "", ""],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "machinery-fuel") {
      const columns: ReportColumn[] = [
        { header: "Asset Code", width: "12%" },
        { header: "Machinery Name", width: "32%" },
        { header: "Issues Count", width: "12%", align: "right" },
        { header: "Fuel Litres", width: "16%", align: "right" },
        { header: "Total Amount (₹)", width: "16%", align: "right" },
        { header: "% of Fleet", width: "12%", align: "right" },
      ];
      const targetMachines = machinery.filter(
        (m) => filterMachine === "all" || m.id === filterMachine
      );
      const allConfirmedFuels = fuels.filter((f) => f.status === "confirmed");
      const fleetLitres = allConfirmedFuels.reduce((s, f) => s + f.quantityLitres, 0) || 1;
      let totalLts = 0;
      let totalAmt = 0;
      let totalIssues = 0;
      const rows = targetMachines.map((m) => {
        const mFuels = fuels.filter((f) => {
          if (f.machineryId !== m.id || f.status !== "confirmed") return false;
          if (startDate && f.issueDate < startDate) return false;
          if (endDate && f.issueDate > endDate) return false;
          return true;
        });
        const lts = mFuels.reduce((s, f) => s + f.quantityLitres, 0);
        const amt = mFuels.reduce((s, f) => s + f.amount, 0);
        totalLts += lts;
        totalAmt += amt;
        totalIssues += mFuels.length;
        const pct = ((lts / fleetLitres) * 100).toFixed(1);
        return [
          m.assetCode,
          getMachineryDisplayName(m),
          mFuels.length,
          lts.toFixed(1),
          money(amt),
          `${pct}%`,
        ];
      });
      return {
        reportTitle: "Machinery-wise Fuel Consumption Summary",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", totalIssues, totalLts.toFixed(1), money(totalAmt), "100%"],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "project-fuel") {
      const columns: ReportColumn[] = [
        { header: "Project Code", width: "15%" },
        { header: "Project Name", width: "35%" },
        { header: "Equipment Count", width: "15%", align: "right" },
        { header: "Fuel Litres (L)", width: "17%", align: "right" },
        { header: "Total Fuel Cost (₹)", width: "18%", align: "right" },
      ];
      let sumLts = 0;
      let sumAmt = 0;
      const rows = projects.map((p) => {
        const pFuels = fuels.filter((f) => {
          if (f.projectId !== p.id || f.status !== "confirmed") return false;
          if (startDate && f.issueDate < startDate) return false;
          if (endDate && f.issueDate > endDate) return false;
          return true;
        });
        const lts = pFuels.reduce((s, f) => s + f.quantityLitres, 0);
        const amt = pFuels.reduce((s, f) => s + f.amount, 0);
        const mCount = machinery.filter((m) => m.currentProjectId === p.id).length;
        sumLts += lts;
        sumAmt += amt;
        return [p.code, p.name, mCount, lts.toFixed(1), money(amt)];
      });
      return {
        reportTitle: "Project-wise Fuel Distribution & Cost Report",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", machinery.length, sumLts.toFixed(1), money(sumAmt)],
        defaultOrientation: "portrait",
      };
    }

    if (activeReportKey === "breakdowns") {
      const columns: ReportColumn[] = [
        { header: "Breakdown No", width: "14%" },
        { header: "Reported Date", width: "10%" },
        { header: "Machinery", width: "22%" },
        { header: "Problem Description", width: "26%" },
        { header: "Priority", width: "9%" },
        { header: "Downtime", width: "10%", align: "right" },
        { header: "Status", width: "9%" },
      ];
      const filteredBreakdowns = breakdowns.filter((b) => {
        if (filterMachine !== "all" && b.machineryId !== filterMachine) return false;
        if (startDate && b.breakdownDate < startDate) return false;
        if (endDate && b.breakdownDate > endDate) return false;
        return true;
      });
      const totalDowntime = filteredBreakdowns.reduce((s, b) => s + (b.downtimeHours || 0), 0);
      const rows = filteredBreakdowns.map((b) => {
        const m = machinery.find((mac) => mac.id === b.machineryId);
        return [
          b.breakdownNo,
          b.breakdownDate,
          m ? getMachineryDisplayName(m) : b.machineryId,
          b.problemDescription,
          b.priority.toUpperCase(),
          `${b.downtimeHours || 0} hrs`,
          b.status.toUpperCase(),
        ];
      });
      return {
        reportTitle: "Equipment Breakdown & Downtime Analysis",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", "", "", "", `${totalDowntime} hrs`, ""],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "maintenance-cost") {
      const columns: ReportColumn[] = [
        { header: "Asset Code", width: "12%" },
        { header: "Machinery Name", width: "28%" },
        { header: "Services", width: "10%", align: "right" },
        { header: "Parts Cost (₹)", width: "16%", align: "right" },
        { header: "Labour Cost (₹)", width: "16%", align: "right" },
        { header: "Total Actual Cost (₹)", width: "18%", align: "right" },
      ];
      let grandParts = 0;
      let grandLabour = 0;
      let grandActual = 0;
      let grandServices = 0;
      const rows = machinery.map((m) => {
        const mMnts = maintenances.filter((mnt) => {
          if (mnt.machineryId !== m.id) return false;
          if (startDate && mnt.serviceDate < startDate) return false;
          if (endDate && mnt.serviceDate > endDate) return false;
          return true;
        });
        const parts = mMnts.reduce((s, mnt) => s + (mnt.partsCost || 0), 0);
        const labour = mMnts.reduce((s, mnt) => s + (mnt.labourCost || 0), 0);
        const actual = mMnts.reduce((s, mnt) => s + (mnt.actualCost || 0), 0);
        grandParts += parts;
        grandLabour += labour;
        grandActual += actual;
        grandServices += mMnts.length;
        return [
          m.assetCode,
          getMachineryDisplayName(m),
          mMnts.length,
          money(parts),
          money(labour),
          money(actual),
        ];
      });
      return {
        reportTitle: "Machinery Maintenance & Repair Cost Summary",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", grandServices, money(grandParts), money(grandLabour), money(grandActual)],
        defaultOrientation: "landscape",
      };
    }

    if (activeReportKey === "maintenance-history") {
      const columns: ReportColumn[] = [
        { header: "Service No", width: "14%" },
        { header: "Service Date", width: "10%" },
        { header: "Machinery", width: "22%" },
        { header: "Type", width: "12%" },
        { header: "Reading", width: "10%", align: "right" },
        { header: "Vendor / Workshop", width: "18%" },
        { header: "Actual Cost (₹)", width: "14%", align: "right" },
      ];
      const filteredMnts = maintenances.filter((mnt) => {
        if (filterMachine !== "all" && mnt.machineryId !== filterMachine) return false;
        if (startDate && mnt.serviceDate < startDate) return false;
        if (endDate && mnt.serviceDate > endDate) return false;
        return true;
      });
      const totalCost = filteredMnts.reduce((s, mnt) => s + (mnt.actualCost || 0), 0);
      const rows = filteredMnts.map((mnt) => {
        const m = machinery.find((mac) => mac.id === mnt.machineryId);
        const v = vendors.find((vnd) => vnd.id === mnt.vendorId);
        return [
          mnt.maintenanceNo,
          mnt.serviceDate,
          m ? getMachineryDisplayName(m) : mnt.machineryId,
          mnt.maintenanceType,
          mnt.currentReading,
          v?.name || "Internal Workshop",
          money(mnt.actualCost || 0),
        ];
      });
      return {
        reportTitle: "Equipment Maintenance & Workshop Service History",
        periodText,
        filters: activeFilters,
        columns,
        rows,
        totals: ["Totals", "", "", "", "", "", money(totalCost)],
        defaultOrientation: "landscape",
      };
    }

    // Default: compliance-expiry
    const columns: ReportColumn[] = [
      { header: "Asset Code", width: "10%" },
      { header: "Machinery", width: "22%" },
      { header: "Ownership", width: "10%" },
      { header: "Road Tax Expiry", width: "12%" },
      { header: "Fitness Expiry", width: "12%" },
      { header: "Insurance Expiry", width: "12%" },
      { header: "PUC Expiry", width: "11%" },
      { header: "Permit Expiry", width: "11%" },
    ];
    const rows = machinery.map((m) => [
      m.assetCode,
      getMachineryDisplayName(m),
      m.ownership === "rental" ? "Rental" : "Own",
      m.roadTaxExpiry || "—",
      m.fitnessExpiry || "—",
      m.insuranceExpiry || "—",
      m.pucExpiry || "—",
      m.permitExpiry || "—",
    ]);
    return {
      reportTitle: "Statutory Compliance & Document Expiry Schedule",
      periodText,
      filters: activeFilters,
      columns,
      rows,
      defaultOrientation: "landscape",
    };
  };

  return (
    <PageTransition className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Reports & MIS Analytics"
          subtitle="Generate operational registries, fuel efficiency audits, maintenance cost ledgers, and compliance schedules."
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="btn-secondary text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Icon name="print" className="text-sm" /> Print Preview &amp; PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
              >
                <Icon name="table_chart" className="text-sm" /> Export Excel (.xlsx)
              </button>
              <button
                onClick={handleExportCsv}
                className="btn-secondary text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Icon name="download" className="text-sm" /> CSV
              </button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Menu of All 10 Reports */}
        <div className="card p-3 space-y-1 h-fit print:hidden">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Select Report
          </p>
          {REPORT_MENU.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveReportKey(r.key as any)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                activeReportKey === r.key
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon name={r.icon} className="text-base shrink-0" />
              <span className="truncate">{r.title}</span>
            </button>
          ))}
        </div>

        {/* Right Report Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Report Header & Filters */}
          <div className="card p-5 space-y-4 print:border-none print:p-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {REPORT_MENU.find((r) => r.key === activeReportKey)?.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time aggregated figures from active operational tables.
                </p>
              </div>

              {/* Machinery & Project Filter in Report */}
              <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                {/* Grouping Interval for Efficiency */}
                {(activeReportKey === "fuel-efficiency" || activeReportKey === "fuel-consumption") && (
                  <select
                    value={groupingInterval}
                    onChange={(e) => setGroupingInterval(e.target.value as any)}
                    className="form-select text-xs font-semibold text-blue-700 bg-blue-50/50 border-blue-200 w-auto"
                  >
                    <option value="Total">Summary: Total Period</option>
                    <option value="Day">Group by Day</option>
                    <option value="Week">Group by Week</option>
                    <option value="Month">Group by Month</option>
                  </select>
                )}

                <select
                  value={filterMachine}
                  onChange={(e) => setFilterMachine(e.target.value)}
                  className="form-select text-xs font-medium w-auto"
                >
                  <option value="all">All Machinery ({machinery.length})</option>
                  {machinery.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.assetCode} — {getMachineryDisplayName(m)}
                    </option>
                  ))}
                </select>

                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="form-select text-xs font-medium w-auto"
                >
                  <option value="all">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* REPORT 4: FUEL EFFICIENCY AUDIT (STRICT KM/L vs L/HR) */}
            {activeReportKey === "fuel-efficiency" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
                  <span className="font-semibold">Strict Meter Rule:</span>
                  <span>KM Machinery = Evaluated as KM/L &amp; L/100 KM</span>
                  <span>·</span>
                  <span>HOUR Machinery = Evaluated as L/Hour</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="table-head">
                        <th className="px-4 py-3">Asset Code</th>
                        <th className="px-4 py-3">Name &amp; Make</th>
                        <th className="px-4 py-3">Meter</th>
                        <th className="px-4 py-3 text-right">Total Run</th>
                        <th className="px-4 py-3 text-right">Fuel Litres</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-900">Actual Average</th>
                        <th className="px-4 py-3 text-right">Standard</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Fuel Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {machinery
                        .filter((m) => filterMachine === "all" || m.id === filterMachine)
                        .map((m) => {
                          const mFuels = fuels.filter((f) => {
                            if (f.machineryId !== m.id || f.status !== "confirmed") return false;
                            if (startDate && f.issueDate < startDate) return false;
                            if (endDate && f.issueDate > endDate) return false;
                            return true;
                          });
                          const mLogs = logs.filter((l) => {
                            if (l.machineryId !== m.id || l.status === "cancelled") return false;
                            if (startDate && l.date < startDate) return false;
                            if (endDate && l.date > endDate) return false;
                            return true;
                          });
                          const lts = mFuels.reduce((s, f) => s + f.quantityLitres, 0);
                          const amt = mFuels.reduce((s, f) => s + f.amount, 0);
                          const units = mLogs.reduce((s, l) => s + l.totalKmHours, 0);
                          const std = m.standardFuelEfficiency != null && Number(m.standardFuelEfficiency) > 0 ? Number(m.standardFuelEfficiency) : null;

                          let effStr = "—";
                          let varNum: number | null = null;
                          let status = "No Data";
                          let tone: "green" | "red" | "slate" = "slate";

                          if (m.meterType === "KM") {
                            const kml = lts > 0 ? Number((units / lts).toFixed(2)) : 0;
                            effStr = lts > 0 ? `${kml.toFixed(2)} KM/L` : "—";
                            if (lts > 0 && units > 0) {
                              if (std != null && std > 0) {
                                varNum = Number((kml - std).toFixed(2));
                                status = kml >= std ? "Within Standard" : "Higher Consumption";
                                tone = kml >= std ? "green" : "red";
                              } else {
                                status = "No Standard Set";
                                tone = "slate";
                              }
                            }
                          } else {
                            const lhr = units > 0 ? Number((lts / units).toFixed(2)) : 0;
                            effStr = units > 0 ? `${lhr.toFixed(2)} L/Hr` : "—";
                            if (lts > 0 && units > 0) {
                              if (std != null && std > 0) {
                                varNum = Number((lhr - std).toFixed(2));
                                status = lhr <= std ? "Within Standard" : "Higher Consumption";
                                tone = lhr <= std ? "green" : "red";
                              } else {
                                status = "No Standard Set";
                                tone = "slate";
                              }
                            }
                          }

                          return (
                            <tr key={m.id} className="table-row">
                              <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{m.assetCode}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900 text-xs">{getMachineryDisplayName(m)}</p>
                                <p className="text-[11px] text-gray-500">{m.make} {m.model || ""}</p>
                              </td>
                              <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{m.meterType}</td>
                              <td className="px-4 py-3 font-mono text-gray-800 text-right text-xs">{units.toLocaleString(undefined, { minimumFractionDigits: 1 })} {m.meterType}</td>
                              <td className="px-4 py-3 font-mono text-gray-800 text-right text-xs">{lts.toLocaleString(undefined, { minimumFractionDigits: 1 })} L</td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-900 text-right text-xs">{effStr}</td>
                              <td className="px-4 py-3 font-mono text-gray-500 text-right text-xs">
                                {std != null ? `${std.toFixed(2)} ${m.meterType === "KM" ? "KM/L" : "L/Hr"}` : <span className="text-gray-400">Not Set</span>}
                              </td>
                              <td className="px-4 py-3 font-mono text-right font-semibold text-xs">
                                {varNum != null ? (
                                  <span className={tone === "green" ? "text-emerald-700" : "text-rose-600"}>
                                    {varNum > 0 ? `+${varNum.toFixed(2)}` : varNum.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill tone={tone}>
                                  {status}
                                </StatusPill>
                              </td>
                              <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-right text-xs">{money(amt)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 1: MACHINERY REGISTER */}
            {activeReportKey === "machinery-register" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-3">Asset Code</th>
                      <th className="px-4 py-3">Registration</th>
                      <th className="px-4 py-3">Name &amp; Type</th>
                      <th className="px-4 py-3">Make / Model</th>
                      <th className="px-4 py-3">Meter</th>
                      <th className="px-4 py-3">Current Reading</th>
                      <th className="px-4 py-3">Assigned Project</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {machinery.map((m) => {
                      const prj = projects.find((p) => p.id === m.currentProjectId);
                      return (
                        <tr key={m.id} className="table-row">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{m.assetCode}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 text-xs">{m.registrationNo || "Non-Road"}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{m.machineryName}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{m.make} {m.model}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{m.meterType}</td>
                          <td className="px-4 py-3 font-mono text-gray-900 text-xs">{m.currentReading}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{prj ? prj.code : "Unassigned"}</td>
                          <td className="px-4 py-3">
                            <StatusPill tone={m.status === "active" ? "green" : "red"}>{m.status}</StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 2: DAILY LOG BOOK */}
            {activeReportKey === "daily-log" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-3">Log No</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Machine</th>
                      <th className="px-4 py-3">Opening</th>
                      <th className="px-4 py-3">Closing</th>
                      <th className="px-4 py-3">Total Run</th>
                      <th className="px-4 py-3">Work Hours</th>
                      <th className="px-4 py-3">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((l) => {
                      const m = machinery.find((mac) => mac.id === l.machineryId);
                      return (
                        <tr key={l.id} className="table-row">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{l.logNo}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{l.date}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{m?.assetCode}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 text-xs">{l.openingReading}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 text-xs">{l.closingReading}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{l.totalKmHours} {m?.meterType}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{l.workingHours || "—"}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{l.operatorName || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 3: DAILY THEORETICAL FUEL CONSUMPTION & BALANCE LEDGER */}
            {activeReportKey === "fuel-consumption" && (
              <div className="space-y-4">
                {/* Physical Tank Disclaimer Banner */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Icon name="info" className="text-amber-700 text-base shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      Theoretical / Book Fuel Balance Disclaimer
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Balances shown below are mathematical book figures calculated from cumulative fuel issues minus benchmark consumption based on logged KM / Hours. This is an analytical control figure and does not represent an automated physical fuel level sensor reading.
                    </p>
                  </div>
                </div>

                {loadingDailyConsumption ? (
                  <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                    <span className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-xs">Computing daily consumption &amp; theoretical balances...</p>
                  </div>
                ) : dailyConsumptionRecords.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-gray-200">
                    No daily logs or fuel records found for the selected machinery and date criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="table-head">
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Machinery</th>
                          <th className="px-3.5 py-2.5">Engine</th>
                          <th className="px-3.5 py-2.5">Meter</th>
                          <th className="px-3.5 py-2.5 text-right">Opening</th>
                          <th className="px-3.5 py-2.5 text-right">Closing</th>
                          <th className="px-3.5 py-2.5 text-right font-bold">Run</th>
                          <th className="px-3.5 py-2.5 text-right">Standard</th>
                          <th className="px-3.5 py-2.5 text-right">Opening Bal</th>
                          <th className="px-3.5 py-2.5 text-right">Fuel Issued</th>
                          <th className="px-3.5 py-2.5 text-right font-bold text-rose-700">Consumption</th>
                          <th className="px-3.5 py-2.5 text-right font-bold text-gray-900">Closing Bal</th>
                          <th className="px-3.5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dailyConsumptionRecords.map((r) => {
                          const statusTone =
                            r.status === "Normal"
                              ? "green"
                              : r.status === "Review Required"
                              ? "amber"
                              : r.status === "Negative Book Balance"
                              ? "red"
                              : "slate";

                          return (
                            <tr key={r.id} className="table-row">
                              <td className="px-3.5 py-2.5 font-mono text-gray-700 whitespace-nowrap">{r.date}</td>
                              <td className="px-3.5 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                                <span className="font-bold text-blue-600 font-mono mr-1.5">{r.assetCode}</span>
                                <span>{r.machineryName}</span>
                              </td>
                              <td className="px-3.5 py-2.5 text-gray-600 whitespace-nowrap">
                                {r.engineName || "Main Engine"}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-semibold text-gray-700">{r.meterType}</td>
                              <td className="px-3.5 py-2.5 font-mono text-right text-gray-600">{fmt(r.openingReading)}</td>
                              <td className="px-3.5 py-2.5 font-mono text-right text-gray-600">{fmt(r.closingReading)}</td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-right text-gray-900">{fmt(r.totalRun)}</td>
                              <td className="px-3.5 py-2.5 font-mono text-right text-gray-500">
                                {r.standardFuelEfficiency.toFixed(2)} {r.meterType === "KM" ? "KM/L" : "L/Hr"}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-right text-gray-700">
                                {r.openingFuelBalance.toFixed(1)} L
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-right text-emerald-700">
                                {r.fuelIssuedToday > 0 ? `+${r.fuelIssuedToday.toFixed(1)} L` : "0.0 L"}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-right text-rose-700">
                                -{r.theoreticalConsumption.toFixed(1)} L
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-right text-gray-900">
                                <span className={r.closingFuelBalance < 0 ? "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" : ""}>
                                  {r.closingFuelBalance.toFixed(1)} L
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <StatusPill tone={statusTone}>{r.status}</StatusPill>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* REPORT 6: PROJECT-WISE FUEL */}
            {activeReportKey === "project-fuel" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-3">Project Code</th>
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Active Sites</th>
                      <th className="px-4 py-3">Assigned Machines</th>
                      <th className="px-4 py-3">Total Litres Consumed</th>
                      <th className="px-4 py-3">Total Fuel Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((p) => {
                      const pSites = sites.filter((s) => s.projectId === p.id);
                      const pMachs = machinery.filter((m) => m.currentProjectId === p.id || m.projectId === p.id);
                      const machIds = pMachs.map((m) => m.id);
                      const pFuels = fuels.filter((f) => f.projectId === p.id || machIds.includes(f.machineryId));
                      const totalL = pFuels.reduce((s, f) => s + f.quantityLitres, 0);
                      const totalC = pFuels.reduce((s, f) => s + f.amount, 0);

                      return (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{p.code}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{p.name}</td>
                          <td className="px-4 py-3 font-mono text-gray-700 text-xs">{pSites.length} Sites</td>
                          <td className="px-4 py-3 font-mono text-gray-700 text-xs">{pMachs.length} Units</td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{totalL.toLocaleString()} L</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-xs">{money(totalC)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 7: BREAKDOWN ANALYSIS */}
            {activeReportKey === "breakdowns" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-3">Incident No</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Machine</th>
                      <th className="px-4 py-3">Problem Description</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Downtime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {breakdowns.map((b) => {
                      const m = machinery.find((mac) => mac.id === b.machineryId);
                      return (
                        <tr key={b.id} className="table-row">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{b.breakdownNo}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{b.breakdownDate}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{m?.assetCode}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{b.problemDescription}</td>
                          <td className="px-4 py-3">
                            <StatusPill tone={b.priority === "critical" ? "red" : "amber"}>{b.priority}</StatusPill>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone={b.status === "completed" ? "green" : "red"}>{b.status}</StatusPill>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-700 text-xs">{b.downtimeHours || 0} hrs</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 8: MAINTENANCE COST SUMMARY */}
            {activeReportKey === "maintenance-cost" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-3">Mnt No</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Machine</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Parts Cost</th>
                      <th className="px-4 py-3">Labour Cost</th>
                      <th className="px-4 py-3">Actual Total</th>
                      <th className="px-4 py-3">Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenances.map((mnt) => {
                      const m = machinery.find((mac) => mac.id === mnt.machineryId);
                      const v = vendors.find((vnd) => vnd.id === mnt.vendorId);
                      return (
                        <tr key={mnt.id} className="table-row">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">{mnt.maintenanceNo}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{mnt.serviceDate}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{m?.assetCode}</td>
                          <td className="px-4 py-3 capitalize text-gray-600 text-xs">{mnt.maintenanceType}</td>
                          <td className="px-4 py-3 font-mono text-gray-700 text-xs">{money(mnt.partsCost)}</td>
                          <td className="px-4 py-3 font-mono text-gray-700 text-xs">{money(mnt.labourCost)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-xs">{money(mnt.actualCost)}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{v?.name || "Internal"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 10: COMPLIANCE EXPIRY SCHEDULE */}
            {activeReportKey === "compliance-expiry" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3.5 py-2.5">Asset Code</th>
                      <th className="px-3.5 py-2.5">Machinery</th>
                      <th className="px-3.5 py-2.5">Ownership</th>
                      <th className="px-3.5 py-2.5">Road Tax</th>
                      <th className="px-3.5 py-2.5">Fitness</th>
                      <th className="px-3.5 py-2.5">Insurance</th>
                      <th className="px-3.5 py-2.5">PUC</th>
                      <th className="px-3.5 py-2.5">Permit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {machinery.map((m) => {
                      const now = new Date();
                      const renderDocStatus = (dateStr?: string | null, docNo?: string | null) => {
                        if (!dateStr) return <span className="text-gray-400 font-mono text-[11px]">—</span>;
                        const exp = new Date(dateStr);
                        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
                        const isExpired = daysLeft < 0;
                        const isSoon = daysLeft >= 0 && daysLeft <= 30;

                        return (
                          <div>
                            <span
                              className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                isExpired
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : isSoon
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {dateStr}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {isExpired ? (
                                <span className="text-rose-600 font-medium">Expired {Math.abs(daysLeft)}d ago</span>
                              ) : isSoon ? (
                                <span className="text-amber-600 font-medium">{daysLeft}d remaining</span>
                              ) : (
                                <span className="text-gray-400">{daysLeft}d left</span>
                              )}
                              {docNo && <span className="font-mono text-gray-500 ml-1">({docNo})</span>}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <tr key={m.id} className="table-row">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">{m.assetCode}</td>
                          <td className="px-3.5 py-2.5">
                            <p className="font-semibold text-gray-900">{getMachineryDisplayName(m)}</p>
                            <p className="text-[11px] text-gray-500">{m.category ? m.category.toUpperCase() : ""}</p>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              m.ownership === "rental"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {m.ownership === "rental" ? "Rental" : "Own"}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{renderDocStatus(m.roadTaxExpiry, m.roadTaxDocNo)}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{renderDocStatus(m.fitnessExpiry, m.fitnessDocNo)}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{renderDocStatus(m.insuranceExpiry, m.insuranceDocNo)}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{renderDocStatus(m.pucExpiry, m.pucDocNo)}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{renderDocStatus(m.permitExpiry, m.permitDocNo)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Professional ERP Print Preview Modal */}
      {isPrintModalOpen && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          {...getPrintData()}
        />
      )}
    </PageTransition>
  );
}
