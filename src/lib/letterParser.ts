import zlib from 'zlib';
import path from 'path';
import fs from 'fs';

export * from './gapAnalyzer';
import { calculateDocumentGap, CANONICAL_TRANSMISSION_DOCS, DocumentGapAnalysis } from './gapAnalyzer';

export interface ParsedLetterResult {
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
  receivedDocs: string[];
  missingDocs: string[];
  gapAnalysis: DocumentGapAnalysis;
  hasLostShares?: boolean;
  lostSharesDetail?: string;
  refNo?: string;
  rawTextPreview: string;
  matchSource: "document_parsed" | "mis_enriched" | "manual";
}

/**
 * Extract PDF text from streams and text objects
 */
function extractPDFText(buffer: Buffer): string {
  let fullText = '';
  const str = buffer.toString('binary');

  function parsePdfOperators(content: string): string {
    let out = '';
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let m;
    while ((m = tjRegex.exec(content)) !== null) {
      out += m[1] + ' ';
    }
    const arrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((m = arrayRegex.exec(content)) !== null) {
      const inner = m[1];
      const innerMatches = inner.match(/\(([^)]*)\)/g);
      if (innerMatches) {
        out += innerMatches.map(s => s.slice(1, -1)).join('') + ' ';
      }
    }
    return out;
  }

  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const rawData = Buffer.from(match[1], 'binary');
    let decompressed: Buffer | null = null;
    try {
      decompressed = zlib.inflateSync(rawData);
    } catch (e) {
      try {
        decompressed = zlib.inflateRawSync(rawData);
      } catch (e2) {}
    }

    if (decompressed) {
      const text = parsePdfOperators(decompressed.toString('utf8'));
      if (text) fullText += '\n' + text;
    }
  }

  const uncompressed = parsePdfOperators(str);
  if (uncompressed) {
    fullText += '\n' + uncompressed;
  }

  if (fullText.trim().length < 30) {
    const rawMatches = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ')
      .match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/()#:&@\n\r]{6,}/g);
    if (rawMatches) {
      fullText = rawMatches.join('\n');
    }
  }

  return fullText.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract raw text from docx, doc, pdf, or plain buffer
 */
export function extractTextFromBuffer(buffer: Buffer, filename: string = ""): string {
  const lowerName = filename.toLowerCase();

  // 1. PDF detection
  if (lowerName.endsWith('.pdf') || (buffer.length > 4 && buffer.toString('utf8', 0, 4) === '%PDF')) {
    try {
      const pdfText = extractPDFText(buffer);
      if (pdfText && pdfText.length > 10) {
        return pdfText;
      }
    } catch (err) {
      console.warn('PDF extraction failed:', err);
    }
  }

  // 2. DOCX format
  if (lowerName.endsWith('.docx') || (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B)) {
    try {
      let idx = 0;
      while (idx < buffer.length - 30) {
        if (buffer.readUInt32LE(idx) === 0x04034b50) {
          const compMethod = buffer.readUInt16LE(idx + 8);
          const compSize = buffer.readUInt32LE(idx + 18);
          const fnLen = buffer.readUInt16LE(idx + 26);
          const extraLen = buffer.readUInt16LE(idx + 28);
          const fn = buffer.toString('utf8', idx + 30, idx + 30 + fnLen);
          const dataStart = idx + 30 + fnLen + extraLen;

          if (fn === 'word/document.xml') {
            const data = buffer.subarray(dataStart, dataStart + compSize);
            let xml = '';
            if (compMethod === 8) {
              xml = zlib.inflateRawSync(data).toString('utf8');
            } else if (compMethod === 0) {
              xml = data.toString('utf8');
            } else {
              try {
                xml = zlib.inflateSync(data).toString('utf8');
              } catch (e) {
                xml = data.toString('utf8');
              }
            }

            return xml
              .replace(/<w:p[^>]*>/gi, '\n')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();
          }
          idx = dataStart + compSize;
        } else {
          idx++;
        }
      }
    } catch (err) {
      console.warn('Docx fast extract failed, falling back to string scan:', err);
    }
  }

  // 3. DOC (OLE2 binary) or binary fallback
  const str = buffer.toString('binary');
  const cleanRuns = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  const matches = cleanRuns.match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/()#:&@\n\r]{6,}/g);
  if (matches && matches.length > 0) {
    return matches.join('\n').replace(/ {2,}/g, ' ').trim();
  }

  return buffer.toString('utf8');
}

