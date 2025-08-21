"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Megaphone, Download, Printer } from "lucide-react";

export default function BroadcastClient() {
  const params = useSearchParams();
  const caseId = params.get("caseId") || "";

  const title = useMemo(
    () => (caseId ? `Broadcast Alert • Case ${caseId}` : "Broadcast Alert"),
    [caseId]
  );

  const handlePrint = () => {
    // Minimal: let browser print the composed poster section
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Download Poster
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Compose Public Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Headline</label>
                <Input placeholder="MISSING CHILD • AMBER ALERT" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input placeholder="+675 XXX XXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                rows={5}
                placeholder="Name, age, last seen location & time, clothing/description, medical needs, who to contact…"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Preview</Button>
              <Button>Generate Poster</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
