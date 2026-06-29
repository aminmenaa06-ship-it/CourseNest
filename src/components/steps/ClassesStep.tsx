import { useApp } from '../../state/AppContext';
import type { ClassItem } from '../../types';
import SyllabusUploader from '../SyllabusUploader';
import BlocksEditor from '../BlocksEditor';
import type { ParsedSyllabus } from '../../lib/syllabusParser';
import { classColor } from '../../lib/colors';
import { derivedStudyHours, effectiveHoursPerUnit } from '../../lib/studyHours';
import { fmtHours } from '../../lib/time';

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

  const needsAttention = !item.name || item.meetings.length === 0;

  return (
    <div className="card p-5" style={{ borderLeft: `3px solid ${item.color}` }}>
      <div className="flex items-start gap-3">
        <input
          type="color"
          value={item.color}
          onChange={(e) => set({ color: e.target.value })}
          className="h-9 w-9 rounded-lg bg-transparent border border-[var(--color-border)] cursor-pointer shrink-0"
          aria-label="Class color"
        />
        <div className="flex-1 grid sm:grid-cols-[1fr_120px_120px] gap-3">
          <div>
            <label className="label">Course name</label>
            <input
              className="input"
              placeholder="e.g. Intro to Programming"
              value={item.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>
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
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              className="input"
              value={item.units}
              onChange={(e) => {
                const units = Number(e.target.value);
                // Derived hours follow units unless locked by the syllabus.
                set(
                  item.studyHoursAuto
                    ? { units }
                    : { units, studyHoursPerWeek: recalc(units) },
                );
              }}
            />
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none px-1 shrink-0"
          aria-label="Remove class"
        >
          ×
        </button>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 mt-4 items-end">
        <div>
          <label className="label">Meeting times</label>
          <BlocksEditor blocks={item.meetings} onChange={(meetings) => set({ meetings })} />
        </div>
        <div className="sm:w-[200px]">
          <label className="label">Study hours / week</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={40}
              step={0.5}
              className="input"
              value={item.studyHoursPerWeek}
              onChange={(e) =>
                set({ studyHoursPerWeek: Number(e.target.value), studyHoursAuto: false })
              }
            />
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1.5">
            {item.studyHoursAuto ? (
              <span className="text-[var(--color-ink)] font-medium">From syllabus workload</span>
            ) : (
              <>
                {item.units} units × {rate} hr ={' '}
                <button
                  className="text-[var(--color-ink)] underline underline-offset-2 hover:opacity-70"
                  onClick={() => set({ studyHoursPerWeek: recalc(item.units) })}
                >
                  reset to {recalc(item.units)}h
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {item.source && <span className="chip">{item.source}</span>}
        {needsAttention && (
          <span className="chip border-[var(--color-ink)] text-[var(--color-ink)]">
            Check the highlighted fields
          </span>
        )}
      </div>
    </div>
  );
}
