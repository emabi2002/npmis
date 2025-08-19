"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MapPin,
  FileText as FileTextIcon,
  Camera,
  Paperclip,
  Shield,
  Scale,
  Download,
  Printer,
  FileSpreadsheet,
  FileText
} from "lucide-react"
import type { User as UserType } from "@/types/user"

// ---------------- Types & Mock Data ----------------

interface LogBookEntry {
  id: string
  incidentNumber: string
  status: "pending" | "verified" | "amended" | "rejected"
  type: "arrest" | "custody" | "incident" | "transfer"
  personName: string
  personAge: number
  personGender: string
  incidentType: string
  location: string
  dateTime: string
  reportingOfficer: string
  verifyingOfficer?: string
  postCommander?: string
  description: string
  charges: string[]
  evidence: { documents: number; photos: number; videos: number }
  custody: {
    inCustody: boolean
    cellNumber?: string
    bail?: { amount: number; type: string; guarantor: string }
  }
  amendments: { count: number; lastAmended?: string; amendedBy?: string }
  priority: "low" | "medium" | "high" | "critical"
  lastUpdated: string
}

const MOCK_LOG_ENTRIES: LogBookEntry[] = [
  {
    id: "LOG-2024-001",
    incidentNumber: "INC-2024-001",
    status: "pending",
    type: "arrest",
    personName: "John Kaupa",
    personAge: 29,
    personGender: "Male",
    incidentType: "Armed Robbery",
    location: "Port Moresby Central Market",
    dateTime: "2024-01-15T14:30:00Z",
    reportingOfficer: "Const. Peter Bani",
    description:
      "Suspect arrested for armed robbery at Central Market. Found in possession of stolen items and weapon.",
    charges: ["Armed Robbery", "Possession of Stolen Property", "Carrying Weapon"],
    evidence: { documents: 3, photos: 8, videos: 1 },
    custody: { inCustody: true, cellNumber: "A-3" },
    amendments: { count: 0 },
    priority: "high",
    lastUpdated: "2024-01-15T14:45:00Z",
  },
  {
    id: "LOG-2024-002",
    incidentNumber: "INC-2024-002",
    status: "verified",
    type: "custody",
    personName: "Mary Temu",
    personAge: 35,
    personGender: "Female",
    incidentType: "Domestic Violence",
    location: "Gerehu Stage 4",
    dateTime: "2024-01-15T09:15:00Z",
    reportingOfficer: "Const. Sarah Kila",
    verifyingOfficer: "Sgt. Michael Namaliu",
    postCommander: "Insp. David Agarobe",
    description:
      "Domestic violence incident. Suspect brought in for questioning and processing.",
    charges: ["Domestic Violence", "Assault"],
    evidence: { documents: 2, photos: 4, videos: 0 },
    custody: {
      inCustody: false,
      bail: { amount: 500, type: "Cash", guarantor: "Paul Temu (Brother)" },
    },
    amendments: {
      count: 1,
      lastAmended: "2024-01-15T11:30:00Z",
      amendedBy: "Insp. David Agarobe",
    },
    priority: "medium",
    lastUpdated: "2024-01-15T12:00:00Z",
  },
  {
    id: "LOG-2024-003",
    incidentNumber: "INC-2024-003",
    status: "amended",
    type: "incident",
    personName: "Tony Siaguru",
    personAge: 42,
    personGender: "Male",
    incidentType: "Theft",
    location: "Boroko Market",
    dateTime: "2024-01-14T16:20:00Z",
    reportingOfficer: "Const. Helen Bani",
    verifyingOfficer: "Sgt. Lisa Kaupa",
    postCommander: "Insp. David Agarobe",
    description:
      "Theft of motor vehicle parts. Suspect apprehended and items recovered.",
    charges: ["Theft", "Receiving Stolen Goods"],
    evidence: { documents: 4, photos: 12, videos: 2 },
    custody: {
      inCustody: false,
      bail: { amount: 300, type: "Surety", guarantor: "Grace Siaguru (Wife)" },
    },
    amendments: {
      count: 2,
      lastAmended: "2024-01-15T08:15:00Z",
      amendedBy: "Insp. David Agarobe",
    },
    priority: "medium",
    lastUpdated: "2024-01-15T08:15:00Z",
  },
]

