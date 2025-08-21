'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  User as UserIcon,
  Calendar,
  Shield,
  FileText,
  CheckCircle2,
  Receipt,
  Scale,
  ArrowLeft,
} from 'lucide-react';

/* ===== Types (same as dashboard) ===== */
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
  admissionTime: string;
  status: CustodyStatus;
  personalProperty: PropertyItem[];
  medicalNotes?: string;
  specialInstructions?: string;
  visitorsToday: number;
  admittingOfficer: string;
  bail?: { amount: number; type: string; receiptNumber?: string };
}

/* ===== TEMP: same mock as your dashboard (replace with API fetch) ===== */
const MOCK: CustodyRecord[] = [
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
        secureLocation: 'Property A / Shelf 3',
      },
      {
        id: 'p2',
        description: 'Leather wallet (K45)',
        condition: 'Good',
        isEvidence: true,
        evidenceTag: 'EVD-2024-001-A',
        secureLocation: 'Evidence Room / Locker 15',
      },
    ],
    medicalNotes: 'No known medical conditions',
    specialInstructions: 'High risk – maintain visual surveillance',
    visitorsToday: 1,
    admittingOfficer: 'Const. Peter Bani',
  },
];

/* ===== Helpers ===== */
function statusBadge(s: CustodyStatus) {
  switch (s) {
    case 'in-custody':
      return <Badge variant="destructive">IN CUSTODY</Badge>;
    case 'bailed':
      return <Badge>BAILED</Badge>;
    case 'released':
      return <Badge>RELEASED</Badge>;
    default:
      return <Badge variant="secondary">TRANSFERRED</Badge>;
  }
}

/* ===== Page ===== */
export default function CustodyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Replace this with a real fetch:
  const record = React.useMemo(
    () => MOCK.find((r) => r.id === id) || null,
    [id]
  );

  if (!record) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Record not found</div>
              <Button variant="outline" onClick={() => router.push('/custody')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Custody
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              No custody record exists with ID <strong>{id}</strong>.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{record.personName}</h1>
              <div className="text-sm text-gray-600">
                Custody ID: {record.id} • Cell {record.cellNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusBadge(record.status)}
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" onClick={() => router.push('/custody')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Admission</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(record.admissionTime).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {record.admittingOfficer}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Charges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1">
              {record.charges.map((c, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {c}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {statusBadge(record.status)}
              </div>
              <div>Property items: {record.personalProperty.length}</div>
              <div>Visitors today: {record.visitorsToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {record.specialInstructions && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Special Instructions:</strong> {record.specialInstructions}
            </AlertDescription>
          </Alert>
        )}
        {record.medicalNotes && (
          <Alert>
            <AlertDescription>
              <strong>Medical:</strong> {record.medicalNotes}
            </AlertDescription>
          </Alert>
        )}

        {/* Property list */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {record.personalProperty.map((p) => (
              <div
                key={p.id}
                className="p-3 border rounded-md flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-medium">{p.description}</div>
                  <div className="text-sm text-gray-600">
                    Condition: {p.condition} • Location: {p.secureLocation}
                  </div>
                  {p.evidenceTag && (
                    <div className="text-sm text-red-600">
                      Evidence Tag: {p.evidenceTag}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.isEvidence && <Badge variant="destructive">EVIDENCE</Badge>}
                  {!p.isEvidence && <Badge variant="outline">Property</Badge>}
                </div>
              </div>
            ))}
            {record.personalProperty.length === 0 && (
              <div className="text-sm text-gray-600">No property recorded.</div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {record.status === 'in-custody' && (
            <Link href={`/custody/new-intake?step=1&from=${record.id}`}>
              <Button variant="outline" className="text-green-700">
                <Scale className="w-4 h-4 mr-1" />
                Process Bail
              </Button>
            </Link>
          )}

          <Link href={`/custody/new-intake?step=3&from=${record.id}`}>
            <Button variant="outline" className="text-purple-700">
              <Receipt className="w-4 h-4 mr-1" />
              Receipt
            </Button>
          </Link>

          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark Reviewed
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
