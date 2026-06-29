import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this URL to the bundled worker file.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// CMap + standard-font data live under public/pdfjs/ (copied from pdfjs-dist by
// scripts/copy-pdf-assets.mjs). Without these, real syllabi that use CID-keyed
// or non-embedded standard fonts fail to extract text. BASE_URL keeps the paths
// correct whether served from "/" locally or "/CourseNest/" on GitHub Pages.
const ASSET_BASE = `${import.meta.env.BASE_URL}pdfjs/`;

/** Extract all text from a PDF File, preserving line breaks as best we can. */
export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: buf,
    cMapUrl: `${ASSET_BASE}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${ASSET_BASE}standard_fonts/`,
    // Be lenient with mildly malformed PDFs rather than throwing.
    stopAtErrors: false,
  }).promise;

  const lines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    let content;
    try {
      const page = await pdf.getPage(p);
      content = await page.getTextContent();
    } catch (err) {
      // A single unreadable page shouldn't sink the whole syllabus.
      console.warn(`[pdf] skipped page ${p}:`, err);
      continue;
    }

    // Group text items into lines by their vertical position.
    let lastY: number | null = null;
    let current: string[] = [];
    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      if (typeof item.str !== 'string' || !item.transform) continue;
      const y = item.transform[5];
      if (lastY === null || Math.abs(y - lastY) < 3) {
        current.push(item.str);
      } else {
        lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
        current = [item.str];
      }
      lastY = y;
    }
    if (current.length) lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
    lines.push(''); // page break
  }

  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
