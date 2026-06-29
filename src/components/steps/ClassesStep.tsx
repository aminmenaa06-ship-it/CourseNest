import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import type { ClassItem } from '../../types';
import { DAY_ABBR } from '../../types';
import SyllabusUploader from '../SyllabusUploader';
import BlocksEditor from '../BlocksEditor';
import NumberInput from '../NumberInput';
import type { ParsedSyllabus } from '../../lib/syllabusParser';
import { classColor } from '../../lib/colors';
import { derivedStudyHours, effectiveHoursPerUnit } from '../../lib/studyHours';
import { fmtHours, fmtTime } from '../../lib/time';

let n = 0;
const newId = () => `class-${Date.now().toString(36)}-${n++}`;

export default function ClassesStep() {
  const { state, dispatch } = useApp();
  const { schoolId, customStudyHoursPerUnit, classes } = state;

  function addFromParse(parsed: ParsedSyllabus, filename: string) {
    const units = parsed.units ?? 3;
    const auto = parsed.explicitStudyHours !== null;
    const studyHoursPerWeek = auto
      ? parsed.explicitStudyHours!
      : derivedStudyHours(units, schoolId, customStudyHoursPerUnit);
    const item: ClassItem = {
      id: newId(),
      name: parsed.name ?? 'Untitled course',
      code: parsed.code ?? undefined,
      units,
      meetings: parsed.meetings,
      studyHoursPerWeek,
      studyHoursAuto: auto,
      color: classColor(classes.length),
      source: filename,
    };
    dispatch({ type: 'addClass', item });
  }

  function addManual() {
    const units = 3;
    dispatch({
      type: 'addClass',
      item: {
        id: newId(),
        name: '',
        units,
        meetings: [],
        studyHoursPerWeek: derivedStudyHours(units, schoolId, customStudyHoursPerUnit),
        studyHoursAuto: false,
        color: classColor(classes.length),
      },
    });
  }

  const totalStudy = classes.reduce((a, c) => a + c.studyHoursPerWeek, 0);

  return (
    <div className="animate-in flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold">Add your classes</h2>
        <p className="text-[var(--color-muted)] mt-1 max-w-2xl">
          Upload each class's syllabus and CourseNest fills in the details automatically. Always give
          the auto-filled fields a quick check — every field is editable.
        </p>
      </header>

      <SyllabusUploader onParsed={addFromParse} />

      <div className="flex items-center gap-3">
        <button onClick={addManual} className="btn btn-ghost">
          + Add a class manually
        </button>
        {classes.length > 0 && (
          <span className="text-sm text-[var(--color-muted)]">
            {classes.length} class{classes.length > 1 ? 'es' : ''} ·{' '}
            <strong className="text-[var(--color-ink)]">{fmtHours(totalStudy * 60)}</strong> study /
            week
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            item={c}
            rate={effectiveHoursPerUnit(schoolId, customStudyHoursPerUnit)}
            onChange={(item) => dispatch({ type: 'updateClass', item })}
            onRemove={() => dispatch({ type: 'removeClass', id: c.id })}
            recalc={(units) => derivedStudyHours(units, schoolId, customStudyHoursPerUnit)}
          />
        ))}
      </div>
    </div>
  );
}

/** Group meetings that share a time into a readable line, e.g. "Mon, Wed, Fri · 10:00–10:50 AM". */
function summarizeMeetings(item: ClassItem): string[] {
  const groups = new Map<string, { start: number; end: number; days: number[] }>();
  for (const m of item.meetings) {
    const key = `${m.start}-${m.end}`;
    if (!groups.has(key)) groups.set(key, { start: m.start, end: m.end, days: [] });
    groups.get(key)!.days.push(m.day);
  }
  return [...groups.values()].map(
    (g) =>
      `${g.days
        .sort((a, b) => a - b)
        .map((d) => DAY_ABBR[d])
        .join(', ')} · ${fmtTime(g.start)}–${fmtTime(g.end)}`,
  );
}

