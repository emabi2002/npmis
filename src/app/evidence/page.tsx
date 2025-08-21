"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package, Camera, FileText, Search, Filter, Plus, Download, Users,
  Scale, Lock, Eye, Archive, AlertTriangle, Clock as ClockIcon
} from "lucide-react";
import type { User as UserType } from "@/types/user";
import {
  EVIDENCE_DATA,
  STORAGE_LOCATIONS,
  type EvidenceItem,
  type EvidenceType,
  type EvidenceStatus,
} from "@/lib/evidence-data";

/* ---- UI metadata ---- */
const EVIDENCE_TYPES: Record<EvidenceType, { label: string; icon: any; color: string }> = {
  physical:   { label: "Physical Evidence",  icon: Package,  color: "bg-blue-500" },
  digital:    { label: "Digital Evidence",   icon: FileText, color: "bg-purple-500" },
  photo:      { label: "Photographic",       icon: Camera,   color: "bg-green-500" },
  document:   { label: "Documents",          icon: FileText, color: "bg-orange-500" },
  weapon:     { label: "Weapons",            icon: Package,  color: "bg-red-500" },
  drug:       { label: "Narcotics",          icon: AlertTriangle, color: "bg-red-600" },
  biological: { label: "Biological",         icon: Package,  color: "bg-pink-500" },
};

const EVIDENCE_STATUS: Record<EvidenceStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  collected:   { label: "Collected",    variant: "default" },
  processing:  { label: "Processing",   variant: "default" },
  analyzed:    { label: "Analyzed",     variant: "default" },
  court_ready: { label: "Court Ready",  variant: "default" },
  in_court:    { label: "In Court",     variant: "destructive" },
  returned:    { label: "Returned",     variant: "secondary" },
  destroyed:   { label: "Destroyed",    variant: "secondary" },
};

