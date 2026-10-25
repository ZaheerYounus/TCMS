/**
 * In-browser client-side OCR engine using Tesseract.js and HTML5 Canvas.
 * Running directly in the browser completely eliminates Vercel serverless timeouts (504s),
 * payload size limits, and network errors!
 */
import { createWorker } from 'tesseract.js';

export async function preprocessImageInBrowser(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Scale to optimal OCR width (1600px - 2000px)
        const targetWidth = Math.min(2000, Math.max(1200, img.width));
        const scale = targetWidth / img.width;
        canvas.width = targetWidth;
        canvas.height = Math.round(img.height * scale);

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // High-contrast Grayscale & Binarization filter
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Standard luminosity grayscale with gentle contrast adjustment (prevents blowing out fine text)
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Gentle contrast enhancement (1.15x instead of 1.5x)
          const contrast = (gray - 128) * 1.15 + 128;
          const finalVal = Math.min(255, Math.max(0, contrast));

          d[i] = finalVal;
          d[i + 1] = finalVal;
          d[i + 2] = finalVal;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        }, 'image/jpeg', 0.95);
      } catch (err) {
        console.warn("Browser image preprocessing fallback:", err);
        resolve(file);
      }
    };

    reader.readAsDataURL(file);
  });
}

export async function runBrowserOCR(
  file: File, 
  onProgress?: (progressPercent: number, status: string) => void
): Promise<string> {
  let worker: any = null;
  try {
    if (onProgress) onProgress(15, "Optimizing image resolution & contrast...");
    const preprocessedBlob = await preprocessImageInBrowser(file);

    if (onProgress) onProgress(35, "Initializing local OCR worker...");
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(35 + (m.progress || 0) * 60);
          onProgress(pct, `Reading document text (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      }
    });

    if (onProgress) onProgress(50, "Recognizing text from document...");
    const ret = await worker.recognize(preprocessedBlob);
    await worker.terminate();

    return ret?.data?.text || "";
  } catch (err) {
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    console.warn("Client-side OCR error:", err);
    throw err;
  }
}
