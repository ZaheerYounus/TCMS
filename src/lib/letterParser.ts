import { calculateDocumentGap, CANONICAL_TRANSMISSION_DOCS, DocumentGapAnalysis } from './gapAnalyzer';
export * from './gapAnalyzer';

export interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  scripts: string;
}

export interface ParsedLetterResult {
  mode: "single" | "multi";
  folio?: string;
  company?: string;
  compSymbol?: string;
  deceased?: string;
  legalHeir?: string;
  relation?: string;
  address?: string;
  contactNo?: string;
  cnic?: string;
  shares?: string;
  certificates?: string;
  scripts?: string;
  multiFolios?: MultiFolioItem[];
  receivedDocs: string[];
  missingDocs: string[];
  gapAnalysis: DocumentGapAnalysis;
  hasLostShares?: boolean;
  lostSharesDetail?: string;
  refNo?: string;
  rawTextPreview: string;
  matchSource: "document_parsed" | "mis_enriched" | "manual";
}

// Comprehensive mapping of abbreviations and short forms to official CDC registered names
export const COMPANY_ALIASES: Record<string, string> = {
  'CHERAT CEMENT': 'Cherat Cement Company Limited',
  'CHERAT': 'Cherat Cement Company Limited',
  'FIRST HABIB MODARABA': 'First Habib Modaraba',
  'HABIB MODARABA': 'First Habib Modaraba',
  'SSGC': 'Sui Southern Gas Company Limited',
  'SUI SOUTHERN': 'Sui Southern Gas Company Limited',
  'SUI SOUTHERN GAS': 'Sui Southern Gas Company Limited',
  'SNGPL': 'Sui Northern Gas Pipelines Limited',
  'SUI NORTHERN': 'Sui Northern Gas Pipelines Limited',
  'HBL': 'Habib Bank Limited',
  'HABIB BANK': 'Habib Bank Limited',
  'MCB': 'MCB Bank Limited',
  'UBL': 'United Bank Limited',
  'ABL': 'Allied Bank Limited',
  'ALLIED BANK': 'Allied Bank Limited',
  'MEBL': 'Meezan Bank Limited',
  'MEEZAN BANK': 'Meezan Bank Limited',
  'OGDCL': 'Oil & Gas Development Company Limited',
  'OGDC': 'Oil & Gas Development Company Limited',
  'PPL': 'Pakistan Petroleum Limited',
  'PSO': 'Pakistan State Oil Company Limited',
  'POL': 'Pakistan Oilfields Limited',
  'ENGRO': 'Engro Corporation Limited',
  'FFC': 'Fauji Fertilizer Company Limited',
  'FFBL': 'Fauji Fertilizer Bin Qasim Limited',
  'FATIMA': 'Fatima Fertilizer Company Limited',
  'LUCK': 'Lucky Cement Limited',
  'LUCKY CEMENT': 'Lucky Cement Limited',
  'DGKC': 'D.G. Khan Cement Company Limited',
  'MAPLE LEAF': 'Maple Leaf Cement Factory Limited',
  'POWER CEMENT': 'Power Cement Limited',
  'K-ELECTRIC': 'K-Electric Limited',
  'KE': 'K-Electric Limited',
  'HUBC': 'The Hub Power Company Limited',
  'HUBCO': 'The Hub Power Company Limited',
  'KAPCO': 'Kot Addu Power Company Limited',
  'NBP': 'National Bank of Pakistan',
  'BAFL': 'Bank Alfalah Limited',
  'BAHL': 'Bank AL Habib Limited',
  'EFERT': 'Engro Fertilizers Limited',
  'SYS': 'Systems Limited',
  'SYSTEMS': 'Systems Limited',
  'TRG': 'TRG Pakistan Limited',
  'PAKT': 'Pakistan Tobacco Company Limited',
  'KHTC': 'Khyber Tobacco Company Limited',
  'KHYBER TOBACCO': 'Khyber Tobacco Company Limited',
};

/**
 * Universal heuristic letter parser supporting single-folio letters, multi-folio lists,
 * and standard CDCSR forms. Works seamlessly both client-side and server-side.
 */
