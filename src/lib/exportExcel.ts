import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  reportTitle: string;
  companyName?: string;
  periodText?: string;
  filters?: { label: string; value: string }[];
  filterSummary?: Record<string, string>;
  headers?: string[];
  columns?: { header: string }[];
  rows: (string | number | null | undefined)[][];
  totals?: (string | number | null | undefined)[];
}

/**
 * Export filtered ERP report data to real tabular .xlsx spreadsheet
 */
export function exportReportToExcel(options: ExcelExportOptions) {
  const {
    filename,
    sheetName = "Report",
    reportTitle,
    companyName = "MILESTONE INFRASTRUCTURE ERP",
    periodText,
    filters,
    filterSummary,
    headers: explicitHeaders,
    columns,
    rows,
    totals,
  } = options;

  const headers = explicitHeaders || (columns ? columns.map((c) => c.header) : []);

  // Build Array of Arrays for the worksheet
  const aoa: any[][] = [];

  // 1. Company Header
  aoa.push([companyName]);
  aoa.push([reportTitle]);
  if (periodText) {
    aoa.push([`Period: ${periodText}`]);
  }
  aoa.push([`Generated on: ${new Date().toLocaleString()}`]);

  // 2. Active Filter Scope
  if (filters && filters.length > 0) {
    const filterParts = filters
      .filter((f) => f.value && f.value !== "all" && f.value !== "All")
      .map((f) => `${f.label}: ${f.value}`);
    if (filterParts.length > 0) {
      aoa.push([`Filter Scope: ${filterParts.join(" | ")}`]);
    }
  } else if (filterSummary && Object.keys(filterSummary).length > 0) {
    const filterParts = Object.entries(filterSummary)
      .filter(([_, v]) => v && v !== "all" && v !== "All")
      .map(([k, v]) => `${k}: ${v}`);
    if (filterParts.length > 0) {
      aoa.push([`Filter Scope: ${filterParts.join(" | ")}`]);
    }
  }

  // Blank row separator
  aoa.push([]);

  // 3. Table Column Headers
  aoa.push(headers);

  // 4. Data Rows
  rows.forEach((row) => {
    aoa.push(
      row.map((cell) => {
        if (cell === null || cell === undefined) return "";
        if (typeof cell === "number") return cell;
        return String(cell);
      })
    );
  });

  // 5. Grand Totals Row if present
  if (totals && totals.length > 0) {
    aoa.push(
      totals.map((t) => {
        if (t === null || t === undefined) return "";
        if (typeof t === "number") return t;
        return String(t);
      })
    );
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-calculate column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header ? header.length : 10;
    rows.forEach((row) => {
      const val = row[colIdx];
      if (val != null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    });
    if (totals && totals[colIdx] != null) {
      const len = String(totals[colIdx]).length;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });

  ws["!cols"] = colWidths;

  // Create workbook and write file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
