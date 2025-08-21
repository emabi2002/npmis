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

export default function DispatchClient() {
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

      {/* …………………………… the rest of your JSX unchanged …………………………… */}
      {/* Header, Stats, View Selector, Units/Dispatches/Map sections */}
      {/* (All content from your previous component remains here) */}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* For brevity: keep exactly the JSX you posted earlier below   */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* >>> Paste the remainder of your JSX here (unchanged) <<< */}
    </DashboardLayout>
  );
}
