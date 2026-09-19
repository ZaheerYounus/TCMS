import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, parseLetterText } from '@/lib/letterParser';

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
      const extractedText = extractTextFromBuffer(buffer, file.name);
      const parsed = parseLetterText(extractedText);

      return NextResponse.json({
        success: true,
        filename: file.name,
        parsed,
        textPreview: extractedText.slice(0, 500)
      });
    }

    // B. Handle JSON body with raw text or base64 file
    const body = await req.json();
    let text = body.text || '';
    if (body.base64) {
      const buffer = Buffer.from(body.base64, 'base64');
      text = extractTextFromBuffer(buffer, body.filename || 'letter.docx');
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text content or file is empty' }, { status: 400 });
    }

    const parsed = parseLetterText(text);

    return NextResponse.json({
      success: true,
      parsed,
      textPreview: text.slice(0, 500)
    });

  } catch (err: any) {
    console.error('Error in letter parse API:', err);
    return NextResponse.json({ 
      error: 'Failed to parse incoming letter', 
      details: err?.message || String(err) 
    }, { status: 500 });
  }
}
