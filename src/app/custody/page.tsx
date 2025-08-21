'use client';

import * as React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  Eye,
  Receipt,
  Scale,
  CheckCircle,
  Download,
  Printer,
} from 'lucide-react';

/* ================= Types ================= */

type CustodyStatus = 'in-custody' | 'released' | 'transferred' | 'bailed';

interface PropertyItem {
  id: string;
  description: string;
  condition: string;
  isEvidence: boolean;
  secureLocation: string;
  evidenceTag?: string;
}

interface CustodyRecord {
  id: string;
  personName: string;
  personAge: number;
  charges: string[];
  cellNumber: string;
  admissionTime: string; // ISO
  status: CustodyStatus;
  personalProperty: PropertyItem[];
  medicalNotes?: string;
  specialInstructions?: string;
  visitorsToday: number;
  admittingOfficer: string;
  bail?: { amount: number; type: string; receiptNumber?: string };
}

interface BailTransaction {
  id: string;
  receiptNumber: string;
  personName: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
}

/* ================= Mock (replace with API) ================= */

const MOCK_CUSTODY: CustodyRecord[] = [
  {
    id: 'CUST-2024-001',
    personName: 'John Kaupa',
    personAge: 29,
    charges: ['Armed Robbery', 'Possession of Stolen Property'],
    cellNumber: 'A-3',
    admissionTime: '2024-01-15T14:45:00Z',
    status: 'in-custody',
    personalProperty: [
      {
        id: 'p1',
        description: 'Samsung Galaxy S21',
        condition: 'Good',
        isEvidence: false,
        secureLocation: 'Property A/Shelf 3',
      },
      {
        id: 'p2',
        description: 'Leather wallet (K45)',
        condition: 'Good',
        isEvidence: true,
        evidenceTag: 'EVD-2024-001-A',
        secureLocation: 'Evidence/Locker 15',
      },
    ],
    medicalNotes: 'No known medical conditions',
    specialInstructions: 'High risk - maintain visual surveillance',
    visitorsToday: 1,
    admittingOfficer: 'Const. Peter Bani',
    bail: undefined,
  },
];

const MOCK_BAIL: BailTransaction[] = [
  {
    id: 'BAIL-TXN-001',
    receiptNumber: 'BAIL-2024-0001',
    personName: 'Mary Temu',
    amount: 500,
    status: 'paid',
  },
];

/* ================= Helpers ================= */

const formatK = (n: number) => `K${n.toLocaleString('en-PG')}`;

function badgeFor(status: CustodyStatus) {
  switch (status) {
    case 'in-custody':
      return <Badge variant="destructive">IN CUSTODY</Badge>;
    case 'bailed':
      return <Badge>BAILED</Badge>;
    case 'released':
      return <Badge>RELEASED</Badge>;
    case 'transferred':
    default:
      return <Badge variant="secondary">TRANSFERRED</Badge>;
  }
}

function exportCsv(rows: CustodyRecord[]) {
  const headers = [
    'custodyId',
    'name',
    'age',
    'cell',
    'status',
    'admissionTime',
    'charges',
    'propertyItems',
    'visitorsToday',
    'admittingOfficer',
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.personName,
      r.personAge,
      r.cellNumber,
      r.status,
      r.admissionTime,
      r.charges.join('|'),
      r.personalProperty.length,
      r.visitorsToday,
      r.admittingOfficer,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `custody_records_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ================= Page ================= */

export default function CustodyDashboardPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<CustodyStatus | 'all'>('all');

  // Replace with API state when ready
  const records = MOCK_CUSTODY;
  const bailTxns = MOCK_BAIL;

  // Stats
  const inCustody = records.filter((r) => r.status === 'in-custody').length;
  const released = records.filter((r) => r.status === 'released').length;
  const bailPaid = bailTxns.filter((t) => t.status === 'paid').length;
  const bailTotal = bailTxns.reduce((s, t) => s + t.amount, 0);
  const totalProperty = records.reduce((s, r) => s + r.personalProperty.length, 0);

  // Filter + search
  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.personName.toLowerCase().includes(q) ||
      r.cellNumber.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="w-7 h-7" /> Custody Management
            </h1>
            <p className="text-gray-600">
              Detention tracking, bail processing, and property management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportCsv(filtered)}>
              <Download className="w-4 h-4 mr-2" />
              Export Records
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Register
            </Button>
            <Link href="/custody/new-intake">
              <Button className="bg-red-600 hover:bg-red-700">+ New Intake</Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Currently In Custody</CardTitle>
              <Users className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inCustody}</div>
              <p className="text-xs text-red-600">Active detainees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Released Today</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{released}</div>
              <p className="text-xs text-green-600">Processed releases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Bail Processed</CardTitle>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bailPaid}</div>
              <p className="text-xs text-blue-600">Bail transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Total Bail Amount</CardTitle>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatK(bailTotal)}</div>
              <p className="text-xs text-purple-600">Collected today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Property Items</CardTitle>
              <FileText className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperty}</div>
              <p className="text-xs text-orange-600">Stored securely</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Custody Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-col md:flex-row">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, custody ID, or cell number…"
                className="md:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter((e.target.value as CustodyStatus | 'all') ?? 'all')
                }
                className="px-3 py-2 border rounded-md md:w-48"
              >
                <option value="all">All Status</option>
                <option value="in-custody">In Custody</option>
                <option value="bailed">Bailed</option>
                <option value="released">Released</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Record list */}
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{r.personName}</div>
                      <div className="text-sm text-gray-600">
                        Custody ID: {r.id} • Cell {r.cellNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{badgeFor(r.status)}</div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 mt-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Admission</div>
                    <div>{new Date(r.admissionTime).toLocaleString()}</div>
                    <div>Officer: {r.admittingOfficer}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Charges</div>
                    <div className="flex flex-wrap gap-1">
                      {r.charges.map((c, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Status</div>
                    <div>Property: {r.personalProperty.length}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Link href={`/custody/${r.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>

                  <Link href={`/custody/new-intake?step=1&from=${r.id}`}>
                    <Button variant="outline" size="sm" className="text-green-700">
                      <Scale className="w-4 h-4 mr-1" />
                      Process Bail
                    </Button>
                  </Link>

                  {r.bail && (
                    <Link href={`/custody/new-intake?step=3&from=${r.id}`}>
                      <Button variant="outline" size="sm" className="text-purple-700">
                        <Receipt className="w-4 h-4 mr-1" />
                        Receipt
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-gray-600">
                No records match your search/filter.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
