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
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return { success: false, error: 'NO_API_KEY', source: 'ocr_fallback' };
  }

  const base64Data = imageBuffer.toString('base64');

  const systemPrompt = `You are an expert CDC Share Registrar legal document reader. 
Analyze this shareholder transmission letter, request form, or official application.
Think like an experienced human legal registrar:
1. Find Company Name (e.g. SSGC, OGDC, HBL, PSO, etc.). Match to its official listed corporate name if abbreviated.
2. Find Deceased Shareholder Details:
   - Deceased Name (look under 'Deceased Shareholder Details', 'Late [Name]', 'Father/Husband Name (Late)').
   - Folio # or CDS Account # (e.g. '2593' or '03277-6959').
3. Find Applicant / Legal Heir Details (the living person making the application):
   - Applicant/Legal Heir Name
   - Relationship with deceased (e.g. Son, Daughter, Sister, Brother, Widow)
   - Complete Postal Address
   - Mobile / Cell # (e.g. 03xx-xxxxxxx)
4. Check if this is a Single-Folio or Multi-Folio document:
   - If there are multiple folios or multiple companies mentioned in a list or table, set mode to 'multi' and populate the multiFolios array.
   - Otherwise set mode to 'single'.

Return ONLY valid JSON with this exact schema (no markdown, no backticks, just raw JSON):
{
  "mode": "single" | "multi",
  "folio": string,
  "company": string,
  "compSymbol": string,
  "deceased": string,
  "legalHeir": string,
  "relation": string,
  "address": string,
  "contactNo": string,
  "shares": string,
  "certificates": string,
  "multiFolios": [
    {
      "folio": string,
      "company": string,
      "shares": string,
      "certificates": string,
      "scripts": string
    }
  ],
  "receivedDocs": string[]
}`;

  const candidateModels = [
    'models/gemini-3-flash-preview',
    'models/gemini-3.8-flash',
    'models/gemini-flash-latest',
    'models/gemini-2.5-flash'
  ];

  let candidateText = '';
  for (const model of candidateModels) {
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
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json'
          }
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
        console.warn(`Gemini model ${model} failed:`, res.status, errText);
      }
    } catch (modelErr) {
      console.warn(`Gemini model ${model} request error:`, modelErr);
    }
  }

  if (!candidateText) {
    return { success: false, error: 'All Gemini vision endpoints failed', source: 'ocr_fallback' };
  }

  try {
    const cleanJson = candidateText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
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

    const result: ParsedLetterResult = {
      mode: parsedObj.mode === 'multi' ? 'multi' : 'single',
      folio: parsedObj.folio || '',
      company: resolvedCompany,
      compSymbol: compSymbol || (resolvedCompany ? resolvedCompany.split(' ')[0].toUpperCase() : 'COMP'),
      deceased: (parsedObj.deceased || '').replace(/^Late\s+/i, '').replace(/\s*\(Late\)/i, '').trim(),
      legalHeir: parsedObj.legalHeir || '',
      relation: parsedObj.relation || 'Legal Heir',
      address: parsedObj.address || '',
      contactNo: parsedObj.contactNo || '',
      shares: parsedObj.shares || '=0=',
      certificates: parsedObj.certificates || '=01=',
      scripts: '',
      multiFolios: parsedObj.multiFolios || [],
      receivedDocs: parsedObj.receivedDocs && parsedObj.receivedDocs.length > 0 ? parsedObj.receivedDocs : [
        'Copy of CNIC of subject deceased shareholder and yourself',
        'Written transmission request application'
      ],
      missingDocs: [],
      gapAnalysis: calculateDocumentGap(parsedObj.receivedDocs || []),
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
