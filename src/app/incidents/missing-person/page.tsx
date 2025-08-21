// /src/app/incidents/missing-person/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User, AlertTriangle, Clock, MapPin, Phone, Camera, Users,
  Search, Send, CheckCircle, Eye, Megaphone, Shield, Target, Activity
} from "lucide-react";
import type { User as UserType } from "@/types/user";

/* ------------ data used for selects/stats (can live here for now) -------- */
const PNG_PROVINCES = [
  "National Capital District","Western Province","Gulf Province","Central Province",
  "Milne Bay Province","Oro Province","Southern Highlands Province","Western Highlands Province",
  "Enga Province","Simbu Province","Eastern Highlands Province","Morobe Province","Madang Province",
  "East Sepik Province","West Sepik Province","Manus Province","New Ireland Province",
  "East New Britain Province","West New Britain Province","Bougainville Province",
];

const MISSING_CATEGORIES = {
  child:      { label: "Missing Child",       priority: "critical", color: "bg-red-600",    amber: true  },
  adult:      { label: "Missing Adult",       priority: "high",     color: "bg-orange-500", amber: false },
  elderly:    { label: "Missing Elderly",     priority: "high",     color: "bg-red-500",    amber: false },
  vulnerable: { label: "Vulnerable Person",   priority: "critical", color: "bg-red-700",    amber: true  },
  endangered: { label: "Endangered Missing",  priority: "critical", color: "bg-red-800",    amber: true  },
} as const;

const CIRCUMSTANCES = [
  "Last seen at home","Last seen at school","Last seen at work","Last seen with friends",
  "Left for walk/exercise","Went to market/shopping","Family dispute","Mental health concerns",
  "Medical emergency","Possible abduction","Runaway","Lost while traveling",
  "Tribal/family conflict","Sorcery accusations","Unknown circumstances",
];

/* ------------------------ mock cases (replace later) ---------------------- */
const MOCK_MISSING_PERSONS = [
  {
    id: "MP-2024-001",
    name: "Mary Kaupa",
    age: 8,
    gender: "Female",
    category: "child",
    reportDate: "2024-01-15",
    lastSeen: "2024-01-14 16:00",
    location: "Gerehu Primary School, Port Moresby",
    province: "National Capital District",
    description: "Small girl, short black hair, wearing blue school uniform and black shoes",
    circumstances: "Last seen leaving school, never arrived home",
    reportedBy: "Grace Kaupa (Mother)",
    reporterPhone: "+675 325 8901",
    caseOfficer: "Det. Sarah Johnson",
    status: "active",
    amberAlert: true,
    mediaAttention: true,
    searchTeams: 3,
    tips: 12,
    lastUpdate: "2024-01-15 14:30",
  },
  {
    id: "MP-2024-002",
    name: "Peter Temu",
    age: 45,
    gender: "Male",
    category: "adult",
    reportDate: "2024-01-12",
    lastSeen: "2024-01-11 08:00",
    location: "Mt. Hagen Market",
    province: "Western Highlands Province",
    description: "Medium build, beard, wearing red shirt and blue jeans",
    circumstances: "Went to market for business, never returned home",
    reportedBy: "Maria Temu (Wife)",
    reporterPhone: "+675 542 7890",
    caseOfficer: "Const. Michael Kila",
    status: "active",
    amberAlert: false,
    mediaAttention: false,
    searchTeams: 1,
    tips: 5,
    lastUpdate: "2024-01-14 10:15",
  },
  {
    id: "MP-2024-003",
    name: "Joseph Namaliu",
    age: 72,
    gender: "Male",
    category: "elderly",
    reportDate: "2024-01-10",
    lastSeen: "2024-01-09 19:00",
    location: "Lae Township",
    province: "Morobe Province",
    description: "Elderly man, gray hair, walks with cane, wearing traditional clothing",
    circumstances: "Has dementia, wandered from home during evening",
    reportedBy: "David Namaliu (Son)",
    reporterPhone: "+675 472 1234",
    caseOfficer: "Sgt. Grace Bani",
    status: "found",
    amberAlert: false,
    mediaAttention: true,
    searchTeams: 2,
    tips: 8,
    lastUpdate: "2024-01-11 06:45",
    foundDate: "2024-01-11",
    foundLocation: "Lae Market - found safe",
  },
];

