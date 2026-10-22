import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
// Vite URL import bundles worker locally for instant offline/low-bandwidth execution
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  try {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  } catch (e) {
    console.warn("PDF worker url setup notice:", e);
  }
}

/**
 * Extracts text client-side from a DOCX file using mammoth.
 * Runs 100% on the device in milliseconds without uploading megabytes.
 */
export async function extractTextFromDocxClient(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return (result.value || '').trim();
  } catch (err: any) {
    console.warn("Client-side DOCX extraction error:", err?.message || err);
    return '';
  }
}

/**
 * Extracts text client-side from a PDF file using pdfjs-dist.
 * Runs 100% on the device without uploading megabytes over the network.
 */
export async function extractTextFromPdfClient(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Ensure worker is configured
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableFontFace: true,
      useSystemFonts: true,
      verbosity: 0
    } as any);

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, numPages);
      }
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageLines = textContent.items
        .map((item: any) => (item.str !== undefined ? item.str : ''))
        .join(' ')
        .trim();

      if (pageLines.length > 0) {
        fullText += `\n--- Page ${pageNum} ---\n` + pageLines;
      }
    }

    return fullText.trim();
  } catch (err: any) {
    console.warn("Client-side PDF extraction error:", err?.message || err);
    return '';
  }
}

/**
 * Compresses an image file (e.g. 5-15MB camera capture) to a lightweight ~200-350KB JPEG
 * so mobile upload takes 1-3 seconds instead of minutes.
 */
export async function compressImageForOcr(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // If browser doesn't have Image/Canvas, fallback to raw base64
    if (typeof window === 'undefined' || !window.Image) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        // Fallback to raw base64
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Calculate scaled dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Use white background in case of transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
