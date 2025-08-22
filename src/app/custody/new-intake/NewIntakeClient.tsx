"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Scale,
  FileText,
  Receipt,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";

/* ---------------- Types ---------------- */
type CustodyStatus = "in-custody" | "released" | "transferred" | "bailed";
type BailType = "cash" | "surety" | "property" | "card";

interface PropertyItem {
  id: string;
  description: string;
  condition: string;
  isEvidence: boolean;
  evidenceTag?: string;
  secureLocation: string;
}

interface BailInfo {
  enabled: boolean;
  amount: number;
  type: BailType;
  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  paymentMethod: string;
}

interface CustodyForm {
  id?: string;
  personName: string;
  personAge: number | "";
  chargesCsv: string;
  cellNumber: string;
  admissionTime: string; // ISO (for <input type="datetime-local">)
  medicalNotes?: string;
  specialInstructions?: string;
  status: CustodyStatus;
  property: PropertyItem[];
  bail: BailInfo;
}

/* ---------------- Helpers ---------------- */
const isoNow = () => new Date().toISOString().slice(0, 16);
const digitsOnly = (s: string) => s.replace(/[^\d+ ]/g, "");

// receipt utils
const makeReceiptNo = (prefix: string) => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${ymd}-${rnd}`;
};

const openPrintWindow = (html: string) => {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    alert("Popup blocked. Please allow popups to print the receipt.");
    return;
  }
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt</title>
<style>
:root { --ink:#0f172a; --muted:#475569; --line:#e2e8f0; }
* { box-sizing:border-box; }
body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; color:var(--ink); margin:24px; }
.letterhead { display:flex; align-items:center; gap:12px; border-bottom:2px solid var(--line); padding-bottom:12px; margin-bottom:16px; }
.crest { width:44px; height:44px; border-radius:50%; background:#ef4444; }
h1 { font-size:18px; margin:0; }
.sub { color:var(--muted); font-size:12px; }
.kicker { display:flex; justify-content:space-between; align-items:flex-end; margin:8px 0 18px; }
.title { font-size:20px; font-weight:700; letter-spacing:.4px; }
.meta { font-size:12px; color:var(--muted); text-align:right; }
.meta div { margin-top:2px; }
.badge { display:inline-block; padding:2px 8px; border:1px solid var(--line); border-radius:999px; font-size:11px; color:var(--muted); }
table { width:100%; border-collapse:collapse; margin:8px 0 16px; }
th, td { border:1px solid var(--line); padding:8px 10px; font-size:14px; text-align:left; vertical-align:top;}
th { background:#f8fafc; font-weight:600; }
.row { display:flex; gap:14px; }
.col { flex:1; }
.sigrow { display:flex; gap:24px; margin-top:28px; }
.sig { flex:1; }
.sig .line { border-bottom:1px solid var(--ink); height:22px; }
.sig .lbl { font-size:12px; color:var(--muted); margin-top:6px; }
.qr { width:80px; height:80px; border:1px dashed var(--line); display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--muted); }
.foot { margin-top:22px; font-size:11px; color:var(--muted); }
.section-title { font-weight:700; margin:14px 0 6px; }
</style>
</head>
<body>${html}</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};

const buildIntakeReceiptHTML = ({
  receiptNo,
  when,
  custodyId,
  personName,
  personAge,
  cellNumber,
  charges,
  medicalNotes,
  specialInstructions,
  bail,
  property,
  officer,
}: {
  receiptNo: string;
  when: string;
  custodyId?: string;
  personName: string;
  personAge: number | "";
  cellNumber: string;
  charges: string[];
  medicalNotes?: string;
  specialInstructions?: string;
  bail: BailInfo;
  property: PropertyItem[];
  officer: string;
}) => {
  const chargesRows =
    charges.map((c, i) => `<tr><td style="width:48px">${i + 1}</td><td>${c}</td></tr>`).join("") ||
    `<tr><td colspan="2">—</td></tr>`;

  const propRows =
    property
      .map(
        (p, i) => `
    <tr>
      <td style="width:48px">${i + 1}</td>
      <td>${p.description}</td>
      <td style="width:140px">${p.condition || "-"}</td>
      <td style="width:180px">${p.secureLocation || "-"}</td>
      <td style="width:140px">${p.isEvidence ? p.evidenceTag || "EVIDENCE" : "-"}</td>
    </tr>`
      )
      .join("") || `<tr><td colspan="5">—</td></tr>`;

  const bailTable = bail.enabled
    ? `
      <div class="section-title">Bail Details</div>
      <table>
        <tbody>
          <tr><th style="width:180px">Amount</th><td>K${(bail.amount || 0).toLocaleString("en-PG")}</td></tr>
          <tr><th>Type</th><td>${bail.type}</td></tr>
          <tr><th>Guarantor</th><td>${bail.guarantorName || "-"}</td></tr>
          <tr><th>Payment Method</th><td>${bail.paymentMethod || "-"}</td></tr>
          <tr><th>Guarantor Contact</th><td>${digitsOnly(bail.guarantorPhone || "")} • ${bail.guarantorAddress || "-"}</td></tr>
        </tbody>
      </table>`
    : "";

  return `
  <div class="letterhead">
    <div class="crest"></div>
    <div>
      <h1>Royal Papua New Guinea Constabulary</h1>
      <div class="sub">Police Management System • Intake Receipt</div>
    </div>
    <div class="qr" style="margin-left:auto">QR</div>
  </div>

  <div class="kicker">
    <div class="title">Digital Intake Receipt</div>
    <div class="meta">
      <div><strong>Receipt No:</strong> ${receiptNo}</div>
      <div><strong>Date/Time:</strong> ${when}</div>
      <div class="badge">${custodyId ? `Custody ID: ${custodyId}` : "New Custody Record"}</div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <table>
        <tbody>
          <tr><th style="width:180px">Detainee</th><td>${personName}</td></tr>
          <tr><th>Age</th><td>${personAge || "-"}</td></tr>
          <tr><th>Cell</th><td>${cellNumber || "-"}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="col">
      <table>
        <tbody>
          <tr><th style="width:180px">Processing Officer</th><td>${officer}</td></tr>
          <tr><th>Medical Notes</th><td>${medicalNotes || "-"}</td></tr>
          <tr><th>Special Instructions</th><td>${specialInstructions || "-"}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section-title">Charges</div>
  <table>
    <thead><tr><th>#</th><th>Charge</th></tr></thead>
    <tbody>${chargesRows}</tbody>
  </table>

  ${bailTable}

  <div class="section-title">Personal Property</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Condition</th>
        <th>Secure Location</th>
        <th>Evidence Tag</th>
      </tr>
    </thead>
    <tbody>${propRows}</tbody>
  </table>

  <div class="sigrow">
    <div class="sig"><div class="line"></div><div class="lbl">Detainee / Guarantor Signature</div></div>
    <div class="sig"><div class="line"></div><div class="lbl">Processing Officer Signature</div></div>
  </div>

  <div class="foot">This is a computer-generated document. Verification can be done via the Receipt No inside the system.</div>
  `;
};

/* --------------- Component -------------- */
export default function NewIntakeClient() {
  const router = useRouter();
  const params = useSearchParams();

  const initialStep = Math.max(0, Math.min(3, Number(params.get("step") ?? 0)));
  const [step, setStep] = React.useState<number>(isNaN(initialStep) ? 0 : initialStep);
  const fromId = params.get("from") ?? undefined;

  const [officer, setOfficer] = React.useState<string>("Officer");
  React.useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      setOfficer(u?.name || u?.fullName || u?.displayName || (u?.badgeId ? `Badge #${u.badgeId}` : "Officer"));
    } catch {
      /* noop */
    }
  }, []);

  const [form, setForm] = React.useState<CustodyForm>({
    id: fromId,
    personName: "",
    personAge: "",
    chargesCsv: "",
    cellNumber: "",
    admissionTime: isoNow(),
    medicalNotes: "",
    specialInstructions: "",
    status: "in-custody",
    property: [],
    bail: {
      enabled: false,
      amount: 0,
      type: "cash",
      guarantorName: "",
      guarantorPhone: "",
      guarantorAddress: "",
      paymentMethod: "Cash",
    },
  });

  const [receiptNo, setReceiptNo] = React.useState<string | null>(null);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const addProperty = () =>
    setForm((f) => ({
      ...f,
      property: [
        ...f.property,
        {
          id: crypto.randomUUID(),
          description: "",
          condition: "",
          isEvidence: false,
          evidenceTag: "",
          secureLocation: "",
        },
      ],
    }));

  const removeProperty = (id: string) => setForm((f) => ({ ...f, property: f.property.filter((p) => p.id !== id) }));

  const updateProperty = (id: string, patch: Partial<PropertyItem>) =>
    setForm((f) => ({
      ...f,
      property: f.property.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const generateAndPrintReceipt = () => {
    const number = makeReceiptNo("INTK");
    setReceiptNo(number);

    const charges = form.chargesCsv.split(",").map((s) => s.trim()).filter(Boolean);

    const html = buildIntakeReceiptHTML({
      receiptNo: number,
      when: new Date().toLocaleString(),
      custodyId: form.id,
      personName: form.personName || "—",
      personAge: form.personAge,
      cellNumber: form.cellNumber || "—",
      charges,
      medicalNotes: form.medicalNotes,
      specialInstructions: form.specialInstructions,
      bail: form.bail,
      property: form.property,
      officer,
    });

    openPrintWindow(html);
  };

  const steps = [
    { key: 0, title: "Custody Record", icon: <Lock className="w-4 h-4" /> },
    { key: 1, title: "Bail Processing", icon: <Scale className="w-4 h-4" /> },
    { key: 2, title: "Property", icon: <FileText className="w-4 h-4" /> },
    { key: 3, title: "Digital Receipt", icon: <Receipt className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">New Intake</h1>
          <div className="text-sm text-gray-500">{fromId ? `Starting from record: ${fromId}` : "New custody record"}</div>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={[
                  "flex items-center gap-2 rounded-md px-3 py-2 border",
                  active && "bg-blue-600 text-white border-blue-600",
                  !active && !done && "bg-white text-gray-700 hover:bg-gray-50",
                  done && "bg-green-50 text-green-700 border-green-300",
                ].join(" ")}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                <span className="text-sm font-medium">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* ===== STEP 0: Custody Record ===== */}
        {step === 0 && (
          <section className="rounded border bg-white p-4 space-y-4">
            <h2 className="text-lg font-medium">Custody Record</h2>

            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="Full name" value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} />
              <Input
                type="number"
                placeholder="Age"
                value={form.personAge}
                onChange={(e) => setForm({ ...form, personAge: Number(e.target.value) || "" })}
              />
              <Input placeholder="Cell (e.g., A-3)" value={form.cellNumber} onChange={(e) => setForm({ ...form, cellNumber: e.target.value })} />
            </div>

            <Input placeholder="Charges (comma separated)" value={form.chargesCsv} onChange={(e) => setForm({ ...form, chargesCsv: e.target.value })} />

            <div className="grid md:grid-cols-2 gap-3">
              <Input type="datetime-local" value={form.admissionTime} onChange={(e) => setForm({ ...form, admissionTime: e.target.value })} />
              <select
                className="px-3 py-2 border rounded-md"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CustodyStatus })}
              >
                <option value="in-custody">In Custody</option>
                <option value="bailed">Bailed</option>
                <option value="released">Released</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            <Input placeholder="Medical notes (optional)" value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} />
            <Input
              placeholder="Special instructions (optional)"
              value={form.specialInstructions}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/custody")}>
                Cancel
              </Button>
              <Button onClick={next}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* ===== STEP 1: Bail Processing ===== */}
        {step === 1 && (
          <section className="rounded border bg-white p-4 space-y-4">
            <h2 className="text-lg font-medium">Bail Processing</h2>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.bail.enabled}
                onChange={(e) => setForm({ ...form, bail: { ...form.bail, enabled: e.target.checked } })}
              />
              Enable bail for this intake
            </label>

            {form.bail.enabled && (
              <div className="grid md:grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="Amount (K)"
                  value={form.bail.amount}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, amount: Number(e.target.value) || 0 } })}
                />
                <select
                  className="px-3 py-2 border rounded-md"
                  value={form.bail.type}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, type: e.target.value as BailType } })}
                >
                  <option value="cash">Cash</option>
                  <option value="surety">Surety</option>
                  <option value="property">Property</option>
                  <option value="card">Card</option>
                </select>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={form.bail.paymentMethod}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, paymentMethod: e.target.value } })}
                >
                  <option>Cash</option>
                  <option>POS</option>
                  <option>Bank Transfer</option>
                </select>

                <Input
                  placeholder="Guarantor name"
                  value={form.bail.guarantorName}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, guarantorName: e.target.value } })}
                />
                <Input
                  placeholder="Guarantor phone"
                  value={form.bail.guarantorPhone}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, guarantorPhone: digitsOnly(e.target.value) } })}
                />
                <Input
                  placeholder="Guarantor address"
                  value={form.bail.guarantorAddress}
                  onChange={(e) => setForm({ ...form, bail: { ...form.bail, guarantorAddress: e.target.value } })}
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={next}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* ===== STEP 2: Property ===== */}
        {step === 2 && (
          <section className="rounded border bg-white p-4 space-y-4">
            <h2 className="text-lg font-medium">Property</h2>

            <div className="space-y-3">
              {form.property.map((p) => (
                <div key={p.id} className="rounded border p-3 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input placeholder="Description" value={p.description} onChange={(e) => updateProperty(p.id, { description: e.target.value })} />
                    <Input placeholder="Condition" value={p.condition} onChange={(e) => updateProperty(p.id, { condition: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={p.isEvidence} onChange={(e) => updateProperty(p.id, { isEvidence: e.target.checked })} />
                      Mark as evidence
                    </label>
                    <Input placeholder="Evidence Tag (if any)" value={p.evidenceTag} onChange={(e) => updateProperty(p.id, { evidenceTag: e.target.value })} />
                    <Input placeholder="Secure location" value={p.secureLocation} onChange={(e) => updateProperty(p.id, { secureLocation: e.target.value })} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={() => removeProperty(p.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove item
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addProperty}>
                <Plus className="w-4 h-4 mr-1" />
                Add property item
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={next}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* ===== STEP 3: Digital Receipt ===== */}
        {step === 3 && (
          <section className="rounded border bg-white p-4 space-y-4">
            <h2 className="text-lg font-medium">Digital Receipt</h2>

            <p className="text-sm text-slate-600">
              Generate a print-ready receipt for this intake. A unique receipt number and timestamp will be embedded, with signature lines for the
              officer and detainee / guarantor.
            </p>

            <div className="rounded border p-3">
              <div className="text-sm mb-2">
                <span className="font-semibold">Last generated:</span>{" "}
                {receiptNo ? (
                  <>
                    <span className="font-mono">{receiptNo}</span> • {new Date().toLocaleString()}
                  </>
                ) : (
                  "—"
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" onClick={generateAndPrintReceipt}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate & Print
                </Button>

                <Button variant="outline" onClick={() => router.push("/custody")}>Close</Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={() => router.push("/custody")}>Finish</Button>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
