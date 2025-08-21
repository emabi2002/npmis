// app/incidents/[id]/page.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, FileText, Calendar, MapPin, UserRound } from "lucide-react";

/** TODO: replace with your real DB/API. Kept locally to avoid 404s. */
const INCIDENTS = [
  {
    id: "INC-2024-001",
    type: "Armed Robbery",
    location: "Boroko Market, NCD",
    status: "Under Investigation",
    priority: "High",
    assignedTo: "Detective Kila",
    reportedAt: "2024-01-15T14:30:00Z",
    summary:
      "Armed robbery at market stall. Suspect fled on foot. CCTV footage requested.",
  },
  {
    id: "INC-2024-002",
    type: "Domestic Violence",
    location: "Gerehu Stage 4, NCD",
    status: "Resolved",
    priority: "Medium",
    assignedTo: "Sergeant Bani",
    reportedAt: "2024-01-15T11:15:00Z",
    summary:
      "Victim safe. Protection order issued. Case closed with counseling referral.",
  },
];

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const incident = useMemo(
    () => INCIDENTS.find((i) => i.id === id),
    [id]
  );

  const exportJSON = () => {
    if (!incident) return;
    const blob = new Blob([JSON.stringify(incident, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${incident.id}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!incident) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Button variant="outline" onClick={() => router.push("/incidents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to incidents
          </Button>
          <p className="text-sm">Incident <b>{id}</b> not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const priorityVariant = incident.priority === "High" ? "destructive" : "default";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">
              Incident {incident.id} — {incident.type}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/incidents/${encodeURIComponent(incident.id)}/report`}>
              <Button variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </Link>
            <Button onClick={exportJSON}>
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant}>{incident.priority}</Badge>
          <Badge>{incident.status}</Badge>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Assigned To</CardTitle></CardHeader>
            <CardContent className="text-sm flex items-center gap-2">
              <UserRound className="w-4 h-4" /> {incident.assignedTo}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {incident.location}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Reported</CardTitle></CardHeader>
            <CardContent className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {new Date(incident.reportedAt).toLocaleString()}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {incident.summary ?? "—"}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href="/incidents"><Button variant="outline">Back to list</Button></Link>
          <Link href={`/incidents/${incident.id}/edit`}><Button>Edit</Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
