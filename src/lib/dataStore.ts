import { prisma, isDatabaseConnected } from "./prisma";
import { normalizeStatusCode } from "./statusLabels";
import { calculateMetricsFromRecords, CaseMetrics } from "./metrics";
import { normalizeCompanyName, isValidDateString } from "./companyDictionary";
import fs from "fs";
import path from "path";

export interface CaseRecord {
  caseId: string;
  compSymbol?: string;
  company: string;
  folio: string;
  shareholder?: string;
  deceased: string;
  legalHeir?: string;
  cnic?: string;
  address?: string;
  shares?: string;
  certificates?: string;
  status: string;
  statusCode: string;
  isClosed: boolean;
  reqRecDate?: string;
  formSentDate?: string;
  formRecDate?: string;
  fwdCompDate?: string;
  appRecDate?: string;
  fwdTransDate?: string;
  recTransDate?: string;
  physAppFwdComp?: string;
  sharesRecComp?: string;
  sharesFwdDate?: string;
  chqRecComp?: string;
  chqFwdLegalHeir?: string;
  remarks?: string;
  workedThisMonth?: boolean;
  auditTrail?: Array<{
    id: string;
    user: string;
    userId: string;
    action: string;
    note: string;
    timestamp: string;
  }>;
}

// In-memory fallback cache
let localCasesCache: CaseRecord[] | null = null;
let caseIdMap = new Map<string, CaseRecord>();
let folioMap = new Map<string, CaseRecord[]>();

const stripZeros = (s: string) => s.replace(/^0+/, '') || '0';

function loadFallbackData(): CaseRecord[] {
  if (localCasesCache) return localCasesCache;

  const recordsPath = path.join(process.cwd(), "src", "data", "misRecords.json");
  const samplePath = path.join(process.cwd(), "src", "data", "sampleCases.json");
  const activePath = fs.existsSync(recordsPath) ? recordsPath : (fs.existsSync(samplePath) ? samplePath : null);

  if (activePath) {
    try {
      const data = JSON.parse(fs.readFileSync(activePath, "utf-8"));
      localCasesCache = data.map((r: any) => ({
        ...r,
        company: normalizeCompanyName(r.company),
        statusCode: r.statusCode || normalizeStatusCode(r.status),
        isClosed: r.isClosed || r.statusCode === "CLOSED",
      }));
    } catch (e) {
      console.error("Failed to read fallback data:", e);
      localCasesCache = [];
    }
  } else {
    localCasesCache = [];
  }

  // Build indexes
  caseIdMap.clear();
  folioMap.clear();
  for (const c of localCasesCache!) {
    if (c.caseId) {
      caseIdMap.set(c.caseId.toLowerCase().trim(), c);
    }
    if (c.folio) {
      const fKey = String(c.folio).toLowerCase().trim();
      if (!folioMap.has(fKey)) folioMap.set(fKey, []);
      folioMap.get(fKey)!.push(c);

      const fStripped = stripZeros(fKey);
      if (fStripped !== fKey) {
        if (!folioMap.has(fStripped)) folioMap.set(fStripped, []);
        folioMap.get(fStripped)!.push(c);
      }
    }
  }

  return localCasesCache!;
}

export async function searchCases(options: {
  q?: string;
  status?: string;
  company?: string;
  thisMonth?: boolean;
  page?: number;
  limit?: number;
  exact?: boolean;
  sessionRole?: "ADMIN" | "STAFF";
}) {
  const {
    q = "",
    status = "",
    company = "",
    thisMonth = false,
    page = 1,
    limit: rawLimit = 50,
    exact = false,
    sessionRole = "STAFF",
  } = options;

  // Strict pagination limit cap: maximum 100 rows per request (Section 1.5)
  const limit = Math.min(Math.max(1, rawLimit), 100);

  const cleanQ = q.trim().toLowerCase();
  const allCases = loadFallbackData();

  let filtered = allCases;

  // 1. Status Filter
  if (thisMonth || status === "WORKED_THIS_MONTH") {
    filtered = filtered.filter(c => c.workedThisMonth);
  } else if (status && status !== "ALL") {
    const targetCode = normalizeStatusCode(status);
    filtered = filtered.filter(c => {
      const code = c.statusCode || normalizeStatusCode(c.status);
      if (targetCode === "CLOSED") return c.isClosed || code === "CLOSED";
      if (targetCode === "PARTIALLY_CLOSED") return code === "PARTIALLY_CLOSED";
      if (targetCode === "PENDING") return code === "PENDING" || code === "UNDER_REVIEW";
      return code === targetCode;
    });
  }

  // 2. Company Filter
  if (company && company !== "ALL") {
    const compClean = company.toLowerCase().trim();
    filtered = filtered.filter(c => {
      const cComp = (c.company || "").toLowerCase();
      return cComp.includes(compClean) || compClean.includes(cComp);
    });
  }

  // 3. Search Query
  if (cleanQ) {
    const cleanQStripped = stripZeros(cleanQ);
    if (exact && (folioMap.has(cleanQ) || folioMap.has(cleanQStripped))) {
      filtered = folioMap.get(cleanQ) || folioMap.get(cleanQStripped) || [];
    } else {
      filtered = filtered.filter(c => {
        const rawFolio = String(c.folio || "").toLowerCase().trim();
        const strippedFolio = stripZeros(rawFolio);
        const folioMatch = rawFolio.includes(cleanQ) || 
                           strippedFolio.includes(cleanQStripped) || 
                           cleanQStripped.includes(strippedFolio);

        const caseIdStr = String(c.caseId || "").toLowerCase();
        const deceasedStr = String(c.deceased || "").toLowerCase();
        const heirStr = String(c.legalHeir || "").toLowerCase();
        const companyStr = String(c.company || "").toLowerCase();
        const remarksStr = String(c.remarks || "").toLowerCase();

        return (
          folioMatch ||
          caseIdStr.includes(cleanQ) ||
          deceasedStr.includes(cleanQ) ||
          heirStr.includes(cleanQ) ||
          companyStr.includes(cleanQ) ||
          remarksStr.includes(cleanQ)
        );
      });

      // Smart series sort: exact match first, startsWith next, then numerical
      filtered.sort((a, b) => {
        const fA = String(a.folio || "").toLowerCase().trim();
        const fB = String(b.folio || "").toLowerCase().trim();
        const fAStr = stripZeros(fA);
        const fBStr = stripZeros(fB);

        const isExactA = fA === cleanQ || fAStr === cleanQStripped;
        const isExactB = fB === cleanQ || fBStr === cleanQStripped;
        if (isExactA && !isExactB) return -1;
        if (!isExactA && isExactB) return 1;

        const aStarts = fA.startsWith(cleanQ) || fAStr.startsWith(cleanQStripped);
        const bStarts = fB.startsWith(cleanQ) || fBStr.startsWith(cleanQStripped);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return fA.localeCompare(fB, undefined, { numeric: true });
      });
    }
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paged = filtered.slice(startIndex, startIndex + limit);

  // Mask PII (CNIC and address) for non-admin users (Section 1.5)
  const isAdmin = sessionRole === "ADMIN";
  const records = paged.map(c => {
    if (isAdmin) return c;
    return {
      ...c,
      cnic: c.cnic ? `${c.cnic.slice(0, 5)}*****${c.cnic.slice(-2)}` : "",
      address: c.address ? `${c.address.slice(0, 15)}... (Masked)` : "",
    };
  });

  const metrics = calculateMetricsFromRecords(allCases);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    records,
    summary: metrics,
  };
}

