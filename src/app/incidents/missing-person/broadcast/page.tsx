// /src/app/incidents/missing-person/broadcast/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, ArrowLeft, Printer, Download } from "lucide-react";

type Channel = "sms" | "radio" | "tv" | "social" | "email";

export default function BroadcastPage() {
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get("caseId") || "";

  const [title, setTitle] = useState("AMBER Alert: Missing Person");
  const [urgency, setUrgency] = useState<"critical" | "high" | "normal">("critical");
  const [regions, setRegions] = useState("National Capital District, Central, Gulf");
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    sms: true,
    radio: true,
    tv: false,
    social: true,
    email: true,
  });
  const [message, setMessage] = useState(
    "Please be on the lookout for a missing person. If seen, call 111 or your nearest police station immediately."
  );

  // Lightweight prefill if a caseId is provided
  useEffect(() => {
    if (caseId) {
      setTitle((t) => `AMBER Alert: ${caseId}`);
      setMessage((m) =>
        `Police have issued an AMBER Alert for case ${caseId}. ` +
        `If you have information, call 111 immediately. Do not approach—report location and details.`
      );
    }
  }, [caseId]);

  const selectedChannels = useMemo(
    () => (Object.keys(channels) as Channel[]).filter((c) => channels[c]),
    [channels]
  );

  const toggleChannel = (key: Channel) =>
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleBroadcast = () => {
    // In real app, POST to your backend here.
    alert(
      `Broadcast queued:\n\nTitle: ${title}\nUrgency: ${urgency}\nRegions: ${regions}\nChannels: ${selectedChannels.join(
        ", "
      )}\n\nMessage:\n${message}`
    );
    router.back();
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const payload = {
      type: "AMBER/missing-person",
      caseId: caseId || undefined,
      title,
      urgency,
      regions: regions.split(",").map((r) => r.trim()).filter(Boolean),
      channels: selectedChannels,
      message,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `broadcast_${caseId || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/incidents/missing-person">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Broadcast Alert
              {caseId && <Badge variant="outline">Case: {caseId}</Badge>}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleBroadcast}>
              <Megaphone className="w-4 h-4 mr-2" />
              Send Broadcast
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Compose */}
          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regions">Regions / Provinces</Label>
                  <Input
                    id="regions"
                    value={regions}
                    onChange={(e) => setRegions(e.target.value)}
                    placeholder="Comma-separated list"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-3 text-sm">
                  {(["sms", "radio", "tv", "social", "email"] as Channel[]).map((c) => (
                    <label key={c} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={channels[c]}
                        onChange={() => toggleChannel(c)}
                      />
                      <span className="capitalize">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What should the public know and do?"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 space-y-3 print:border-none">
                <div
                  className={`text-white text-sm px-3 py-1 rounded inline-block ${
                    urgency === "critical"
                      ? "bg-red-600"
                      : urgency === "high"
                      ? "bg-orange-500"
                      : "bg-gray-500"
                  }`}
                >
                  {urgency.toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold">{title}</h2>
                {caseId && (
                  <p className="text-sm text-gray-600">
                    Related case: <strong>{caseId}</strong>
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message}</p>
                <div className="text-sm text-gray-600">
                  <strong>Regions:</strong> {regions || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Channels:</strong> {selectedChannels.join(", ") || "—"}
                </div>
                <div className="text-xs text-gray-500 pt-2">
                  If you have information, call <strong>111</strong> or your nearest police station.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
