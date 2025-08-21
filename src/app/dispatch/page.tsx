"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Car,
  CheckCircle,
  Activity,
  AlertTriangle,
  Phone,
  Timer,
  RefreshCw,
  MapPin,
  Navigation,
  Satellite,
  Eye,
  Radio,
} from "lucide-react";
import type { User as UserType } from "@/types/user";

/* ------------------------------ Types & Data ------------------------------ */

type RegionKey = "pom" | "lae" | "hagen";

type Region = {
  key: RegionKey;
  name: string;
  center: { lat: number; lng: number };
};

type Unit = {
  id: string;
  callsign: string;
  plate: string;
  status: "available" | "responding" | "on_scene";
  speedKph: number;
  lat: number;
  lng: number;
  region: RegionKey;
};

type DispatchRecord = {
  id: string;
  priority: "Emergency" | "Urgent" | "Routine";
  type: string;
  location: string;
  unit: string;
  notes?: string;
  createdAt: string;            // ISO string
  status: "Open" | "On Scene" | "Closed";
};

const REGIONS: Region[] = [
  { key: "pom", name: "Port Moresby Region", center: { lat: -9.4438, lng: 147.1803 } },
  { key: "lae", name: "Lae Region",            center: { lat: -6.7320, lng: 146.9990 } },
  { key: "hagen", name: "Mt. Hagen Region",     center: { lat: -5.8667, lng: 144.2167 } },
];

/** Seed random demo units around region centers */
function seedDemoUnits(): Unit[] {
  const rand = (s: number) => (Math.random() - 0.5) * s;
  return [
    { id: "U01", callsign: "POM-12", plate: "PNG A1234", status: "available",  speedKph: 34, lat: REGIONS[0].center.lat + rand(0.01), lng: REGIONS[0].center.lng + rand(0.01), region: "pom" },
    { id: "U02", callsign: "POM-21", plate: "PNG B7781", status: "responding", speedKph: 68, lat: REGIONS[0].center.lat + rand(0.01), lng: REGIONS[0].center.lng + rand(0.01), region: "pom" },
    { id: "U03", callsign: "LAE-05", plate: "PNG C2201", status: "on_scene",   speedKph: 0,  lat: REGIONS[1].center.lat + rand(0.01), lng: REGIONS[1].center.lng + rand(0.01), region: "lae" },
    { id: "U04", callsign: "LAE-09", plate: "PNG D9011", status: "available",  speedKph: 18, lat: REGIONS[1].center.lat + rand(0.01), lng: REGIONS[1].center.lng + rand(0.01), region: "lae" },
    { id: "U05", callsign: "HGN-03", plate: "PNG E1140", status: "responding", speedKph: 54, lat: REGIONS[2].center.lat + rand(0.01), lng: REGIONS[2].center.lng + rand(0.01), region: "hagen" },
  ];
}

/* --------------------------------- Page ---------------------------------- */