// ---------------- Page ----------------

export default function LogBookPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [entries] = useState<LogBookEntry[]>(MOCK_LOG_ENTRIES)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const printableRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  if (!user) return <div>Loading...</div>

  // Filtering
  const filteredEntries = entries.filter((entry) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      entry.personName.toLowerCase().includes(q) ||
      entry.incidentNumber.toLowerCase().includes(q) ||
      entry.incidentType.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || entry.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Badges/helpers
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      verified: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      amended: { variant: "default" as const, icon: Edit, color: "text-blue-600" },
      rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary" as const,
      medium: "default" as const,
      high: "destructive" as const,
      critical: "destructive" as const,
    }
    return variants[priority as keyof typeof variants] || "secondary"
  }

  const canAmend = user.role === "commander" || user.role === "admin"

  // ---------------- Export / Print ----------------

  // Common column definitions for both Excel and PDF
  const exportColumns = [
    { label: "Date/Time", value: (e: LogBookEntry) => new Date(e.dateTime).toLocaleString() },
    { label: "Incident #", value: (e: LogBookEntry) => e.incidentNumber },
    { label: "Name", value: (e: LogBookEntry) => e.personName },
    { label: "Type", value: (e: LogBookEntry) => e.incidentType },
    { label: "Status", value: (e: LogBookEntry) => e.status },
    { label: "Location", value: (e: LogBookEntry) => e.location },
    { label: "Officer", value: (e: LogBookEntry) => e.reportingOfficer },
    {
      label: "In Custody",
      value: (e: LogBookEntry) =>
        e.custody.inCustody
          ? `Yes${e.custody.cellNumber ? ` (Cell ${e.custody.cellNumber})` : ""}`
          : e.custody.bail
          ? `Bail: K${e.custody.bail.amount} ${e.custody.bail.type}`
          : "No",
    },
    { label: "Amendments", value: (e: LogBookEntry) => String(e.amendments.count) },
  ]

  const formatRows = () =>
    filteredEntries.map((e) => {
      const obj: Record<string, any> = {}
      for (const col of exportColumns) obj[col.label] = col.value(e)
      return obj
    })

  const filenameStem = `logbook_${new Date().toISOString().slice(0, 10)}`

  const exportExcel = async () => {
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(formatRows())
    XLSX.utils.book_append_sheet(wb, ws, "Logbook")
    XLSX.writeFile(wb, `${filenameStem}.xlsx`)
  }

  const exportPdf = async () => {
    const { default: JsPDF } = await import("jspdf")
    await import("jspdf-autotable")
    const doc = new JsPDF({ orientation: "landscape" })

    const head = [exportColumns.map((c) => c.label)]
    const body = filteredEntries.map((row) => exportColumns.map((c) => c.value(row)))

    // @ts-ignore (autotable augments jsPDF instance)
    doc.autoTable({
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { top: 14 },
    })

    doc.save(`${filenameStem}.pdf`)
  }

  const printRegister = () => {
    if (!printableRef.current) return window.print()
    const html = printableRef.current.outerHTML
    const w = window.open("", "_blank", "noopener,noreferrer,width=1200,height=800")
    if (!w) return window.print()
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${filenameStem}</title>
          <style>
            body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; padding: 24px; }
            h1 { margin: 0 0 8px 0; }
            .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Digital Log Book Register</h1>
          <div class="muted">${new Date().toLocaleString()}</div>
          ${html}
        </body>
      </html>
    `)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  // ---------------- Render ----------------

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Digital Log Book
            </h1>
            <p className="text-gray-600">
              Incident verification, custody logging, and audit trail management
            </p>
          </div>

          <div className="flex gap-2">
            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Log
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPdf} className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Print */}
            <Button variant="outline" onClick={printRegister} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Register
            </Button>

            <Link href="/logbook/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Log Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* Commander notice */}
        {canAmend && (
          <div className="border rounded-md p-3 bg-blue-50 text-blue-800 flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5" />
            <p className="text-sm">
              <strong>Commander Authority:</strong> You have permission to amend log book entries.
              All amendments will be tracked in the audit trail.
            </p>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
              <p className="text-xs text-gray-600">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter((e) => e.status === "pending").length}
              </div>
              <p className="text-xs text-yellow-600">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Custody</CardTitle>
              <User className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter((e) => e.custody.inCustody).length}
              </div>
              <p className="text-xs text-red-600">Currently detained</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amendments</CardTitle>
              <Edit className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.reduce((sum, e) => sum + e.amendments.count, 0)}
              </div>
              <p className="text-xs text-purple-600">Total amendments</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter Log Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, incident number, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md min-w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="amended">Amended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Register (printable) */}
        <div ref={printableRef}>
          <Card>
            <CardHeader>
              <CardTitle>Log Book Entries ({filteredEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEntries.map((entry) => {
                  const statusConfig = getStatusBadge(entry.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <div key={entry.id} className="p-4 border rounded-lg print:border-black">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{entry.personName}</h3>
                            <p className="text-sm text-gray-600">
                              {entry.incidentNumber} • {entry.incidentType}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityBadge(entry.priority)}>
                            {entry.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {entry.status.toUpperCase()}
                          </Badge>
                          {entry.custody.inCustody && (
                            <Badge variant="destructive" className="bg-red-600">
                              IN CUSTODY
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3 text-sm mb-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.dateTime).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {entry.location}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-4 h-4" />
                          {entry.reportingOfficer}
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Charges: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.charges.map((charge, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {charge}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mb-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <h4 className="font-medium mb-1">Evidence Attached</h4>
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1">
                              <FileTextIcon className="w-3 h-3" />
                              {entry.evidence.documents} docs
                            </span>
                            <span className="flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {entry.evidence.photos} photos
                            </span>
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {entry.evidence.videos} videos
                            </span>
                          </div>
                        </div>

                        <div className="p-2 bg-gray-50 rounded">
                          <h4 className="font-medium mb-1">Custody Status</h4>
                          {entry.custody.inCustody ? (
                            <div>
                              <span className="text-red-600 font-medium">In Custody</span>
                              {entry.custody.cellNumber && (
                                <span className="text-gray-600"> - Cell {entry.custody.cellNumber}</span>
                              )}
                            </div>
                          ) : entry.custody.bail ? (
                            <div>
                              <span className="text-green-600 font-medium">Released on Bail</span>
                              <span className="text-gray-600">
                                {" "}
                                - K{entry.custody.bail.amount} ({entry.custody.bail.type})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-600">Not in custody</span>
                          )}
                        </div>
                      </div>

                      {entry.amendments.count > 0 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium">{entry.amendments.count} amendment(s) made</span>
                            {entry.amendments.lastAmended && (
                              <span className="text-gray-600">
                                Last: {new Date(entry.amendments.lastAmended).toLocaleString()}
                                {entry.amendments.amendedBy && ` by ${entry.amendments.amendedBy}`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Link href={`/logbook/${entry.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>

                        {entry.status === "pending" && (
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}

                        {canAmend && (
                          <Button variant="outline" size="sm" className="text-blue-600">
                            <Edit className="w-4 h-4 mr-1" />
                            Amend
                          </Button>
                        )}

                        {entry.custody.inCustody && (
                          <Link href={`/custody/${entry.id}`}>
                            <Button variant="outline" size="sm" className="text-purple-600">
                              <Scale className="w-4 h-4 mr-1" />
                              Custody
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}

                {filteredEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No log entries found</h3>
                    <p>No entries match your search criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
