"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STORAGE_LOCATIONS, EVIDENCE_DATA } from "@/lib/evidence-data";
import { ArrowLeft, Download } from "lucide-react";

export default function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const item = useMemo(
    () => EVIDENCE_DATA.find(e => e.id === decodeURIComponent(id)),
    [id]
  );

  if (!item) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push("/evidence")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Evidence
        </Button>
        <p className="mt-6 text-red-600">Evidence not found.</p>
      </div>
    );
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/evidence")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={downloadJSON}>
          <Download className="w-4 h-4 mr-2" />
          Download JSON
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {item.id}
            <Badge variant="outline">{item.caseId}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><span className="font-medium">Type:</span> {item.type}</div>
          <div><span className="font-medium">Status:</span> {item.status}</div>
          <div><span className="font-medium">Collected By:</span> {item.collectedBy}</div>
          <div><span className="font-medium">Collected Date:</span> {item.collectedDate}</div>
          <div><span className="font-medium">Court Date:</span> {item.courtDate ?? "—"}</div>
          <div><span className="font-medium">Location:</span> {STORAGE_LOCATIONS[item.location]}</div>
          <div><span className="font-medium">Description:</span> {item.description}</div>
          {!!item.tags?.length && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}
          <div className="pt-2">
            <div className="font-medium mb-1">Chain of Custody</div>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {item.chainOfCustody.map((c, i) => (
                <li key={i}>
                  <b>{c.action}</b> by {c.officer} — {c.date} @ {c.location}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
