import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../state/AppContext';
import { generateSchedule } from '../../lib/scheduler';
import { buildICS, downloadICS } from '../../lib/ics';
import type { GeneratedSchedule } from '../../types';
import CalendarGrid from '../CalendarGrid';
import BackupSchedules, { type BackupSummary } from '../BackupSchedules';
import SavedSchedules from '../SavedSchedules';
import { fmtHours } from '../../lib/time';
import { STUDY_COLOR } from '../../lib/colors';
import { CalendarIcon, DownloadIcon, LockIcon } from '../Icons';
import { usePlan } from '../../features/PlanContext';
import { ProGate } from '../../features/ProGate';
import ProBadge from '../../features/ProBadge';
import {
  BACKUP_STRATEGIES,
  strategyByKey,
  type StrategyKey,
} from '../../features/backupStrategies';

const BACKUPS_KEY = 'coursenest:backups';

function loadBackupKeys(): StrategyKey[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BACKUPS_KEY) || '[]');
    return Array.isArray(raw) ? (raw as StrategyKey[]) : [];
  } catch {
    return [];
  }
}

function studyPctOf(sch: GeneratedSchedule): number {
  const { requiredStudyMin, scheduledStudyMin } = sch.summary;
  return requiredStudyMin > 0
    ? Math.min(100, Math.round((scheduledStudyMin / requiredStudyMin) * 100))
    : 100;
}

