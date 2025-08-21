// app/incidents/[id]/report/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";

/** TODO: replace with your real DB/API. Kept locally for now. */
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

export default function IncidentReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const incident = useMemo(() => INCIDENTS.find((i) => i.id === id), [id]);

  // Auto-open print dialog when the page loads
  useEffect(() => {
    // Delay slightly so fonts/layout are ready before printing
    const t = setTimeout(() => window.print(), 200);
    return () => clearTimeout(t);
  }, []);

  if (!incident) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push("/incidents")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to incidents
        </Button>
        <p className="mt-4 text-sm">Incident <b>{id}</b> not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 print:p-0">
      {/* Toolbar (hidden when printing) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* A4-ish report frame */}
      <div className="mx-auto max-w-[800px] print:max-w-none print:w-full">
        <Card className="shadow-none border print:border-0">
          <CardContent className="p-8 print:p-6">
            {/* Header / Letterhead */}
            <div className="text-center mb-6">
              <div className="text-lg font-bold">Royal PNG Constabulary</div>
              <div className="text-xs text-gray-600">Police Management System</div>
              <hr className="my-4" />
              <div className="text-xl font-semibold">Incident Report</div>
              <div className="text-sm text-gray-600">Reference: {incident.id}</div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="font-medium">Type:</span> {incident.type}</div>
              <div><span className="font-medium">Status:</span> {incident.status}</div>
              <div><span className="font-medium">Priority:</span> {incident.priority}</div>
              <div><span className="font-medium">Reported:</span> {new Date(incident.reportedAt).toLocaleString()}</div>
              <div className="col-span-2"><span className="font-medium">Location:</span> {incident.location}</div>
              <div className="col-span-2"><span className="font-medium">Assigned To:</span> {incident.assignedTo}</div>
            </div>

            {/* Narrative */}
            <div className="mb-8">
              <div className="font-semibold mb-2">Summary</div>
              <div className="text-sm whitespace-pre-wrap">
                {incident.summary ?? "—"}
              </div>
            </div>

            {/* Sign-off */}
            <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold">Processing Officer</div>
                <div>Officer 12345</div>
                <div className="mt-10 border-t pt-2">Signature &amp; Date</div>
              </div>
              <div>
                <div className="font-semibold">Approving Officer</div>
                <div>—</div>
                <div className="mt-10 border-t pt-2">Signature &amp; Date</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
      `}</style>
    </div>
  );
}
