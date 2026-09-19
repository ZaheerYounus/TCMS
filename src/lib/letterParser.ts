import zlib from 'zlib';
import path from 'path';
import fs from 'fs';

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
  refNo?: string;
  rawTextPreview: string;
  matchSource: "document_parsed" | "mis_enriched" | "manual";
}

/**
 * Extract raw text from docx, doc, or plain buffer
 */
export function extractTextFromBuffer(buffer: Buffer, filename: string = ""): string {
  const lowerName = filename.toLowerCase();

  // 1. DOCX format (Zip containing word/document.xml)
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

  // 2. DOC (OLE2 binary) or binary fallback: extract printable character runs
  const str = buffer.toString('binary');
  const cleanRuns = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  const matches = cleanRuns.match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/()#:&@\n\r]{10,}/g);
  if (matches && matches.length > 0) {
    return matches.join('\n').replace(/ {2,}/g, ' ').trim();
  }

  return buffer.toString('utf8');
}

/**
 * Known Karachi / PSX listed client companies handled by CDCSR
 */
const KNOWN_COMPANIES = [
  { name: "Oil & Gas Development Company Limited", symbol: "OGDC", aliases: ["oil & gas", "ogdc", "ogdcl"] },
  { name: "Habib Bank Limited", symbol: "HBL", aliases: ["habib bank", "hbl"] },
  { name: "MCB Bank Limited", symbol: "MCB", aliases: ["mcb", "mcb bank"] },
  { name: "Pakistan State Oil Company Limited", symbol: "PSO", aliases: ["pakistan state oil", "pso"] },
  { name: "United Bank Limited", symbol: "UBL", aliases: ["united bank", "ubl"] },
  { name: "Engro Corporation Limited", symbol: "ENGRO", aliases: ["engro", "engro corp"] },
  { name: "Fauji Fertilizer Company Limited", symbol: "FFC", aliases: ["fauji fertilizer", "ffc"] },
  { name: "Lucky Cement Limited", symbol: "LUCK", aliases: ["lucky cement", "luck"] },
  { name: "The Hub Power Company Limited", symbol: "HUBCO", aliases: ["hub power", "hubco"] },
  { name: "National Bank of Pakistan", symbol: "NBP", aliases: ["national bank", "nbp"] },
  { name: "Pakistan Petroleum Limited", symbol: "PPL", aliases: ["pakistan petroleum", "ppl"] },
  { name: "Mari Energies Limited", symbol: "MARI", aliases: ["mari", "mari energies", "mari petroleum"] },
  { name: "Meezan Bank Limited", symbol: "MEBL", aliases: ["meezan bank", "mebl"] },
  { name: "Bank AL Habib Limited", symbol: "BAHL", aliases: ["bank al habib", "bahl"] },
  { name: "Attock Petroleum Limited", symbol: "APL", aliases: ["attock petroleum", "apl"] },
  { name: "Kot Addu Power Company Limited", symbol: "KAPCO", aliases: ["kot addu", "kapco"] },
  { name: "K-Electric Limited", symbol: "KEL", aliases: ["k-electric", "kel", "kelectric"] },
  { name: "Khyber Tobacco Company Limited", symbol: "KHTC", aliases: ["khyber tobacco", "khtc"] },
  { name: "PAK Suzuki Motor Company Limited", symbol: "PSMC", aliases: ["pak suzuki", "psmc"] },
  { name: "Pakistan International Airlines Corporation Limited", symbol: "PIAC", aliases: ["pakistan international airlines", "piac", "pia"] }
];

/**
 * Smart heuristic letter text parser
 */
