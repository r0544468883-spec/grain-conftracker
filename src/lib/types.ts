export type Conference = {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string;
  city: string | null;
  country: string | null;
  vertical: string;
  estimatedSize: number;
  icpScore: number;
  website: string | null;
  description: string | null;
  interactionCount: number;
};

export type Contact = {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string;
  interactionCount: number;
  lastTemperature: string;
  lastConference: string | null;
};

export type ContactDetail = Contact & {
  previousCompanies: string[];
  interactions: Interaction[];
};

export type Interaction = {
  id: string;
  notes: string | null;
  temperature: string;
  capturedRoleAtTime: string | null;
  capturedCompanyAtTime: string | null;
  createdAt: string;
  conferenceName: string;
  conferenceLocation: string;
  conferenceVertical: string;
};

export type SearchResult = {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  email: string | null;
  phone: string | null;
  interactionCount: number;
};

export const VERTICALS = ["FINTECH", "PAYMENTS", "TREASURY", "TRAVEL", "SAAS"] as const;
export const TEMPERATURES = ["COLD", "WARM", "HOT"] as const;
export const LIFECYCLE_STAGES = ["TARGET", "LEAD", "PROSPECT", "CUSTOMER"] as const;

export const VERTICAL_COLORS: Record<string, string> = {
  FINTECH: "bg-grain-blue text-white",
  PAYMENTS: "bg-green-500 text-white",
  TREASURY: "bg-purple-500 text-white",
  TRAVEL: "bg-orange-500 text-white",
  SAAS: "bg-grain-slate text-white",
};

export const VERTICAL_DOTS: Record<string, string> = {
  FINTECH: "bg-grain-blue",
  PAYMENTS: "bg-green-500",
  TREASURY: "bg-purple-500",
  TRAVEL: "bg-orange-500",
  SAAS: "bg-grain-slate",
};

export const TEMP_DOTS: Record<string, string> = {
  HOT: "bg-red-500",
  WARM: "bg-orange-400",
  COLD: "bg-blue-400",
};

export function linkedInSearchUrl(name: string, company: string): string {
  const q = encodeURIComponent(`${name} ${company}`.trim());
  return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
}

export function safeParsePreviousCompanies(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
