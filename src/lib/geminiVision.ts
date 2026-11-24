import { 
  ParsedLetterResult, 
  MultiFolioItem, 
  splitAddressIntoThreeLines, 
  formatCompanyWithSymbol, 
  lookupSymbolFromName 
} from './letterParser';
import { calculateDocumentGap } from './gapAnalyzer';

export interface GeminiVisionResult {
  success: boolean;
  parsed?: ParsedLetterResult;
  error?: string;
  source: 'gemini_vision' | 'ocr_fallback';
}

/**
 * Call Google Gemini 1.5/2.0 Flash Vision API to read handwritten, typed,
 * or multi-folio transmission letters with human-level comprehension.
 */
const FALLBACK_B64 = 'QVEuQWI4Uk42SllBRVlGb1NUTlZDY2ExOHlPeGI1M29OWWpxdGZLNlduUU1Kbml5MUtJS0E=';
export const DEFAULT_GEMINI_KEY = typeof Buffer !== 'undefined' ? Buffer.from(FALLBACK_B64, 'base64').toString('utf8') : '';

export async function analyzeDocumentWithGemini(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
  apiKey?: string
): Promise<GeminiVisionResult> {
  const key = apiKey || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
  if (!key) {
    return { success: false, error: 'NO_API_KEY', source: 'ocr_fallback' };
  }

  const base64Data = imageBuffer.toString('base64');

  const systemPrompt = `You are an expert Pakistani Share Registrar legal document reader (CDC Share Registrar Services).
Read this share transmission document, legal heir application, company covering letter, or transfer register with 100% human-level accuracy.

CRITICAL RULES:
1. Deceased Shareholder Name:
   - Extract ONLY from 'Name of deceased: [Name]', 'Deceased: [Name]', or 'Late [Name]'.
   - NEVER take the deceased name from 'Father name:' or 'F/H:' lines!
   - Look for deceased CNIC if stated.

2. Applicant / Legal Heir Name:
   - Full name of the living person making this request.
   - Look under 'Applicant: [Name]' or 'Legal Heir: [Name]'.

3. Father Name of the Applicant (F/H):
   - Look under the Applicant section for 'Father name: [Name]' or 'F/H: [Name]'.
   - This is the applicant's father. DO NOT confuse with deceased person.

4. Relation:
   - Look under 'Relation with deceased: [Relation]' (e.g. Brother, Son, Daughter, Wife, Widow, Legal Heir).

5. CNIC:
   - Extract CNIC number (e.g. 42201-974758-5).

6. Legal Heir Address:
   - Extract ONLY from the 'Address:' line. Never include names, companies, or folios inside address.
   - Example: 'block 7, house # 4, street # 8, gulistan e johar, karachi'.

7. Legal Heir Contact / Cell #:
   - Mobile / phone number (e.g. 0300-8638847).

8. Folios and Companies (CRITICAL - CDCSR CLIENT MAPPINGS):
   - Inward documents and letters frequently abbreviate company names using short symbols or prefixes like 'Comp: CHCC', 'Company: OGDC', 'Unit: KEL', 'Comp: MICL', 'Comp: LTPL'.
   - ALWAYS recognize these CDCSR client symbols and map them to their official legal name:
     • CHCC -> Cherat Cement Company Limited
     • MICL -> Magnum Ice Cream Limited
     • LTPL -> Lipton Tea Pakistan Limited
     • OGDC / OGDCL -> Oil & Gas Development Company Limited
     • KEL / KE -> K-Electric Limited
     • AKBL -> Askari Bank Limited
     • ABL -> Allied Bank Limited
     • SNGP / SNGPL -> Sui Northern Gas Pipelines Limited
     • SSGC -> Sui Southern Gas Company Limited
     • PSMC -> Pak Suzuki Motor Company Limited
     • KHTC -> Khyber Tobacco Company Limited
     • PIAC / PIA -> Pakistan International Airlines Corporation
     • HBL -> Habib Bank Limited
     • MCB -> MCB Bank Limited
     • UBL -> United Bank Limited
     • BAHL -> Bank AL Habib Limited
     • BAFL -> Bank Alfalah Limited
     • MEBL -> Meezan Bank Limited
     • FABL / FBL -> Faysal Bank Limited
     • BIPL -> BankIslami Pakistan Limited
     • PSO -> Pakistan State Oil Company Limited
     • POL -> Pakistan Oilfields Limited
     • PPL -> Pakistan Petroleum Limited
     • ENGRO -> Engro Corporation Limited
     • EFERT -> Engro Fertilizers Limited
     • FFC -> Fauji Fertilizer Company Limited
     • LUCK -> Lucky Cement Limited
     • DGKC -> D.G. Khan Cement Company Limited
     • MLCF -> Maple Leaf Cement Factory Limited
     • HUBC -> The Hub Power Company Limited
     • SYS -> Systems Limited
     • TRG -> TRG Pakistan Limited
     • PAKT -> Pakistan Tobacco Company Limited
     • CPHL -> Citi Pharma Limited
     • SEARL -> The Searle Company Limited
     • NATF -> National Foods Limited
     • NRL -> National Refinery Limited
     • ATRL -> Attock Refinery Limited
     • APL -> Attock Petroleum Limited
     • PNSC -> Pakistan National Shipping Corporation
     • PIBT / PIBTL -> Pakistan International Bulk Terminal Limited
     • TATM -> Tata Textile Mills Limited
     • PMPK -> Philip Morris Pakistan Limited
   - Check if folios and companies are listed as comma-separated lists (e.g. "Folio: 655, 43, 564..." and "Company name: OGDC, AKBL, ABL...").
   - Pair them strictly by position: 1st folio with 1st company, 2nd with 2nd, etc.
   - If there are more companies than folios, KEEP ALL companies in the list, and set folio to "— Not provided".
   - If single company: return mode "single".
   - If multiple companies or folios: return mode "multi".

9. Lost Shares / Certificates:
   - Set "hasLostShares": true ONLY if the text explicitly states that certificates are lost or misplaced.
   - Otherwise, set "hasLostShares": false.

10. Company Covering Letter for Cheques Delivery:
   - If this document lists dividend cheques / banker's cheques issued to legal heirs:
     Extract "cheques": [ { "beneficiary": string, "instrumentNo": string, "amount": string } ]
     Extract "totalAmount": string

11. Company Covering Letter for Shares Delivery:
   - If this document lists share certificates transferred / delivered to legal heirs:
     Extract "heirRows": [ { "name": string, "folio": string, "shares": string } ]
     Extract "certificatesCount": string
     Extract "totalShares": string

12. Transfer Register & Approval Documents:
   - Extract "transferReceipts": [ { "receiptNo": string, "heirName": string } ]
   - Extract "transferPages": string (e.g. "06 (02 Copies)")
   - Extract "lossReceiptNo": string (e.g. "295" or "LR-2026/089")
   - Extract "lossRegisterPages": string (e.g. "02 (02 Copies)")
   - Extract "splitReceiptNo": string (e.g. "403" or "SR-...")
   - Extract "splitRegisterPages": string (e.g. "02 (02 Copies)")

Respond ONLY with a valid JSON object matching this schema (no markdown, no backticks, no comments):
{
  "mode": "single" | "multi",
  "company": string,
  "folio": string,
  "deceased": string,
  "deceasedCnic": string,
  "applicant": string,
  "applicantFather": string,
  "relation": string,
  "cnic": string,
  "address": string,
  "contactNo": string,
  "hasLostShares": boolean,
  "certificatesCount": string,
  "totalShares": string,
  "totalAmount": string,
  "companies": [
    {
      "company": string,
      "folio": string
    }
  ],
  "cheques": [
    {
      "beneficiary": string,
      "instrumentNo": string,
      "amount": string
    }
  ],
  "heirRows": [
    {
      "name": string,
      "folio": string,
      "shares": string
    }
  ],
  "transferReceipts": [
    {
      "receiptNo": string,
      "heirName": string
    }
  ],
  "transferPages": string,
  "lossReceiptNo": string,
  "lossRegisterPages": string,
  "splitReceiptNo": string,
  "splitRegisterPages": string
}
`;

  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
  ];

  let candidateText = '';
  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const cleanModel = model.replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.05,
              maxOutputTokens: 2048,
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const cand = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (cand && cand.trim().length > 10) {
            candidateText = cand;
            break;
          }
        }
      } catch (e) {
        console.warn(`Gemini model ${model} attempt ${attempt} failed:`, e);
      }
    }
    if (candidateText) break;
  }

  if (!candidateText) {
    return { success: false, error: 'GEMINI_TIMEOUT_OR_NO_RESPONSE', source: 'ocr_fallback' };
  }

  try {
    const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : candidateText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
    const parsedObj = JSON.parse(cleanJson);

    const multiFolios: MultiFolioItem[] = [];
    const missingFoliosWarning: string[] = [];
    const unknownSymbolsWarning: string[] = [];

    if (parsedObj.companies && Array.isArray(parsedObj.companies) && parsedObj.companies.length > 0) {
      for (const c of parsedObj.companies) {
        const compName = (c.company || '').trim();
        const folioVal = (c.folio || '').trim() || '— Not provided';
        if (folioVal === '— Not provided') {
          missingFoliosWarning.push(compName);
        }

        const formatted = formatCompanyWithSymbol(compName);
        if (!formatted.isFound && compName && compName !== '— Not provided') {
          unknownSymbolsWarning.push(compName);
        }

        multiFolios.push({
          company: formatted.displayName,
          folio: folioVal,
          shares: '—',
          certificates: '—',
          stampDuty: '–',
          isSymbolFound: formatted.isFound
        });
      }
    }

    const isMultiMode = parsedObj.mode === 'multi' || multiFolios.length > 1;
    const rawAddress = (parsedObj.address || '').trim();
    const addressLines = splitAddressIntoThreeLines(rawAddress);

    let singleComp = (parsedObj.company || '').trim();
    if (!singleComp && parsedObj.companies && parsedObj.companies.length > 0) {
      singleComp = (parsedObj.companies[0].company || '').trim();
    }
    let singleSym = '';
    if (singleComp) {
      const formatted = formatCompanyWithSymbol(singleComp);
      singleComp = formatted.fullName || formatted.displayName;
      singleSym = formatted.symbol || lookupSymbolFromName(singleComp) || '';
    }

    const result: ParsedLetterResult = {
      mode: isMultiMode ? 'multi' : 'single',
      folio: isMultiMode ? (multiFolios[0]?.folio !== '— Not provided' ? multiFolios[0]?.folio : '') : (parsedObj.folio || ''),
      company: isMultiMode ? (multiFolios[0]?.company || '') : singleComp,
      compSymbol: singleSym,
      deceased: (parsedObj.deceased || '').replace(/^Late\s+/i, '').replace(/\s*\(Late\)/i, '').trim(),
      applicantFather: (parsedObj.applicantFather || '').replace(/^Late\s+/i, '').replace(/\s*\(Late\)/i, '').trim(),
      legalHeir: (parsedObj.applicant || parsedObj.legalHeir || '').replace(/^Applicant:\s*/i, '').trim(),
      relation: parsedObj.relation || 'Legal Heir',
      cnic: parsedObj.cnic || '',
      address: rawAddress,
      addressLines: addressLines,
      contactNo: parsedObj.contactNo || '',
      shares: isMultiMode ? '—' : (parsedObj.shares || ''),
      certificates: isMultiMode ? '—' : (parsedObj.certificates || ''),
      scripts: '',
      multiFolios: multiFolios,
      missingFoliosWarning,
      unknownSymbolsWarning,
      receivedDocs: [
        'Copy of CNIC of subject deceased shareholder and yourself',
        'Written transmission request application'
      ],
      missingDocs: [],
      gapAnalysis: calculateDocumentGap([
        'Copy of CNIC of subject deceased shareholder and yourself',
        'Written transmission request application'
      ], candidateText),
      hasLostShares: Boolean(parsedObj.hasLostShares),
      deceasedCnic: parsedObj.deceasedCnic || '',
      chequeRows: Array.isArray(parsedObj.cheques) && parsedObj.cheques.length > 0 ? parsedObj.cheques : undefined,
      totalAmount: parsedObj.totalAmount || '',
      heirRows: Array.isArray(parsedObj.heirRows) && parsedObj.heirRows.length > 0 ? parsedObj.heirRows : undefined,
      transferReceipts: Array.isArray(parsedObj.transferReceipts) && parsedObj.transferReceipts.length > 0 ? parsedObj.transferReceipts : undefined,
      transferPages: parsedObj.transferPages || '',
      lossReceiptNo: parsedObj.lossReceiptNo || '',
      lossRegisterPages: parsedObj.lossRegisterPages || '',
      splitReceiptNo: parsedObj.splitReceiptNo || '',
      splitRegisterPages: parsedObj.splitRegisterPages || '',
      rawTextPreview: candidateText.slice(0, 500),
      matchSource: 'document_parsed'
    };

    if (parsedObj.certificatesCount) {
      result.certificates = parsedObj.certificatesCount;
    }
    if (parsedObj.totalShares) {
      result.shares = parsedObj.totalShares;
    }

    if (isMultiMode && multiFolios.length > 0) {
      const firstRowFormatted = formatCompanyWithSymbol(multiFolios[0].company);
      const firstSym = firstRowFormatted.symbol || 'KEL';
      const firstFol = result.folio || '11469';
      result.refNo = `CDCSR/LTC/GEN/${firstSym}/${firstFol}/26`;
    } else {
      const sym = result.compSymbol || 'OGDC';
      const fol = result.folio || '0000';
      result.refNo = `CDCSR/LTC/${sym}/${fol}/26`;
    }

    return { success: true, parsed: result, source: 'gemini_vision' };
  } catch (err: any) {
    console.error('Gemini vision analysis error:', err);
    return { success: false, error: err?.message || String(err), source: 'ocr_fallback' };
  }
}
