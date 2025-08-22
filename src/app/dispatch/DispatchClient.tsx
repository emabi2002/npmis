"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  createdAt: string; // ISO string
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

/** Safe initial view without useSearchParams (no Suspense needed) */
function getInitialView(): "units" | "dispatches" | "map" {
  if (typeof window === "undefined") return "units";
  const v = new URLSearchParams(window.location.search).get("view");
  return v === "dispatches" || v === "map" || v === "units" ? v : "units";
}

/** keep URL in sync w/o Next hooks (avoids Suspense) */
function setQueryParam(name: string, value: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState(null, "", url.toString());
}

export default function DispatchClient() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // DEMO data (swap to API/WebSocket later)
  const [units, setUnits] = useState<Unit[]>(seedDemoUnits());
  const [savedDispatches, setSavedDispatches] = useState<DispatchRecord[]>([]);

  // View tabs / map controls
  const [selectedView, setSelectedView] = useState<"units" | "dispatches" | "map">(getInitialView());
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("pom");
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Google Maps
  const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [mapsReady, setMapsReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Auth + local mock data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setAuthChecked(true);
        router.replace("/");
        return;
      }
      setUser(JSON.parse(raw));
      const d = localStorage.getItem("mock-dispatches");
      if (d) setSavedDispatches(JSON.parse(d));
    } catch {
      /* noop */
    } finally {
      setAuthChecked(true);
    }
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

  const currentRegion = useMemo(
    () => regionsSummary.find((r) => r.key === selectedRegion)!,
    [regionsSummary, selectedRegion]
  );

  /* keep the URL up to date (no Suspense) */
  useEffect(() => {
    setQueryParam("view", selectedView);
  }, [selectedView]);

  /* ------------------------ Google Maps lifecycle ------------------------ */
  // Initialize map after script loads AND when Map tab is opened
  useEffect(() => {
    if (selectedView !== "map") return;
    if (!GMAPS_KEY) return;
    if (!mapsReady) return;
    if (mapRef.current || !mapDivRef.current) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    mapRef.current = new google.maps.Map(mapDivRef.current, {
      center: currentRegion.center,
      zoom: 12,
      mapTypeId: mapType,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
    });
    infoRef.current = new google.maps.InfoWindow();
  }, [selectedView, GMAPS_KEY, mapsReady]); // mapType/center handled below

  // Recenter when region changes
  useEffect(() => {
    if (mapRef.current) mapRef.current.setCenter(currentRegion.center);
  }, [currentRegion.center]);

  // Update map type
  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  // Draw markers for current region (and when units move)
  useEffect(() => {
    if (!mapRef.current) return;

    // clear previous markers
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    const google = (window as any).google;
    for (const u of currentRegion.list) {
      const color = u.status === "available" ? "#16a34a" : u.status === "responding" ? "#f59e0b" : "#dc2626";
      const marker = new google.maps.Marker({
        position: { lat: u.lat, lng: u.lng },
        map: mapRef.current,
        title: `${u.callsign} (${u.plate})`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          strokeColor: color,
          fillColor: color,
          fillOpacity: 1,
        },
      });
      marker.addListener("click", () => openInfo(u, marker));
      markersRef.current[u.id] = marker;
    }
  }, [currentRegion]);

  // DEMO live motion (replace with your live feed later)
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
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

  /** Center map on a unit (from list) */
  function focusUnit(u: Unit) {
    const m = markersRef.current[u.id];
    if (!m || !mapRef.current) return;
    const google = (window as any).google;
    mapRef.current.setCenter(new google.maps.LatLng(u.lat, u.lng));
    mapRef.current.setZoom(14);
    openInfo(u, m);
  }

  /** Reset the demo seed positions */
  function resetDemo() {
    setUnits(seedDemoUnits());
    setLastUpdate(new Date());
  }

  /* ------------------------------ Guards/UI ------------------------------ */
  if (!authChecked) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading…</div>
      </DashboardLayout>
    );
  }
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6">Redirecting…</div>
      </DashboardLayout>
    );
  }

  // Safe, TS-friendly display name
  const u = user as any;
  const displayName: string =
    u?.name ||
    [u?.first_name ?? u?.firstName, u?.last_name ?? u?.lastName].filter(Boolean).join(" ").trim() ||
    u?.badge_number ||
    u?.badgeNumber ||
    "Officer";

  /* -------------------------------- Render ------------------------------- */
  return (
    <DashboardLayout>
      {/* Load Maps script (client only). Add &libraries if you later use places, geometry, etc. */}
      {!!GMAPS_KEY && (
        <Script
          id="gmaps-js"
          src={`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
          onError={(e) => {
            console.error("Google Maps script failed to load", e);
            setMapsReady(false);
          }}
        />
      )}

      {!GMAPS_KEY && (
        <div className="mx-6 mt-4 mb-0 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <b>Maps key missing.</b> Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment (Netlify) and redeploy.
        </div>
      )}

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dispatch Management</h1>
            <p className="text-gray-600">Welcome, {displayName}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/incidents/new">
                <Radio className="w-4 h-4 mr-2" />
                Create Incident
              </Link>
            </Button>
            <Button variant="outline" onClick={resetDemo}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units Active</CardTitle>
              <Car className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{units.length}</div>
              <p className="text-xs text-muted-foreground">Across all regions</p>
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
              <p className="text-xs text-muted-foreground">Ready to deploy</p>
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
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {savedDispatches.filter((d) => d.priority !== "Routine").length}
              </div>
              <p className="text-xs text-muted-foreground">Emergency/Urgent</p>
            </CardContent>
          </Card>
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedView === "units" ? "default" : "outline"}
            onClick={() => setSelectedView("units")}
          >
            Units
          </Button>
          <Button
            variant={selectedView === "dispatches" ? "default" : "outline"}
            onClick={() => setSelectedView("dispatches")}
          >
            Dispatches
          </Button>
        <Button
          variant={selectedView === "map" ? "default" : "outline"}
          onClick={() => setSelectedView("map")}
        >
          Map
        </Button>
        </div>

        {/* Units View */}
        {selectedView === "units" && (
          <Card>
            <CardHeader>
              <CardTitle>Units by Region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {regionsSummary.map((r) => (
                <div key={r.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    <Badge variant="outline">{r.active} active</Badge>
                    <Badge className="bg-green-600"> {r.available} available</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Callsign</TableHead>
                        <TableHead>Plate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Speed</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.list.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.callsign}</TableCell>
                          <TableCell>{u.plate}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                u.status === "available"
                                  ? "bg-green-600"
                                  : u.status === "responding"
                                  ? "bg-orange-600"
                                  : "bg-red-600"
                              }
                            >
                              {u.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.speedKph} km/h</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedView("map");
                                setSelectedRegion(r.key);
                                // focus after map paints
                                setTimeout(() => focusUnit(u), 0);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Focus on Map
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dispatches View */}
        {selectedView === "dispatches" && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              {savedDispatches.length === 0 ? (
                <div className="text-sm text-gray-600 p-4">No saved dispatches yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedDispatches.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.id}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              d.priority === "Emergency"
                                ? "bg-red-600"
                                : d.priority === "Urgent"
                                ? "bg-orange-600"
                                : "bg-gray-600"
                            }
                          >
                            {d.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{d.type}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {d.location}
                        </TableCell>
                        <TableCell>{d.unit}</TableCell>
                        <TableCell>{d.status}</TableCell>
                        <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {selectedView === "map" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Live Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!GMAPS_KEY && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
                  Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to see the map.
                </div>
              )}

              {GMAPS_KEY && !mapsReady && (
                <div className="text-sm text-gray-600 p-2">Loading Google Maps…</div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <select
                  className="border rounded px-2 py-1"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as RegionKey)}
                >
                  {REGIONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <Button variant="outline" onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}>
                  <Satellite className="w-4 h-4 mr-2" />
                  Map: {mapType}
                </Button>

                <Button variant={live ? "default" : "outline"} onClick={() => setLive((v) => !v)}>
                  <Activity className="w-4 h-4 mr-2" />
                  {live ? "Live" : "Paused"}
                </Button>

                <Button variant="outline" onClick={resetDemo}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {lastUpdate ? `Last update ${lastUpdate.toLocaleTimeString()}` : "Waiting for updates…"}
                </div>
              </div>

              <div ref={mapDivRef} className="h-[60vh] w-full rounded border" />

              <div className="mt-2 text-xs text-gray-500">Click a marker to view unit details.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