export default function ScheduleStep() {
  const { state } = useApp();
  const { classes, commitments, prefs } = state;
  const { can, promptUpgrade } = usePlan();

  const canExport = can('calendarExport');
  const canBackups = can('backupSchedules');

  const [backupKeys, setBackupKeys] = useState<StrategyKey[]>(loadBackupKeys);
  const [activeKey, setActiveKey] = useState<StrategyKey | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BACKUPS_KEY, JSON.stringify(backupKeys));
    } catch {
      /* ignore */
    }
  }, [backupKeys]);

  const primary = useMemo(
    () => generateSchedule(classes, commitments, prefs),
    [classes, commitments, prefs],
  );

  const backups = useMemo(
    () =>
      backupKeys.map((key) => {
        const strat = strategyByKey(key);
        return {
          key,
          label: strat.label,
          description: strat.description,
          schedule: generateSchedule(classes, commitments, { ...prefs, ...strat.patch }),
        };
      }),
    [backupKeys, classes, commitments, prefs],
  );

  // A downgraded user shouldn't be stuck previewing a (now locked) backup.
  const effectiveKey = canBackups ? activeKey : null;
  const activeEntry = effectiveKey ? backups.find((b) => b.key === effectiveKey) : null;
  const active = activeEntry?.schedule ?? primary;

  const [opts, setOpts] = useState({
    includeClasses: true,
    includeCommitments: true,
    includeStudy: true,
    includeFree: false,
    includeMeals: false,
  });

  if (classes.length === 0) {
    return (
      <div className="animate-in card p-10 text-center">
        <div className="flex justify-center mb-3 text-[var(--color-muted)]">
          <CalendarIcon size={32} />
        </div>
        <h2 className="text-xl font-bold">Add at least one class first</h2>
        <p className="text-[var(--color-muted)] mt-1">
          Go back to the Classes step and upload a syllabus to generate your schedule.
        </p>
      </div>
    );
  }

  const s = active.summary;
  const studyPct = studyPctOf(active);

  function handleExport() {
    if (!canExport) {
      promptUpgrade('calendarExport');
      return;
    }
    const ics = buildICS(active, prefs, opts);
    downloadICS('coursenest-schedule.ics', ics);
  }

  const dayStart = Math.max(0, prefs.wake - 30);
  const dayEnd = Math.min(24 * 60, prefs.sleep + 30);

  const backupSummaries: BackupSummary[] = backups.map((b) => ({
    key: b.key,
    label: b.label,
    description: b.description,
    studyPct: studyPctOf(b.schedule),
    freeHrs: fmtHours(b.schedule.summary.freeMin),
  }));
  const available = BACKUP_STRATEGIES.filter((st) => !backupKeys.includes(st.key));

  return (
    <div className="animate-in flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Your weekly schedule</h2>
          <p className="text-[var(--color-muted)] mt-1">
            Study blocks placed around your fixed commitments. Tune anything on the previous steps —
            this updates instantly.
          </p>
        </div>
      </header>

      {/* Summary stat cards (reflect whichever schedule is showing) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Study scheduled"
          value={fmtHours(s.scheduledStudyMin)}
          sub={`of ${fmtHours(s.requiredStudyMin)} recommended`}
          pct={studyPct}
        />
        <Stat label="Free time / week" value={fmtHours(s.freeMin)} sub={`goal ${prefs.freeTimePerWeek}h`} />
        <Stat
          label="Classes"
          value={String(classes.length)}
          sub={`${classes.reduce((a, c) => a + c.meetings.length, 0)} meetings`}
        />
        <Stat label="Commitments" value={String(commitments.length)} sub="work, gym, clubs…" />
      </div>

      {s.warnings.length > 0 && (
        <div className="card p-4 border-l-[3px] border-l-[var(--color-ink)]">
          <div className="font-semibold text-[var(--color-ink)] mb-1.5 text-sm uppercase tracking-[0.06em]">
            A few things to know
          </div>
          <ul className="text-sm text-[var(--color-ink-2)] list-disc pl-5 space-y-1">
            {s.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {activeEntry && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-ink)] bg-[var(--color-surface-2)] px-4 py-2.5">
          <span className="text-sm">
            Previewing backup: <strong>{activeEntry.label}</strong>
          </span>
          <button
            onClick={() => setActiveKey(null)}
            className="text-sm text-[var(--color-ink)] underline underline-offset-2 hover:opacity-70"
          >
            Back to primary
          </button>
        </div>
      )}

      <CalendarGrid schedule={active} dayStart={dayStart} dayEnd={dayEnd} />

      <Legend classes={classes} />

      {/* Saved schedules — Pro */}
      <ProGate feature="savedSchedules">
        <SavedSchedules />
      </ProGate>

      {/* Backup schedule builder — Pro */}
      <ProGate feature="backupSchedules">
        <BackupSchedules
          primary={{ studyPct: studyPctOf(primary), freeHrs: fmtHours(primary.summary.freeMin) }}
          backups={backupSummaries}
          available={available}
          activeKey={effectiveKey}
          onSelect={setActiveKey}
          onAdd={(key) => setBackupKeys((k) => [...k, key])}
          onRemove={(key) =>
            setBackupKeys((k) => {
              if (activeKey === key) setActiveKey(null);
              return k.filter((x) => x !== key);
            })
          }
        />
      </ProGate>

      {/* Calendar export — Pro */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-md">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon size={20} /> Add to Google or Apple Calendar
              <ProBadge tone="outline" />
            </h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Download a <code className="text-[var(--color-ink)]">.ics</code> file — the universal
              calendar format. It imports into <strong>both</strong> Google Calendar and Apple
              Calendar, with each event repeating weekly until your term ends.
            </p>
          </div>

          {canExport && (
            <div className="flex flex-col gap-2">
              <span className="label !mb-0">Include in export</span>
              {(
                [
                  ['includeClasses', 'Classes'],
                  ['includeCommitments', 'Commitments'],
                  ['includeStudy', 'Study blocks'],
                  ['includeMeals', 'Meals'],
                  ['includeFree', 'Free-time blocks'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opts[key]}
                    onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          {canExport ? (
            <button onClick={handleExport} className="btn btn-primary">
              <DownloadIcon size={16} /> Download .ics file
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-3.5">
              <span className="h-9 w-9 rounded-lg grid place-items-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] shrink-0">
                <LockIcon size={18} />
              </span>
              <div className="flex-1 min-w-[12rem]">
                <div className="text-sm font-semibold">Calendar export is a Pro feature</div>
                <div className="text-xs text-[var(--color-muted)]">
                  Your schedule is ready to view — upgrade to download and sync it.
                </div>
              </div>
              <button onClick={() => promptUpgrade('calendarExport')} className="btn btn-primary">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  pct,
}: {
  label: string;
  value: string;
  sub: string;
  pct?: number;
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1.5 text-[var(--color-ink)] tnum">{value}</div>
      <div className="text-xs text-[var(--color-muted)] mt-0.5">{sub}</div>
      {pct !== undefined && (
        <div className="h-1 rounded-full bg-[var(--color-surface-2)] mt-2.5 overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-ink)]" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function Legend({ classes }: { classes: { id: string; name: string; code?: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {classes.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: c.color }} />
          {c.code || c.name}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded" style={{ background: STUDY_COLOR }} />
        Study
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-dashed border-[var(--color-border)]" />
        Free time
      </span>
    </div>
  );
}
