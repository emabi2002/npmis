"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileDown, Printer } from "lucide-react";

/** Adjust to your row shape if needed */
export type AuditLogEntry = {
  id?: string | number;
  timestamp: string | number | Date;
  user: string;
  action: string;
  severity?: string;
  ip?: string;
  details?: string;
};

type Props = {
  rows: AuditLogEntry[];
  /** Control export column order & labels */
  columns?: Array<{ key: keyof AuditLogEntry; label: string }>;
  /** Print only this section; if omitted, prints whole page */
  printableRef?: React.RefObject<HTMLElement>;
  /** Base filename (no extension) */
  filenameStem?: string;
};

export function AuditExportButtons({
  rows,
  printableRef,
  filenameStem = "audit-trail",
  columns = [
    { key: "timestamp", label: "Timestamp" },
    { key: "user",      label: "User" },
    { key: "action",    label: "Action" },
    { key: "severity",  label: "Severity" },
    { key: "ip",        label: "IP Address" },
    { key: "details",   label: "Details" },
  ],
}: Props) {
  /** Map rows → plain objects keyed by labels, and format the timestamp nicely */
  const formatRows = React.useCallback(() => {
    return rows.map((r) => {
      const o: Record<string, any> = {};
      for (const c of columns) {
        let v = (r as any)[c.key];
        if (c.key === "timestamp") {
          const d =
            typeof v === "string" || typeof v === "number" ? new Date(v) : (v as Date);
          v = isNaN(d?.getTime?.() ?? NaN) ? v : d.toLocaleString();
        }
        o[c.label] = v ?? "";
      }
      return o;
    });
  }, [rows, columns]);

  const stem = `${filenameStem}_${new Date().toISOString().slice(0, 10)}`;

  /** CSV builder with UTF-8 BOM (Excel-friendly) */
  const exportCsv = () => {
    const data = formatRows();
    const headers = columns.map((c) => c.label);

    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };

    const lines: string[] = [];
    lines.push(headers.map(csvEscape).join(","));
    for (const row of data) {
      lines.push(headers.map((h) => csvEscape(row[h])).join(","));
    }

    const csv = "\uFEFF" + lines.join("\r\n"); // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${stem}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** Export to Excel (dynamic import); falls back to CSV on failure */
  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = formatRows();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "AuditTrail");
      XLSX.writeFile(wb, `${stem}.xlsx`);
    } catch (e) {
      // Fallback if xlsx is unavailable
      exportCsv();
    }
  };

  /** Export to PDF using jsPDF + autoTable (call plugin directly for TS safety) */
  const exportPdf = async () => {
    const JsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new JsPDF({ orientation: "landscape" });

    const head = [columns.map((c) => c.label)];
    const body = formatRows().map((row) => columns.map((c) => row[c.label]));

    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { top: 14 },
    });

    doc.save(`${stem}.pdf`);
  };

  /** Print only the target section (or whole page if no ref provided) */
  const print = () => {
    if (!printableRef?.current) return window.print();

    const html = printableRef.current.outerHTML;
    const w = window.open("", "_blank", "noopener,noreferrer,width=1200,height=800");
    if (!w) return window.print();

    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${stem}</title>
          <style>
            body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Audit Log
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPdf} className="gap-2">
            <FileText className="h-4 w-4" />
            PDF (.pdf)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportCsv} className="gap-2">
            <FileDown className="h-4 w-4" />
            CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className="gap-2" onClick={print}>
        <Printer className="h-4 w-4" />
        Print Report
      </Button>
    </div>
  );
}
