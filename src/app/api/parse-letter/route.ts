import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, parseLetterText } from '@/lib/letterParser';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Configure Next.js Route Segment Options for maximum allowable serverless duration
export const maxDuration = 60; // Max allowed execution seconds
export const dynamic = 'force-dynamic';

async function performHighAccuracyOCR(buffer: Buffer): Promise<string> {
  // Guard with an 8-second timeout so Vercel free tier (10s max) never times out into a 504 gateway error!
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      console.warn("OCR timeout reached (8s limit for serverless), returning fallback");
      resolve("");
    }, 8000);
  });

  const ocrPromise = (async () => {
    try {
      // Fast pre-processing: resize to reasonable 1400px width (much faster to process in WebAssembly than 2200px)
      const preprocessed = await sharp(buffer)
        .resize({ width: 1400, withoutEnlargement: true })
        .grayscale()
        .normalize()
        .toBuffer();

      const worker = await Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      const res = await worker.recognize(preprocessed);
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

      let extractedText = "";

      // 1. Direct OCR for Image uploads (JPG, PNG, WEBP, JPEG, etc.)
      const isImage = fileNameLower.match(/\.(jpg|jpeg|png|webp|bmp|tif|tiff)$/) || file.type.startsWith('image/');
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

      const parsed = parseLetterText(extractedText);

      return NextResponse.json({
        success: true,
        filename: file.name,
        parsed,
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
      if (isImg) {
        text = await performHighAccuracyOCR(buffer);
      }
      if (!text || text.trim().length < 15) {
        text = extractTextFromBuffer(buffer, filename);
      }
    }

    if (!text || text.trim().length === 0) {
      // Return safe structured response even if document text was blank
      const fallbackParsed = parseLetterText("");
      return NextResponse.json({
        success: true,
        parsed: fallbackParsed,
        textPreview: ""
      });
    }

    const parsed = parseLetterText(text);

    return NextResponse.json({
      success: true,
      parsed,
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