function getAllCompaniesList(): string[] {
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'companiesList.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {}
  return [];
}

/**
 * Smart heuristic letter text parser
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
    receivedDocs: [],
    missingDocs: [],
    gapAnalysis: defaultGap,
    rawTextPreview: text.slice(0, 1000),
    matchSource: "document_parsed"
  };

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lower = normalized.toLowerCase();
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Folio Number Detection
  const folioMatch = text.match(/(?:folio(?:\s*(?:#|no|number|num))?[:\s]*)([A-Za-z0-9\/-]{2,15})/i) ||
                     text.match(/CDCSR\/LTC\/[A-Z0-9]+\/([0-9A-Za-z]+)\//i) ||
                     text.match(/\bFolio\s+([0-9]{2,10})\b/i);
  if (folioMatch && folioMatch[1]) {
    const rawF = folioMatch[1].trim();
    if (!['number', 'details', 'particulars', 'no', 'num'].includes(rawF.toLowerCase())) {
      result.folio = rawF;
    }
  }

  // 2. Company Detection (Check entire registered 183+ companies list)
  const allComps = getAllCompaniesList();
  for (const comp of allComps) {
    const cLow = comp.toLowerCase();
    const shortName = cLow.replace(/\s+(limited|ltd\.?|corporation|bank|company).*$/i, '').trim();
    if (lower.includes(cLow) || (shortName.length > 3 && lower.includes(shortName))) {
      result.company = comp;
      result.compSymbol = comp.split(' ')[0].toUpperCase();
      break;
    }
  }

  if (!result.company) {
    const compLineMatch = text.match(/([A-Z][A-Za-z0-9\s&]+(?:Company|Corporation|Bank|Cement|Fertilizer|Textile|Sugar|Power|Oil)\s+(?:Limited|Ltd\.?))/i);
    if (compLineMatch) {
      result.company = compLineMatch[1].trim();
      result.compSymbol = result.company.split(' ')[0].toUpperCase();
    }
  }

  // 3. Deceased Name Detection
  const decMatch = text.match(/(?:Late\s+)([A-Z][a-zA-Z\s.]{2,40})(?=\s*\(Late\)|[\r\n,]|Folio|F\/H|\bDear\b|\bTransmission\b)/i) ||
                   text.match(/F\/H[:\s]+([A-Za-z\s.]+?)(?=\s*\(Late\)|[\r\n,]|$)/i) ||
                   text.match(/(?:deceased(?:\s+shareholder)?|deceased)[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|registered)/i);
  if (decMatch && decMatch[1]) {
    result.deceased = decMatch[1].trim().replace(/\s*\(Late\)/i, '').replace(/^Late\s+/i, '');
  }

  // 4. Legal Heir Name Detection
  const toMatch = text.match(/(?:Legal\s*Heir|Applicant|Name\s*of\s*Legal\s*Heir|To)[:\s]*([A-Za-z\s.()\/]{3,45})(?=[\r\n,]|F\/H|Address)/i) ||
                  text.match(/\b((?:Mr\.|Mrs\.|Ms\.|Mst\.|Dr\.|Syed|Syeda)\s+[A-Z][a-zA-Z\s.]{3,35})\b/i);
  if (toMatch && toMatch[1]) {
    const rawHeir = toMatch[1].trim();
    if (!rawHeir.toLowerCase().includes("concern") && !rawHeir.toLowerCase().includes("secretary")) {
      result.legalHeir = rawHeir;
    }
  }

  if (!result.legalHeir) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('F/H:') && i > 0) {
        const prev = lines[i - 1].replace(/^To:\s*/i, '').trim();
        if (prev.length > 2 && prev.length < 50 && !prev.includes('CDCSR') && !prev.includes('202')) {
          result.legalHeir = prev;
          break;
        }
      }
    }
  }

  // 5. Contact / Mobile Number Detection
  const contactMatch = text.match(/(?:Contact\s*(?:#|No|Number)?[:\s]*)?(\+?92[-\s]?3\d{2}[-\s]?\d{7}|03\d{2}[-\s]?\d{7}|021[-\s]?\d{7,8})/i) ||
                       text.match(/\b(03[0-4][0-9][-\s]?[0-9]{7})\b/);
  if (contactMatch) {
    result.contactNo = contactMatch[0].replace(/^(?:Contact\s*(?:#|No|Number)?[:\s]*)/i, '').trim();
  }

  // 6. Address Detection
  const addrMatch = text.match(/((?:House|Flat|Plot|Bungalow|Apartment|D-|\d+[A-Z]?)[#\s\w\-,]+(?:Street|Block|Sector|Scheme|Road|Phase|Colony|Town)[\w\s\-,]+(?:Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Peshawar|Quetta|Multan|Hyderabad))/i) ||
                    text.match(/Address[:\s]*([\w\s\-,.#]{12,120})/i);
  if (addrMatch && addrMatch[1]) {
    result.address = addrMatch[1].trim().replace(/\s+/g, ' ');
  }

  // 7. Shares and Certificates Detection
  const certMatch = text.match(/=?(\d+)=?\s*share\s*certificates?/i);
  if (certMatch) {
    result.certificates = `=${certMatch[1].padStart(2, '0')}=`;
  }
  const sharesMatch = text.match(/=?([0-9,]+)=?\s*shares/i);
  if (sharesMatch) {
    result.shares = `=${sharesMatch[1]}=`;
  }

  // 8. Auto-Identify Documents Received
  const foundDocs: string[] = [];
  if (lower.includes("written") || lower.includes("request application") || lower.includes("transmission request") || lower.includes("application")) {
    foundDocs.push("Written transmission request application");
  }
  if (lower.includes("death certificate") || lower.includes("death cert")) {
    foundDocs.push("Legible notarized copy of death certificate of subject deceased shareholder");
  }
  if (lower.includes("cnic") && (lower.includes("deceased") || lower.includes("both") || lower.includes("yourself"))) {
    foundDocs.push("Copy of CNIC of subject deceased shareholder and yourself");
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

  if (foundDocs.length === 0) {
    foundDocs.push("Copy of CNIC of subject deceased shareholder and yourself");
    foundDocs.push("Written transmission request application");
  }

  result.receivedDocs = foundDocs;

  const sym = result.compSymbol || "COMP";
  const fol = result.folio || "FOLIO";
  result.refNo = `CDCSR/LTC/${sym}/${fol}/26`;

  // Enrich with MIS database if folio was discovered
  if (result.folio) {
    try {
      const recordsPath = path.join(process.cwd(), 'src', 'data', 'misRecords.json');
      if (fs.existsSync(recordsPath)) {
        const misData = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
        const fTarget = result.folio.toLowerCase().trim();
        const matchedMis = misData.find((m: any) => String(m.folio).toLowerCase().trim() === fTarget);
        if (matchedMis) {
          result.matchSource = "mis_enriched";
          if (!result.company && matchedMis.company) {
            result.company = matchedMis.company;
            result.compSymbol = matchedMis.company.split(' ')[0].toUpperCase();
            result.refNo = `CDCSR/LTC/${result.compSymbol}/${result.folio}/26`;
          }
          if (!result.deceased && matchedMis.deceased) {
            result.deceased = matchedMis.deceased;
          }
          if (!result.legalHeir && matchedMis.legalHeir) {
            result.legalHeir = matchedMis.legalHeir;
          }
          if (!result.shares && matchedMis.shares) {
            result.shares = `=${Number(matchedMis.shares).toLocaleString()}=`;
          }
          if (!result.certificates && matchedMis.certificates) {
            result.certificates = `=${String(matchedMis.certificates).padStart(2, '0')}=`;
          }
        }
      }
    } catch (e) {
      console.warn("MIS lookup in letter parser skipped:", e);
    }
  }

  const gap = calculateDocumentGap(result.receivedDocs, text);
  result.gapAnalysis = gap;
  result.missingDocs = gap.missingDocs;
  result.hasLostShares = gap.hasLostShares;

  return result;
}
