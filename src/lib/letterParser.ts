import { calculateDocumentGap, CANONICAL_TRANSMISSION_DOCS, DocumentGapAnalysis } from './gapAnalyzer';
import { formatCompanyWithSymbol, lookupSymbol, lookupSymbolFromName, EXACT_SYMBOL_MAP } from './companySymbols';
export * from './gapAnalyzer';
export * from './companySymbols';

export interface MultiFolioItem {
  folio: string;
  company: string;
  shares: string;
  certificates: string;
  stampDuty?: string;
  isSymbolFound?: boolean;
  scripts?: string;
}

export interface ParsedLetterResult {
  mode: "single" | "multi";
  folio?: string;
  company?: string;
  compSymbol?: string;
  deceased?: string;
  deceasedCnic?: string;
  applicantFather?: string; // Father name of the applicant (for F/H line)
  legalHeir?: string;
  lawFirm?: string;
  relation?: string;
  address?: string;
  addressLines?: string[]; // 3-line split address
  contactNo?: string;
  cnic?: string;
  shares?: string;
  certificates?: string;
  scripts?: string;
  multiFolios?: MultiFolioItem[];
  missingFoliosWarning?: string[];
  unknownSymbolsWarning?: string[];
  receivedDocs: string[];
  missingDocs: string[];
  gapAnalysis: DocumentGapAnalysis;
  hasLostShares?: boolean;
  lostSharesDetail?: string;
  refNo?: string;
  rawTextPreview: string;
  matchSource: "document_parsed" | "mis_enriched" | "manual";

  // Document types & specialized extractions
  docType?: "transmission_request" | "cheques_delivery" | "shares_delivery" | "transfer_register" | "loss_register" | "split_register";
  chequeRows?: Array<{ beneficiary: string; instrumentNo: string; amount: string; folio?: string }>;
  totalAmount?: string;
  heirRows?: Array<{ folio: string; name: string; shares: string }>;
  transferReceipts?: Array<{ receiptNo: string; heirName: string }>;
  transferees?: Array<{ name: string; cnic: string; shares: string; folio: string }>;
  transferPages?: string;
  lossReceiptNo?: string;
  lossRegisterPages?: string;
  splitReceiptNo?: string;
  splitRegisterPages?: string;
  duplicateCertsCount?: string;
}

/**
 * Split a raw address into 3 clean lines:
 * Line 1: House / Block / Street
 * Line 2: Area / Scheme
 * Line 3: City (e.g. Karachi.)
 */
