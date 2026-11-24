import { NextRequest, NextResponse } from 'next/server';
import { parseLetterText } from '@/lib/letterParser';
import { analyzeDocumentWithGemini, DEFAULT_GEMINI_KEY } from '@/lib/geminiVision';
import Tesseract from 'tesseract.js';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';

// Configure Next.js Route Segment Options for maximum allowable serverless duration
export const maxDuration = 60; // Max allowed execution seconds
export const dynamic = 'force-dynamic';

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
function extractTextFromBuffer(buffer: Buffer, filename: string = ""): string {
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

  // 3. DOC (OLE2 binary) or binary fallback with dual-encoding support
  try {
    const u16 = buffer.toString('utf16le');
    const u16Matches = u16.match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/():#@\n\r]{6,}/g) || [];
    const u8 = buffer.toString('latin1');
    const u8Matches = u8.match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/():#@\n\r]{6,}/g) || [];

    const u16Len = u16Matches.join(' ').length;
    const u8Len = u8Matches.join(' ').length;

    const docText = u16Len > u8Len ? u16Matches.join('\n') : u8Matches.join('\n');
    if (docText && docText.length > 20) {
      return docText.replace(/ {2,}/g, ' ').trim();
    }
  } catch (oleErr) {
    console.warn("OLE2 extraction fallback:", oleErr);
  }

  const str = buffer.toString('binary');
  const cleanRuns = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  const matches = cleanRuns.match(/[A-Za-z0-9][A-Za-z0-9 ,.\-\/()#:&@\n\r]{6,}/g);
  if (matches && matches.length > 0) {
    return matches.join('\n').replace(/ {2,}/g, ' ').trim();
  }

  return buffer.toString('utf8');
}

import { formatCompanyWithSymbol, lookupSymbol } from '@/lib/companySymbols';

let cachedShareholders: any[] | null = null;
let cachedMisRecords: any[] | null = null;

function getShareholdersData(): any[] {
  if (cachedShareholders) return cachedShareholders;
  try {
    const sPath = path.join(process.cwd(), 'src', 'data', 'shareholdersSample.json');
    if (fs.existsSync(sPath)) {
      cachedShareholders = JSON.parse(fs.readFileSync(sPath, 'utf8'));
      return cachedShareholders || [];
    }
  } catch (e) {
    console.warn("Failed to load shareholdersSample.json:", e);
  }
  return [];
}

function getMisRecordsData(): any[] {
  if (cachedMisRecords) return cachedMisRecords;
  try {
    const rPath = path.join(process.cwd(), 'src', 'data', 'misRecords.json');
    if (fs.existsSync(rPath)) {
      cachedMisRecords = JSON.parse(fs.readFileSync(rPath, 'utf8'));
      return cachedMisRecords || [];
    }
  } catch (e) {
    console.warn("Failed to load misRecords.json:", e);
  }
  return [];
}

/**
 * Automatically cross-reference MIS database & shareholders register to enrich parsed fields
 */
function enrichWithMISDatabase(parsed: any) {
  if (!parsed) return parsed;
  try {
    const shareholders = getShareholdersData();
    const misRecords = getMisRecordsData();

    // 1. Single folio enrichment
    if (parsed.folio) {
      const cleanFolio = String(parsed.folio).toLowerCase().trim();
      const shMatch = shareholders.find(s => String(s.folio).toLowerCase().trim() === cleanFolio);
      const misMatch = misRecords.find(r => String(r.folio).toLowerCase().trim() === cleanFolio);

      if (shMatch) {
        if (!parsed.company && shMatch.company) {
          parsed.company = shMatch.company;
        }
        if (!parsed.deceased && shMatch.name) {
          parsed.deceased = shMatch.name;
        }
        if (shMatch.shares && (!parsed.shares || parsed.shares === '0' || parsed.shares === '—')) {
          parsed.shares = `=${Number(shMatch.shares).toLocaleString()}=`;
          if (!parsed.certificates || parsed.certificates === '0' || parsed.certificates === '—') {
            parsed.certificates = '=01=';
          }
        }
        parsed.matchSource = "shareholders_enriched";
      } else if (misMatch) {
        if (!parsed.company && misMatch.company) {
          parsed.company = misMatch.company;
        }
        if (!parsed.deceased && misMatch.deceased) {
          parsed.deceased = misMatch.deceased;
        }
        if (!parsed.legalHeir && misMatch.legalHeir) {
          parsed.legalHeir = misMatch.legalHeir;
        }
        parsed.matchSource = "mis_enriched";
      }

      if (!parsed.shares || parsed.shares === '0') {
        parsed.shares = '—';
        parsed.certificates = '—';
      }
    }

    // 2. Multi folios enrichment
    if (Array.isArray(parsed.multiFolios)) {
      parsed.multiFolios = parsed.multiFolios.map((item: any) => {
        const row = { ...item };
        const cleanF = String(row.folio || '').toLowerCase().trim();
        const isValidFolio = cleanF && !cleanF.includes('not provided') && cleanF !== 'unknown' && cleanF !== '—';

        if (isValidFolio) {
          const shMatch = shareholders.find(s => String(s.folio).toLowerCase().trim() === cleanF);
          if (shMatch && shMatch.shares) {
            if (!row.shares || row.shares === '0' || row.shares === '—') {
              row.shares = `=${Number(shMatch.shares).toLocaleString()}=`;
            }
            if (!row.certificates || row.certificates === '0' || row.certificates === '—') {
              row.certificates = '=01=';
            }
            if (!row.company && shMatch.company) {
              row.company = shMatch.company;
            }
          } else {
            if (!row.shares || row.shares === '0') row.shares = '—';
            if (!row.certificates || row.certificates === '0') row.certificates = '—';
          }
        } else {
          if (!row.shares || row.shares === '0') row.shares = '—';
          if (!row.certificates || row.certificates === '0') row.certificates = '—';
        }

        // Format company with symbol
        if (row.company) {
          const formatted = formatCompanyWithSymbol(row.company);
          if (formatted.isFound) {
            row.company = formatted.displayName;
          }
        }

        if (!row.stampDuty) {
          row.stampDuty = '–';
        }

        return row;
      });
    }
  } catch (err) {
    console.warn("MIS auto-enrichment warning:", err);
  }
  return parsed;
}

async function performHighAccuracyOCR(buffer: Buffer): Promise<string> {
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      console.warn("OCR timeout reached (8s limit), returning fallback");
      resolve("");
    }, 8000);
  });

  const ocrPromise = (async () => {
    try {
      const worker = await Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      const res = await worker.recognize(buffer);
      const text = res?.data?.text || "";
      await worker.terminate();
      return text;
    } catch (err) {
      console.warn("OCR execution error:", err);
      return "";
    }
  })();

  return Promise.race([ocrPromise, timeoutPromise]);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const geminiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;

    // A. Handle multipart/form-data file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileNameLower = file.name.toLowerCase();
      const isImage = !!(fileNameLower.match(/\.(jpg|jpeg|png|webp|bmp|tif|tiff)$/) || file.type?.startsWith('image/'));
      const isPdf = fileNameLower.endsWith('.pdf') || file.type === 'application/pdf';

      // Priority 1: If Gemini API key is configured and file is an image or PDF, run AI Vision!
      if (geminiKey && (isImage || isPdf)) {
        try {
          let mimeType = 'image/jpeg';
          if (isPdf) {
            mimeType = 'application/pdf';
          } else if (fileNameLower.endsWith('.png') || file.type === 'image/png') {
            mimeType = 'image/png';
          } else if (fileNameLower.endsWith('.webp') || file.type === 'image/webp') {
            mimeType = 'image/webp';
          }
          const aiRes = await analyzeDocumentWithGemini(buffer, mimeType, geminiKey);
          if (aiRes.success && aiRes.parsed) {
            let parsed = aiRes.parsed;
            parsed = enrichWithMISDatabase(parsed);
            return NextResponse.json({
              success: true,
              filename: file.name,
              parsed,
              data: parsed,
              source: 'gemini_vision',
              textPreview: parsed.rawTextPreview || ''
            });
          }
        } catch (aiErr) {
          console.warn("Gemini vision fallback to local OCR:", aiErr);
        }
      }

      let extractedText = "";

      // 1. Direct OCR for Image uploads (JPG, PNG, WEBP, JPEG, etc.)
      if (isImage) {
        extractedText = await performHighAccuracyOCR(buffer);
      }

      // 2. Buffer extraction for PDF, DOCX, DOC, TXT (or fallback if OCR produced minimal text)
      if (!extractedText || extractedText.trim().length < 15) {
        const bufferText = extractTextFromBuffer(buffer, file.name);
        if (bufferText && bufferText.trim().length > extractedText.trim().length) {
          extractedText = bufferText;
        }
      }

      let parsed = parseLetterText(extractedText);
      parsed = enrichWithMISDatabase(parsed);

      return NextResponse.json({
        success: true,
        filename: file.name,
        parsed,
        data: parsed,
        source: 'ocr_heuristic',
        textPreview: extractedText.slice(0, 600)
      });
    }

    // B. Handle JSON body with raw text or base64 file
    const body = await req.json();
    let text = body.text || '';
    if (body.base64) {
      const buffer = Buffer.from(body.base64, 'base64');
      const filename = body.filename || 'letter.docx';
      const isImg = filename.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
      if (geminiKey && isImg) {
        try {
          const aiRes = await analyzeDocumentWithGemini(buffer, 'image/jpeg', geminiKey);
          if (aiRes.success && aiRes.parsed) {
            let parsed = aiRes.parsed;
            parsed = enrichWithMISDatabase(parsed);
            return NextResponse.json({
              success: true,
              filename,
              parsed,
              data: parsed,
              source: 'gemini_vision',
              textPreview: parsed.rawTextPreview || ''
            });
          }
        } catch (e) {
          console.warn("Base64 Gemini vision fallback:", e);
        }
      }
      if (isImg) {
        text = await performHighAccuracyOCR(buffer);
      }
      if (!text || text.trim().length < 15) {
        text = extractTextFromBuffer(buffer, filename);
      }
    }

    if (!text || text.trim().length === 0) {
      const fallbackParsed = parseLetterText("");
      return NextResponse.json({
        success: true,
        parsed: fallbackParsed,
        data: fallbackParsed,
        textPreview: ""
      });
    }

    let parsed = parseLetterText(text);
    parsed = enrichWithMISDatabase(parsed);

    return NextResponse.json({
      success: true,
      parsed,
      data: parsed,
      textPreview: text.slice(0, 600)
    });

  } catch (err: any) {
    console.error('Error in letter parse API:', err);
    return NextResponse.json({ 
      error: 'Failed to parse incoming letter', 
      details: err?.message || String(err) 
    }, { status: 500 });
  }
}
