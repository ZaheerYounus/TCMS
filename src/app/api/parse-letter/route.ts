import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, parseLetterText } from '@/lib/letterParser';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

async function performHighAccuracyOCR(buffer: Buffer): Promise<string> {
  let combinedText = "";

  // 1. First attempt: Sharp grayscale, 2x upscale, sharpen & normalize
  try {
    const preprocessed = await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.2 })
      .toBuffer();

    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });
    const res = await worker.recognize(preprocessed);
    combinedText = res?.data?.text || "";
    await worker.terminate();
  } catch (err) {
    console.warn("First OCR attempt failed:", err);
  }

  // 2. Fallback attempt if text is sparse: direct recognize on raw buffer
  if (!combinedText || combinedText.trim().length < 50) {
    try {
      const rawRes = await Tesseract.recognize(buffer, 'eng');
      const rawText = rawRes?.data?.text || "";
      if (rawText.trim().length > combinedText.trim().length) {
        combinedText = rawText;
      } else {
        combinedText += "\n" + rawText;
      }
    } catch (e) {
      console.warn("Raw OCR fallback failed:", e);
    }
  }

  return combinedText;
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

      // 2. Buffer extraction for PDF, DOCX, DOC, TXT (or fallback)
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
      return NextResponse.json({ error: 'Text content or file could not be read' }, { status: 400 });
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
