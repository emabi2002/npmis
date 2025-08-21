// /src/app/incidents/missing-person/[id]/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Megaphone, Printer, FileText, CheckCircle, MapPin, User, Clock } from "lucide-react";

/** TODO: Replace with your real DB/API.
 *  This is only to prevent 404s while wiring the route.
 */
const MOCK = [
  {
    id: "MP-2024-001",
    name: "Mary Kaupa",
    age: 8,
    gender: "Female",
    category: "child",
    reportDate: "2024-01-15",
    lastSeen: "2024-01-14 16:00",
    location: "Gerehu Primary School, Port Moresby",
    province: "National Capital District",
    description: "Small girl, short black hair, wearing blue school uniform and black shoes",
    circumstances: "Last seen leaving school, never arrived home",
    reportedBy: "Grace Kaupa (Mother)",
    reporterPhone: "+675 325 8901",
    caseOfficer: "Det. Sarah Johnson",
    status: "active",
    amberAlert: true,
    mediaAttention: true,
    searchTeams: 3,
    tips: 12,
    lastUpdate: "2024-01-15 14:30"
  },
  {
    id: "MP-2024-002",
    name: "Peter Temu",
    age: 45,
    gender: "Male",
    category: "adult",
    reportDate: "2024-01-12",
    lastSeen: "2024-01-11 08:00",
    location: "Mt. Hagen Market",
    province: "Western Highlands Province",
    description: "Medium build, beard, wearing red shirt and blue jeans",
    circumstances: "Went to market for business, never returned home",
    reportedBy: "Maria Temu (Wife)",
    reporterPhone: "+675 542 7890",
    caseOfficer: "Const. Michael Kila",
    status: "active",
    amberAlert: false,
    mediaAttention: false,
    searchTeams: 1,
    tips: 5,
    lastUpdate: "2024-01-14 10:15"
  }
];

const CATEGORY_LABEL: Record<string, string> = {
  child: "Missing Child",
  adult: "Missing Adult",
  elderly: "Missing Elderly",
  vulnerable: "Vulnerable Person",
  endangered: "Endangered Missing",
};

export default function MissingPersonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const person = useMemo(() => MOCK.find((p) => p.id === id), [id]);

  const exportJSON = () => {
    if (!person) return;
    const blob = new Blob([JSON.stringify(person, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${person.id}_case.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!person) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Button variant="outline" onClick={() => router.push("/incidents/missing-person")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to list
          </Button>
          <p className="text-sm">Case <b>{id}</b> not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const priorityBadge =
    person.amberAlert ? (
      <Badge variant="destructive">AMBER</Badge>
    ) : person.status === "found" ? (
      <Badge>FOUND SAFE</Badge>
    ) : (
      <Badge variant="outline">ACTIVE</Badge>
    );

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
              {person.name} — <span className="text-gray-500">{person.id}</span>
            </h1>
            {priorityBadge}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Link href={`/incidents/missing-person/broadcast?caseId=${encodeURIComponent(person.id)}`}>
              <Button className="bg-red-600 hover:bg-red-700">
                <Megaphone className="w-4 h-4 mr-2" />
                Broadcast
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Person</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2"><User className="w-4 h-4" />{person.age} years, {person.gender}</div>
              <div className="flex items-center gap-2"><Badge variant="outline">{CATEGORY_LABEL[person.category] || person.category}</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Last Seen</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{person.lastSeen}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{person.location}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Case</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>Officer: <b>{person.caseOfficer}</b></div>
              <div>Reported by: <b>{person.reportedBy}</b> ({person.reporterPhone})</div>
              <div>Report date: <b>{person.reportDate}</b></div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <div className="font-medium mb-1">Description</div>
              <p>{person.description}</p>
            </div>
            <div>
              <div className="font-medium mb-1">Circumstances</div>
              <p>{person.circumstances}</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer actions */}
        {person.status !== "found" && (
          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Found
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