export function splitAddressIntoThreeLines(rawAddress: string): string[] {
  if (!rawAddress || !rawAddress.trim()) return ["", "", ""];

  const clean = rawAddress.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 3) {
    return [
      lines[0].endsWith(',') ? lines[0] : `${lines[0]},`,
      lines.slice(1, -1).join(', ').endsWith(',') ? lines.slice(1, -1).join(', ') : `${lines.slice(1, -1).join(', ')},`,
      lines[lines.length - 1].endsWith('.') ? lines[lines.length - 1] : `${lines[lines.length - 1]}.`
    ];
  }

  // Split by comma
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const city = parts[parts.length - 1];
    const area = parts[parts.length - 2];
    const street = parts.slice(0, parts.length - 2).join(', ');
    return [
      street ? `${street},` : "",
      area ? `${area},` : "",
      city.endsWith('.') ? city : `${city}.`
    ];
  } else if (parts.length === 2) {
    return [
      `${parts[0]},`,
      "",
      parts[1].endsWith('.') ? parts[1] : `${parts[1]}.`
    ];
  } else {
    return [clean, "", ""];
  }
}

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

  // 1. MULTI-FOLIO DETECTION: Separate comma lists (e.g. Folio: 655, 43, 564... and Company: OGDC, AKBL...)
  const folioListMatch = normalized.match(/(?:Folios?|Folio\s*Nos?|Folio\s*#)[:\s]+([0-9A-Za-z\s,/-]+?)(?=(?:\n[A-Za-z]+[:\s]|Company|Applicant|Name|$))/i);
  const companyListMatch = normalized.match(/(?:Company(?:\s*name)?s?|Symbols?)[:\s]+([A-Za-z0-9\s,&./-]+?)(?=(?:\n[A-Za-z]+[:\s]|Folio|Applicant|Name|CNIC|$))/i);

  let rawFolios: string[] = [];
  let rawCompanies: string[] = [];

  if (folioListMatch && folioListMatch[1].includes(',')) {
    rawFolios = folioListMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !['and', 'or', '&'].includes(s.toLowerCase()));
  }

  if (companyListMatch && companyListMatch[1].includes(',')) {
    rawCompanies = companyListMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !['and', 'or', '&'].includes(s.toLowerCase()));
  }

  // Also check standard line-by-line format: "1) Cherat Cement Co. Ltd. Folio No. F00965 shares 3912"
  const multiFolioRegex = /(?:(\d+)\)\s*)?([A-Za-z0-9\s.&'-]+?)(?:,\s*|\s+)Folio(?:\s*No\.?|\s*#)?[:\s]*([A-Za-z0-9\/-]+)(?:[\s,]+(?:shares?|# of shares?)[:\s]*([0-9,]+))?/gi;
  let mfMatch;
  const lineDetectedFolios: MultiFolioItem[] = [];
  while ((mfMatch = multiFolioRegex.exec(normalized)) !== null) {
    const rawComp = mfMatch[2].trim().replace(/^\d+[\).]\s*/, '').trim();
    const rawFolio = mfMatch[3].trim();
    const rawShares = mfMatch[4] ? mfMatch[4].trim() : "";
    if (rawFolio && !['above', 'as', 'cds', 'details', 'number', 'account', 'particulars'].includes(rawFolio.toLowerCase())) {
      const formatted = formatCompanyWithSymbol(rawComp);
      lineDetectedFolios.push({
        folio: rawFolio,
        company: formatted.displayName,
        shares: rawShares ? `=${rawShares}=` : "—",
        certificates: "=01=",
        stampDuty: "–",
        isSymbolFound: formatted.isFound
      });
    }
  }

  const detectedFolios: MultiFolioItem[] = [];
  const missingFoliosWarning: string[] = [];
  const unknownSymbolsWarning: string[] = [];

  if (rawCompanies.length > 1 || rawFolios.length > 1) {
    const maxLen = Math.max(rawCompanies.length, rawFolios.length);
    for (let i = 0; i < maxLen; i++) {
      const folioVal = rawFolios[i] || "— Not provided";
      const compVal = rawCompanies[i] || "— Not provided";

      if (folioVal === "— Not provided") {
        missingFoliosWarning.push(compVal);
      }

      const formatted = formatCompanyWithSymbol(compVal);
      if (!formatted.isFound && compVal !== "— Not provided") {
        unknownSymbolsWarning.push(compVal);
      }

      detectedFolios.push({
        folio: folioVal,
        company: formatted.displayName,
        shares: "—",
        certificates: "—",
        stampDuty: "–",
        isSymbolFound: formatted.isFound
      });
    }
  } else if (lineDetectedFolios.length > 1) {
    detectedFolios.push(...lineDetectedFolios);
  }

  if (detectedFolios.length > 1) {
    result.mode = "multi";
    result.multiFolios = detectedFolios;
    result.folio = detectedFolios[0].folio !== "— Not provided" ? detectedFolios[0].folio : "";
    result.company = detectedFolios[0].company;
    result.missingFoliosWarning = missingFoliosWarning;
    result.unknownSymbolsWarning = unknownSymbolsWarning;

    // Multi-folio reference number format: CDCSR/LTC/GEN/{SYMBOL}/{FOLIO}/26
    const firstRowFormatted = formatCompanyWithSymbol(detectedFolios[0].company);
    const firstSymbol = firstRowFormatted.symbol || 'KEL';
    const firstFolio = result.folio || '11469';
    result.refNo = `CDCSR/LTC/GEN/${firstSymbol}/${firstFolio}/26`;
  }

  // 2. REFERENCE NUMBER DETECTION (if already printed on letter)
  const refMatch = normalized.match(/CDCSR\/LTC\/[A-Za-z0-9\/_-]+/i);
  if (refMatch) {
    result.refNo = refMatch[0].trim();
  }

  // 3. SINGLE FOLIO DETECTION (if not multi)
  if (!result.folio) {
    const singleFolioMatch = normalized.match(/(?:Folio(?:\s*#|\s*No\.?|\s*Number)?[:\s]+)([0-9A-Za-z\/-]+)/i);
    if (singleFolioMatch && singleFolioMatch[1]) {
      const val = singleFolioMatch[1].trim();
      if (!['number', 'details', 'particulars', 'no', 'num', 'above', 'as', 'shares', 'certificate'].includes(val.toLowerCase())) {
        result.folio = val;
      }
    }
  }

  // 4. SINGLE COMPANY NAME & SYMBOL DETECTION
  if (result.mode === "single") {
    // Check for explicit "Company name:", "Comp:", "Unit:", "Securities:", "Co.", etc.
    const compMatch = normalized.match(/(?:comp(?:\s*name|\s*symbol)?|company(?:\s*name)?|unit|client|co\.)[:\s]+([A-Za-z0-9\s&.,'-\/]+?)(?=[,\r\n]|Folio|Applicant|Father|CNIC|Address|Deceased|$)/i);
    let candidateComp = compMatch ? compMatch[1].trim() : "";

    if (!candidateComp) {
      // Check for known symbols
      for (const [sym, full] of Object.entries(EXACT_SYMBOL_MAP)) {
        const reg = new RegExp(`\\b${sym}\\b`, 'i');
        if (reg.test(normalized) || normalized.includes(`(${sym})`)) {
          candidateComp = sym;
          break;
        }
      }
    }

    if (candidateComp) {
      const formatted = formatCompanyWithSymbol(candidateComp);
      result.company = formatted.fullName || formatted.displayName;
      result.compSymbol = formatted.symbol || lookupSymbolFromName(result.company) || candidateComp.toUpperCase();
    }

    if (!result.refNo && result.folio) {
      const sym = result.compSymbol || 'OGDC';
      result.refNo = `CDCSR/LTC/${sym}/${result.folio}/26`;
    }
  }

  // 5. DECEASED NAME DETECTION
  // CRITICAL RULE: "Name of deceased:" -> deceased name ONLY.
  // Never take the deceased name from a "Father name:" or "F/H:" line!
  const deceasedMatch = 
    normalized.match(/(?:Name\s*of\s*Deceased|Deceased(?:\s*Shareholder)?(?:\s*Name)?|Deceased)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|\s*Father|\s*Applicant|\s*CNIC|\s*Folio|$)/i) ||
    normalized.match(/(?:Late\s+)([A-Z][a-zA-Z\s.]{2,40})(?=\s*\(Late\)|[\r\n,]|Folio|Dear|Transmission|-|\()/i) ||
    normalized.match(/(?:demise of\s+(?:Late\s+)?)([A-Z][a-zA-Z\s.]{2,40})(?=[\r\n,]|registered|\(|$)/i);

  if (deceasedMatch && deceasedMatch[1]) {
    let val = deceasedMatch[1].trim()
      .replace(/^Mr\.?\s+/i, '')
      .replace(/^Mrs\.?\s+/i, '')
      .replace(/^Mst\.?\s+/i, '')
      .replace(/^Late\s+/i, '')
      .replace(/\s*\(Late\)/i, '')
      .replace(/^D\/O\s+/i, '')
      .replace(/^S\/O\s+/i, '')
      .replace(/^W\/O\s+/i, '')
      .trim();
    if (val.length > 2 && !['above', 'details', 'subject', 'transmission', 'folio', 'company', 'shares', 'concern'].includes(val.toLowerCase())) {
      result.deceased = val;
    }
  }

  // 6. APPLICANT / LEGAL HEIR NAME DETECTION
  const applicantMatch = 
    normalized.match(/(?:Applicant(?:\s*Name)?|Name\s*of\s*Applicant|Legal\s*Heir(?:\s*Name)?)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|\s*Father|\s*Relation|\s*CNIC|\s*Address|$)/i);

  if (applicantMatch && applicantMatch[1]) {
    let val = applicantMatch[1].trim()
      .replace(/^Mr\.?\s+/i, '')
      .replace(/^Mrs\.?\s+/i, '')
      .replace(/^Ms\.?\s+/i, '')
      .replace(/^Mst\.?\s+/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim();
    if (val.length > 2 && val !== result.deceased) {
      result.legalHeir = val;
    }
  }

  // 7. APPLICANT'S FATHER NAME (F/H) DETECTION
  // CRITICAL RULE: Read from "Father name:" that sits under the Applicant part of the letter.
  // This field is the F/H of the letter.
  let applicantSection = "";
  const applicantIdx = normalized.search(/\bApplicant[:\s]/i);
  if (applicantIdx !== -1) {
    applicantSection = normalized.slice(applicantIdx);
  } else {
    applicantSection = normalized;
  }

  const applicantFatherMatch = 
    applicantSection.match(/(?:Father(?:\s*name)?|F\/H(?:\s*Name)?)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|\s*Relation|\s*CNIC|\s*Address|\s*Contact|$)/i);

  if (applicantFatherMatch && applicantFatherMatch[1]) {
    let val = applicantFatherMatch[1].trim()
      .replace(/^Mr\.?\s+/i, '')
      .replace(/^Late\s+/i, '')
      .replace(/\s*\(Late\)/i, '')
      .trim();
    if (val.length > 1 && !['above', 'details', 'concern'].includes(val.toLowerCase())) {
      result.applicantFather = val;
    }
  }

  // 8. RELATION DETECTION
  const relationMatch = normalized.match(/(?:Relation(?:\s*with\s*deceased)?|Relationship)[:\s]+([A-Za-z\s/]+?)(?=[\r\n,]|\s*CNIC|\s*Address|\s*Contact|$)/i);
  if (relationMatch && relationMatch[1]) {
    result.relation = relationMatch[1].trim();
  }

  // 9. CNIC DETECTION
  const cnicMatch = normalized.match(/(?:CNIC(?:\s*#|\s*No\.?)?)[:\s]*([0-9]{5}-[0-9]{7}-[0-9])/i) ||
                    normalized.match(/\b([0-9]{5}-[0-9]{7}-[0-9])\b/);
  if (cnicMatch) {
    result.cnic = cnicMatch[1].trim();
  }

  // 10. CONTACT / MOBILE NUMBER
  const phoneMatch = normalized.match(/(?:Contact\s*(?:#|No\.?)|Cell\s*(?:#|No\.?)|Mobile\s*(?:#|No\.?)|Phone\s*(?:#|No\.?))[:\s]*([0-9\s+-]{10,16})/i) ||
                     normalized.match(/\b(03[0-4][0-9][-\s]?[0-9]{7})\b/);
  if (phoneMatch) {
    result.contactNo = (phoneMatch[1] || phoneMatch[0]).replace(/[^0-9+-]/g, '').trim();
  }

  // 11. ADDRESS DETECTION & 3-LINE FORMATTING
  // CRITICAL RULE: Take address ONLY from the "Address:" line.
  // Never build address from the whole text before the phone number!
  const addressLineMatch = normalized.match(/Address[:\s]+([^\r\n]+?)(?=\s*Contact|\s*Cell|\s*Mobile|\s*Phone|[\r\n]|$)/i);
  if (addressLineMatch && addressLineMatch[1]) {
    const rawAddr = addressLineMatch[1].trim().replace(/^[,.\s-]+/, '');
    if (rawAddr.length > 5) {
      result.address = rawAddr;
      result.addressLines = splitAddressIntoThreeLines(rawAddr);
    }
  }

  // 12. DOCUMENTS RECEIVED DETECTION
  // CRITICAL RULE: List ONLY the documents that the uploaded letter actually mentions.
  // Never add a document by default.
  const actualReceivedDocs: string[] = [];
  const docKeywords = [
    { text: "Copy of CNIC of subject deceased shareholder and yourself", kw: ["cnic of subject", "copy of cnic", "cnic copy"] },
    { text: "Written transmission request application", kw: ["transmission request", "request letter", "application for transmission", "written application"] },
    { text: "Copy of death certificate of subject deceased shareholder", kw: ["death certificate", "death cert"] },
    { text: "Original physical share certificate(s)", kw: ["original physical", "original share cert", "share certificates enclosed"] },
    { text: "Succession Certificate / Letter of Administration", kw: ["succession certificate", "letter of administration", "court order"] },
    { text: "Attested Affidavit / Indemnity Bond", kw: ["attested affidavit", "indemnity bond", "stamp paper"] },
    { text: "Account maintenance certificate / IBAN details", kw: ["iban", "bank account", "account maintenance"] }
  ];

  for (const item of docKeywords) {
    if (item.kw.some(k => lower.includes(k))) {
      actualReceivedDocs.push(item.text);
    }
  }

  // 13. DECEASED CNIC & LAW FIRM DETECTION
  const deceasedCnicMatch = normalized.match(/(?:Deceased(?:\s*Shareholder)?\s*CNIC|CNIC\s*of\s*deceased)[:\s]*([0-9]{5}-[0-9]{7}-[0-9])/i);
  if (deceasedCnicMatch) {
    result.deceasedCnic = deceasedCnicMatch[1].trim();
  }

  const lawFirmMatch = normalized.match(/(?:(?:Law\s*Firm|Advocate|Solicitor|Chambers)[:\s]+([^\r\n,]+))|([A-Za-z\s.]+Law\s*Associates|[A-Za-z\s.]+Advocate[s]?|[A-Za-z\s.]+Chambers)/i);
  if (lawFirmMatch) {
    result.lawFirm = (lawFirmMatch[1] || lawFirmMatch[2]).trim();
  }

  // 14. CHEQUES DELIVERY DETECTION
  const hasChequeKeywords = lower.includes("banker's cheque") || lower.includes("dividend cheque") || lower.includes("instrument #") || lower.includes("unpaid dividend");
  if (hasChequeKeywords) {
    result.docType = "cheques_delivery";
    const detectedCheques: Array<{ beneficiary: string; instrumentNo: string; amount: string; folio?: string }> = [];
    const chequeLineRegex = /(?:(\d+)\s+)?([A-Z][A-Za-z\s.]+?)\s+([0-9]{6,12})\s+(?:PKR\s*)?([0-9,]+(?:\.[0-9]{2})?)/g;
    let chqMatch;
    while ((chqMatch = chequeLineRegex.exec(normalized)) !== null) {
      const bName = chqMatch[2].trim();
      const instNo = chqMatch[3].trim();
      const amt = chqMatch[4].trim();
      if (!['total', 'dividend', 'cheque', 'amount', 'instrument'].includes(bName.toLowerCase())) {
        detectedCheques.push({
          beneficiary: bName,
          instrumentNo: instNo,
          amount: amt
        });
      }
    }
    if (detectedCheques.length > 0) {
      result.chequeRows = detectedCheques;
    }

    const totalAmtMatch = normalized.match(/(?:Total(?:\s*Dividend)?(?:\s*Amount)?[:\s]+(?:PKR\s*)?)([0-9,]+(?:\.[0-9]{2})?)/i);
    if (totalAmtMatch) {
      result.totalAmount = totalAmtMatch[1].trim();
    }
  }

  // 15. SHARES DELIVERY DETECTION
  const hasSharesDeliveryKeywords = lower.includes("forward herewith") && (lower.includes("shares certificates") || lower.includes("share certificate") || lower.includes("duly transmitted"));
  if (hasSharesDeliveryKeywords) {
    result.docType = "shares_delivery";
    const certsMatch = normalized.match(/(?:forward\s*herewith\s*|enclosed\s*|herewith\s*)(\d+)\s*(?:shares?\s*certificates?|share\s*certs?)/i);
    if (certsMatch) {
      result.certificates = certsMatch[1].trim();
    }

    const totalSharesMatch = normalized.match(/(?:for|totaling|totalling)\s*([0-9,]+)\s*shares/i);
    if (totalSharesMatch) {
      result.shares = totalSharesMatch[1].trim();
    }

    const detectedHeirRows: Array<{ folio: string; name: string; shares: string }> = [];
    const heirRowRegex = /(?:([0-9A-Za-z/-]{3,10})\s+)?([A-Z][A-Za-z\s.]{2,40}?)\s+([0-9,]{2,10})(?:\s*shares)?/g;
    let hrMatch;
    while ((hrMatch = heirRowRegex.exec(normalized)) !== null) {
      const fNum = hrMatch[1] || "";
      const hName = hrMatch[2].trim();
      const sNum = hrMatch[3].trim();
      if (fNum && !['total', 'shares', 'folio', 'number', 'certificates', 'details'].includes(hName.toLowerCase())) {
        detectedHeirRows.push({
          folio: fNum,
          name: hName,
          shares: sNum
        });
      }
    }
    if (detectedHeirRows.length > 0) {
      result.heirRows = detectedHeirRows;
    }
  }

  // 16. TRANSFER / LOSS / SPLIT REGISTER DETECTION (Physical Approval)
  const hasTransferKeywords = lower.includes("transfer register") || lower.includes("approval of transfer") || lower.includes("transfer receipt") || lower.includes("رسید نمبر");
  if (hasTransferKeywords) {
    result.docType = "transfer_register";
    const receipts: Array<{ receiptNo: string; heirName: string }> = [];
    const trRegex = /(?:Transfer\s*receipt(?:\(s\))?\s*#?|Receipt\s*#?|رسید\s*نمبر)[:\s]*([0-9A-Za-z/-]+)(?:\s*(?:\(in the name of|\bin\s*favo[u]?r\s*of|\bto)\s*([A-Za-z\s.]+?)\)?)?/gi;
    let rMatch;
    while ((rMatch = trRegex.exec(normalized)) !== null) {
      const rNo = rMatch[1].trim();
      const hName = (rMatch[2] || "").trim().replace(/\)$/, '');
      if (rNo && !['no', 'number', 'details'].includes(rNo.toLowerCase())) {
        receipts.push({
          receiptNo: rNo,
          heirName: hName
        });
      }
    }
    if (receipts.length > 0) {
      result.transferReceipts = receipts;
    }

    // Transfer register pages
    const tpMatch = normalized.match(/Transfer\s*register\s*[-–:]\s*no\.?\s*of\s*page\(s\)[:\s]*([0-9A-Za-z\s()]+?)(?=\n|$)/i);
    if (tpMatch) {
      result.transferPages = tpMatch[1].trim();
    }

    // Loss register receipt & pages
    const lrMatch = normalized.match(/(?:Loss\s*receipt(?:\(s\))?\s*#?|LR\s*#?)[:\s]*([0-9A-Za-z/-]+)/i);
    if (lrMatch) {
      result.lossReceiptNo = lrMatch[1].trim();
    }
    const lpMatch = normalized.match(/Loss\s*register\s*[-–:]\s*no\.?\s*of\s*page\(s\)[:\s]*([0-9A-Za-z\s()]+?)(?=\n|$)/i);
    if (lpMatch) {
      result.lossRegisterPages = lpMatch[1].trim();
    }

    // Split register receipt & pages
    const srMatch = normalized.match(/(?:Split\s*receipt(?:\(s\))?\s*#?|SR\s*#?)[:\s]*([0-9A-Za-z/-]+)/i);
    if (srMatch) {
      result.splitReceiptNo = srMatch[1].trim();
    }
    const spMatch = normalized.match(/Split\s*register\s*[-–:]\s*no\.?\s*of\s*page\(s\)[:\s]*([0-9A-Za-z\s()]+?)(?=\n|$)/i);
    if (spMatch) {
      result.splitRegisterPages = spMatch[1].trim();
    }

    // Transferees table detection: Name, CNIC, Shares, Folio
    const transferees: Array<{ name: string; cnic: string; shares: string; folio: string }> = [];
    const transfereeRegex = /([A-Z][A-Za-z\s.]{2,35})\s+([0-9]{5}-[0-9]{7}-[0-9])\s+([0-9,]+)\s+([0-9A-Za-z/-]{3,10})/g;
    let tMatch;
    while ((tMatch = transfereeRegex.exec(normalized)) !== null) {
      transferees.push({
        name: tMatch[1].trim(),
        cnic: tMatch[2].trim(),
        shares: tMatch[3].trim(),
        folio: tMatch[4].trim()
      });
    }
    if (transferees.length > 0) {
      result.transferees = transferees;
    }
  }

  return result;
}
