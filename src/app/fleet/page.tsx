"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import GoogleFleetMap from "@/components/fleet/GoogleFleetMap"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Car, MapPin, Radar, Satellite, Gauge, Droplet, Lock, Unlock, AlertTriangle,
  LocateFixed, Route, Shield, Wrench, Download, Plus, Play, Pause,
  Upload, FileSpreadsheet, FileText
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu"

/* ================= Types ================= */
type Province =
  | "NCD" | "Central" | "Morobe" | "Eastern Highlands" | "Western Highlands" | "East Sepik" | "Southern Highlands"

type VehicleStatus = "active" | "idle" | "maintenance" | "offline"
type Station = { id: string; name: string; province: Province }
type LatLng = { lat: number; lng: number }
type Telemetry = {
  speedKph: number
  fuelPct: number
  headingDeg: number
  lastSeen: string
  engineCut: boolean
}

type Vehicle = {
  id: string
  callsign: string
  plate: string
  makeModel: string
  type: "Patrol" | "Van" | "Truck" | "Bike"
  province: Province
  stationId: string
  status: VehicleStatus
  pos: LatLng
  history: LatLng[]
  telemetry: Telemetry
  geofences: string[]
}

type GeoFence = {
  id: string
  name: string
  center: LatLng
  radiusKm: number
  color: string
}

/* ============== Demo Data ============== */
const STATIONS: Station[] = [
  { id: "S-NCD-01", name: "Boroko Police Station", province: "NCD" },
  { id: "S-NCD-02", name: "Gerehu Station", province: "NCD" },
  { id: "S-CEN-01", name: "Kwikila Station", province: "Central" },
  { id: "S-MRB-01", name: "Lae Central", province: "Morobe" },
  { id: "S-EHG-01", name: "Goroka Station", province: "Eastern Highlands" },
  { id: "S-WHG-01", name: "Mt Hagen Station", province: "Western Highlands" },
  { id: "S-ESP-01", name: "Wewak Station", province: "East Sepik" },
  { id: "S-SHG-01", name: "Mendi Station", province: "Southern Highlands" },
]

const GEOFENCES: GeoFence[] = [
  { id: "Z-NCD", name: "Port Moresby Ops Zone", center: { lat: -9.443, lng: 147.18 }, radiusKm: 10, color: "#22c55e" },
  { id: "Z-LAE", name: "Lae Urban Zone", center: { lat: -6.72, lng: 146.99 }, radiusKm: 8, color: "#3b82f6" },
  { id: "Z-GOR", name: "Goroka Town Zone", center: { lat: -6.083, lng: 145.387 }, radiusKm: 6, color: "#f59e0b" },
]

/* ============== Helpers ============== */
const KM_PER_DEG = 111.32
const distKm = (a: LatLng, b: LatLng) => {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180)
  const y = (b.lat - a.lat)
  return Math.sqrt(x * x + y * y) * KM_PER_DEG
}
const insideFence = (pos: LatLng, zone: GeoFence) => distKm(pos, zone.center) <= zone.radiusKm

// Fallback clamp to PNG bbox
const PNG_BBOX = { minLat: -11.0, maxLat: -2.0, minLng: 141.0, maxLng: 155.9 }
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number }

// Tighter inland rectangles to keep demo units off water
const AREA_BOUNDS: Record<string, Bounds> = {
  // NOTE: minLng moved to 147.14 so we never include the harbor/sea
  NCD: { minLat: -9.55, maxLat: -9.35, minLng: 147.14, maxLng: 147.28 },
  Morobe: { minLat: -6.81, maxLat: -6.64, minLng: 146.93, maxLng: 147.07 },
  "Eastern Highlands": { minLat: -6.12, maxLat: -6.03, minLng: 145.34, maxLng: 145.45 },
}
const clampToBounds = (p: LatLng, b: Bounds): LatLng => ({
  lat: clamp(p.lat, b.minLat, b.maxLat),
  lng: clamp(p.lng, b.minLng, b.maxLng),
})

