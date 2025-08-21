"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Download,
  CheckCircle,
  Users,
  Clock,
  Target,
  PieChart,
} from "lucide-react"
import type { User as UserType } from "@/types/user"

export default function AnalyticsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [exporting, setExporting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  if (!user) {
    return <div>Loading...</div>
  }

  // ======= DATA (kept in one place so export/generate uses the same values) =======
  const today = new Date().toISOString().slice(0, 10)

  const summary = {
    crimeRatePct: -12,
    responseTime: "8.5m",
    resolutionRatePct: 78,
    officerEfficiencyPct: 92,
    hotspotsCount: 15,
    notes: "Metrics represent month-to-date changes unless stated."
  }

  const crimeTypes = [
    { type: "Theft/Burglary", pct: 32 },
    { type: "Domestic Violence", pct: 24 },
    { type: "Traffic Offenses", pct: 18 },
    { type: "Tribal Fighting", pct: 15 },
  ]

  const hotspots = [
    { name: "Gerehu Suburb", level: "High Risk", incidents: 23 },
    { name: "Lae Market Area", level: "Medium Risk", incidents: 15 },
    { name: "Mt. Hagen CBD", level: "Watch Area", incidents: 8 },
  ]

  const regions = [
    { region: "National Capital District", incidents: 89, resolvedPct: 85, resolved: 76, responseTime: "7.2m" },
    { region: "Morobe Province",          incidents: 45, resolvedPct: 71, resolved: 32, responseTime: "9.8m" },
    { region: "Western Highlands",        incidents: 67, resolvedPct: 72, resolved: 48, responseTime: "11.5m" },
    { region: "Southern Highlands",       incidents: 23, resolvedPct: 83, resolved: 19, responseTime: "8.9m" },
  ]

  // ======= EXPORT: Excel (.xlsx) =======
  const handleExportXlsx = async () => {
    try {
      setExporting(true)
      const XLSX = await import("xlsx")

      // Summary sheet
      const summaryRows = [
        { Metric: "Crime Rate (Δ)", Value: `${summary.crimeRatePct}%` },
        { Metric: "Response Time", Value: summary.responseTime },
        { Metric: "Resolution Rate", Value: `${summary.resolutionRatePct}%` },
        { Metric: "Officer Efficiency", Value: `${summary.officerEfficiencyPct}%` },
        { Metric: "Active Hotspots", Value: summary.hotspotsCount },
        { Metric: "Notes", Value: summary.notes },
        { Metric: "As of", Value: today },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary")
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crimeTypes), "Crime Types")
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotspots), "Hotspots")
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regions), "Regions")

      XLSX.writeFile(wb, `analytics_report_${today}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  // ======= GENERATE: PDF =======
  const handleGeneratePdf = async () => {
    setGenerating(true)
    try {
      // Try jsPDF + autoTable
      // @ts-ignore - typings may not be present in your project; this keeps build happy.
      const { jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      // @ts-ignore
      const doc = new jsPDF({ unit: "pt" })
      const marginX = 40
      let y = 40

      doc.setFontSize(18)
      doc.text("RPNGC • Analytics & Reports", marginX, y)
      y += 22
      doc.setFontSize(10)
      doc.text(`Generated: ${today}`, marginX, y)
      y += 18

      // Summary table
      // @ts-ignore
      doc.autoTable({
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Crime Rate (Δ)", `${summary.crimeRatePct}%`],
          ["Response Time", summary.responseTime],
          ["Resolution Rate", `${summary.resolutionRatePct}%`],
          ["Officer Efficiency", `${summary.officerEfficiencyPct}%`],
          ["Active Hotspots", `${summary.hotspotsCount}`],
          ["Notes", summary.notes],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [60, 80, 180] },
      })
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 20

      // Crime types
      doc.setFontSize(12)
      doc.text("Crime Types Distribution", marginX, y)
      y += 8
      // @ts-ignore
      doc.autoTable({
        startY: y,
        head: [["Type", "Share (%)"]],
        body: crimeTypes.map((c) => [c.type, `${c.pct}`]),
        theme: "striped",
        styles: { fontSize: 10 },
      })
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 20

      // Hotspots
      doc.setFontSize(12)
      doc.text("Crime Hotspots", marginX, y)
      y += 8
      // @ts-ignore
      doc.autoTable({
        startY: y,
        head: [["Area", "Risk Level", "Incidents"]],
        body: hotspots.map((h) => [h.name, h.level, h.incidents]),
        theme: "striped",
        styles: { fontSize: 10 },
      })
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 20

      // Regions
      doc.setFontSize(12)
      doc.text("Regional Performance Overview", marginX, y)
      y += 8
      // @ts-ignore
      doc.autoTable({
        startY: y,
        head: [["Region", "Incidents", "Resolved", "Resolved (%)", "Response Time"]],
        body: regions.map((r) => [
          r.region,
          r.incidents,
          r.resolved,
          `${r.resolvedPct}%`,
          r.responseTime,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [60, 80, 180] },
      })

      doc.save(`analytics_report_${today}.pdf`)
    } catch (err) {
      // Graceful fallback to browser print (user can save as PDF)
      const html = `
        <html>
          <head>
            <title>Analytics Report - ${today}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
              h1 { margin: 0 0 8px 0; }
              h2 { margin: 24px 0 8px 0; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
              th { background: #eef2ff; }
            </style>
          </head>
          <body>
            <h1>RPNGC • Analytics & Reports</h1>
            <div>Generated: ${today}</div>

            <h2>Summary</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Crime Rate (Δ)</td><td>${summary.crimeRatePct}%</td></tr>
              <tr><td>Response Time</td><td>${summary.responseTime}</td></tr>
              <tr><td>Resolution Rate</td><td>${summary.resolutionRatePct}%</td></tr>
              <tr><td>Officer Efficiency</td><td>${summary.officerEfficiencyPct}%</td></tr>
              <tr><td>Active Hotspots</td><td>${summary.hotspotsCount}</td></tr>
              <tr><td>Notes</td><td>${summary.notes}</td></tr>
            </table>

            <h2>Crime Types Distribution</h2>
            <table>
              <tr><th>Type</th><th>Share (%)</th></tr>
              ${crimeTypes.map(c => `<tr><td>${c.type}</td><td>${c.pct}</td></tr>`).join("")}
            </table>

            <h2>Crime Hotspots</h2>
            <table>
              <tr><th>Area</th><th>Risk Level</th><th>Incidents</th></tr>
              ${hotspots.map(h => `<tr><td>${h.name}</td><td>${h.level}</td><td>${h.incidents}</td></tr>`).join("")}
            </table>

            <h2>Regional Performance Overview</h2>
            <table>
              <tr><th>Region</th><th>Incidents</th><th>Resolved</th><th>Resolved (%)</th><th>Response Time</th></tr>
              ${regions.map(r => `<tr>
                <td>${r.region}</td><td>${r.incidents}</td><td>${r.resolved}</td>
                <td>${r.resolvedPct}%</td><td>${r.responseTime}</td>
              </tr>`).join("")}
            </table>

            <script>
              window.onload = () => { window.print(); }
            </script>
          </body>
        </html>
      `
      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
      if (w) {
        w.document.open()
        w.document.write(html)
        w.document.close()
      } else {
        alert("Report generated. Please use your browser's Print to PDF.")
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Crime statistics, trends, and performance metrics for Papua New Guinea</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportXlsx} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting…" : "Export Report"}
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleGeneratePdf} disabled={generating}>
              <PieChart className="w-4 h-4 mr-2" />
              {generating ? "Generating…" : "Generate Report"}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crime Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.crimeRatePct}%</div>
              <p className="text-xs text-green-600">↓ Down from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.responseTime}</div>
              <p className="text-xs text-green-600">↓ 2m faster</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.resolutionRatePct}%</div>
              <p className="text-xs text-green-600">↑ +5% improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Officer Efficiency</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.officerEfficiencyPct}%</div>
              <p className="text-xs text-blue-600">↑ +3% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
              <MapPin className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.hotspotsCount}</div>
              <p className="text-xs text-orange-600">Active crime areas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Crime Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Row label="Theft/Burglary" pct={32} barClass="bg-blue-500" />
                <Row label="Domestic Violence" pct={24} barClass="bg-red-500" />
                <Row label="Traffic Offenses" pct={18} barClass="bg-orange-500" />
                <Row label="Tribal Fighting" pct={15} barClass="bg-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Crime Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <HotspotCard tone="red"    level="High Risk"   area="Gerehu Suburb"   count={23} />
                <HotspotCard tone="orange" level="Medium Risk" area="Lae Market Area" count={15} />
                <HotspotCard tone="yellow" level="Watch Area"  area="Mt. Hagen CBD"   count={8} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Regional Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {regions.map((r) => (
                <div key={r.region} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">{r.region}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Incidents:</span><span className="font-medium">{r.incidents}</span></div>
                    <div className="flex justify-between"><span>Resolved:</span><span className="text-green-600">{r.resolved} ({r.resolvedPct}%)</span></div>
                    <div className="flex justify-between"><span>Response Time:</span><span>{r.responseTime}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

/* ---------- Small presentational helpers ---------- */
function Row({ label, pct, barClass }: { label: string; pct: number; barClass: string }) {
  const width = Math.max(6, Math.round((pct / 40) * 64)) // scale to ~w-64 max
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <div className={`${barClass} h-2 rounded-full`} style={{ width }} />
        <span className="text-sm">{pct}%</span>
      </div>
    </div>
  )
}

function HotspotCard({
  tone,
  level,
  area,
  count,
}: {
  tone: "red" | "orange" | "yellow"
  level: string
  area: string
  count: number
}) {
  const toneMap = {
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", badge: "destructive" as const },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", badge: "default" as const },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600", badge: "secondary" as const },
  }[tone]

  return (
    <div className={`p-3 ${toneMap.bg} rounded border ${toneMap.border}`}>
      <div className="flex justify-between items-center">
        <div>
          <Badge variant={toneMap.badge} className="mb-1">{level}</Badge>
          <h4 className="font-medium">{area}</h4>
        </div>
        <span className={`text-lg font-bold ${toneMap.text}`}>{count}</span>
      </div>
    </div>
  )
}
