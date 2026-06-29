import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../state/AppContext';
import { useSavedSchedules } from '../features/savedSchedules';
import type { AppSnapshot } from '../types';
import {
  COMFORT_LEVELS,
  comfortToHours,
  generateFinalsPlan,
  buildFinalsICS,
  type FinalsClassInput,
} from '../lib/finalsScheduler';
import { downloadICS } from '../lib/ics';
import { fmtHours, fromTimeInput, toTimeInput, todayISO } from '../lib/time';
import NumberInput from './NumberInput';
import FinalsAgenda from './FinalsAgenda';
import ProBadge from '../features/ProBadge';
import { ArrowLeft, ArrowRight, DownloadIcon } from './Icons';

interface Source {
  id: string;
  name: string;
  snapshot: AppSnapshot;
}

export default function FinalsBuilder({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const { items: saved } = useSavedSchedules();

  const sources = useMemo<Source[]>(() => {
    const list: Source[] = [];
    if (state.classes.length > 0) {
      list.push({
        id: 'current',
        name: 'Current schedule',
        snapshot: {
          schoolId: state.schoolId,
          customStudyHoursPerUnit: state.customStudyHoursPerUnit,
          classes: state.classes,
          commitments: state.commitments,
          prefs: state.prefs,
        },
      });
    }
    for (const s of saved) list.push({ id: s.id, name: s.name, snapshot: s.snapshot });
    return list;
  }, [state, saved]);

  const [step, setStep] = useState(0);
  const [sourceId, setSourceId] = useState<string | null>(sources[0]?.id ?? null);
  const [inputs, setInputs] = useState<Record<string, FinalsClassInput>>({});
  const [autoDate, setAutoDate] = useState<Record<string, boolean>>({});
  const [prepStart, setPrepStart] = useState(todayISO());

  const snapshot = sourceId ? sources.find((s) => s.id === sourceId)?.snapshot ?? null : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function initInputs(snap: AppSnapshot) {
    const inp: Record<string, FinalsClassInput> = {};
    const autos: Record<string, boolean> = {};
    for (const c of snap.classes) {
      const fe = c.finalExam;
      inp[c.id] = {
        classId: c.id,
        hasExam: true,
        comfort: 3,
        studyHours: comfortToHours(3, c.units),
        examDate: fe?.date ?? '',
        examStart: fe?.start ?? 9 * 60,
        examEnd: fe?.end ?? 11 * 60,
      };
      autos[c.id] = !!fe?.date;
    }
    setInputs(inp);
    setAutoDate(autos);
  }

  const plan = useMemo(
    () =>
      snapshot
        ? generateFinalsPlan(snapshot.classes, snapshot.commitments, inputs, snapshot.prefs, prepStart)
        : null,
    [snapshot, inputs, prepStart],
  );

  const setInput = (id: string, patch: Partial<FinalsClassInput>) =>
    setInputs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  function next() {
    if (step === 0 && snapshot) {
      initInputs(snapshot);
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] overflow-y-auto animate-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--color-bg)]/85 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">Finals schedule builder</span>
            <ProBadge tone="outline" />
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none px-1"
            aria-label="Close finals builder"
          >
            ×
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 pb-3 flex gap-1.5">
          {['Schedule', 'Your finals', 'Plan'].map((label, i) => (
            <div
              key={label}
              className={`flex-1 h-1 rounded-full ${
                i <= step ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-border)]'
              }`}
              title={label}
            />
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-7 pb-28">
        {step === 0 && (
          <StepSource sources={sources} sourceId={sourceId} onPick={setSourceId} />
        )}
        {step === 1 && snapshot && (
          <StepSurvey
            snapshot={snapshot}
            inputs={inputs}
            autoDate={autoDate}
            prepStart={prepStart}
            setPrepStart={setPrepStart}
            setInput={setInput}
          />
        )}
        {step === 2 && plan && <StepPlan plan={plan} />}
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 inset-x-0 z-10 bg-[var(--color-bg)]/90 backdrop-blur-xl border-t border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="btn btn-ghost"
          >
            <ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 2 ? (
            <button
              onClick={next}
              disabled={step === 0 && !snapshot}
              className="btn btn-primary"
            >
              {step === 0 ? 'Continue' : 'Build finals plan'} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => plan && downloadICS('coursenest-finals.ics', buildFinalsICS(plan))}
              disabled={!plan || plan.events.length === 0}
              className="btn btn-primary"
            >
              <DownloadIcon size={16} /> Download finals .ics
            </button>
          )}
        </div>
      </footer>
    </div>,
    document.body,
  );
}

// ---- Step 1: choose source ---------------------------------------------

