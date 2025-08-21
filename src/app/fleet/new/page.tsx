"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, Save, ArrowLeft, Shield, MapPin } from "lucide-react";

/* ---------- Types (match your fleet page) ---------- */
type Province =
  | "NCD"
  | "Central"
  | "Morobe"
  | "Eastern Highlands"
  | "Western Highlands"
  | "East Sepik"
  | "Southern Highlands";

type VehicleStatus = "active" | "idle" | "maintenance" | "offline";
type LatLng = { lat: number; lng: number };
type Telemetry = {
  speedKph: number;
  fuelPct: number;
  headingDeg: number;
  lastSeen: string;
  engineCut: boolean;
};

type Vehicle = {
  id: string;
  callsign: string;
  plate: string;
  makeModel: string;
  type: "Patrol" | "Van" | "Truck" | "Bike";
  province: Province;
  stationId: string;
  status: VehicleStatus;
  pos: LatLng;
  history: LatLng[];
  telemetry: Telemetry;
  geofences: string[];
};

type Station = { id: string; name: string; province: Province };
type GeoFence = { id: string; name: string; center: LatLng; radiusKm: number; color: string };

/* ---------- Same demo data as the fleet page ---------- */
const STATIONS: Station[] = [
  { id: "S-NCD-01", name: "Boroko Police Station", province: "NCD" },
  { id: "S-NCD-02", name: "Gerehu Station", province: "NCD" },
  { id: "S-CEN-01", name: "Kwikila Station", province: "Central" },
  { id: "S-MRB-01", name: "Lae Central", province: "Morobe" },
  { id: "S-EHG-01", name: "Goroka Station", province: "Eastern Highlands" },
  { id: "S-WHG-01", name: "Mt Hagen Station", province: "Western Highlands" },
  { id: "S-ESP-01", name: "Wewak Station", province: "East Sepik" },
  { id: "S-SHG-01", name: "Mendi Station", province: "Southern Highlands" },
];

const GEOFENCES: GeoFence[] = [
  { id: "Z-NCD", name: "Port Moresby Ops Zone", center: { lat: -9.443, lng: 147.18 }, radiusKm: 10, color: "#22c55e" },
  { id: "Z-LAE", name: "Lae Urban Zone", center: { lat: -6.72, lng: 146.99 }, radiusKm: 8, color: "#3b82f6" },
  { id: "Z-GOR", name: "Goroka Town Zone", center: { lat: -6.083, lng: 145.387 }, radiusKm: 6, color: "#f59e0b" },
];

/* Center of the main urban areas for a sensible starting position */
const URBAN_ANCHOR: Record<string, LatLng> = {
  NCD: { lat: -9.45, lng: 147.18 },
  Morobe: { lat: -6.73, lng: 146.99 },
  "Eastern Highlands": { lat: -6.08, lng: 145.39 },
};

const STORAGE_KEY = "fleetVehicles";

/* ---------- helpers ---------- */
const safeParse = <T,>(raw: string | null, fallback: T): T => {
  try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const jitter = (p: LatLng, meters = 120): LatLng => {
  // ~1e-5 deg ≈ ~1.11 m at equator; PNG is close enough for demo purposes
  const degPerM = 1 / 111_320;
  const r = meters * degPerM;
  const dx = (Math.random() - 0.5) * 2 * r;
  const dy = (Math.random() - 0.5) * 2 * r;
  return { lat: p.lat + dy, lng: p.lng + dx };
};
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `V-${Date.now()}`);

