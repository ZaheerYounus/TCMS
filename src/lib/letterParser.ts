import { calculateDocumentGap, CANONICAL_TRANSMISSION_DOCS, DocumentGapAnalysis } from './gapAnalyzer';
import companiesList from '../data/companiesList.json';
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
  'FHAM': 'First Habib Modaraba',
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
  'KEL': 'K-Electric Limited',
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

// Filter valid company names
const validCompanies: string[] = (companiesList as string[]).filter(
  c => c && c.length > 2 && c !== 'NA' && c !== 'N/A'
);

/**
 * Universal human-like document parser for Pakistani share transmission letters,
 * shareholder inquiries, and official registrar forms.
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

  if (!text || text.trim().length === 0) {
    return result;
  }

  // Normalize all whitespaces and remove non-printable control characters
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/[ \t]+/g, ' ');

  const lower = normalized.toLowerCase();

  // 1. Detect Multi-Folio lines (e.g. "1) Cherat Cement Co. Ltd. Folio No. F00965 shares 3912")
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

  // 2. REFERENCE NUMBER DETECTION
  const refMatch = normalized.match(/CDCSR\/LTC\/[A-Za-z0-9\/_-]+/i);
  if (refMatch) {
    result.refNo = refMatch[0].trim();
  }

  // 3. FOLIO / CDS ACCOUNT NUMBER DETECTION (Human Thinking: Priority to explicit CDS A/C or Folio #)
  if (!result.folio) {
    const cdsMatch = normalized.match(/CDS(?:\s*A\/C|\s*Account)?\s*(?:#|No\.?)?[:\s-]+([0-9]{4,6}\s*-\s*[0-9]{3,6})/i);
    if (cdsMatch) {
      result.folio = cdsMatch[1].replace(/\s+/g, '');
    } else {
      const folioPatterns = [
        /(?:Folio\s*(?:#|No\.?|Number|Num)?\s*(?:\/|\&)?\s*(?:CDS(?:\s*Account)?\s*(?:#|No\.?)?)?[:\s-]+)([A-Za-z0-9\/-]{2,18})/i,
        /(?:Folio\s*-\s*Folio\s*#\s*|Folio\s*#\s*|-\s*Folio\s*#\s*)([A-Za-z0-9\/-]{2,15})/i,
        /Folio\s*No\(s\)[:\s]+([A-Za-z0-9\/-]{2,15})/i,
        /\bFolio\s+([0-9]{2,10})\b/i,
        /CDCSR\/LTC\/[A-Z0-9]+\/([0-9A-Za-z]+)\//i,
        /(?:folio|olio|fol|f\.no)[^0-9a-zA-Z\n]{0,5}(?:#|no|:)?\s*([A-Za-z0-9\/-]{2,15})/i
      ];
      for (const fp of folioPatterns) {
        const fm = normalized.match(fp);
        if (fm && fm[1]) {
          const val = fm[1].trim();
          if (!['number', 'details', 'particulars', 'no', 'num', 'above', 'as', 'lowing', 'owing', 'shares', 'certificate'].includes(val.toLowerCase())) {
            result.folio = val;
            break;
          }
        }
      }
    }
  }

  // 4. COMPANY NAME DETECTION
  // Check known aliases first (e.g. OGDC, HBL, PSO, BAHL, FFC)
  for (const [sym, full] of Object.entries(COMPANY_ALIASES)) {
    const reg = new RegExp(`\\b${sym}\\b`, 'i');
    if (reg.test(normalized) || normalized.includes(`(${sym})`)) {
      result.company = full;
      result.compSymbol = sym;
      break;
    }
  }

  // If not found from alias, check full listed companies (longest match first)
  if (!result.company) {
    const sortedComps = [...validCompanies].sort((a, b) => b.length - a.length);
    const upperText = normalized.toUpperCase();
    for (const comp of sortedComps) {
      if (upperText.includes(comp.toUpperCase())) {
        result.company = comp;
        break;
      }
    }
  }

  // Regex fallback for company patterns (e.g. "ABC Limited", "XYZ Company Limited")
  if (!result.company) {
    const compRegex = /(?:Company(?:\s*Name)?[:\s]+)?([A-Z][A-Za-z0-9\s&.,'-]+?(?:Company|Corporation|Bank|Modaraba|Cement|Power|Sugar|Textile|Petroleum|Gas)\s+(?:Limited|Ltd\.?))/i;
    const cm = normalized.match(compRegex);
    if (cm && cm[1] && !cm[1].toLowerCase().includes('dear') && !cm[1].toLowerCase().includes('manager')) {
      result.company = cm[1].trim();
    }
  }

  // Resolve compSymbol
  if (result.company && !result.compSymbol) {
    for (const [sym, full] of Object.entries(COMPANY_ALIASES)) {
      if (full.toLowerCase() === result.company.toLowerCase()) {
        result.compSymbol = sym;
        break;
      }
    }
    if (!result.compSymbol) {
      result.compSymbol = result.company.split(' ')[0].toUpperCase();
    }
  }

  // 5. DECEASED NAME DETECTION (Human-like thinking)
  const deceasedPatterns = [
    /(?:Father(?:\s*name)?|F\/H(?:\s*Name)?)[:\s]+([A-Za-z\s.]+?)(?=\s*\(Late\)|[\r\n,]|$)/i,
    /(?:To(?:\s+the)?\s*Legal\s*Heirs?\s*of[:\s]+(?:Late\s+)?)([A-Za-z\s.]+?)(?=\s*Company|\s*Folio|[\r\n,]|$)/i,
    /(?:Late\s+)([A-Z][a-zA-Z\s.]{2,40})(?=\s*\(Late\)|[\r\n,]|Folio|F\/H|Dear|Transmission|-|\()/i,
    /(?:Deceased(?:\s*Shareholder)?(?:\s*Name|\s*Title)?|Name\s*of\s*Deceased)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|registered|\(|$)/i,
    /(?:Transmission of (?:Shares|Dividends)[^\n\r]*?Late\s+)([A-Za-z\s.]+?)(?=[\r\n,-]|Folio|CDS|$)/i,
    /(?:Shareholder Title[:\s_]+)([A-Za-z\s.]+?)(?=[_\r\n,]|$)/i,
    /(?:demise of\s+(?:Late\s+)?)([A-Z][a-zA-Z\s.]{2,40})(?=[\r\n,]|registered|\(|$)/i,
    /(?:Marhoom|Marhooma)\s+([A-Za-z\s.]+?)(?=[\r\n,]|$)/i
  ];

  for (const dp of deceasedPatterns) {
    const dm = normalized.match(dp);
    if (dm && dm[1]) {
      let val = dm[1].trim()
        .replace(/^Mr\.?\s+/i, '')
        .replace(/^Mrs\.?\s+/i, '')
        .replace(/^Mst\.?\s+/i, '')
        .replace(/^Late\s+/i, '')
        .replace(/\s*\(Late\)/i, '')
        .replace(/^D\/O\s+/i, '')
        .replace(/^S\/O\s+/i, '')
        .replace(/^W\/O\s+/i, '')
        .trim();
      if (val.length > 2 && 
          !['above', 'details', 'subject', 'transmission', 'folio', 'company', 'shares', 'concern'].includes(val.toLowerCase())) {
        result.deceased = val;
        break;
      }
    }
  }

  // 6. LEGAL HEIR NAME DETECTION (Human-like thinking)
  const heirPatterns = [
    /([A-Z][A-Za-z\s.]+?)(?=\s*(?:F\/H|Father\s*name)[:\s])/i,
    /\b((?:Mr\.|Mrs\.|Ms\.|Mst\.|Dr\.|Syed|Syeda)\s+[A-Z][a-zA-Z\s.]{3,35})(?=\s*(?:House|Flat|Plot|D-|R-|\d+|[A-Z][a-z]+ Road|[A-Z][a-z]+ Street|Majeed|Law|Advocate|[\r\n]))/i,
    /(?:Name\s*of\s*(?:Legal\s*Heir|L\.H|Applicant)|Applicant\s*Details[\s\S]*?Name)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|$)/i,
    /(?:Legal\s*Heir|Applicant)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|Address|Cell|$)/i,
    /([A-Z][a-z]+(?:\s+[a-z]+)?)\s*\((?:son|daughter|wife|widow|legal heir|brother|sister)[^)\]]*[)\]]/im
  ];

  for (const hp of heirPatterns) {
    const hm = normalized.match(hp);
    if (hm && hm[1]) {
      let val = hm[1].trim()
        .replace(/^Mr\.?\s+/i, '')
        .replace(/^Mrs\.?\s+/i, '')
        .replace(/^Ms\.?\s+/i, '')
        .replace(/^Mst\.?\s+/i, '')
        .replace(/F\/H.*$/i, '')
        .replace(/\n.*/s, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim();
      if (val.length > 2 && 
          !['above', 'details', 'concern', 'secretary', 'authorized', 'manager', 'transmission', 'subject'].includes(val.toLowerCase()) &&
          val !== result.deceased) {
        result.legalHeir = val;
        break;
      }
    }
  }

  // 7. CONTACT / MOBILE NUMBER
  const phoneMatch = normalized.match(/(?:Contact\s*(?:#|No\.?)|Cell\s*(?:#|No\.?)|Mobile\s*(?:#|No\.?)|Phone\s*(?:#|No\.?))[:\s]*([0-9\s+-]{10,16})/i) ||
                     normalized.match(/\b(03[0-4][0-9][-\s]?[0-9]{7})\b/);
  if (phoneMatch) {
    result.contactNo = (phoneMatch[1] || phoneMatch[0]).replace(/[^0-9+-]/g, '').trim();
  }

  // 8. ADDRESS DETECTION (Extract the exact address between Heir/Deceased and Phone/Subject)
  let addressCandidate = "";
  const phoneIdx = normalized.search(/(?:Contact\s*(?:#|No)|Cell\s*(?:#|No)|Mobile|Phone|\b03[0-4][0-9])/i);
  const dearIdx = normalized.search(/\b(?:Dear\s*Concern|Dear\s*Sir|Transmission of Shares)\b/i);
  const endLimit = phoneIdx !== -1 ? phoneIdx : (dearIdx !== -1 ? dearIdx : -1);

  if (endLimit > 20) {
    let sub = normalized.slice(0, endLimit);
    sub = sub.replace(/CDCSR\/[^\s]+/gi, '').replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi, '');
    if (result.legalHeir) {
      sub = sub.replace(new RegExp(result.legalHeir.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
    }
    if (result.deceased) {
      sub = sub.replace(new RegExp(result.deceased.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
    }
    sub = sub
      .replace(/F\/H(?:\s*Name)?[:\s]*/gi, '')
      .replace(/Father(?:\s*name)?[:\s]*/gi, '')
      .replace(/\(Late\)/gi, '')
      .replace(/\b(?:Mr\.|Mrs\.|Ms\.|Mst\.|Dr\.|Syed|Syeda)\b/gi, '')
      .replace(/Contact[:\s#]*$/i, '')
      .replace(/\s+/g, ' ')
      .replace(/^[,.\s-]+/, '')
      .replace(/[,.\s-]+$/, '')
      .trim();

    if (sub.length > 8 && !sub.toLowerCase().includes('transmission') && !sub.toLowerCase().includes('dear')) {
      addressCandidate = sub;
    }
  }

  if (!addressCandidate) {
    const explicitAddr = normalized.match(/Address[:\s]+([^\n\r]+)/i);
    if (explicitAddr) addressCandidate = explicitAddr[1].trim();
  }

  if (addressCandidate) {
    result.address = addressCandidate.replace(/,\s*$/, '').trim();
  }

  // 9. RELATION DETECTION
  const relMatch = normalized.match(/Relation(?:ship)?\s*(?:with\s*Deceased\s*Shareholder)?[:\s]*([A-Za-z\s\/]+)/i) ||
                   normalized.match(/\((son|daughter|wife|widow|brother|sister|legal heir)[^)]*\)/i);
  if (relMatch && relMatch[1]) {
    result.relation = relMatch[1].trim();
  } else {
    result.relation = "Legal Heir";
  }

  // 10. CNIC DETECTION
  const cnicMatch = normalized.match(/\b(\d{5}-\d{7}-\d{1})\b/);
  if (cnicMatch) {
    result.cnic = cnicMatch[1];
  }

  // 11. SHARES AND CERTIFICATES DETECTION (if single mode)
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

  // 12. DOCUMENTS RECEIVED & GAP ANALYSIS
  const foundDocs: string[] = [
    "Copy of CNIC of subject deceased shareholder and yourself",
    "Written transmission request application"
  ];
  if (lower.includes("death certificate") || lower.includes("death cert")) {
    foundDocs.push("Copy of death certificate of subject deceased shareholder");
  }
  if (lower.includes("original physical") || lower.includes("original share certificate") || lower.includes("physical share")) {
    foundDocs.push("Original physical share certificate(s)");
  }
  if (lower.includes("family registration") || lower.includes("frc")) {
    foundDocs.push("Copy of Family Registration Certificate (FRC)");
  }
  if (lower.includes("succession certificate") || lower.includes("court order") || lower.includes("letter of administration")) {
    foundDocs.push("Succession Certificate / Letter of Administration");
  }

  result.receivedDocs = Array.from(new Set(foundDocs));

  if (!result.refNo) {
    const sym = result.compSymbol || (result.company ? result.company.split(' ')[0].toUpperCase() : "COMP");
    const fol = result.folio || "FOLIO";
    result.refNo = `CDCSR/LTC/${sym}/${fol}/26`;
  }

  const gap = calculateDocumentGap(result.receivedDocs, normalized);
  result.gapAnalysis = gap;
  result.missingDocs = gap.missingDocs;
  result.hasLostShares = gap.hasLostShares;

  return result;
}
