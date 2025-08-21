// src/app/cases/[id]/page.tsx
"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// TEMP: same IDs/titles you show in the list. Replace with real fetch later.
const MOCK_CASES = [
  {
    id: "CASE-2024-001",
    title: "Armed Robbery Investigation - Port Moresby Bank",
    type: "Criminal Investigation",
    priority: "Critical",
    status: "Under Investigation",
    lead: "Det. Sarah Johnson",
    location: "Port Moresby Central",
    updated: "2024-01-15",
    evidence: 12,
    witnesses: 5,
  },
  {
    id: "CASE-2024-002",
    title: "Missing Person - Mary Tamate",
    type: "Missing Person",
    priority: "High",
    status: "Open",
    lead: "Det. James Wannya",
    location: "Mt. Hagen",
    updated: "2024-01-15",
    evidence: 4,
    witnesses: 8,
  },
  // add the others you show in the table as needed…
];

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const rec = MOCK_CASES.find((c) => c.id === params.id);

  if (!rec) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Link href="/cases">
            <Button variant="outline">← Back to cases</Button>
          </Link>
          <p className="text-sm">Case <b>{params.id}</b> not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const priorityVariant = rec.priority === "Critical" ? "destructive" : "default";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{rec.title}</h1>
            <p className="text-sm text-gray-600">
              Case ID: {rec.id} • {rec.type}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={priorityVariant}>{rec.priority}</Badge>
            <Badge>{rec.status}</Badge>
          </div>
        </div>

        {/* Key facts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Lead Detective</CardTitle></CardHeader>
            <CardContent className="text-sm">{rec.lead}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
            <CardContent className="text-sm">{rec.evidence} items</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Witnesses</CardTitle></CardHeader>
            <CardContent className="text-sm">{rec.witnesses} people</CardContent>
          </Card>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Location: </span>{rec.location}</div>
            <div><span className="text-gray-600">Last updated: </span>{rec.updated}</div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href="/cases">
            <Button variant="outline">Back</Button>
          </Link>
          {/* Add more actions (Edit/Close/Assign) here later */}
        </div>
      </div>
    </DashboardLayout>
  );
}
