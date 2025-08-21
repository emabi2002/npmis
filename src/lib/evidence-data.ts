/** ---------------- Storage map (declare first so types can reference it) ---------------- */
export const STORAGE_LOCATIONS = {
  evidence_room_a: "Evidence Room A - Port Moresby",
  evidence_room_b: "Evidence Room B - Lae",
  forensics_lab: "Forensics Laboratory",
  digital_storage: "Digital Evidence Server",
  court_custody: "Court Custody",
  destroyed: "Destroyed/Disposed",
} as const;

export type StorageKey = keyof typeof STORAGE_LOCATIONS;

/** ---------------- Canonical lists -> union types ---------------- */
export const EVIDENCE_STATUS = [
  "collected",
  "processing",
  "analyzed",
  "court_ready",
  "in_court",
  "returned",
  "destroyed",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUS)[number];

export const EVIDENCE_TYPES = [
  "physical",
  "digital",
  "photo",
  "document",
  "weapon",
  "drug",
  "biological",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/** ---------------- Core record type ---------------- */
export type EvidenceItem = {
  id: string;
  caseId: string;
  type: EvidenceType;
  status: EvidenceStatus;
  description: string;
  collectedBy: string;
  collectedDate: string; // YYYY-MM-DD
  location: StorageKey;
  chainOfCustody: Array<{ officer: string; action: string; date: string; location: string }>;
  forensicsResults: string;
  photos: number;
  tags: string[];
  priority: "high" | "medium" | "low" | "none" | null;
  courtDate: string | null;
};

/** ---------------- Demo dataset ---------------- */
export const EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: "EVD-2024-001",
    caseId: "CASE-2024-001",
    type: "weapon",
    status: "court_ready",
    description: "Knife used in armed robbery",
    collectedBy: "Det. Johnson",
    collectedDate: "2024-01-15",
    location: "evidence_room_a",
    chainOfCustody: [
      { officer: "Det. Johnson", action: "Collected", date: "2024-01-15 14:30", location: "Crime Scene" },
      { officer: "Forensics Tech", action: "Received", date: "2024-01-15 16:00", location: "Forensics Lab" },
      { officer: "Evidence Clerk", action: "Stored", date: "2024-01-16 09:00", location: "Evidence Room A" },
    ],
    forensicsResults: "Fingerprints found, DNA swab taken",
    photos: 5,
    tags: ["weapon", "fingerprints", "DNA"],
    priority: "high",
    courtDate: "2024-02-15",
  },
  {
    id: "EVD-2024-002",
    caseId: "CASE-2024-002",
    type: "digital",
    status: "processing",
    description: "Laptop computer containing financial records",
    collectedBy: "Det. Kila",
    collectedDate: "2024-01-12",
    location: "digital_storage",
    chainOfCustody: [
      { officer: "Det. Kila", action: "Collected", date: "2024-01-12 10:15", location: "Suspect's Office" },
      { officer: "Digital Forensics", action: "Imaging", date: "2024-01-12 14:00", location: "Cyber Unit" },
    ],
    forensicsResults: "Hard drive imaging in progress",
    photos: 3,
    tags: ["computer", "financial", "fraud"],
    priority: "medium",
    courtDate: null,
  },
  {
    id: "EVD-2024-003",
    caseId: "CASE-2024-003",
    type: "photo",
    status: "analyzed",
    description: "Crime scene photographs - tribal fighting",
    collectedBy: "Const. Temu",
    collectedDate: "2024-01-08",
    location: "digital_storage",
    chainOfCustody: [
      { officer: "Const. Temu", action: "Photographed", date: "2024-01-08 15:30", location: "Wabag Crime Scene" },
      { officer: "Evidence Tech", action: "Uploaded", date: "2024-01-08 18:00", location: "Digital Storage" }
    ],
    forensicsResults: "25 high-resolution photos documented",
    photos: 25,
    tags: ["crime_scene", "tribal", "fighting"],
    priority: "medium",
    courtDate: "2024-01-25",
  },
  {
    id: "EVD-2024-004",
    caseId: "CASE-2024-004",
    type: "drug",
    status: "in_court",
    description: "Cocaine seizure - 2.5kg",
    collectedBy: "Insp. Namaliu",
    collectedDate: "2024-01-05",
    location: "court_custody",
    chainOfCustody: [
      { officer: "Insp. Namaliu", action: "Seized", date: "2024-01-05 11:00", location: "Lae Port" },
      { officer: "Drug Lab Tech", action: "Tested", date: "2024-01-06 09:00", location: "Drug Lab" },
      { officer: "Court Officer", action: "Court Transfer", date: "2024-01-20 10:00", location: "National Court" }
    ],
    forensicsResults: "Confirmed 98% purity cocaine",
    photos: 8,
    tags: ["narcotics", "cocaine", "trafficking"],
    priority: "high",
    courtDate: "2024-01-22",
  },
  {
    id: "EVD-2024-005",
    caseId: "CASE-2024-005",
    type: "biological",
    status: "processing",
    description: "Blood samples from assault victim",
    collectedBy: "Det. Bani",
    collectedDate: "2024-01-14",
    location: "forensics_lab",
    chainOfCustody: [
      { officer: "Det. Bani", action: "Collected", date: "2024-01-14 16:45", location: "Crime Scene" },
      { officer: "Forensics Lab", action: "Received", date: "2024-01-14 18:00", location: "Forensics Lab" }
    ],
    forensicsResults: "DNA analysis pending",
    photos: 2,
    tags: ["DNA", "blood", "assault"],
    priority: "high",
    courtDate: null,
  },
];

/** Handy helper for detail pages */
export const byId = (evidenceId: string) =>
  EVIDENCE_DATA.find((e) => e.id === evidenceId) ?? null;