/* --------------------------------- page ---------------------------------- */
export default function MissingPersonPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);

  const [activeTab, setActiveTab]   = useState("active");
  const [selectedCase, setSelected] = useState<typeof MOCK_MISSING_PERSONS[0] | null>(null);
  const [showNewReport, setShowNew] = useState(false);
  const [searchTerm, setSearch]     = useState("");
  const [cases, setCases]           = useState(MOCK_MISSING_PERSONS);

  // new report minimal form
  const [newReport, setNewReport] = useState({
    name: "", age: "", gender: "", category: "",
    lastSeenDate: "", lastSeenTime: "", location: "", province: "",
    description: "", circumstances: "",
    reporterName: "", reporterPhone: "", reporterRelation: "",
    notes: "", recentPhotos: false, hasMedicalNeeds: false,
    isEndangered: false, suspectedAbduction: false,
  });

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (!data) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(data));
  }, [router]);

  if (!user) return <div>Loading...</div>;

  /* ------------------------------ helpers -------------------------------- */
  const getStatusBadge = (status: string) =>
    status === "active" ? ("destructive" as const)
    : status === "found" ? ("default" as const)
    : ("secondary" as const);

  const getCategoryColor = (category: string) =>
    MISSING_CATEGORIES[category as keyof typeof MISSING_CATEGORIES]?.color || "bg-gray-500";

  const filteredCases = cases.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && p.status === "active") ||
      (activeTab === "found"  && p.status === "found")  ||
      (activeTab === "amber"  && p.amberAlert);

    return matchesSearch && matchesTab;
  });

  const markSelectedFound = () => {
    if (!selectedCase) return;
    const foundDate = new Date().toISOString().slice(0, 10);
    const foundLocation = "Marked found (location to confirm)";

    setCases((prev) =>
      prev.map((p) => (p.id === selectedCase.id ? { ...p, status: "found", foundDate, foundLocation } : p))
    );
    setSelected((prev) => (prev ? { ...prev, status: "found", foundDate, foundLocation } as any : prev));
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const caseId = `MP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
    setCases((prev) => [
      {
        id: caseId,
        name: newReport.name,
        age: Number(newReport.age),
        gender: newReport.gender as any,
        category: newReport.category as any,
        reportDate: new Date().toISOString().slice(0, 10),
        lastSeen: `${newReport.lastSeenDate} ${newReport.lastSeenTime || ""}`.trim(),
        location: newReport.location,
        province: newReport.province,
        description: newReport.description,
        circumstances: newReport.circumstances,
        reportedBy: newReport.reporterName,
        reporterPhone: newReport.reporterPhone,
        caseOfficer: "Unassigned",
        status: "active",
        amberAlert: MISSING_CATEGORIES[newReport.category as keyof typeof MISSING_CATEGORIES]?.amber || false,
        mediaAttention: false,
        searchTeams: 0,
        tips: 0,
        lastUpdate: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...prev,
    ]);
    setShowNew(false);
    setNewReport({
      name: "", age: "", gender: "", category: "", lastSeenDate: "", lastSeenTime: "",
      location: "", province: "", description: "", circumstances: "",
      reporterName: "", reporterPhone: "", reporterRelation: "",
      notes: "", recentPhotos: false, hasMedicalNeeds: false,
      isEndangered: false, suspectedAbduction: false,
    });
    alert(`Missing person report ${caseId} created successfully`);
  };

  /* -------------------------------- UI ---------------------------------- */
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Missing Person Reports</h1>
            <p className="text-gray-600">Manage and track missing person cases across Papua New Guinea</p>
          </div>
          <div className="flex gap-2">
            {/* Broadcast goes to the broadcast route (sibling folder) */}
            <Button variant="outline" asChild>
              <Link href="/incidents/missing-person/broadcast">
                <Megaphone className="w-4 h-4 mr-2" />
                Broadcast Alert
              </Link>
            </Button>
            <Button onClick={() => setShowNew(true)} className="bg-red-600 hover:bg-red-700">
              <User className="w-4 h-4 mr-2" />
              Report Missing Person
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cases.filter((p) => p.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">Currently missing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AMBER Alerts</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {cases.filter((p) => p.amberAlert && p.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Critical alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Found Safe</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{cases.filter((p) => p.status === "found").length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search Teams</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {cases.filter((p) => p.status === "active").reduce((sum, p) => sum + p.searchTeams, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Tips</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {cases.reduce((sum, p) => sum + p.tips, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>
        </div>

        {/* AMBER banner */}
        {cases.some((p) => p.amberAlert && p.status === "active") && (
          <Alert variant="destructive" className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>AMBER ALERT ACTIVE:</strong>{" "}
              {cases.filter((p) => p.amberAlert && p.status === "active").length} critical case(s) require immediate
              public attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Missing Persons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, case ID, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setSearch("")}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases list */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active ({cases.filter((p) => p.status === "active").length})</TabsTrigger>
            <TabsTrigger value="amber">AMBER ({cases.filter((p) => p.amberAlert && p.status === "active").length})</TabsTrigger>
            <TabsTrigger value="found">Found ({cases.filter((p) => p.status === "found").length})</TabsTrigger>
            <TabsTrigger value="all">All ({cases.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Missing Person Cases ({filteredCases.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCases.map((person) => (
                    <div
                      key={person.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all
                        ${person.amberAlert ? "border-red-300 bg-red-50" : "hover:bg-gray-50"}
                        ${selectedCase?.id === person.id ? "border-blue-500 bg-blue-50" : ""}`}
                      onClick={() => setSelected(person)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-500" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{person.name}</h3>
                              <Badge variant="outline">ID: {person.id}</Badge>
                              {person.amberAlert && (
                                <Badge variant="destructive" className="animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> AMBER
                                </Badge>
                              )}
                              {person.status === "found" && (
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" /> FOUND SAFE
                                </Badge>
                              )}
                            </div>

                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span>{person.age} years old, {person.gender}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span>{person.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span>Last seen: {person.lastSeen}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>Reported by: {person.reportedBy}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-gray-400" />
                                  <span>Officer: {person.caseOfficer}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-gray-400" />
                                  <span>{person.searchTeams} search teams, {person.tips} tips</span>
                                </div>
                              </div>
                            </div>

                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{person.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(person.category)}`} />
                          <Badge variant={getStatusBadge(person.status)}>{person.status.toUpperCase()}</Badge>
                          <Button size="sm" asChild>
                            <Link href={`/incidents/missing-person/${encodeURIComponent(person.id)}`}>
                              <Eye className="w-4 h-4 mr-2" /> View Case
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredCases.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <User className="mx-auto h-12 w-12 mb-4" />
                      <p>No missing person cases found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Case details */}
        {selectedCase && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" /> Case Details - {selectedCase.name}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/incidents/missing-person/${encodeURIComponent(selectedCase.id)}/photos`}>
                      <Camera className="w-4 h-4 mr-2" /> Photos
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/incidents/missing-person/broadcast?caseId=${encodeURIComponent(selectedCase.id)}`}>
                      <Megaphone className="w-4 h-4 mr-2" /> Broadcast
                    </Link>
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={markSelectedFound}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Found
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Left column */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Missing Person</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{selectedCase.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Age:</span><span className="font-medium">{selectedCase.age}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Gender:</span><span className="font-medium">{selectedCase.gender}</span></div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <Badge className={getCategoryColor(selectedCase.category)}>
                          {MISSING_CATEGORIES[selectedCase.category as keyof typeof MISSING_CATEGORIES]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedCase.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Circumstances</h4>
                    <p className="text-sm text-gray-700">{selectedCase.circumstances}</p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Case Information</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Case ID:</span><span className="font-medium">{selectedCase.id}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Report Date:</span><span className="font-medium">{selectedCase.reportDate}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Last Seen:</span><span className="font-medium">{selectedCase.lastSeen}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Location:</span><span className="font-medium">{selectedCase.location}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Province:</span><span className="font-medium">{selectedCase.province}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Contact</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Reported By:</span><span className="font-medium">{selectedCase.reportedBy}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Phone:</span><span className="font-medium">{selectedCase.reporterPhone}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Case Officer:</span><span className="font-medium">{selectedCase.caseOfficer}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Search Status</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Search Teams:</span><span className="font-medium">{selectedCase.searchTeams} active</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Community Tips:</span><span className="font-medium">{selectedCase.tips} received</span></div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Media Coverage:</span>
                        <Badge variant={selectedCase.mediaAttention ? "default" : "secondary"}>
                          {selectedCase.mediaAttention ? "Active" : "None"}
                        </Badge>
                      </div>
                      <div className="flex justify-between"><span className="text-gray-600">Last Update:</span><span className="font-medium">{selectedCase.lastUpdate}</span></div>
                    </div>
                  </div>

                  {selectedCase.status === "found" && (selectedCase as any).foundDate && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>FOUND SAFE:</strong> {selectedCase.name} was found on {(selectedCase as any).foundDate} at {(selectedCase as any).foundLocation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Report form (modal-style section) */}
        {showNewReport && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><User className="w-5 h-5" /> Report Missing Person</span>
                <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReport} className="space-y-6">
                <Tabs defaultValue="person" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="person">Missing Person</TabsTrigger>
                    <TabsTrigger value="circumstances">Circumstances</TabsTrigger>
                    <TabsTrigger value="reporter">Reporter Info</TabsTrigger>
                    <TabsTrigger value="additional">Additional Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="person" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" value={newReport.name}
                          onChange={(e) => setNewReport((p) => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input id="age" type="number" value={newReport.age}
                          onChange={(e) => setNewReport((p) => ({ ...p, age: e.target.value }))} required />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Select value={newReport.gender} onValueChange={(v) => setNewReport((p) => ({ ...p, gender: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={newReport.category} onValueChange={(v) => setNewReport((p) => ({ ...p, category: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(MISSING_CATEGORIES).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Physical Description *</Label>
                      <Textarea rows={4} value={newReport.description}
                        onChange={(e) => setNewReport((p) => ({ ...p, description: e.target.value }))} required />
                    </div>
                  </TabsContent>

                  <TabsContent value="circumstances" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Last Seen Date *</Label>
                        <Input type="date" value={newReport.lastSeenDate}
                          onChange={(e) => setNewReport((p) => ({ ...p, lastSeenDate: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Seen Time</Label>
                        <Input type="time" value={newReport.lastSeenTime}
                          onChange={(e) => setNewReport((p) => ({ ...p, lastSeenTime: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Last Known Location *</Label>
                        <Input value={newReport.location}
                          onChange={(e) => setNewReport((p) => ({ ...p, location: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Province *</Label>
                        <Select value={newReport.province} onValueChange={(v) => setNewReport((p) => ({ ...p, province: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                          <SelectContent>
                            {PNG_PROVINCES.map((pv) => (<SelectItem key={pv} value={pv}>{pv}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Circumstances *</Label>
                      <Select value={newReport.circumstances} onValueChange={(v) => setNewReport((p) => ({ ...p, circumstances: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select circumstances" /></SelectTrigger>
                        <SelectContent>
                          {CIRCUMSTANCES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="reporter" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Your Name *</Label>
                        <Input value={newReport.reporterName}
                          onChange={(e) => setNewReport((p) => ({ ...p, reporterName: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone *</Label>
                        <Input placeholder="+675 XXX XXXX" value={newReport.reporterPhone}
                          onChange={(e) => setNewReport((p) => ({ ...p, reporterPhone: e.target.value }))} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Relationship to Missing Person *</Label>
                      <Select value={newReport.reporterRelation} onValueChange={(v) => setNewReport((p) => ({ ...p, reporterRelation: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="relative">Other Relative</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="neighbor">Neighbor</SelectItem>
                          <SelectItem value="teacher">Teacher/School</SelectItem>
                          <SelectItem value="employer">Employer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="additional" className="space-y-2">
                    <Label htmlFor="notes">Additional Information</Label>
                    <Textarea id="notes" rows={4} value={newReport.notes}
                      onChange={(e) => setNewReport((p) => ({ ...p, notes: e.target.value }))} />
                  </TabsContent>
                </Tabs>

                <div className="flex gap-4 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    <Send className="w-4 h-4 mr-2" /> Submit Missing Person Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
