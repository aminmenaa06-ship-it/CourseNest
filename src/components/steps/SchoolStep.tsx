import { useMemo, useState } from 'react';
import { useApp } from '../../state/AppContext';
import { SCHOOLS, SCHOOL_SYSTEMS, getSchool } from '../../data/schools';
import { effectiveHoursPerUnit } from '../../lib/studyHours';
import NumberInput from '../NumberInput';

export default function SchoolStep() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [useCustom, setUseCustom] = useState(state.customStudyHoursPerUnit !== null);

  const q = query.trim().toLowerCase();
  const filtered = SCHOOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.system ?? '').toLowerCase().includes(q),
  );

  // Preserve system order, dropping empty groups after filtering.
  const grouped = useMemo(() => {
    const order = [...SCHOOL_SYSTEMS];
    return order
      .map((sys) => ({ sys, items: filtered.filter((s) => (s.system ?? 'Other') === sys) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const school = getSchool(state.schoolId);
  const rate = effectiveHoursPerUnit(state.schoolId, state.customStudyHoursPerUnit);

  return (
    <div className="animate-in flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold">Which school are you at?</h2>
        <p className="text-[var(--color-muted)] mt-1 max-w-2xl">
          Schools publish how many hours you should study per credit unit each week. CourseNest uses
          that number to turn each class's units into a weekly study target. You can override it
          anytime.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card p-5">
          <div className="flex items-end justify-between gap-2">
            <label className="label !mb-0">Search schools &amp; guidelines</label>
            <span className="text-xs text-[var(--color-muted)]">
              {SCHOOLS.length} schools across {SCHOOL_SYSTEMS.length - 1} systems
            </span>
          </div>
          <input
            className="input mt-1.5"
            placeholder="Search a campus, system, or state… (e.g. CSU, Buffalo, UCLA)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-3 max-h-[440px] overflow-y-auto flex flex-col gap-3 pr-1">
            {grouped.map((g) => (
              <div key={g.sys}>
                <div className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm py-1 mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {g.sys}
                  <span className="ml-2 text-[var(--color-border-strong)] font-semibold">
                    {g.items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.items.map((s) => {
                    const active = s.id === state.schoolId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => dispatch({ type: 'setSchool', id: s.id })}
                        className={`text-left rounded-xl px-3.5 py-2.5 border transition-colors ${
                          active
                            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/12'
                            : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{s.name}</span>
                          <span className="chip shrink-0">{s.studyHoursPerUnit} hr/unit</span>
                        </div>
                        {s.note && (
                          <p className="text-xs text-[var(--color-muted)] mt-0.5">{s.note}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="text-sm text-[var(--color-muted)] italic px-1 py-3">
                No match — pick a general guideline or set a custom rate on the right.
              </p>
            )}
          </div>
        </div>

        <div className="card p-5 h-max">
          <h3 className="font-semibold mb-1">Your study rate</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-[var(--color-ink)] tnum">{rate}</span>
            <span className="text-[var(--color-muted)]">hours / unit / week</span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {school ? school.name : 'Custom'} → a 4-unit class becomes{' '}
            <strong className="text-[var(--color-ink)]">{rate * 4} study hrs/week</strong>.
          </p>

          <label className="flex items-center gap-2 mt-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => {
                setUseCustom(e.target.checked);
                dispatch({
                  type: 'setCustomHours',
                  value: e.target.checked ? rate : null,
                });
              }}
            />
            <span className="text-sm">Use a custom rate instead</span>
          </label>
          {useCustom && (
            <div className="mt-3">
              <label className="label">Hours per unit per week</label>
              <NumberInput
                value={state.customStudyHoursPerUnit ?? rate}
                min={0.5}
                max={6}
                ariaLabel="Custom hours per unit per week"
                onChange={(v) => dispatch({ type: 'setCustomHours', value: v })}
              />
            </div>
          )}
          <p className="text-xs text-[var(--color-muted)] mt-4 leading-relaxed">
            <span className="font-semibold text-[var(--color-ink)]">Note</span> — if a syllabus
            states its own expected weekly workload, CourseNest uses that exact number for the class
            and ignores this rate.
          </p>
        </div>
      </div>
    </div>
  );
}