export function parseLetterText(text: string): ParsedLetterResult {
  const result: ParsedLetterResult = {
    receivedDocs: [],
    rawTextPreview: text.slice(0, 1000),
    matchSource: "document_parsed"
  };

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lower = normalized.toLowerCase();
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Folio Number Detection
  const folioMatch = text.match(/(?:folio(?:\s*(?:#|no|number|num))?[:\s]*)([A-Za-z0-9\/-]{3,12})/i) ||
                     text.match(/CDCSR\/LTC\/[A-Z0-9]+\/([0-9A-Za-z]+)\//i) ||
                     text.match(/\bFolio\s+([0-9]{3,8})\b/i);
  if (folioMatch && folioMatch[1]) {
    const rawF = folioMatch[1].trim();
    if (!['number', 'details', 'particulars'].includes(rawF.toLowerCase())) {
      result.folio = rawF;
    }
  }

  // 2. Company Detection
  for (const comp of KNOWN_COMPANIES) {
    if (comp.aliases.some(alias => lower.includes(alias))) {
      result.company = comp.name;
      result.compSymbol = comp.symbol;
      break;
    }
  }

  if (!result.company) {
    const compLineMatch = text.match(/([A-Z][A-Za-z0-9\s&]+(?:Company|Corporation|Bank|Cement|Fertilizer|Textile|Sugar|Power|Oil)\s+(?:Limited|Ltd\.?))/);
    if (compLineMatch) {
      result.company = compLineMatch[1].trim();
      result.compSymbol = result.company.split(' ')[0].toUpperCase();
    }
  }

  // 3. Header Block Parsing (Legal Heir, Deceased, Address & Contact)
  let inAddress = false;
  let addressParts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('Dear Concern') || line.includes('Transmission of Shares')) {
      break;
    }

    // Match F/H line
    if (line.match(/(?:F\/H|Father name|Husband name)[:\s]/i)) {
      inAddress = true;
      const decMatch = line.match(/(?:F\/H(?:\s*Name)?|Father name|Husband name)[:\s]+([A-Za-z\s.]+?)(?=\s*\(Late\)|$)/i);
      if (decMatch) {
        result.deceased = decMatch[1].trim().replace(/\s*\(Late\)/i, '');
      }
      // Previous line is typically Legal Heir name
      if (i > 0 && !lines[i-1].match(/(?:CDCSR|CDC|\d{4}|August|September|October|November|December|January|February|March|April|May|June|July)/i)) {
        const potentialHeir = lines[i-1].replace(/^To:\s*/i, '').trim();
        if (potentialHeir.length > 2 && potentialHeir.length < 55) {
          result.legalHeir = potentialHeir;
        }
      }
      continue;
    }

    if (inAddress) {
      const phoneMatch = line.match(/(?:Contact\s*(?:#|No|Number)?[:\s]*)?(\+?92[-\s]?3\d{2}[-\s]?\d{7}|03\d{2}[-\s]?\d{7}|021[-\s]?\d{7,8})/i);
      if (phoneMatch) {
        result.contactNo = phoneMatch[0].trim();
        const rem = line.replace(phoneMatch[0], '').trim();
        if (rem.length > 5 && !rem.match(/^(?:Contact|Cell|Phone|Mob)/i)) {
          addressParts.push(rem);
        }
      } else if (!line.toLowerCase().includes('dear concern')) {
        addressParts.push(line);
      }
    }
  }

  if (addressParts.length > 0) {
    result.address = addressParts
      .join(', ')
      .replace(/,\s*,+/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/,\s*$/, '');
  }

  // Fallback for Deceased name if not caught in F/H
  if (!result.deceased) {
    const lateMatch = text.match(/(?:Late\s+)([A-Z][a-zA-Z\s.]{2,35})(?=\s*\(Late\)|[\r\n,]|Folio|F\/H|\bDear\b|\bTransmission\b)/i) ||
                      text.match(/deceased(?:\s+shareholder)?[:\s]+([A-Za-z\s.]+?)(?=[\r\n,]|registered)/i);
    if (lateMatch && lateMatch[1]) {
      result.deceased = lateMatch[1].trim().replace(/\s*\(Late\)/i, '').replace(/Late\s+/i, '');
    }
  }

  // Fallback for Legal Heir name
  if (!result.legalHeir) {
    const toMatch = text.match(/To:\s*[\r\n]+\s*([A-Za-z\s.()\/]+?)(?=[\r\n]+F\/H|[\r\n]+Address|[\r\n]+House)/i) ||
                    text.match(/(?:legal heir|applicant|addressee)[:\s]*([A-Za-z\s.]+?)(?=[\r\n,(])/i) ||
                    text.match(/\b((?:Mr\.|Mrs\.|Ms\.|Mst\.|Dr\.|Syed)\s+[A-Z][a-zA-Z\s.]{3,35})\b/);
    if (toMatch && toMatch[1]) {
      const rawHeir = toMatch[1].trim();
      if (!rawHeir.toLowerCase().includes("concern") && rawHeir.length > 2 && rawHeir.length < 55) {
        result.legalHeir = rawHeir;
      }
    }
  }

  // Fallback for address
  if (!result.address) {
    const addrMatch = text.match(/((?:House|Flat|Plot|Bungalow|Apartment|D-|\d+[A-Z]?)[#\s\w\-,]+(?:Street|Block|Sector|Scheme|Road|Phase|Colony|Town)[\w\s\-,]+(?:Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Peshawar|Quetta|Multan|Hyderabad))/i) ||
                      text.match(/Address[:\s]*([\w\s\-,.#]{15,100})/i);
    if (addrMatch && addrMatch[1]) {
      result.address = addrMatch[1].trim().replace(/\s+/g, ' ');
    }
  }

  // Fallback for contact
  if (!result.contactNo) {
    const contactMatch = text.match(/(?:03\d{2}[-\s]?\d{7}|021[-\s]?\d{7,8}|\+92[-\s]?3\d{2}[-\s]?\d{7})/);
    if (contactMatch) {
      result.contactNo = contactMatch[0].trim();
    }
  }

  // Relation
  const relationMatch = text.match(/\((Legal Heir|Son|Daughter|Widow|Wife|Husband|Brother|Sister|Applicant)\)/i) ||
                        text.match(/(?:relation|capacity)[:\s]*([A-Za-z\s\/]+?)(?=[\r\n,])/i);
  if (relationMatch && relationMatch[1]) {
    result.relation = relationMatch[1].trim();
  } else {
    result.relation = "Legal Heir / Son";
  }

  // Shares and Certificates
  const certMatch = text.match(/=?(\d+)=?\s*share\s*certificates?/i);
  if (certMatch) {
    result.certificates = `=${certMatch[1].padStart(2, '0')}=`;
  }
  const sharesMatch = text.match(/=?([0-9,]+)=?\s*shares/i);
  if (sharesMatch) {
    result.shares = `=${sharesMatch[1]}=`;
  }

  // Distinctive numbers or scripts
  const scriptsMatch = text.match(/(Cert(?:ificate)?\s*(?:#|no)?\s*[\d\w\s\-]+(?:\(Distinctive:?\s*[\d\w\s\-]+\))?)/i);
  if (scriptsMatch) {
    result.scripts = scriptsMatch[1].trim();
  }

  // Auto-Identify Documents Received
  const foundDocs: string[] = [];
  if (lower.includes("written") || lower.includes("request application") || lower.includes("transmission request") || lower.includes("application")) {
    foundDocs.push("Written transmission request application");
  }
  if (lower.includes("death certificate") || lower.includes("death cert")) {
    foundDocs.push("Certified copy of computerized Death Certificate");
  }
  if (lower.includes("cnic of deceased") || (lower.includes("cnic") && lower.includes("deceased"))) {
    foundDocs.push("Attested copy of CNIC of deceased shareholder");
  }
  if (lower.includes("cnic") && (lower.includes("applicant") || lower.includes("legal heir") || lower.includes("yourself"))) {
    foundDocs.push("Attested copy of CNIC of legal heir / applicant");
  }
  if (lower.includes("original physical") || lower.includes("original share certificate") || lower.includes("physical share")) {
    foundDocs.push("Original physical share certificate(s)");
  }
  if (lower.includes("family registration") || lower.includes("frc")) {
    foundDocs.push("Family Registration Certificate (FRC) issued by NADRA");
  }
  if (lower.includes("succession certificate") || lower.includes("court order") || lower.includes("letter of administration")) {
    foundDocs.push("Succession Certificate / Letter of Administration");
  }
  if (lower.includes("indemnity") || lower.includes("affidavit") || lower.includes("stamp paper")) {
    foundDocs.push("Attested Affidavit / Indemnity Bond");
  }

  if (foundDocs.length === 0) {
    foundDocs.push("Written transmission request application");
    foundDocs.push("Attested copy of CNIC of deceased shareholder");
    foundDocs.push("Attested copy of CNIC of legal heir / applicant");
  }

  result.receivedDocs = foundDocs;

  // Ref No Generation
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

  return result;
}
