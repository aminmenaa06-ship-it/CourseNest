import type { ReactNode } from 'react';
import { useApp } from '../../state/AppContext';
import type { DayIndex, StudyWindow } from '../../types';
import DayPicker from '../DayPicker';
import { fromTimeInput, toTimeInput } from '../../lib/time';

const WINDOWS: { id: StudyWindow; label: string; hint: string }[] = [
  { id: 'any', label: 'Any', hint: 'No preference' },
  { id: 'morning', label: 'Morning', hint: '6am–12pm' },
  { id: 'afternoon', label: 'Afternoon', hint: '12–5pm' },
  { id: 'evening', label: 'Evening', hint: '5–10pm' },
];

export default function PreferencesStep() {
  const { state, dispatch } = useApp();
  const p = state.prefs;
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setPrefs', patch });

  return (
    <div className="animate-in flex flex-col gap-6 max-w-3xl">
      <header>
        <h2 className="text-2xl font-bold">How do you want your week to feel?</h2>
        <p className="text-[var(--color-muted)] mt-1">
          These shape where study blocks land and how much breathing room you keep.
        </p>
      </header>

      <Section title="Your week">
        <Row label="Free time to protect" hint="Kept unscheduled before study fills in">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={p.freeTimePerWeek}
              onChange={(e) => set({ freeTimePerWeek: Number(e.target.value) })}
              className="w-40 accent-[var(--color-ink)]"
            />
            <span className="tnum font-semibold w-12 text-right text-[var(--color-ink)]">
              {p.freeTimePerWeek}h
            </span>
          </div>
        </Row>

        <Row label="Day runs from" hint="Nothing is scheduled outside these hours">
          <div className="flex items-center gap-2">
            <input
              type="time"
              className="input !w-auto !py-1.5"
              value={toTimeInput(p.wake)}
              onChange={(e) => e.target.value && set({ wake: fromTimeInput(e.target.value) })}
            />
            <span className="text-sm text-[var(--color-muted)]">to</span>
            <input
              type="time"
              className="input !w-auto !py-1.5"
              value={toTimeInput(p.sleep)}
              onChange={(e) => e.target.value && set({ sleep: fromTimeInput(e.target.value) })}
            />
          </div>
        </Row>

        <Row label="Reserve meal times" hint="Holds lunch & dinner open">
          <Toggle checked={p.includeMeals} onChange={(v) => set({ includeMeals: v })} />
        </Row>
      </Section>

      <Section title="Studying">
        <Row label="Preferred time of day">
          <div className="inline-flex rounded-lg border border-[var(--color-border-strong)] overflow-hidden">
            {WINDOWS.map((w) => {
              const active = p.studyWindow === w.id;
              return (
                <button
                  key={w.id}
                  title={w.hint}
                  onClick={() => set({ studyWindow: w.id })}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-[var(--color-border-strong)] last:border-r-0 ${
                    active
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </Row>

        <Row label="Session shape" hint="Block length and breaks between">
          <div className="flex items-center gap-2">
            <select
              className="select !w-auto !py-1.5"
              value={p.maxStudyBlock}
              onChange={(e) => set({ maxStudyBlock: Number(e.target.value) })}
            >
              <option value={60}>Up to 1h</option>
              <option value={90}>Up to 1.5h</option>
              <option value={120}>Up to 2h</option>
              <option value={180}>Up to 3h</option>
            </select>
            <select
              className="select !w-auto !py-1.5"
              value={p.minBreak}
              onChange={(e) => set({ minBreak: Number(e.target.value) })}
            >
              <option value={0}>No break</option>
              <option value={15}>15m break</option>
              <option value={30}>30m break</option>
              <option value={60}>1h break</option>
            </select>
          </div>
        </Row>

        <Row label="Days you'll study">
          <DayPicker
            value={p.studyDays}
            size="sm"
            onChange={(studyDays: DayIndex[]) => set({ studyDays })}
          />
        </Row>
      </Section>

      <Section
        title="Term dates"
        subtitle="Your weekly plan repeats between these when added to a calendar."
      >
        <Row label="First & last day">
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input !w-auto !py-1.5"
              value={p.termStart}
              onChange={(e) => e.target.value && set({ termStart: e.target.value })}
            />
            <span className="text-sm text-[var(--color-muted)]">to</span>
            <input
              type="date"
              className="input !w-auto !py-1.5"
              value={p.termEnd}
              onChange={(e) => e.target.value && set({ termEnd: e.target.value })}
            />
          </div>
        </Row>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="px-1 mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="card px-5">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2.5 py-4 border-b border-[var(--color-border)] last:border-0">
      <div>
        <div className="font-medium text-[15px] text-[var(--color-ink)]">{label}</div>
        {hint && <div className="text-xs text-[var(--color-muted)] mt-0.5">{hint}</div>}
      </div>
      <div className="sm:justify-self-end">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 rounded-full transition-colors ${
        checked ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-border-strong)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
