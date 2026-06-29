import { useRef, useState } from 'react';
import { extractPdfText } from '../lib/pdf';
import { parseSyllabus, type ParsedSyllabus } from '../lib/syllabusParser';
import { SAMPLE_SYLLABUS_TEXT } from '../data/samples';
import { UploadIcon } from './Icons';

interface Props {
  onParsed: (parsed: ParsedSyllabus, filename: string) => void;
}

export default function SyllabusUploader({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF syllabus. (You can also add the class manually.)');
      return;
    }
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      if (!text || text.replace(/\s/g, '').length < 20) {
        setError(
          'Could not read text from this PDF (it may be a scanned image). Add the class manually instead.',
        );
        return;
      }
      onParsed(parseSyllabus(text), file.name);
    } catch (e) {
      console.error(e);
      const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
      setError(`Couldn't read that PDF${detail}. Try another file, or add the class manually.`);
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    setError(null);
    onParsed(parseSyllabus(SAMPLE_SYLLABUS_TEXT), 'Sample · CS 61A.pdf');
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
            : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/60 hover:bg-[var(--color-surface-2)]/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        {busy ? (
          <div className="flex items-center justify-center gap-2 text-[var(--color-ink)] font-semibold">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Reading syllabus…
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-2 text-[var(--color-ink)]">
              <UploadIcon size={26} />
            </div>
            <div className="font-semibold">Drop a syllabus PDF here, or click to browse</div>
            <div className="text-sm text-[var(--color-muted)] mt-1">
              CourseNest reads the course name, units, meeting times, and expected workload — then
              lets you confirm.
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={loadSample}
          className="text-sm text-[var(--color-ink)] underline underline-offset-2 hover:opacity-70"
        >
          Try it with a sample syllabus
        </button>
        {error && <span className="text-sm text-[#b91c1c]">{error}</span>}
      </div>
    </div>
  );
}
