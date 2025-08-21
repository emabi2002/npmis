"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Calendar, Eye, Filter, Plus, Search, Shield,
  BookOpen, Award, Clock, AlertTriangle, CheckCircle,
  TrendingUp, GraduationCap
} from "lucide-react";
import type { User as UserType } from "@/types/user";

const RANKS = {
  commissioner: { label: "Commissioner", level: 9, color: "bg-purple-600" },
  deputy_commissioner: { label: "Deputy Commissioner", level: 8, color: "bg-purple-500" },
  assistant_commissioner: { label: "Assistant Commissioner", level: 7, color: "bg-blue-600" },
  chief_superintendent: { label: "Chief Superintendent", level: 6, color: "bg-blue-500" },
  superintendent: { label: "Superintendent", level: 5, color: "bg-blue-400" },
  chief_inspector: { label: "Chief Inspector", level: 4, color: "bg-green-600" },
  inspector: { label: "Inspector", level: 3, color: "bg-green-500" },
  sergeant: { label: "Sergeant", level: 2, color: "bg-orange-500" },
  constable: { label: "Constable", level: 1, color: "bg-gray-500" }
} as const;

const DEPARTMENTS = {
  general_duties: "General Duties",
  cid: "Criminal Investigation Department",
  traffic: "Traffic Division",
  forensics: "Forensics Unit",
  cyber: "Cybercrime Unit",
  narcotics: "Narcotics Division",
  special_operations: "Special Operations",
  community: "Community Relations",
  internal_affairs: "Internal Affairs",
  administration: "Administration"
} as const;

const STATUS_OPTIONS = {
  active: { label: "Active Duty", color: "bg-green-500", variant: "default" as const },
  training: { label: "In Training", color: "bg-blue-500", variant: "default" as const },
  leave: { label: "On Leave", color: "bg-yellow-500", variant: "secondary" as const },
  suspended: { label: "Suspended", color: "bg-red-500", variant: "destructive" as const },
  retired: { label: "Retired", color: "bg-gray-500", variant: "secondary" as const },
  medical: { label: "Medical Leave", color: "bg-orange-500", variant: "default" as const }
} as const;

/** ---- Types ---- */
type Officer = {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  station: string;
  rank: keyof typeof RANKS;
  department: keyof typeof DEPARTMENTS;
  status: keyof typeof STATUS_OPTIONS;
  yearsOfService: number;
  performanceRating: "Excellent" | "Good" | "Needs Improvement";
  commendations: number;
  trainingCompleted: string[];
  trainingDue: string[];
  photo?: string | null;
};

/** ---- Mock data (sample 5 officers) ---- */
const MOCK_PERSONNEL: Officer[] = [
  {
    id: "1",
    firstName: "Maria",
    lastName: "Kave",
    badgeNumber: "PNG-0001",
    station: "Port Moresby",
    rank: "inspector",
    department: "cid",
    status: "active",
    yearsOfService: 9,
    performanceRating: "Excellent",
    commendations: 6,
    trainingCompleted: ["Crime Scene Mgmt", "Interview & Interrogation"],
    trainingDue: ["Digital Forensics"],
    photo: null
  },
  {
    id: "2",
    firstName: "Peter",
    lastName: "Hagen",
    badgeNumber: "PNG-0372",
    station: "Mt. Hagen",
    rank: "sergeant",
    department: "traffic",
    status: "training",
    yearsOfService: 5,
    performanceRating: "Good",
    commendations: 2,
    trainingCompleted: ["Road Safety Ops"],
    trainingDue: ["Advanced Pursuit"],
    photo: null
  },
  {
    id: "3",
    firstName: "Lucy",
    lastName: "Daru",
    badgeNumber: "PNG-1120",
    station: "Lae",
    rank: "chief_inspector",
    department: "special_operations",
    status: "active",
    yearsOfService: 14,
    performanceRating: "Excellent",
    commendations: 8,
    trainingCompleted: ["Tactical Command", "Incident Command System"],
    trainingDue: [],
    photo: null
  },
  {
    id: "4",
    firstName: "Jon",
    lastName: "Bogia",
    badgeNumber: "PNG-0844",
    station: "Kokopo",
    rank: "constable",
    department: "community",
    status: "leave",
    yearsOfService: 2,
    performanceRating: "Good",
    commendations: 1,
    trainingCompleted: ["Community Policing"],
    trainingDue: ["Mediation"],
    photo: null
  },
  {
    id: "5",
    firstName: "Anna",
    lastName: "Tari",
    badgeNumber: "PNG-2213",
    station: "Tari",
    rank: "superintendent",
    department: "forensics",
    status: "medical",
    yearsOfService: 11,
    performanceRating: "Needs Improvement",
    commendations: 3,
    trainingCompleted: ["Lab QA", "Evidence Chain"],
    trainingDue: ["DNA Refresher"],
    photo: null
  }
];

