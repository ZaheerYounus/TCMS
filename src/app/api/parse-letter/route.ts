import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, parseLetterText } from '@/lib/letterParser';
import Tesseract from 'tesseract.js';

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
        try {
          const ocrResult = await Tesseract.recognize(buffer, 'eng', {
            logger: () => {}
          });
          extractedText = ocrResult?.data?.text || "";
        } catch (ocrErr) {
          console.warn("OCR recognition error on image:", ocrErr);
        }
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
        try {
          const ocrRes = await Tesseract.recognize(buffer, 'eng');
          text = ocrRes?.data?.text || "";
        } catch (e) {
          console.warn("OCR failed on base64:", e);
        }
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