/* ---------- page ---------- */
export default function NewVehiclePage() {
  const router = useRouter();

  // basic auth guard (consistent with the rest of the app)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/");
      return;
    }
    setReady(true);
  }, [router]);

  const [province, setProvince] = useState<Province>("NCD");
  const stationsForProvince = useMemo(() => STATIONS.filter((s) => s.province === province), [province]);
  const [stationId, setStationId] = useState<string>(stationsForProvince[0]?.id ?? "S-NCD-01");

  useEffect(() => {
    setStationId(stationsForProvince[0]?.id ?? "");
  }, [stationsForProvince]);

  const [form, setForm] = useState({
    callsign: "",
    plate: "",
    makeModel: "",
    type: "Patrol" as Vehicle["type"],
    status: "idle" as VehicleStatus,
    fuelPct: 60,
  });

  const [selectedFences, setSelectedFences] = useState<string[]>([]);
  const toggleFence = (id: string) =>
    setSelectedFences((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const valid =
    form.callsign.trim().length > 0 &&
    form.plate.trim().length > 0 &&
    form.makeModel.trim().length > 0 &&
    !!stationId;

  const handleSave = () => {
    if (!valid) return;

    const existing = safeParse<Vehicle[]>(localStorage.getItem(STORAGE_KEY), []);

    // duplicate guards (simple demo check)
    const plateTaken = existing.some(
      (v) => v.plate.trim().toLowerCase() === form.plate.trim().toLowerCase()
    );
    const callsignTaken = existing.some(
      (v) => v.callsign.trim().toLowerCase() === form.callsign.trim().toLowerCase()
    );
    if (plateTaken) {
      alert("A vehicle with this plate already exists.");
      return;
    }
    if (callsignTaken) {
      alert("A vehicle with this callsign already exists.");
      return;
    }

    // start position near urban anchor, with a small jitter so points don't overlap
    const anchor = URBAN_ANCHOR[province] ?? ({ lat: -6.5, lng: 147.0 } as LatLng);
    const startPos = jitter(anchor, 150); // ~150m jitter

    const newVehicle: Vehicle = {
      id: newId(),
      callsign: form.callsign.trim(),
      plate: form.plate.trim(),
      makeModel: form.makeModel.trim(),
      type: form.type,
      province,
      stationId,
      status: form.status,
      pos: startPos,
      history: [],
      telemetry: {
        speedKph: 0,
        fuelPct: Math.max(0, Math.min(100, Number(form.fuelPct) || 0)),
        headingDeg: 0,
        lastSeen: new Date().toISOString(),
        engineCut: false,
      },
      geofences: selectedFences,
    };

    const next = [newVehicle, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    router.push("/fleet");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && valid) handleSave();
  };

  if (!ready) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-600">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add Vehicle</h1>
            <p className="text-gray-600">Register a new unit into the national fleet.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSave} disabled={!valid} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4" /> Save Vehicle
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Vehicle details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Callsign *</label>
                  <Input
                    value={form.callsign}
                    onChange={(e) => setForm((f) => ({ ...f, callsign: e.target.value }))}
                    onKeyDown={onKeyDown}
                    placeholder="e.g., POM-Alpha-21"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plate *</label>
                  <Input
                    value={form.plate}
                    onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                    onKeyDown={onKeyDown}
                    placeholder="e.g., RPNGC-12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Make & Model *</label>
                <Input
                  value={form.makeModel}
                  onChange={(e) => setForm((f) => ({ ...f, makeModel: e.target.value }))}
                  onKeyDown={onKeyDown}
                  placeholder="e.g., Toyota Hilux SR5"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patrol">Patrol</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Bike">Bike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuel %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.fuelPct}
                    onChange={(e) => setForm((f) => ({ ...f, fuelPct: Number(e.target.value) }))}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Geofences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Province</label>
                <Select value={province} onValueChange={(v) => setProvince(v as Province)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(STATIONS.map((s) => s.province))).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Station *</label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger><SelectValue placeholder="Select station" /></SelectTrigger>
                  <SelectContent>
                    {stationsForProvince.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Arm Geofences
                </div>
                <div className="flex flex-wrap gap-2">
                  {GEOFENCES.map((z) => (
                    <button
                      type="button"
                      key={z.id}
                      onClick={() => toggleFence(z.id)}
                      className={`px-2 py-1 rounded border text-xs ${
                        selectedFences.includes(z.id) ? "bg-blue-600 text-white" : "bg-white"
                      }`}
                    >
                      {z.name}
                    </button>
                  ))}
                </div>
                {selectedFences.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Armed: {selectedFences.map((id) => GEOFENCES.find((g) => g.id === id)?.name).join(", ")}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Badge variant="outline">Start position auto-set near {province}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
