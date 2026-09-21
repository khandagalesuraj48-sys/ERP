"use client";

import React from "react";

export interface ReportColumn {
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface PrintableReportProps {
  companyName?: string;
  companyAddress?: string;
  reportTitle: string;
  periodText?: string;
  generatedDate?: string;
  filters?: { label: string; value: string }[];
  columns: ReportColumn[];
  rows: (string | number | React.ReactNode)[][];
  totals?: (string | number | null)[];
  showCompanyHeader?: boolean;
  showFilters?: boolean;
  showTotals?: boolean;
  showSignatures?: boolean;
  showFooter?: boolean;
  repeatHeaders?: boolean;
  orientation?: "portrait" | "landscape";
  paperSize?: "A4" | "A3" | "Letter";
}

export const PrintableReportDocument: React.FC<PrintableReportProps> = ({
  companyName = "MILESTONE CONSULTANCY",
  companyAddress = "Construction & Infrastructure Plant Management • NH-48 Express Corridor Zone, Navi Mumbai, MH",
  reportTitle,
  periodText,
  generatedDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  filters = [],
  columns,
  rows,
  totals,
  showCompanyHeader = true,
  showFilters = true,
  showTotals = true,
  showSignatures = true,
  showFooter = true,
  repeatHeaders = true,
  orientation = "landscape",
  paperSize = "A4",
}) => {
  const activeFilters = filters.filter(
    (f) => f.value && f.value !== "all" && f.value !== "All" && f.value !== "—"
  );

  return (
    <div
      className={`print-document-root bg-white text-black p-8 font-sans ${
        orientation === "landscape" ? "print-landscape" : "print-portrait"
      }`}
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: "100%",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* 1. COMPANY HEADER */}
      {showCompanyHeader && (
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {companyName}
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                {companyAddress}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block border border-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 bg-slate-100">
                Official ERP Report
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Format: {paperSize} • {orientation.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {reportTitle}
              </h2>
              {periodText && (
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  Reporting Period: {periodText}
                </p>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p>Generated On: <span className="font-semibold text-slate-800">{generatedDate}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT METADATA & APPLIED FILTERS */}
      {showFilters && activeFilters.length > 0 && (
        <div className="bg-slate-50 border border-slate-300 rounded p-2.5 mb-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Active Scope:
            </span>
            {activeFilters.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">{f.label}:</span>
                <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CRYSTAL-CLEAR DATA TABLE */}
      <table className="erp-print-table w-full text-left border-collapse text-xs">
        <thead className={repeatHeaders ? "table-header-group" : ""}>
          <tr className="bg-slate-100 border-y border-slate-400">
            <th className="p-2 text-[10px] font-bold uppercase text-slate-700 w-8 text-center border-r border-slate-300">
              #
            </th>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{ width: col.width }}
                className={`p-2 text-[10px] font-bold uppercase text-slate-800 border-r border-slate-300 last:border-r-0 ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="p-8 text-center text-slate-500 italic text-xs"
              >
                No operational records found for the selected criteria.
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <td className="p-1.5 text-[11px] text-center text-slate-400 font-mono border-r border-slate-200">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => {
                  const align = columns[cIdx]?.align || "left";
                  return (
                    <td
                      key={cIdx}
                      className={`p-1.5 text-[11px] text-slate-900 border-r border-slate-200 last:border-r-0 leading-tight ${
                        align === "right"
                          ? "text-right font-mono"
                          : align === "center"
                          ? "text-center font-mono"
                          : "text-left"
                      }`}
                    >
                      {cell != null && cell !== "" ? cell : "—"}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>

        {/* 4. TOTALS ROW */}
        {showTotals && totals && totals.length > 0 && rows.length > 0 && (
          <tfoot>
            <tr className="bg-slate-100/90 font-bold border-t-2 border-b-2 border-slate-900">
              <td className="p-2 text-[11px] text-center text-slate-900 font-mono border-r border-slate-300">
                ∑
              </td>
              {totals.map((t, idx) => {
                const align = columns[idx]?.align || "left";
                return (
                  <td
                    key={idx}
                    className={`p-2 text-[11px] text-slate-900 border-r border-slate-300 last:border-r-0 ${
                      align === "right"
                        ? "text-right font-mono"
                        : align === "center"
                        ? "text-center font-mono"
                        : "text-left"
                    }`}
                  >
                    {t != null ? t : ""}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>

      {/* 5. STATUTORY SIGNATURE BLOCK */}
      {showSignatures && (
        <div
          className="erp-print-signatures mt-10 pt-4 border-t border-slate-300"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <div className="grid grid-cols-4 gap-6 text-xs text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Prepared By:</p>
              <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
              <p className="text-[10px] text-slate-500 mt-1">Site / Data Operator</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Checked By:</p>
              <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
              <p className="text-[10px] text-slate-500 mt-1">Mechanical Supervisor</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Approved By:</p>
              <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
              <p className="text-[10px] text-slate-500 mt-1">P&amp;M Project In-Charge</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Verified Date:</p>
              <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
              <p className="text-[10px] text-slate-500 mt-1">Official Company Stamp</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. ERP PRINT FOOTER */}
      {showFooter && (
        <div className="erp-print-footer mt-8 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <span>
            MILESTONE ERP — Construction Machinery &amp; Mechanical ERP
          </span>
          <span className="font-medium text-slate-600">
            Computer Generated Report • No signature required for digital transmission
          </span>
          <span>
            Print Date: {new Date().toISOString().slice(0, 10)}
          </span>
        </div>
      )}
    </div>
  );
};

