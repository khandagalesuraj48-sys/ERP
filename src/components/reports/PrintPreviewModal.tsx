"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  PrintableReportDocument,
  type ReportColumn,
} from "./PrintableReportDocument";

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  periodText?: string;
  filters?: { label: string; value: string }[];
  columns: ReportColumn[];
  rows: (string | number | React.ReactNode)[][];
  totals?: (string | number | null)[];
  defaultOrientation?: "portrait" | "landscape" | "auto";
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  periodText,
  filters = [],
  columns,
  rows,
  totals,
  defaultOrientation = "auto",
}) => {
  // Compute auto-orientation: If table has > 6 columns, choose Landscape
  const resolvedAutoOrientation = columns.length > 6 ? "landscape" : "portrait";

  const [orientationMode, setOrientationMode] = useState<"auto" | "portrait" | "landscape">(defaultOrientation);
  const [paperSize, setPaperSize] = useState<"A4" | "A3" | "Letter">("A4");

  const [showCompanyHeader, setShowCompanyHeader] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showTotals, setShowTotals] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [repeatHeaders, setRepeatHeaders] = useState(true);

  // Active orientation
  const activeOrientation = orientationMode === "auto" ? resolvedAutoOrientation : orientationMode;

  useEffect(() => {
    setOrientationMode(defaultOrientation);
  }, [defaultOrientation, isOpen]);

  // Handle browser print
  const handlePrint = () => {
    // Apply dynamic page orientation style if needed
    const styleId = "milestone-print-page-style";
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `@page { size: ${paperSize.toLowerCase()} ${activeOrientation}; margin: 10mm 10mm 12mm 10mm; }`;

    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md overflow-hidden select-none">
      {/* 1. TOP CONTROLS TOOLBAR (Glass Surface) */}
      <header className="h-16 px-6 bg-white/90 backdrop-blur-xl border-b border-white/70 shadow-sm flex items-center justify-between shrink-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Icon name="print" className="text-[18px]" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900 leading-tight">
              Print Preview &amp; ERP Layout Engine
            </h2>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              {reportTitle} • {rows.length} total rows
            </p>
          </div>
        </div>

        {/* Quick Toggles in Header */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/70 text-xs">
          {/* Orientation selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-1">Layout:</span>
            {(["auto", "portrait", "landscape"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setOrientationMode(mode)}
                className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-all ${
                  orientationMode === mode
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode === "auto" ? `Auto Fit (${resolvedAutoOrientation})` : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Paper Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Paper:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="A4">A4 (Standard)</option>
              <option value="A3">A3 (Wide)</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs shadow-sm shadow-blue-500/25 transition-all"
          >
            <Icon name="print" className="text-[16px]" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100/80 text-slate-700 font-medium text-xs transition-all"
          >
            Close
          </button>
        </div>
      </header>

      {/* 2. BODY WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Options Sidebar (Glass surface) */}
        <div className="w-64 bg-white/80 backdrop-blur-lg border-r border-slate-200/80 p-4 space-y-4 overflow-y-auto shrink-0 print:hidden text-xs">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Print Customization
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompanyHeader}
                  onChange={(e) => setShowCompanyHeader(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Company Header</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFilters}
                  onChange={(e) => setShowFilters(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Applied Filter Scope</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTotals}
                  onChange={(e) => setShowTotals(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Summary Totals Row</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Signatures Section</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Audit Footer</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatHeaders}
                  onChange={(e) => setRepeatHeaders(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Repeat Headers on Multi-Page</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Auto Fit Recommendation
            </h3>
            <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
              <p className="font-semibold mb-0.5">
                {columns.length > 6 ? "Landscape Recommended" : "Portrait Recommended"}
              </p>
              <p className="text-blue-600">
                This report contains {columns.length} columns. Auto Fit has selected{" "}
                <span className="font-bold uppercase">{resolvedAutoOrientation}</span> for optimal legibility.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Printing Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Use &quot;Save as PDF&quot; in the print dialog for digital archiving.</li>
              <li>Ensure &quot;Background graphics&quot; is enabled in your browser print settings.</li>
            </ul>
          </div>
        </div>

        {/* Right Preview Sheet Container */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-6 flex justify-center items-start">
          <div
            className={`bg-white shadow-2xl rounded-sm transition-all duration-200 overflow-hidden ${
              activeOrientation === "landscape" ? "w-[1100px] min-h-[780px]" : "w-[850px] min-h-[1100px]"
            }`}
          >
            <PrintableReportDocument
              reportTitle={reportTitle}
              periodText={periodText}
              filters={filters}
              columns={columns}
              rows={rows}
              totals={totals}
              showCompanyHeader={showCompanyHeader}
              showFilters={showFilters}
              showTotals={showTotals}
              showSignatures={showSignatures}
              showFooter={showFooter}
              repeatHeaders={repeatHeaders}
              orientation={activeOrientation}
              paperSize={paperSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

