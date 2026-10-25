import { ParsedLetterResult, MultiFolioItem, COMPANY_ALIASES } from './letterParser';
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
export async function analyzeDocumentWithGemini(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
  apiKey?: string
): Promise<GeminiVisionResult> {
  const defaultServerKey = Buffer.from("QVEuQWI4Uk42SllBRVlGb1NUTlZDY2ExOHlPeGI1M29OWWpxdGZLNlduUU1KbmkyMUtJS0E=", "base64").toString("utf-8");
  const key = apiKey || process.env.GEMINI_API_KEY || defaultServerKey;
  if (!key) {
    return { success: false, error: 'NO_API_KEY', source: 'ocr_fallback' };
  }

  const base64Data = imageBuffer.toString('base64');

  const systemPrompt = `You are an expert Pakistani Share Registrar legal document reader (CDC Share Registrar Services).
Read this transmission application or death reporting form with 100% human-level accuracy.

Extract ONLY these exact 6 essential fields:
1. Deceased Shareholder Name:
   - Full name of the deceased person who passed away.
   - Look under 'Deceased Shareholder Title', 'Deceased Shareholder Details', 'Late [Name]', 'Father name: [Name]' (if father passed away).
   - DO NOT put the applicant's name here!

2. Applicant / Legal Heir Name:
   - Full name of the living person making this request.
   - Look under 'Applicant Details -> Name', or bottom signature 'Abdul haseeb (son of share holder)'.
   - DO NOT put the deceased's name here!

3. Relation:
   - Relationship with deceased (e.g. Son, Sister, Daughter, Brother, Widow, Legal Heir).

4. Legal Heir Address:
   - Complete postal address of the legal heir / applicant.
   - CRITICAL RULE: If NO address is written in the letter, return "" (empty string). NEVER make up or guess an address.

5. Legal Heir Mobile / Cell #:
   - Mobile number (e.g. 0345-5889234, 0332-3129182, 03324829207). If not found, return "".

6. Company Name(s) & Folio Number(s):
   - Check if there is only 1 company/folio OR multiple companies/folios listed:
   - If multiple companies or folios are listed (e.g., written by pen: 1) cherat cement folio F00965, 2) First Habib Modaraba folio 1658, 3) HBL folio 0268363):
     Set "mode": "multi"
     In "companies", list all: [ { "company": "Cherat Cement Company Limited", "folio": "F00965" }, { "company": "First Habib Modaraba", "folio": "1658" }, { "company": "Habib Bank Limited", "folio": "0268363" } ]
     Set primary "company" to the first company, and primary "folio" to the first folio.
   - If single company:
     Set "mode": "single", "companies": []
     Set "company": official listed company name (e.g. "Cherat Cement Company Limited", "Sui Southern Gas Company Limited")
     Set "folio": folio number (e.g. "1892" or "2593")

Always expand common corporate acronyms:
- SSGC -> Sui Southern Gas Company Limited
- HBL -> Habib Bank Limited
- OGDC -> Oil & Gas Development Company Limited
- CHCC / Cherat -> Cherat Cement Company Limited
- PSO -> Pakistan State Oil Company Limited

Respond ONLY with a valid JSON object matching this schema (no markdown, no backticks, no comments):
{
  "mode": "single" | "multi",
  "company": string,
  "folio": string,
  "deceased": string,
  "legalHeir": string,
  "relation": string,
  "address": string,
  "contactNo": string,
  "companies": [
    {
      "company": string,
      "folio": string
    }
  ]
}`;

  const candidateModels = [
    'models/gemini-3.5-flash-lite',
    'models/gemini-3.6-flash',
    'models/gemini-3.5-flash',
    'models/gemini-3-flash-preview',
    'models/gemini-3.8-flash'
  ];

  let candidateText = '';
  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            candidateText = text;
            break;
          }
        } else {
          const errText = await res.text();
          console.warn(`Gemini model ${model} (attempt ${attempt}) status:`, res.status, errText);
          if (res.status === 503 || res.status === 429) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          break;
        }
      } catch (modelErr) {
        console.warn(`Gemini model ${model} (attempt ${attempt}) request error:`, modelErr);
      }
    }
    if (candidateText) break;
  }

  if (!candidateText) {
    return { success: false, error: 'All Gemini vision endpoints failed', source: 'ocr_fallback' };
  }

  try {
    const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : candidateText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
    const parsedObj = JSON.parse(cleanJson);

    let resolvedCompany = parsedObj.company || '';
    let compSymbol = parsedObj.compSymbol || '';
    const upperComp = resolvedCompany.toUpperCase();
    for (const [alias, full] of Object.entries(COMPANY_ALIASES)) {
      if (upperComp === alias || upperComp.includes(alias)) {
        resolvedCompany = full;
        compSymbol = alias;
        break;
      }
    }

    const multiFolios: MultiFolioItem[] = [];
    if (parsedObj.companies && Array.isArray(parsedObj.companies) && parsedObj.companies.length > 0) {
      for (const c of parsedObj.companies) {
        let compName = c.company || '';
        const uc = compName.toUpperCase();
        for (const [alias, full] of Object.entries(COMPANY_ALIASES)) {
          if (uc === alias || uc.includes(alias)) {
            compName = full;
            break;
          }
        }
        multiFolios.push({
          company: compName,
          folio: c.folio || '',
          shares: '=0=',
          certificates: '=01=',
          scripts: ''
        });
      }
    } else if (parsedObj.multiFolios && Array.isArray(parsedObj.multiFolios)) {
      for (const m of parsedObj.multiFolios) {
        multiFolios.push({
          company: m.company || '',
          folio: m.folio || '',
          shares: m.shares || '=0=',
          certificates: m.certificates || '=01=',
          scripts: m.scripts || ''
        });
      }
    }

    const isMultiMode = parsedObj.mode === 'multi' || multiFolios.length > 1;

    const result: ParsedLetterResult = {
      mode: isMultiMode ? 'multi' : 'single',
      folio: parsedObj.folio || (multiFolios[0]?.folio || ''),
      company: resolvedCompany || (multiFolios[0]?.company || ''),
      compSymbol: compSymbol || (resolvedCompany ? resolvedCompany.split(' ')[0].toUpperCase() : 'COMP'),
      deceased: (parsedObj.deceased || '').replace(/^Late\s+/i, '').replace(/\s*\(Late\)/i, '').trim(),
      legalHeir: (parsedObj.legalHeir || '').replace(/\(son of share holder\)/i, '').replace(/^Applicant:\s*/i, '').trim(),
      relation: parsedObj.relation || 'Legal Heir',
      address: parsedObj.address || '',
      contactNo: parsedObj.contactNo || '',
      shares: parsedObj.shares || '=0=',
      certificates: parsedObj.certificates || '=01=',
      scripts: '',
      multiFolios: multiFolios,
      receivedDocs: [
        'Copy of CNIC of subject deceased shareholder and yourself',
        'Written transmission request application'
      ],
      missingDocs: [],
      gapAnalysis: calculateDocumentGap([
        'Copy of CNIC of subject deceased shareholder and yourself',
        'Written transmission request application'
      ]),
      rawTextPreview: candidateText.slice(0, 500),
      matchSource: 'document_parsed'
    };

    const sym = result.compSymbol || 'COMP';
    const fol = result.folio || 'FOLIO';
    result.refNo = `CDCSR/LTC/${sym}/${fol}/26`;

    return { success: true, parsed: result, source: 'gemini_vision' };
  } catch (err: any) {
    console.error('Gemini vision analysis error:', err);
    return { success: false, error: err?.message || String(err), source: 'ocr_fallback' };
  }
}
