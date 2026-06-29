// Copies pdf.js CMap + standard-font data into public/ so the syllabus reader
// can decode the full range of fonts/encodings real PDFs use. Runs automatically
// before `dev` and `build` (see package.json), and is git-ignored output.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'node_modules/pdfjs-dist');
const dest = resolve(root, 'public/pdfjs');

const assets = ['cmaps', 'standard_fonts'];
mkdirSync(dest, { recursive: true });

let copied = 0;
for (const a of assets) {
  const from = resolve(src, a);
  const to = resolve(dest, a);
  if (!existsSync(from)) {
    console.warn(`[pdf-assets] source missing, skipped: ${from}`);
    continue;
  }
  cpSync(from, to, { recursive: true });
  copied++;
}
console.log(`[pdf-assets] copied ${copied}/${assets.length} asset folders to public/pdfjs`);