export default function DispatchPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const search = useSearchParams();

  // Default tab can be controlled via /dispatch?view=dispatches (or map/units)
  const viewParam = search.get("view");
  const initialView =
    viewParam === "dispatches" || viewParam === "map" || viewParam === "units"
      ? (viewParam as "units" | "dispatches" | "map")
      : "units";

  // DEMO data (swap to API/WebSocket later)
  const [units, setUnits] = useState<Unit[]>(seedDemoUnits());

  // View tabs
  const [selectedView, setSelectedView] = useState<"units" | "dispatches" | "map">(initialView);

  // Map state
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("pom");
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Saved (new) dispatches
  const [savedDispatches, setSavedDispatches] = useState<DispatchRecord[]>([]);

  // Google Maps
  const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) router.push("/");
    else setUser(JSON.parse(raw));
    setAuthChecked(true);

    // Load any newly created dispatches
    try {
      const d = localStorage.getItem("mock-dispatches");
      if (d) setSavedDispatches(JSON.parse(d));
    } catch {}
  }, [router]);

  /* -------- Derived summaries -------- */
  const regionsSummary = useMemo(() => {
    return REGIONS.map((r) => {
      const list = units.filter((u) => u.region === r.key);
      const active = list.length;
      const available = list.filter((u) => u.status === "available").length;
      return { ...r, list, active, available };
    });
  }, [units]);

  const currentRegion = regionsSummary.find((r) => r.key === selectedRegion)!;

  /* -------- Initialize map when Map tab is opened -------- */
  useEffect(() => {
    if (selectedView !== "map") return;                   // only init in Map tab
    if (!GMAPS_KEY) return;
    if (mapRef.current || !mapDivRef.current) return;
    if (!(window as any).google) return;

    mapRef.current = new (window as any).google.maps.Map(mapDivRef.current, {
      center: currentRegion.center,
      zoom: 12,
      mapTypeId: mapType,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
    });
    infoRef.current = new (window as any).google.maps.InfoWindow();
  }, [GMAPS_KEY, selectedView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recenter when region changes
  useEffect(() => {
    if (mapRef.current) mapRef.current.setCenter(currentRegion.center);
  }, [currentRegion.center]);

  // Update map type
  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  // Draw markers for current region
  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};

    for (const u of currentRegion.list) {
      const color = u.status === "available" ? "#16a34a" : u.status === "responding" ? "#f59e0b" : "#dc2626";
      const marker = new (window as any).google.maps.Marker({
        position: { lat: u.lat, lng: u.lng },
        map: mapRef.current,
        title: `${u.callsign} (${u.plate})`,
        icon: {
          path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          strokeColor: color,
          fillColor: color,
          fillOpacity: 1,
        },
      });
      marker.addListener("click", () => openInfo(u, marker));
      markersRef.current[u.id] = marker;
    }
  }, [currentRegion.list]);

  // DEMO live motion (replace with your live feed later)
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setUnits((prev) =>
        prev.map((u) => {
          if (u.status !== "responding") return u;
          const dLat = (Math.random() - 0.5) * 0.001;
          const dLng = (Math.random() - 0.5) * 0.001;
          const speed = Math.max(0, Math.min(90, Math.round(u.speedKph + (Math.random() - 0.5) * 8)));
          return { ...u, lat: u.lat + dLat, lng: u.lng + dLng, speedKph: speed };
        })
      );
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(id);
  }, [live]);

  function openInfo(u: Unit, marker?: any) {
    const anchor = marker ?? markersRef.current[u.id];
    if (!anchor || !infoRef.current || !mapRef.current) return;
    infoRef.current.setContent(`
      <div style="font:12px system-ui">
        <div style="font-weight:600;margin-bottom:4px">${u.callsign} • ${u.plate}</div>
        <div>Status: <b>${u.status.replace("_", " ")}</b></div>
        <div>Speed: <b>${u.speedKph} km/h</b></div>
        <div>Lat/Lng: ${u.lat.toFixed(5)}, ${u.lng.toFixed(5)}</div>
      </div>
    `);
    infoRef.current.open({ map: mapRef.current, anchor });
  }

  /** Center map on a unit (from the left list) */
  function focusUnit(u: Unit) {
    const m = markersRef.current[u.id];
    if (!m || !mapRef.current) return;
    mapRef.current.setCenter(new (window as any).google.maps.LatLng(u.lat, u.lng));
    mapRef.current.setZoom(14);
    openInfo(u, m);
  }

  /** Reset the demo seed positions */
  function resetDemo() {
    setUnits(seedDemoUnits());
    setLastUpdate(new Date());
  }

  /* --------- Guard to keep hooks order stable --------- */
  if (!authChecked) return null;
  if (!user) return null;

  return (
    <DashboardLayout>
      {/* Google Maps script; safe to load globally */}
      {GMAPS_KEY && (
        <Script src={`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}`} strategy="afterInteractive" />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispatch & Patrol Management</h1>
            <p className="text-gray-600">Real-time unit coordination and emergency response</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-indigo-600">Demo Mode</Badge>
            <Button variant="outline" onClick={resetDemo} title="Reseed demo positions">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Demo
            </Button>
            {/* NEW: route to create form */}
            <Link href="/dispatch/new">
              <Button className="bg-red-600 hover:bg-red-700">
                <Eye className="w-4 h-4 mr-2" />
                New Dispatch
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Car className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{units.length}</div>
              <p className="text-xs text-muted-foreground">Patrol vehicles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {units.filter((u) => u.status === "available").length}
              </div>
              <p className="text-xs text-muted-foreground">Ready for dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responding</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {units.filter((u) => u.status === "responding").length}
              </div>
              <p className="text-xs text-muted-foreground">En route</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Scene</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {units.filter((u) => u.status === "on_scene").length}
              </div>
              <p className="text-xs text-muted-foreground">Active incidents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
              <Phone className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <p className="text-xs text-muted-foreground">Emergency calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
              <Timer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Auto-refresh every 3s (demo)</p>
            </CardContent>
          </Card>
        </div>

        {/* View Selector */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={selectedView === "units" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("units")}
          >
            <Car className="w-4 h-4 mr-2" />
            Units
          </Button>
          <Button
            variant={selectedView === "dispatches" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("dispatches")}
          >
            <Radio className="w-4 h-4 mr-2" />
            Active Dispatches
          </Button>
          <Button
            variant={selectedView === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("map")}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Map View
          </Button>
        </div>

        {/* CONTENT BY TAB */}
        {selectedView === "units" && (
          <Card>
            <CardHeader>
              <CardTitle>Police Units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Real-time monitoring of all police units with GPS tracking, status updates,
                and resource management for Papua New Guinea operations.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-500" />
                    Patrol Units
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">8 units covering Port Moresby, Lae, Mt. Hagen</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Response Units
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">3 rapid response teams for emergencies</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-green-500" />
                    Motorcycle Units
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">1 motorcycle unit for traffic enforcement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedView === "dispatches" && (
          <Card>
            <CardHeader>
              <CardTitle>Active Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Current emergency dispatches and response coordination across PNG.
              </p>

              {/* NEW: show saved (new) dispatches first */}
              {savedDispatches.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  {savedDispatches.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 border rounded-lg border-blue-200 bg-blue-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {d.priority === "Emergency" ? (
                          <Badge variant="destructive">Emergency</Badge>
                        ) : d.priority === "Urgent" ? (
                          <Badge>Urgent</Badge>
                        ) : (
                          <Badge variant="outline">Routine</Badge>
                        )}
                        <span className="text-xs text-gray-600">
                          {new Date(d.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-medium">{d.type} — {d.location}</h3>
                      <p className="text-sm text-gray-600">Assigned unit: {d.unit}</p>
                      {d.notes && <p className="text-sm text-gray-600 mt-1">{d.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* demo cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <Badge variant="destructive">Emergency</Badge>
                  </div>
                  <h3 className="font-medium">Armed Robbery - ANZ Bank Boroko</h3>
                  <p className="text-sm text-gray-600">Unit POM-21 responding, ETA 5 minutes</p>
                </div>
                <div className="p-4 border rounded-lg border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-orange-600" />
                    <Badge variant="default">Urgent</Badge>
                  </div>
                  <h3 className="font-medium">Public Disturbance - Lae Market</h3>
                  <p className="text-sm text-gray-600">Unit LAE-05 on scene, situation under control</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedView === "map" && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-11">
            {/* Left: Regions Table (moved into Map View tab) */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Units by Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-center">Units Active</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionsSummary.map((r) => (
                      <TableRow
                        key={r.key}
                        className={`cursor-pointer ${selectedRegion === r.key ? "bg-blue-50" : ""}`}
                        onClick={() => setSelectedRegion(r.key)}
                      >
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-center">{r.active}</TableCell>
                        <TableCell className="text-center">{r.available}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={selectedRegion === r.key ? "default" : "outline"}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Selected region — quick list (click to center on map) */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Units in {currentRegion.name}</div>
                  {currentRegion.list.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => focusUnit(u)}
                      className="w-full flex items-center gap-2 text-sm border rounded p-2 hover:bg-gray-50 text-left"
                      title="Center map on this unit"
                    >
                      <Car className="w-4 h-4" />
                      <div className="font-medium">{u.callsign}</div>
                      <span className="text-muted-foreground">({u.plate})</span>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant="outline"><Activity className="w-3 h-3 mr-1" />{u.speedKph} km/h</Badge>
                        {u.status === "available" && <Badge className="bg-green-600">Available</Badge>}
                        {u.status === "responding" && <Badge className="bg-orange-500">Responding</Badge>}
                        {u.status === "on_scene" && <Badge className="bg-red-600">On Scene</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: Live Map */}
            <Card className="lg:col-span-7">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Live Map — {currentRegion.name}
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Button
                    variant={mapType === "roadmap" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapType("roadmap")}
                  >
                    Map
                  </Button>
                  <Button
                    variant={mapType === "hybrid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapType("hybrid")}
                  >
                    <Satellite className="w-4 h-4 mr-1" />
                    Satellite
                  </Button>
                  <Button variant={live ? "default" : "outline"} size="sm" onClick={() => setLive((v) => !v)}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${live ? "animate-spin" : ""}`} />
                    {live ? "Live" : "Paused"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {!GMAPS_KEY ? (
                  <div className="h-[520px] flex items-center justify-center text-center text-sm text-muted-foreground border rounded">
                    Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code>.env.local</code> to enable the map.
                  </div>
                ) : (
                  <div ref={mapDivRef} className="h-[520px] w-full rounded border" />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