export function parseLetterText(text: string): ParsedLetterResult {
  const defaultGap: DocumentGapAnalysis = {
    receivedCount: 0,
    totalRequirementsCount: CANONICAL_TRANSMISSION_DOCS.length,
    completionPercentage: 0,
    isComplete: false,
    receivedDocs: [],
    missingDocs: [],
    missingItemsDetailed: [],
    hasLostShares: false,
    suggestedStage: "first",
    summaryText: "Awaiting document analysis."
  };

  const result: ParsedLetterResult = {
    mode: "single",
    receivedDocs: [],
    missingDocs: [],
    gapAnalysis: defaultGap,
    rawTextPreview: text.slice(0, 1000),
    matchSource: "document_parsed"
  };

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lower = normalized.toLowerCase();

  // 1. Detect Multi-Folio lines (e.g., "1) Cherat Cement Co. Ltd. Folio No. F00965 shares 3912")
  const multiFolioRegex = /(?:(\d+)\)\s*)?([A-Za-z0-9\s.&'-]+?)(?:,\s*|\s+)Folio(?:\s*No\.?|\s*#)?[:\s]*([A-Za-z0-9\/-]+)(?:[\s,]+(?:shares?|# of shares?)[:\s]*([0-9,]+))?/gi;
  let mfMatch;
  const detectedFolios: MultiFolioItem[] = [];
  while ((mfMatch = multiFolioRegex.exec(normalized)) !== null) {
    const rawComp = mfMatch[2].trim().replace(/^\d+[\).]\s*/, '').trim();
    const rawFolio = mfMatch[3].trim();
    const rawShares = mfMatch[4] ? mfMatch[4].trim() : "";
    if (rawFolio && !['above', 'as', 'cds', 'details', 'number', 'account', 'particulars'].includes(rawFolio.toLowerCase())) {
      let resolvedComp = rawComp;
      const upperComp = rawComp.toUpperCase();
      for (const [alias, full] of Object.entries(COMPANY_ALIASES)) {
        if (upperComp === alias || upperComp.includes(alias)) {
          resolvedComp = full;
          break;
        }
      }
      detectedFolios.push({
        folio: rawFolio,
        company: resolvedComp,
        shares: rawShares ? `=${rawShares}=` : "=0=",
        certificates: "01",
        scripts: ""
      });
    }
  }

  if (detectedFolios.length > 1) {
    result.mode = "multi";
    result.multiFolios = detectedFolios;
    result.folio = detectedFolios[0].folio;
    result.company = detectedFolios[0].company;
    result.shares = detectedFolios[0].shares;
    result.certificates = detectedFolios[0].certificates;
  }

  // 2. Single Folio Number Detection
  if (!result.folio) {
    const cdsTableMatch = normalized.match(/(?:Folio\s*(?:#|No\.?)?\s*(?:\/|\&)?\s*(?:CDS(?:\s*Account)?\s*(?:#|No\.?)?)?[:\s]+)([A-Za-z0-9\/-]+)/i);
    if (cdsTableMatch && cdsTableMatch[1]) {
      const rawF = cdsTableMatch[1].trim();
      if (!['above', 'as', 'cds', 'details', 'number', 'account', 'particulars'].includes(rawF.toLowerCase())) {
        result.folio = rawF;
      }
    }
    if (!result.folio) {
      const folioMatch = normalized.match(/(?:folio(?:\s*(?:#|no|number|num))?[:\s]*)([A-Za-z0-9\/-]{2,15})/i) ||
                         normalized.match(/CDCSR\/LTC\/[A-Z0-9]+\/([0-9A-Za-z]+)\//i) ||
                         normalized.match(/\bFolio\s+([0-9A-Za-z\/-]{2,12})\b/i) ||
                         normalized.match(/(?:folio|olio|lio|folo)[^0-9a-zA-Z]{0,6}(?:#|no|number|4)?[:\s]*([0-9]{3,8})/i);
      if (folioMatch && folioMatch[1]) {
        const rawF = folioMatch[1].trim();
        if (!['number', 'details', 'particulars', 'no', 'num', 'above', 'as'].includes(rawF.toLowerCase())) {
          result.folio = rawF;
        }
      }
    }
  }

  // 3. Company Detection
  if (!result.company) {
    // 3a. Check explicit "Company Name: ..." field
    const compFieldMatch = normalized.match(/Company(?:\s*Name)?[:\s]+([^\n\r,]+)/i);
    if (compFieldMatch && compFieldMatch[1]) {
      const rawC = compFieldMatch[1].trim();
      const upperC = rawC.toUpperCase();
      for (const [alias, full] of Object.entries(COMPANY_ALIASES)) {
        if (upperC === alias || upperC.includes(alias)) {
          result.company = full;
          result.compSymbol = alias.toUpperCase();
          break;
        }
      }
      if (!result.company && rawC.length > 2 && !rawC.toLowerCase().includes('dear') && !rawC.toLowerCase().includes('manager')) {
        result.company = rawC;
      }
    }

    // 3b. Check Alias map across text
    if (!result.company) {
      const upperText = normalized.toUpperCase();
      for (const [alias, full] of Object.entries(COMPANY_ALIASES)) {
        if (upperText.includes(alias)) {
          result.company = full;
          result.compSymbol = alias.toUpperCase();
          break;
        }
      }
    }

    // 3c. Regex fallback for company line
    if (!result.company) {
      const compLineMatch = normalized.match(/([A-Z][A-Za-z0-9\s&]+(?:Company|Corporation|Bank|Cement|Fertilizer|Textile|Sugar|Power|Oil)\s+(?:Limited|Ltd\.?))/i);
      if (compLineMatch) {
        result.company = compLineMatch[1].trim();
      }
    }
  }

  if (result.company && !result.compSymbol) {
    result.compSymbol = result.company.split(' ')[0].toUpperCase();
  }

  // 4. Deceased Name Detection
  const decMatches = [
    normalized.match(/Deceased\s*Shareholder\s*(?:Title|Name)?[:\s]*([^\n\r]+)/i),
    normalized.match(/name\s*of\s*(?:my\s*)?late\s*(?:father|mother|husband|wife)?[:\s]*([^\n\r]+)/i),
    normalized.match(/Father\s*name[:\s]*([A-Za-z\s.]+?)(?=\s*CNIC|Folio|[\r\n]|$)/i),
    normalized.match(/(?:Late\s+)([A-Z][a-zA-Z\s.]{2,40})(?=\s*\(Late\)|[\r\n,]|Folio|F\/H|\bDear\b|\bTransmission\b)/i),
    normalized.match(/F\/H[:\s]+([A-Za-z\s.]+?)(?=\s*\(Late\)|[\r\n,]|$)/i),
    normalized.match(/(?:deceased(?:\s+shareholder)?|deceased)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|registered)/i)
  ];
  for (const dm of decMatches) {
    if (dm && dm[1]) {
      let val = dm[1].trim()
        .replace(/^D\/O\s+/i, '')
        .replace(/^S\/O\s+/i, '')
        .replace(/^W\/O\s+/i, '')
        .replace(/\s*\(Late\)/i, '')
        .replace(/^Late\s+/i, '')
        .replace(/^Father\s*name[:\s]*/i, '')
        .trim();
      if (val.length > 2 && !val.toLowerCase().includes('above') && !val.toLowerCase().includes('details:')) {
        result.deceased = val;
        break;
      }
    }
  }

  // 5. Legal Heir / Applicant Name Detection
  const heirMatches = [
    normalized.match(/Applicant\s*Details[\s\S]*?\n\s*Name[:\s]*([^\n\r]+)/i),
    normalized.match(/Name\s*of\s*Legal\s*Heir[:\s]*([^\n\r]+)/i),
    normalized.match(/([A-Z][a-z]+(?:\s+[a-z]+)?)\s*\((?:son|daughter|wife|widow|legal heir|brother|sister|share\s*holder)[^)\]]*[)\]]/im),
    normalized.match(/^([A-Za-z\s.]+)\s*\((?:son|daughter|wife|widow|legal heir|brother|sister)[^)]*\)/im),
    normalized.match(/(?:Legal\s*Heir|Applicant|Name\s*of\s*Legal\s*Heir|To)[:\s]*([A-Za-z\s.()\/]{3,45})(?=[\r\n,]|F\/H|Address)/i),
    normalized.match(/\b((?:Mr\.|Mrs\.|Ms\.|Mst\.|Dr\.|Syed|Syeda)\s+[A-Z][a-zA-Z\s.]{3,35})\b/i)
  ];
  for (const hm of heirMatches) {
    if (hm && hm[1]) {
      let val = hm[1].trim()
        .replace(/\s*\([^)]*\)\s*$/, '')
        .replace(/^Mr\.?\s*/i, '')
        .replace(/^Mrs\.?\s*/i, '')
        .replace(/^Ms\.?\s*/i, '')
        .trim();
      if (val.length > 2 && 
          !val.toLowerCase().includes('father') && 
          !val.toLowerCase().includes('details') && 
          !val.toLowerCase().includes('concern') && 
          !val.toLowerCase().includes('secretary') &&
          !val.toLowerCase().includes('applicant')) {
        result.legalHeir = val;
        break;
      }
    }
  }

  // 6. Contact / Mobile Number Detection
  const phoneMatch = normalized.match(/(?:Cell\s*(?:#|No|Number)?|Contact(?:\s*No)?|Mobile)[:\s]*([0-9\s+-]{10,16})/i) ||
                     normalized.match(/\b(03[0-4][0-9][-\s]?[0-9]{7})\b/);
  if (phoneMatch) {
    result.contactNo = (phoneMatch[1] || phoneMatch[0]).replace(/[^0-9+-]/g, '').trim();
  }

  // 7. Address Detection
  const addrMatch = normalized.match(/Address[:\s]*([^\n\r]+)/i) ||
                    normalized.match(/((?:House|Flat|Plot|Bungalow|Apartment|D-|\d+[A-Z]?)[#\s\w\-,]+(?:Street|Block|Sector|Scheme|Road|Phase|Colony|Town)[\w\s\-,]+(?:Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Peshawar|Quetta|Multan|Hyderabad))/i);
  if (addrMatch && addrMatch[1]) {
    const rawAddr = addrMatch[1].trim();
    if (rawAddr.length > 8) {
      result.address = rawAddr.split(/\b(?:Cell|Email|Contact|Ph|Phone)\b/i)[0].trim().replace(/,\s*$/, '');
    }
  }

  // 8. Relation Detection
  const relMatch = normalized.match(/Relation(?:ship)?\s*(?:with\s*Deceased\s*Shareholder)?[:\s]*([A-Za-z]+)/i) ||
                   normalized.match(/\((son|daughter|wife|widow|brother|sister|legal heir)[^)]*\)/i);
  if (relMatch && relMatch[1]) {
    result.relation = relMatch[1].trim();
  }

  // 9. CNIC Detection
  const cnicMatch = normalized.match(/\b(\d{5}-\d{7}-\d{1})\b/);
  if (cnicMatch) {
    result.cnic = cnicMatch[1];
  }

  // 10. Shares and Certificates Detection (if single mode)
  if (result.mode === "single") {
    const certMatch = normalized.match(/=?(\d+)=?\s*share\s*certificates?/i);
    if (certMatch) {
      result.certificates = `=${certMatch[1].padStart(2, '0')}=`;
    }
    const sharesMatch = normalized.match(/=?([0-9,]+)=?\s*shares/i);
    if (sharesMatch) {
      result.shares = `=${sharesMatch[1]}=`;
    }
  }

  // 11. Documents Received
  const foundDocs: string[] = [
    "Copy of CNIC of deceased shareholder & yourself",
    "Written transmission request application"
  ];
  if (lower.includes("death certificate") || lower.includes("death cert")) {
    foundDocs.push("Copy of death certificate of subject deceased shareholder");
  }
  if (lower.includes("original physical") || lower.includes("original share certificate") || lower.includes("physical share")) {
    foundDocs.push("Original Share Certificates");
  }
  if (lower.includes("family registration") || lower.includes("frc")) {
    foundDocs.push("Copy of Family Registration Certificate (FRC)");
  }
  if (lower.includes("succession certificate") || lower.includes("court order") || lower.includes("letter of administration")) {
    foundDocs.push("Copy of Succesion Certificate");
  }

  result.receivedDocs = Array.from(new Set(foundDocs));

  const sym = result.compSymbol || (result.company ? result.company.split(' ')[0].toUpperCase() : "COMP");
  const fol = result.folio || "FOLIO";
  result.refNo = `CDCSR/LTC/${sym}/${fol}/26`;

  const gap = calculateDocumentGap(result.receivedDocs, normalized);
  result.gapAnalysis = gap;
  result.missingDocs = gap.missingDocs;
  result.hasLostShares = gap.hasLostShares;

  return result;
}