export async function getCaseByFolio(folio: string): Promise<CaseRecord[]> {
  const all = loadFallbackData();
  const fClean = String(folio).toLowerCase().trim();
  const fStripped = stripZeros(fClean);
  const fromMap = folioMap.get(fClean) || folioMap.get(fStripped);
  if (fromMap && fromMap.length > 0) return fromMap;
  return all.filter(c => {
    const cf = String(c.folio).toLowerCase().trim();
    return cf === fClean || stripZeros(cf) === fStripped;
  });
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  const all = loadFallbackData();
  const cleanId = String(caseId).toLowerCase().trim();
  return caseIdMap.get(cleanId) || all.find(c => String(c.caseId).toLowerCase().trim() === cleanId) || null;
}

export async function updateCaseRecord(
  caseId: string,
  updates: Record<string, any>,
  sessionUser: { username: string; name: string }
): Promise<{ success: boolean; record?: CaseRecord; error?: string }> {
  const all = loadFallbackData();
  const target = caseIdMap.get(caseId.toLowerCase().trim());

  if (!target) {
    return { success: false, error: `Case ${caseId} not found.` };
  }

  // WHITELIST ALLOWED FIELDS ONLY (Section 1.4)
  // Prevent client tampering with caseId, folio, auditTrail, or raw isClosed
  const allowedKeys = [
    "status",
    "remarks",
    "legalHeir",
    "contactNo",
    "formSentDate",
    "formRecDate",
    "formSentAgain1",
    "formRecAgain1",
    "formSentAgain2",
    "formRecAgain2",
    "fwdCompDate",
    "appRecDate",
    "fwdTransDate",
    "recTransDate",
    "physAppFwdComp",
    "sharesRecComp",
    "sharesFwdDate",
    "chqRecComp",
    "chqFwdLegalHeir",
  ];

  for (const [key, val] of Object.entries(updates)) {
    if (allowedKeys.includes(key) && val !== undefined) {
      (target as any)[key] = val;
    }
  }

  // Update status code & isClosed automatically based on status
  if (updates.status) {
    const code = normalizeStatusCode(updates.status);
    target.statusCode = code;
    target.isClosed = code === "CLOSED";
  }

  // Append verifiable audit trail entry with verified session user (Section 1.4)
  if (!Array.isArray(target.auditTrail)) {
    target.auditTrail = [];
  }

  const nowStr = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  target.auditTrail.unshift({
    id: `AUD-${Date.now()}`,
    user: sessionUser.name,
    userId: sessionUser.username,
    action: updates.status ? `Status changed to ${updates.status}` : "Case information updated",
    note: updates.remarks || updates.discussionNote || "",
    timestamp: nowStr,
  });

  return { success: true, record: target };
}

export async function getDashboardMetrics(): Promise<CaseMetrics> {
  const all = loadFallbackData();
  return calculateMetricsFromRecords(all);
}

export function invalidateCache(): void {
  localCasesCache = null;
  caseIdMap.clear();
  folioMap.clear();
}

export const dataStore = {
  searchCases,
  getCaseById,
  getCaseByFolio,
  getCasesByFolio: getCaseByFolio,
  updateCaseRecord,
  getDashboardMetrics,
  invalidateCache,
};