export default function EvidencePage() {
  const router = useRouter();

  // auth
  const [user, setUser] = useState<UserType | null>(null);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EvidenceType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EvidenceStatus>("all");
  const [locationFilter, setLocationFilter] = useState<"all" | keyof typeof STORAGE_LOCATIONS>("all");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/"); return; }
    setUser(JSON.parse(userData));
  }, [router]);

  /* ---------- IMPORTANT: hooks stay above any conditional return ---------- */

  const filteredEvidence: EvidenceItem[] = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return EVIDENCE_DATA.filter(e => {
      const matchesSearch =
        !s ||
        e.description.toLowerCase().includes(s) ||
        e.id.toLowerCase().includes(s) ||
        e.caseId.toLowerCase().includes(s) ||
        e.tags.some(tag => tag.toLowerCase().includes(s));

      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesLocation = locationFilter === "all" || e.location === locationFilter;

      return matchesSearch && matchesType && matchesStatus && matchesLocation;
    });
  }, [searchTerm, typeFilter, statusFilter, locationFilter]);

  const totals = useMemo(() => ({
    total: EVIDENCE_DATA.length,
    processing: EVIDENCE_DATA.filter(e => e.status === "processing").length,
    courtReady: EVIDENCE_DATA.filter(e => e.status === "court_ready").length,
    inCourt: EVIDENCE_DATA.filter(e => e.status === "in_court").length,
    highPriority: EVIDENCE_DATA.filter(e => e.priority === "high").length,
    digitalItems: EVIDENCE_DATA.filter(e => e.type === "digital" || e.type === "photo").length,
  }), []);

  // actions
  const goToNew = () => router.push("/evidence/new");

  const exportAllCsv = () => {
    const headers = [
      "Evidence ID","Case ID","Type","Status","Description","Collected By",
      "Collected Date","Location","Priority","Court Date","Tags"
    ];
    const rows = EVIDENCE_DATA.map(e => [
      e.id, e.caseId,
      EVIDENCE_TYPES[e.type].label,
      EVIDENCE_STATUS[e.status].label,
      e.description.replace(/\n/g, " "),
      e.collectedBy,
      e.collectedDate,
      STORAGE_LOCATIONS[e.location],
      e.priority ?? "none",
      e.courtDate ?? "",
      e.tags.join("|"),
    ]);
    downloadCsv([headers, ...rows], "evidence_report.csv");
  };

  const exportStorageReport = () => {
    const counts: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    EVIDENCE_DATA.forEach(e => {
      counts[e.location] = (counts[e.location] ?? 0) + 1;
      const k = `${e.location}:${e.status}`;
      byStatus[k] = (byStatus[k] ?? 0) + 1;
    });

    const headers = ["Location","Total","Collected","Processing","Analyzed","Court Ready","In Court","Returned","Destroyed"];
    const rows = (Object.keys(STORAGE_LOCATIONS) as (keyof typeof STORAGE_LOCATIONS)[]).map(loc => [
      STORAGE_LOCATIONS[loc],
      counts[loc] ?? 0,
      byStatus[`${loc}:collected`] ?? 0,
      byStatus[`${loc}:processing`] ?? 0,
      byStatus[`${loc}:analyzed`] ?? 0,
      byStatus[`${loc}:court_ready`] ?? 0,
      byStatus[`${loc}:in_court`] ?? 0,
      byStatus[`${loc}:returned`] ?? 0,
      byStatus[`${loc}:destroyed`] ?? 0,
    ]);

    downloadCsv([headers, ...rows], "storage_report.csv");
  };

  const viewItem = (id: string) => router.push(`/evidence/${encodeURIComponent(id)}`);

  const downloadItemJson = (e: EvidenceItem) => {
    const blob = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${e.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  function downloadCsv(rows: (string | number)[][], filename: string) {
    const csv = rows.map(r =>
      r.map(v =>
        String(v).includes(",") || String(v).includes("\"") || String(v).includes("\n")
          ? `"${String(v).replace(/"/g, '""')}"`
          : String(v)
      ).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  /* --------- safe to conditionally render now (no hooks below) --------- */
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-600">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evidence Management</h1>
            <p className="text-gray-600">Track physical and digital evidence with chain of custody</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAllCsv} title="Export all evidence as CSV">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={goToNew} title="Log new evidence">
              <Plus className="w-4 h-4 mr-2" />
              Log Evidence
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total}</div>
              <p className="text-xs text-muted-foreground">Items tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Processing</CardTitle>
              <ClockIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totals.processing}</div>
              <p className="text-xs text-muted-foreground">Being analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Court Ready</CardTitle>
              <Scale className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totals.courtReady}</div>
              <p className="text-xs text-muted-foreground">Ready for trial</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Court</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totals.inCourt}</div>
              <p className="text-xs text-muted-foreground">Court proceedings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totals.highPriority}</div>
              <p className="text-xs text-muted-foreground">Urgent cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Digital Items</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totals.digitalItems}</div>
              <p className="text-xs text-muted-foreground">Digital evidence</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search evidence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Evidence Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(Object.keys(EVIDENCE_TYPES) as EvidenceType[]).map((key) => (
                    <SelectItem key={key} value={key}>{EVIDENCE_TYPES[key].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {(Object.keys(EVIDENCE_STATUS) as EvidenceStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>{EVIDENCE_STATUS[key].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {(Object.keys(STORAGE_LOCATIONS) as (keyof typeof STORAGE_LOCATIONS)[]).map((key) => (
                    <SelectItem key={key} value={key}>{STORAGE_LOCATIONS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportStorageReport} title="Download storage breakdown as CSV">
                <Archive className="w-4 h-4 mr-2" />
                Storage Report
              </Button>

              <Button
                variant="outline"
                onClick={() => { setSearchTerm(""); setTypeFilter("all"); setStatusFilter("all"); setLocationFilter("all"); }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Evidence Items ({filteredEvidence.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence ID</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Collected By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvidence.map((e) => {
                  const TypeIcon = EVIDENCE_TYPES[e.type].icon;
                  return (
                    <TableRow key={e.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{e.id}</TableCell>
                      <TableCell><Badge variant="outline">{e.caseId}</Badge></TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${EVIDENCE_TYPES[e.type].color}`}>
                            <TypeIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm">{EVIDENCE_TYPES[e.type].label}</span>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <button onClick={() => viewItem(e.id)} className="text-left group" title="View details">
                          <div className="font-medium truncate group-hover:underline">{e.description}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {e.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {e.tags.length > 2 && <Badge variant="outline" className="text-xs">+{e.tags.length - 2}</Badge>}
                          </div>
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={EVIDENCE_STATUS[e.status].variant}>{EVIDENCE_STATUS[e.status].label}</Badge>
                          {e.priority === "high" && <Badge variant="destructive" className="text-xs">High Priority</Badge>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{STORAGE_LOCATIONS[e.location]}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Chain of Custody: {e.chainOfCustody.length} entries
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            {e.collectedBy}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{e.collectedDate}</div>
                          {e.courtDate && <div className="text-xs text-purple-600">Court: {e.courtDate}</div>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => viewItem(e.id)} title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadItemJson(e)} title="Download JSON">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