// Gentle “urban anchor” to counter drift toward edges/coastlines
const URBAN_ANCHOR: Record<string, LatLng> = {
  NCD: { lat: -9.45, lng: 147.18 },              // Waigani/Boroko
  Morobe: { lat: -6.73, lng: 146.99 },           // Lae CBD
  "Eastern Highlands": { lat: -6.08, lng: 145.39 }, // Goroka
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const nudgeToward = (p: LatLng, target: LatLng, t = 0.12): LatLng => ({
  lat: lerp(p.lat, target.lat, t),
  lng: lerp(p.lng, target.lng, t),
})

/* ============== Seed & Storage ============== */
const seedFleet = (): Vehicle[] => [
  {
    id: "V-PN-001",
    callsign: "POM-Alpha-12",
    plate: "RPNGC-10234",
    makeModel: "Toyota Land Cruiser",
    type: "Patrol",
    province: "NCD",
    stationId: "S-NCD-01",
    status: "active",
    pos: { lat: -9.45, lng: 147.18 }, // inland Waigani
    history: [],
    telemetry: { speedKph: 32, fuelPct: 72, headingDeg: 80, lastSeen: new Date().toISOString(), engineCut: false },
    geofences: ["Z-NCD"],
  },
  {
    id: "V-PN-002",
    callsign: "Lae-Bravo-05",
    plate: "RPNGC-20891",
    makeModel: "Isuzu D-Max",
    type: "Patrol",
    province: "Morobe",
    stationId: "S-MRB-01",
    status: "idle",
    pos: { lat: -6.73, lng: 146.99 }, // inland Lae
    history: [],
    telemetry: { speedKph: 0, fuelPct: 54, headingDeg: 150, lastSeen: new Date().toISOString(), engineCut: false },
    geofences: ["Z-LAE"],
  },
  {
    id: "V-PN-003",
    callsign: "GOR-Charlie-09",
    plate: "RPNGC-33012",
    makeModel: "Hilux SR5",
    type: "Patrol",
    province: "Eastern Highlands",
    stationId: "S-EHG-01",
    status: "maintenance",
    pos: { lat: -6.08, lng: 145.39 }, // Goroka
    history: [],
    telemetry: { speedKph: 0, fuelPct: 15, headingDeg: 20, lastSeen: new Date().toISOString(), engineCut: true },
    geofences: ["Z-GOR"],
  },
]

const loadFleet = (): Vehicle[] => {
  const sanitize = (arr: Vehicle[]) =>
    arr.map((v) => {
      const b = AREA_BOUNDS[v.province]
      let pos = b
        ? clampToBounds(v.pos, b)
        : {
            lat: clamp(v.pos.lat, PNG_BBOX.minLat, PNG_BBOX.maxLat),
            lng: clamp(v.pos.lng, PNG_BBOX.minLng, PNG_BBOX.maxLng),
          }
      // pull slightly toward the city core so points stay inland
      const anchor = URBAN_ANCHOR[v.province]
      if (anchor) pos = nudgeToward(pos, anchor, 0.20)
      return { ...v, pos }
    })

  if (typeof window === "undefined") return sanitize(seedFleet())
  const raw = localStorage.getItem("fleetVehicles")
  if (!raw) {
    const seeded = sanitize(seedFleet())
    localStorage.setItem("fleetVehicles", JSON.stringify(seeded))
    return seeded
  }
  try {
    return sanitize(JSON.parse(raw) as Vehicle[])
  } catch {
    return sanitize(seedFleet())
  }
}

const saveFleet = (v: Vehicle[]) => {
  if (typeof window !== "undefined") localStorage.setItem("fleetVehicles", JSON.stringify(v))
}

/* ============== Page ============== */
export default function FleetManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(loadFleet)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all")
  const [provinceFilter, setProvinceFilter] = useState<Province | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [live, setLive] = useState(true)
  const selected = useMemo(() => vehicles.find(v => v.id === selectedId) || null, [vehicles, selectedId])

  // ===== CSV/XLSX Import/Export =====
  const fileRef = useRef<HTMLInputElement | null>(null)
  const stem = `fleet_${new Date().toISOString().slice(0, 10)}`
  const stationName = (stId: string) => STATIONS.find(s => s.id === stId)?.name ?? stId

  const flatRows = (rows: Vehicle[]) =>
    rows.map(v => ({
      id: v.id, callsign: v.callsign, plate: v.plate, makeModel: v.makeModel, type: v.type,
      province: v.province, station: stationName(v.stationId), status: v.status,
      speedKph: v.telemetry.speedKph, fuelPct: v.telemetry.fuelPct, headingDeg: v.telemetry.headingDeg,
      lat: v.pos.lat, lng: v.pos.lng, engineCut: v.telemetry.engineCut, lastSeen: v.telemetry.lastSeen,
      geofences: v.geofences.join("|"),
    }))

  const toCsv = (rows: ReturnType<typeof flatRows>) => {
    const headers = Object.keys(rows[0] ?? {
      id: "", callsign: "", plate: "", makeModel: "", type: "",
      province: "", station: "", status: "", speedKph: 0, fuelPct: 0, headingDeg: 0,
      lat: 0, lng: 0, engineCut: false, lastSeen: "", geofences: ""
    })
    const lines = [
      headers.join(","),
      ...rows.map(r =>
        headers.map(h => {
          const val = (r as any)[h]
          const s = String(val ?? "")
          return s.includes(",") ? `"${s}"` : s
        }).join(",")
      ),
    ].join("\n")
    return lines
  }

  const download = (name: string, data: BlobPart, type: string) => {
    const blob = new Blob([data], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const csv = toCsv(flatRows(filtered))
    download(`${stem}.csv`, csv, "text/csv")
  }

  const exportXlsx = async () => {
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(flatRows(filtered))
    XLSX.utils.book_append_sheet(wb, ws, "Fleet")
    XLSX.writeFile(wb, `${stem}.xlsx`)
  }

  const parseNumber = (v: string) => (v === "" || v == null ? undefined : Number(v))
  const parseBool = (v: string) => v === "true" || v === "1"

  const importCsv = async (f: File) => {
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) return
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const rows = lines.slice(1)

    const byId = new Map(vehicles.map(v => [v.id, v]))

    rows.forEach(line => {
      const parts: string[] = []
      let cur = "", inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) { inQ = !inQ; continue }
        if (ch === "," && !inQ) { parts.push(cur); cur = "" } else { cur += ch }
      }
      parts.push(cur)

      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = parts[i]?.replace(/^"|"$/g, "") })

      const stId =
        STATIONS.find(s => s.name.toLowerCase() === (obj.station || "").toLowerCase())?.id
        || STATIONS.find(s => s.province === (obj.province as Province))?.id
        || "S-NCD-01"

      const existing = byId.get(obj.id)
      const merged: Vehicle = {
        id: obj.id || crypto.randomUUID(),
        callsign: obj.callsign || existing?.callsign || "NEW-UNIT",
        plate: obj.plate || existing?.plate || "",
        makeModel: obj.makeModel || existing?.makeModel || "",
        type: (obj.type as Vehicle["type"]) || existing?.type || "Patrol",
        province: (obj.province as Province) || existing?.province || "NCD",
        stationId: stId,
        status: (obj.status as VehicleStatus) || existing?.status || "idle",
        pos: {
          lat: parseNumber(obj.lat) ?? existing?.pos.lat ?? -9.45,
          lng: parseNumber(obj.lng) ?? existing?.pos.lng ?? 147.18,
        },
        history: existing?.history ?? [],
        telemetry: {
          speedKph: parseNumber(obj.speedKph) ?? existing?.telemetry.speedKph ?? 0,
          fuelPct: parseNumber(obj.fuelPct) ?? existing?.telemetry.fuelPct ?? 50,
          headingDeg: parseNumber(obj.headingDeg) ?? existing?.telemetry.headingDeg ?? 0,
          lastSeen: obj.lastSeen || existing?.telemetry.lastSeen || new Date().toISOString(),
          engineCut: obj.engineCut != null ? parseBool(obj.engineCut) : (existing?.telemetry.engineCut ?? false),
        },
        geofences: typeof obj.geofences === "string" && obj.geofences.length
          ? obj.geofences.split("|").map((s: string) => s.trim())
          : (existing?.geofences ?? []),
      }
      byId.set(merged.id, merged)
    })

    const next = Array.from(byId.values())
    setVehicles(next)
    saveFleet(next)
  }

  /* ============== Live simulation ============== */
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => {
      setVehicles(prev => {
        const next = prev.map(v => {
          if (v.status === "maintenance" || v.status === "offline" || v.telemetry.engineCut) {
            return { ...v, telemetry: { ...v.telemetry, speedKph: 0, lastSeen: new Date().toISOString() } }
          }

          // constrained random walk
          const step = 0.005 // ~500m
          const dLat = (Math.random() - 0.5) * step
          const dLng = (Math.random() - 0.5) * step

          let pos: LatLng = { lat: v.pos.lat + dLat, lng: v.pos.lng + dLng }
          const b = AREA_BOUNDS[v.province]
          if (b) pos = clampToBounds(pos, b)
          else pos = { lat: clamp(pos.lat, PNG_BBOX.minLat, PNG_BBOX.maxLat), lng: clamp(pos.lng, PNG_BBOX.minLng, PNG_BBOX.maxLng) }

          // subtle magnet to keep units inland/central
          const anchor = URBAN_ANCHOR[v.province]
          if (anchor) pos = nudgeToward(pos, anchor, 0.08)

          const speed = Math.max(0, Math.min(110, v.telemetry.speedKph + (Math.random() * 10 - 5)))
          const fuel = Math.max(0, v.telemetry.fuelPct - (speed > 2 ? 0.10 : 0.02))
          const heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360

          const history = [...v.history, v.pos]
          if (history.length > 25) history.shift()

          return {
            ...v,
            pos,
            history,
            status: speed > 2 ? "active" : "idle",
            telemetry: {
              speedKph: Math.round(speed),
              fuelPct: Math.round(fuel),
              headingDeg: Math.round(heading),
              lastSeen: new Date().toISOString(),
              engineCut: v.telemetry.engineCut,
            }
          }
        })
        saveFleet(next)
        return next
      })
    }, 2000)
    return () => clearInterval(t)
  }, [live])

  /* ============== Derived ============== */
  const totals = useMemo(() => {
    const total = vehicles.length
    const active = vehicles.filter(v => v.status === "active").length
    const maint = vehicles.filter(v => v.status === "maintenance").length
    const alerts = vehicles.filter(v => v.telemetry.fuelPct <= 10).length
    return { total, active, maint, alerts }
  }, [vehicles])

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    const matchesQ =
      v.callsign.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      v.makeModel.toLowerCase().includes(q) ||
      v.province.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    const matchesProv = provinceFilter === "all" || v.province === provinceFilter
    return matchesQ && matchesStatus && matchesProv
  })

  const toggleEngine = (id: string) =>
    setVehicles(prev => {
      const next = prev.map(v => v.id !== id ? v : ({ ...v, telemetry: { ...v.telemetry, engineCut: !v.telemetry.engineCut, speedKph: 0 } }))
      saveFleet(next)
      return next
    })

  const armDisarmFence = (id: string, fenceId: string) =>
    setVehicles(prev => {
      const next = prev.map(v => {
        if (v.id !== id) return v
        const has = v.geofences.includes(fenceId)
        return { ...v, geofences: has ? v.geofences.filter(f => f !== fenceId) : [...v.geofences, fenceId] }
      })
      saveFleet(next)
      return next
    })

  const fenceBreaches = useMemo(() => {
    const b: Record<string, string[]> = {}
    for (const v of vehicles) {
      const breaches: string[] = []
      for (const z of GEOFENCES) {
        const armed = v.geofences.includes(z.id)
        if (!armed) continue
        if (!insideFence(v.pos, z)) breaches.push(z.name)
      }
      if (breaches.length) b[v.id] = breaches
    }
    return b
  }, [vehicles])

  const statusBadge = (s: VehicleStatus) => {
    switch (s) {
      case "active": return <Badge className="bg-green-600">ACTIVE</Badge>
      case "idle": return <Badge variant="secondary">IDLE</Badge>
      case "maintenance": return <Badge className="bg-yellow-500">MAINT</Badge>
      default: return <Badge variant="outline">OFFLINE</Badge>
    }
  }

  /* ============== Render ============== */
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fleet Management</h1>
            <p className="text-gray-600">
              National vehicle tracking, geofencing, and telemetry for police operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Import/Export */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importCsv(f)
                if (fileRef.current) fileRef.current.value = ""
              }}
            />
            <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2" onClick={exportCsv}>
                  <FileText className="w-4 h-4" /> CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={exportXlsx}>
                  <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Live toggle & New */}
            <Button variant="outline" className="gap-2" onClick={() => setLive(v => !v)}>
              {live ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {live ? "Pause Live" : "Resume Live"}
            </Button>
            <Link href="/vehicles/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" /> New Vehicle
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Vehicles</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totals.total}</div>
              <Car className="w-5 h-5 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Active Units</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totals.active}</div>
              <Radar className="w-5 h-5 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">In Maintenance</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totals.maint}</div>
              <Wrench className="w-5 h-5 text-yellow-600" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Fuel/Alert Events</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totals.alerts}</div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search callsign, plate, model, province..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Provinces</option>
                {Array.from(new Set(STATIONS.map(s => s.province))).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Map & Details */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="w-5 h-5" /> Live Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GoogleFleetMap
                  vehicles={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  geofences={GEOFENCES}
                  followSelected
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LocateFixed className="w-5 h-5" /> {selected ? selected.callsign : "Select a vehicle"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selected && <p className="text-gray-600 text-sm">Click a unit on the map or in the table to view details.</p>}
                {selected && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">{selected.makeModel} • {selected.type}</div>
                        <div className="text-sm text-gray-600">{selected.plate}</div>
                        <div className="text-xs text-gray-500">Station: {stationName(selected.stationId)} ({selected.province})</div>
                      </div>
                      {statusBadge(selected.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> Speed</span>
                        <span className="font-medium">{selected.telemetry.speedKph} km/h</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Droplet className="w-4 h-4" /> Fuel</span>
                        <span className="font-medium">{selected.telemetry.fuelPct}%</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Route className="w-4 h-4" /> Heading</span>
                        <span className="font-medium">{selected.telemetry.headingDeg}°</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Last Seen</span>
                        <span className="font-medium">{new Date(selected.telemetry.lastSeen).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className={`gap-2 ${selected.telemetry.engineCut ? "text-green-700" : "text-red-700"}`}
                        onClick={() => toggleEngine(selected.id)}
                      >
                        {selected.telemetry.engineCut ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {selected.telemetry.engineCut ? "Restore Engine" : "Engine Cut-Off"}
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => alert("Ping sent (demo)")}>
                        <Radar className="w-4 h-4" /> Ping
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Geofences</div>
                      <div className="flex flex-wrap gap-2">
                        {GEOFENCES.map(z => {
                          const armed = selected.geofences.includes(z.id)
                          return (
                            <Button
                              key={z.id}
                              variant={armed ? "default" : "outline"}
                              className="text-xs"
                              onClick={() => armDisarmFence(selected.id!, z.id)}
                            >
                              {armed ? "Armed:" : "Arm:"} {z.name}
                            </Button>
                          )
                        })}
                      </div>
                      {fenceBreaches[selected.id] && (
                        <div className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Outside zones: {fenceBreaches[selected.id].join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Link href={`/fleet/${encodeURIComponent(selected.id)}`}>
                        <Button variant="outline" className="w-full">Open Details</Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car className="w-5 h-5" /> Fleet Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Callsign</TableHead>
                  <TableHead>Plate</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Province / Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{v.callsign}</TableCell>
                    <TableCell>{v.plate}</TableCell>
                    <TableCell>{v.makeModel}</TableCell>
                    <TableCell>
                      <div className="text-sm">{v.province}</div>
                      <div className="text-xs text-gray-500">{stationName(v.stationId)}</div>
                    </TableCell>
                    <TableCell>{statusBadge(v.status)}</TableCell>
                    <TableCell>{v.telemetry.speedKph} km/h</TableCell>
                    <TableCell>{v.telemetry.fuelPct}%</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(v.id)}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleEngine(v.id)}>
                        {v.telemetry.engineCut ? "Restore" : "Cut-Off"}
                      </Button>
                      <Link href={`/fleet/${encodeURIComponent(v.id)}`}>
                        <Button size="sm" variant="outline">Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">No vehicles found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