function ClassCard({
  item,
  rate,
  onChange,
  onRemove,
  recalc,
}: {
  item: ClassItem;
  rate: number;
  onChange: (item: ClassItem) => void;
  onRemove: () => void;
  recalc: (units: number) => number;
}) {
  const set = (patch: Partial<ClassItem>) => onChange({ ...item, ...patch });
  const hasMeetings = item.meetings.length > 0;

  // The meeting-times section bypasses itself when the syllabus already supplied
  // them — collapsed to a confirmation, expandable to edit. If none were found,
  // it opens for input.
  const [editingTimes, setEditingTimes] = useState(!hasMeetings);

  return (
    <div className="card p-5" style={{ borderLeft: `3px solid ${item.color}` }}>
      {/* Name + color + remove */}
      <div className="flex items-start gap-3">
        <input
          type="color"
          value={item.color}
          onChange={(e) => set({ color: e.target.value })}
          className="h-9 w-9 rounded-lg bg-transparent border border-[var(--color-border)] cursor-pointer shrink-0"
          aria-label="Class color"
        />
        <div className="flex-1">
          <label className="label">Course name</label>
          <input
            className="input"
            placeholder="e.g. Intro to Programming"
            value={item.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <button
          onClick={onRemove}
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none px-1 shrink-0 mt-6"
          aria-label="Remove class"
        >
          ×
        </button>
      </div>

      {/* Code · Units · Study hours */}
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <div>
          <label className="label">Code</label>
          <input
            className="input"
            placeholder="CS 101"
            value={item.code ?? ''}
            onChange={(e) => set({ code: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Units</label>
          <NumberInput
            value={item.units}
            min={0.5}
            max={12}
            ariaLabel="Units"
            onChange={(units) =>
              set(item.studyHoursAuto ? { units } : { units, studyHoursPerWeek: recalc(units) })
            }
          />
        </div>
        <div>
          <label className="label">Study / week</label>
          <NumberInput
            value={item.studyHoursPerWeek}
            min={0}
            max={40}
            suffix="hrs"
            ariaLabel="Study hours per week"
            onChange={(v) => set({ studyHoursPerWeek: v, studyHoursAuto: false })}
          />
          <p className="text-xs text-[var(--color-muted)] mt-1.5">
            {item.studyHoursAuto ? (
              <span className="text-[var(--color-ink)] font-medium">From syllabus</span>
            ) : (
              <>
                {item.units} × {rate}h ·{' '}
                <button
                  className="text-[var(--color-ink)] underline underline-offset-2 hover:opacity-70"
                  onClick={() => set({ studyHoursPerWeek: recalc(item.units) })}
                >
                  reset
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Meeting times — bypassed (collapsed) when supplied by the syllabus */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="label !mb-0">Meeting times</span>
            {hasMeetings && !editingTimes && (
              <span className="chip border-[var(--color-border-strong)]">Detected</span>
            )}
            {!hasMeetings && (
              <span className="chip border-[#dc2626] text-[#dc2626]">Not found — add</span>
            )}
          </div>
          {hasMeetings && (
            <button
              onClick={() => setEditingTimes((v) => !v)}
              className="text-sm text-[var(--color-ink)] underline underline-offset-2 hover:opacity-70"
            >
              {editingTimes ? 'Done' : 'Edit'}
            </button>
          )}
        </div>

        {hasMeetings && !editingTimes ? (
          <ul className="mt-2 space-y-1">
            {summarizeMeetings(item).map((line, i) => (
              <li key={i} className="text-sm text-[var(--color-ink-2)] tnum">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <BlocksEditor blocks={item.meetings} onChange={(meetings) => set({ meetings })} />
          </div>
        )}
      </div>

      {item.source && (
        <div className="mt-3">
          <span className="chip">{item.source}</span>
        </div>
      )}
    </div>
  );
}