export default function PersonnelPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  /** Auth guard that waits for client hydration */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    setCheckedAuth(true);
  }, []);

  /** IMPORTANT: run hooks BEFORE any conditional return */
  const filteredPersonnel = useMemo(() => {
    return MOCK_PERSONNEL.filter((officer) => {
      const fullName = `${officer.firstName} ${officer.lastName}`.toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        fullName.includes(q) ||
        officer.badgeNumber.toLowerCase().includes(q) ||
        officer.station.toLowerCase().includes(q);
      const matchesRank = rankFilter === "all" || officer.rank === (rankFilter as Officer["rank"]);
      const matchesDepartment =
        departmentFilter === "all" || officer.department === (departmentFilter as Officer["department"]);
      const matchesStatus = statusFilter === "all" || officer.status === (statusFilter as Officer["status"]);
      return matchesSearch && matchesRank && matchesDepartment && matchesStatus;
    });
  }, [searchTerm, rankFilter, departmentFilter, statusFilter]);

  const goToOfficer = (idOrBadge: string) => router.push(`/personnel/${encodeURIComponent(idOrBadge)}`);

  const total = MOCK_PERSONNEL.length;
  const avgYears =
    total > 0
      ? Math.round(MOCK_PERSONNEL.reduce((sum, o) => sum + o.yearsOfService, 0) / total)
      : 0;
  const totalDue =
    total > 0 ? MOCK_PERSONNEL.reduce((sum, o) => sum + o.trainingDue.length, 0) : 0;

  // Now it’s safe to conditionally return without changing hook order
  if (!checkedAuth) return null;
  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personnel Administration</h1>
            <p className="text-gray-600">Manage officer records, training, and human resources</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" title="Open training schedule">
              <Link href="/personnel/training">
                <BookOpen className="w-4 h-4 mr-2" />
                Training Schedule
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700" title="Add a new officer">
              <Link href="/personnel/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Officer
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Active personnel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Duty</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {MOCK_PERSONNEL.filter((o) => o.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Active duty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Training</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {MOCK_PERSONNEL.filter((o) => o.status === "training").length}
              </div>
              <p className="text-xs text-muted-foreground">Training programs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {MOCK_PERSONNEL.filter((o) => ["leave", "medical"].includes(o.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">Various leave types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Experience</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{avgYears}y</div>
              <p className="text-xs text-muted-foreground">Years of service</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Due</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalDue}</div>
              <p className="text-xs text-muted-foreground">Pending certifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search officers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger><SelectValue placeholder="Rank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranks</SelectItem>
                  {Object.entries(RANKS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Object.entries(DEPARTMENTS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setRankFilter("all");
                  setDepartmentFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personnel Table */}
        <Card>
          <CardHeader>
            <CardTitle>Personnel Records ({filteredPersonnel.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Badge Number</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPersonnel.map((officer) => {
                  const id = officer.id;
                  const detailHref = `/personnel/${encodeURIComponent(id)}`;

                  return (
                    <TableRow
                      key={officer.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => goToOfficer(id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={officer.photo || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {officer.firstName[0]}{officer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      <TableCell className="font-medium">{officer.badgeNumber}</TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{officer.firstName} {officer.lastName}</div>
                          <div className="text-sm text-gray-500">{officer.yearsOfService} years service</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={RANKS[officer.rank].color}>
                          {RANKS[officer.rank].label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {DEPARTMENTS[officer.department]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={STATUS_OPTIONS[officer.status].variant}>
                          {STATUS_OPTIONS[officer.status].label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm">{officer.station}</TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            {officer.performanceRating === "Excellent" ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : officer.performanceRating === "Good" ? (
                              <TrendingUp className="w-3 h-3 text-blue-500" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            )}
                            {officer.performanceRating}
                          </div>
                          <div className="text-xs text-gray-500">{officer.commendations} commendations</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">{officer.trainingCompleted.length} completed</div>
                          <div className="text-orange-600">{officer.trainingDue.length} due</div>
                        </div>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button asChild variant="ghost" size="sm" title="View profile">
                          <Link href={detailHref} aria-label={`View profile ${officer.badgeNumber}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
