// Simple mock data used by /evidence and /evidence/[id]
export type EvidenceItem = {
  id: string;
  caseId: string;
  type: "Weapons" | "Digital Evidence" | "Photographic" | "Narcotics" | "Biological";
  description: string;
  status: "Court Ready" | "Processing" | "Analyzed" | "In Court";
  location: string;
  collectedBy: string;
  date: string; // ISO
  tags?: string[];
};

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "EVD-2024-001",
    caseId: "CASE-2024-001",
    type: "Weapons",
    description: "Knife used in armed robbery",
    status: "Court Ready",
    location: "Evidence Room A - Port Moresby",
    collectedBy: "Det. Johnson",
    date: "2024-01-15",
    tags: ["weapon","fingerprints"]
  },
  {
    id: "EVD-2024-002",
    caseId: "CASE-2024-002",
    type: "Digital Evidence",
    description: "Laptop containing financial records",
    status: "Processing",
    location: "Digital Evidence Server",
    collectedBy: "Det. Kila",
    date: "2024-01-12",
    tags: ["computer","financial"]
  },
  {
    id: "EVD-2024-003",
    caseId: "CASE-2024-003",
    type: "Photographic",
    description: "Crime scene photographs - tribal fighting",
    status: "Analyzed",
    location: "Digital Evidence Server",
    collectedBy: "Const. Temu",
    date: "2024-01-08",
    tags: ["crime_scene","tribal"]
  },
  {
    id: "EVD-2024-004",
    caseId: "CASE-2024-004",
    type: "Narcotics",
    description: "Cocaine seizure - 2.5kg",
    status: "In Court",
    location: "Court Custody",
    collectedBy: "Insp. Namaliu",
    date: "2024-01-05",
    tags: ["narcotics","cocaine"]
  },
  {
    id: "EVD-2024-005",
    caseId: "CASE-2024-005",
    type: "Biological",
    description: "Blood samples from assault victim",
    status: "Processing",
    location: "Forensics Laboratory",
    collectedBy: "Det. Bani",
    date: "2024-01-14",
    tags: ["DNA","blood"]
  }
];
