"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Upload } from "lucide-react";

export type VehicleRow = {
  id: string;
  plate: string;
  province: string;
  station: string;
  type: string;
  make: string;
  model: string;
  year?: number;
  status: "active" | "maintenance" | "out_of_service";
  fuelLevel?: number; // %
  speedKph?: number;
  engineOn?: boolean;
  lat?: number;
  lng?: number;
  lastSeen?: string; // ISO
};

type Props = {
  rows: VehicleRow[];
  onImport?: (rows: VehicleRow[]) => void;
  filenameStem?: string;
};

export function FleetExportButtons({
  rows,
  onImport,
  filenameStem = "fleet",
}: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const stem = `${filenameStem}_${new Date().toISOString().slice(0, 10)}`;

  const toCsv = (data: VehicleRow[]) => {
    const headers = [
      "id",
      "plate",
      "province",
      "station",
      "type",
      "make",
      "model",
      "year",
      "status",
      "fuelLevel",
      "speedKph",
      "engineOn",
      "lat",
      "lng",
      "lastSeen",
    ];
    const lines = [
      headers.join(","),
      ...data.map((r) =>
        [
          r.id,
          r.plate,
          r.province,
          r.station,
          r.type,
          r.make,
          r.model,
          r.year ?? "",
          r.status,
          r.fuelLevel ?? "",
          r.speedKph ?? "",
          r.engineOn ?? "",
          r.lat ?? "",
          r.lng ?? "",
          r.lastSeen ?? "",
        ]
          .map((v) =>
            typeof v === "string" && v.includes(",") ? `"${v}"` : String(v)
          )
          .join(",")
      ),
    ].join("\n");
    return lines;
  };

  const parseNumber = (v: string) =>
    v === "" || v == null ? undefined : Number(v);

  const parseBool = (v: string) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : undefined);

  const importCsv = async (f: File) => {
    const text = await f.text();
    const [header, ...rowsCsv] = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const cols = header.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const out: VehicleRow[] = [];

    for (const line of rowsCsv) {
      // naive CSV split that handles quotes for simple cases
      const parts: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) {
          inQ = !inQ;
          continue;
        }
        if (ch === "," && !inQ) {
          parts.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      parts.push(cur);
      const obj: any = {};
      cols.forEach((c, i) => (obj[c] = parts[i]?.replace(/^"|"$/g, "")));
      const v: VehicleRow = {
        id: obj.id,
        plate: obj.plate,
        province: obj.province,
        station: obj.station,
        type: obj.type,
        make: obj.make,
        model: obj.model,
        year: parseNumber(obj.year),
        status: (obj.status ?? "active") as VehicleRow["status"],
        fuelLevel: parseNumber(obj.fuelLevel),
        speedKph: parseNumber(obj.speedKph),
        engineOn: parseBool(obj.engineOn),
        lat: parseNumber(obj.lat),
        lng: parseNumber(obj.lng),
        lastSeen: obj.lastSeen || undefined,
      };
      if (v.id && v.plate) out.push(v);
    }
    onImport?.(out);
  };

  const download = (filename: string, data: BlobPart, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => download(`${stem}.csv`, toCsv(rows), "text/csv");

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Fleet");
    XLSX.writeFile(wb, `${stem}.xlsx`);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileRef}
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importCsv(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="gap-2" onClick={exportCsv}>
            <FileText className="h-4 w-4" />
            CSV (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={exportXlsx}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel (.xlsx)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
