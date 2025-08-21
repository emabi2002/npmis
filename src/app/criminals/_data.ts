// /src/app/criminals/_data.ts
export type CriminalRecord = {
  id: string;                // e.g., "CRIM-001"
  name: string;              // e.g., "John Kaupa"
  age: number;
  gender: "Male" | "Female";
  threatLevel: "Low" | "Medium" | "High" | "Extreme";
  status: "Wanted" | "Arrested" | "At Large";
  gang?: string | null;
  charges: string;
  lastSeenCity: string;      // e.g., "Port Moresby"
  lastSeen?: string;         // optional timestamp/text
  aliases?: string[];
  notes?: string;
};

export const CRIMINALS: CriminalRecord[] = [
  {
    id: "CRIM-001",
    name: "John Kaupa",
    age: 35,
    gender: "Male",
    threatLevel: "High",
    status: "Wanted",
    gang: "Raskol Gang Alpha",
    charges: "Armed Robbery, Assault",
    lastSeenCity: "Port Moresby",
    lastSeen: "2024-01-14 16:00",
    aliases: ["JK"],
  },
  {
    id: "CRIM-002",
    name: "Maria Bani",
    age: 28,
    gender: "Female",
    threatLevel: "Medium",
    status: "Arrested",
    gang: "None",
    charges: "Fraud, Embezzlement",
    lastSeenCity: "Lae",
    aliases: ["MB"],
  },
  {
    id: "CRIM-003",
    name: "Peter Namaliu",
    age: 42,
    gender: "Male",
    threatLevel: "Extreme",
    status: "Wanted",
    gang: "PNG Drug Cartel",
    charges: "Drug Trafficking, Money Laundering",
    lastSeenCity: "Mt. Hagen",
    aliases: ["PN"],
  },
];