function StepSource({
  sources,
  sourceId,
  onPick,
}: {
  sources: Source[];
  sourceId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Which schedule are your finals for?</h2>
      <p className="text-[var(--color-muted)] mt-1">
        Finals week has no lectures, so we'll drop those and rebuild around your exam times.
      </p>

      {sources.length === 0 ? (
        <div className="card p-8 text-center mt-6 text-[var(--color-muted)]">
          You don't have a schedule yet. Build one (and save it) first, then come back.
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-6">
          {sources.map((s) => {
            const active = s.id === sourceId;
            return (
              <button
                key={s.id}
                onClick={() => onPick(s.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  active
                    ? 'border-[var(--color-ink)] bg-[var(--color-surface-2)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  {s.snapshot.classes.length} class
                  {s.snapshot.classes.length === 1 ? '' : 'es'} ·{' '}
                  {s.snapshot.classes.filter((c) => c.finalExam?.date).length} final
                  {s.snapshot.classes.filter((c) => c.finalExam?.date).length === 1 ? '' : 's'} found
                  in syllabi
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Step 2: comfort + exam survey -------------------------------------

function StepSurvey({
  snapshot,
  inputs,
  autoDate,
  prepStart,
  setPrepStart,
  setInput,
}: {
  snapshot: AppSnapshot;
  inputs: Record<string, FinalsClassInput>;
  autoDate: Record<string, boolean>;
  prepStart: string;
  setPrepStart: (v: string) => void;
  setInput: (id: string, patch: Partial<FinalsClassInput>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">How ready are you for each final?</h2>
      <p className="text-[var(--color-muted)] mt-1">
        Tell us how comfortable you feel — we'll give the shakier classes more study time. Exam
        dates pulled from your syllabi are pre-filled; add any that are missing.
      </p>

      <div className="card px-5 mt-6">
        <div className="grid sm:grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2.5 py-4">
          <div>
            <div className="font-medium text-[15px]">Start preparing on</div>
            <div className="text-xs text-[var(--color-muted)] mt-0.5">
              The plan fills study time from this day up to each exam.
            </div>
          </div>
          <input
            type="date"
            className="input !w-auto !py-1.5 sm:justify-self-end"
            value={prepStart}
            onChange={(e) => e.target.value && setPrepStart(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {snapshot.classes.map((c) => {
          const inp = inputs[c.id];
          if (!inp) return null;
          return (
            <div key={c.id} className="card p-5" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{c.code ? `${c.code} — ${c.name}` : c.name}</div>
                <label className="flex items-center gap-2 text-sm text-[var(--color-muted)] cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={inp.hasExam}
                    onChange={(e) => setInput(c.id, { hasExam: e.target.checked })}
                  />
                  Has a final
                </label>
              </div>

              {inp.hasExam && (
                <>
                  {/* Comfort */}
                  <div className="mt-4">
                    <div className="label">How comfortable are you with the material?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMFORT_LEVELS.map((lvl) => {
                        const active = inp.comfort === lvl.value;
                        return (
                          <button
                            key={lvl.value}
                            title={lvl.hint}
                            onClick={() =>
                              setInput(c.id, {
                                comfort: lvl.value,
                                studyHours: comfortToHours(lvl.value, c.units),
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              active
                                ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]'
                                : 'border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Study hours + exam date/time */}
                  <div className="grid sm:grid-cols-[150px_1fr] gap-4 mt-4">
                    <div>
                      <label className="label">Study time</label>
                      <NumberInput
                        value={inp.studyHours}
                        min={0}
                        max={40}
                        suffix="hrs"
                        ariaLabel={`Study hours for ${c.name}`}
                        onChange={(v) => setInput(c.id, { studyHours: v })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="label !mb-0">Final exam</label>
                        {autoDate[c.id] ? (
                          <span className="chip border-[var(--color-border-strong)]">
                            From syllabus
                          </span>
                        ) : (
                          <span className="chip border-[#dc2626] text-[#dc2626]">Add date</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <input
                          type="date"
                          className="input !w-auto !py-1.5"
                          value={inp.examDate}
                          onChange={(e) => setInput(c.id, { examDate: e.target.value })}
                        />
                        <input
                          type="time"
                          className="input !w-auto !py-1.5"
                          value={toTimeInput(inp.examStart)}
                          onChange={(e) =>
                            e.target.value &&
                            setInput(c.id, { examStart: fromTimeInput(e.target.value) })
                          }
                        />
                        <span className="text-sm text-[var(--color-muted)]">to</span>
                        <input
                          type="time"
                          className="input !w-auto !py-1.5"
                          value={toTimeInput(inp.examEnd)}
                          onChange={(e) =>
                            e.target.value &&
                            setInput(c.id, { examEnd: fromTimeInput(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Step 3: the plan ---------------------------------------------------

function StepPlan({ plan }: { plan: ReturnType<typeof generateFinalsPlan> }) {
  const totalStudy = plan.events
    .filter((e) => e.kind === 'study')
    .reduce((a, e) => a + (e.end - e.start), 0);
  const examCount = plan.events.filter((e) => e.kind === 'exam').length;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Your finals plan</h2>
      <p className="text-[var(--color-muted)] mt-1">
        Study sessions ramp up toward each exam. Download it as an .ics to drop into Google or Apple
        Calendar.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <Mini label="Study scheduled" value={fmtHours(totalStudy)} />
        <Mini label="Finals" value={String(examCount)} />
        <Mini
          label="Through"
          value={new Date(plan.endDate + 'T00:00:00').toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        />
      </div>

      {plan.warnings.length > 0 && (
        <div className="card p-4 mt-4 border-l-[3px] border-l-[var(--color-ink)]">
          <ul className="text-sm text-[var(--color-ink-2)] list-disc pl-5 space-y-1">
            {plan.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <FinalsAgenda plan={plan} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="text-xl font-bold mt-1.5 text-[var(--color-ink)] tnum">{value}</div>
    </div>
  );
}
