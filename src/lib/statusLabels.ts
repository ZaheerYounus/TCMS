export interface StatusDefinition {
  code: string;
  label: string;
  category: "pending" | "waiting" | "company" | "closed" | "other";
  badgeClass: string;
  description: string;
}

export const STATUS_DEFINITIONS: Record<string, StatusDefinition> = {
  PENDING: {
    code: "PENDING",
    label: "Pending (Action Required)",
    category: "pending",
    badgeClass: "bg-orange-100 text-[#D85B10] border-orange-200",
    description: "Action required by CDCSR team",
  },
  UNDER_REVIEW: {
    code: "UNDER_REVIEW",
    label: "Under Review (CDCSR)",
    category: "pending",
    badgeClass: "bg-blue-100 text-[#0B2B5E] border-blue-200",
    description: "Cases being reviewed by CDCSR operations team",
  },
  WAITING: {
    code: "WAITING",
    label: "Awaiting Legal Heirs",
    category: "waiting",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Formalities letter sent; awaiting response from legal heirs",
  },
  CO_APPROVAL: {
    code: "CO_APPROVAL",
    label: "Co. - Case Review & Approval",
    category: "company",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Reviewed by CDCSR and dispatched to Issuer Company for approval",
  },
  CO_SIGNING: {
    code: "CO_SIGNING",
    label: "Co. - Signing of Shares",
    category: "company",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    description: "Dispatched to Issuer Company for authorized director signing",
  },
  CO_DIVIDEND: {
    code: "CO_DIVIDEND",
    label: "Co. - Dividend Payment",
    category: "company",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    description: "Referred to company/bank for dividend counterfoil/warrant payment",
  },
  IN_TRANSFER: {
    code: "IN_TRANSFER",
    label: "In Transfer",
    category: "company",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    description: "In physical transfer process",
  },
  PARTIALLY_CLOSED: {
    code: "PARTIALLY_CLOSED",
    label: "Partially Case Closed",
    category: "closed",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Shares transmitted; dividend/bonus entitlements pending",
  },
  CLOSED: {
    code: "CLOSED",
    label: "Shares Transmitted (Case Closed)",
    category: "closed",
    badgeClass: "bg-emerald-600 text-white border-transparent",
    description: "Transmission fully executed and dispatched to legal heirs",
  },
  OTHER: {
    code: "OTHER",
    label: "Other Pipeline",
    category: "other",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Specialized, custody, or transit status",
  },
};

/**
 * Normalizes raw spreadsheet or legacy status string into standard status code
 */
export function normalizeStatusCode(rawStatus: string = ""): string {
  if (!rawStatus) return "OTHER";
  const s = rawStatus.trim().toLowerCase();

  if (s.includes("partially")) return "PARTIALLY_CLOSED";
  if (s.includes("closed")) return "CLOSED";
  if (s === "under review" || s.includes("under_review")) return "UNDER_REVIEW";
  if (s === "pending") return "PENDING";
  if (s.includes("waiting") || s.includes("awaited")) return "WAITING";
  if (s.includes("signing")) return "CO_SIGNING";
  if (s.includes("review") || s.includes("approval") || s.includes("approved case")) return "CO_APPROVAL";
  if (s.includes("dividend") || s.includes("div")) return "CO_DIVIDEND";
  if (s.includes("transfer") || s.includes("received from transfer")) return "IN_TRANSFER";

  return "OTHER";
}

export function getStatusDisplay(codeOrRaw: string): StatusDefinition {
  const code = normalizeStatusCode(codeOrRaw);
  return STATUS_DEFINITIONS[code] || STATUS_DEFINITIONS.OTHER;
}
