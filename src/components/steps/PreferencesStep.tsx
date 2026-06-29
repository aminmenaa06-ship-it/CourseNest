import { useApp } from '../../state/AppContext';
import type { DayIndex, StudyWindow } from '../../types';
import DayPicker from '../DayPicker';
import { fromTimeInput, toTimeInput } from '../../lib/time';

const WINDOWS: { id: StudyWindow; label: string; hint: string }[] = [
  { id: 'any', label: 'Anytime', hint: 'No preference' },
  { id: 'morning', label: 'Mornings', hint: '6am–12pm' },
  { id: 'afternoon', label: 'Afternoons', hint: '12–5pm' },
  { id: 'evening', label: 'Evenings', hint: '5–10pm' },
];

export default function PreferencesStep() {
  const { state, dispatch } = useApp();
  const p = state.prefs;
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setPrefs', patch });

  return (
    <div className="animate-in flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold">How do you want your week to feel?</h2>
        <p className="text-[var(--color-muted)] mt-1 max-w-2xl">
          These preferences shape where study blocks land and how much breathing room you keep.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Free time */}
        <div className="card p-5">
          <label className="label">Free time you want each week</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={p.freeTimePerWeek}
              onChange={(e) => set({ freeTimePerWeek: Number(e.target.value) })}
              className="flex-1 accent-[var(--color-brand)]"
            />
            <span className="text-2xl font-bold text-[var(--color-ink)] w-20 text-right tnum">
              {p.freeTimePerWeek}h
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            CourseNest keeps at least this much unscheduled leisure time before filling slots with
            study.
          </p>
        </div>

        {/* Sleep window */}
        <div className="card p-5">
          <label className="label">Your day runs from…</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-xs text-[var(--color-muted)]">Wake</span>
              <input
                type="time"
                className="input mt-1"
                value={toTimeInput(p.wake)}
                onChange={(e) => set({ wake: fromTimeInput(e.target.value) })}
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-[var(--color-muted)]">Wind down</span>
              <input
                type="time"
                className="input mt-1"
                value={toTimeInput(p.sleep)}
                onChange={(e) => set({ sleep: fromTimeInput(e.target.value) })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={p.includeMeals}
              onChange={(e) => set({ includeMeals: e.target.checked })}
            />
            Reserve time for lunch &amp; dinner
          </label>
        </div>

        {/* Study window */}
        <div className="card p-5">
          <label className="label">Preferred time to study</label>
          <div className="grid grid-cols-2 gap-2">
            {WINDOWS.map((w) => {
              const active = p.studyWindow === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => set({ studyWindow: w.id })}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/12'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  <div className="font-semibold text-sm">{w.label}</div>
                  <div className="text-xs text-[var(--color-muted)]">{w.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Study shape */}
        <div className="card p-5">
          <label className="label">Study session shape</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-[var(--color-muted)]">Longest block</span>
              <select
                className="select mt-1"
                value={p.maxStudyBlock}
                onChange={(e) => set({ maxStudyBlock: Number(e.target.value) })}
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
            <div>
              <span className="text-xs text-[var(--color-muted)]">Break between</span>
              <select
                className="select mt-1"
                value={p.minBreak}
                onChange={(e) => set({ minBreak: Number(e.target.value) })}
              >
                <option value={0}>None</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[var(--color-muted)]">Days you'll study</span>
            <div className="mt-1.5">
              <DayPicker
                value={p.studyDays}
                onChange={(studyDays: DayIndex[]) => set({ studyDays })}
              />
            </div>
          </div>
        </div>

        {/* Term dates */}
        <div className="card p-5 lg:col-span-2">
          <label className="label">Term dates (used for the calendar export)</label>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-xs text-[var(--color-muted)]">First day</span>
              <input
                type="date"
                className="input mt-1"
                value={p.termStart}
                onChange={(e) => set({ termStart: e.target.value })}
              />
            </div>
            <div>
              <span className="text-xs text-[var(--color-muted)]">Last day</span>
              <input
                type="date"
                className="input mt-1"
                value={p.termEnd}
                onChange={(e) => set({ termEnd: e.target.value })}
              />
            </div>
            <p className="text-sm text-[var(--color-muted)] flex-1 min-w-[14rem]">
              Your weekly schedule repeats between these dates when added to Google or Apple
              Calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
