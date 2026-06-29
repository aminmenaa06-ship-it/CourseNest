import { useMemo, useState } from 'react';
import { useApp } from '../../state/AppContext';
import { generateSchedule } from '../../lib/scheduler';
import { buildICS, downloadICS } from '../../lib/ics';
import CalendarGrid from '../CalendarGrid';
import { fmtHours } from '../../lib/time';
import { STUDY_COLOR } from '../../lib/colors';
import { CalendarIcon, DownloadIcon } from '../Icons';

export default function ScheduleStep() {
  const { state } = useApp();
  const { classes, commitments, prefs } = state;

  const schedule = useMemo(
    () => generateSchedule(classes, commitments, prefs),
    [classes, commitments, prefs],
  );

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

  const s = schedule.summary;
  const studyPct =
    s.requiredStudyMin > 0
      ? Math.min(100, Math.round((s.scheduledStudyMin / s.requiredStudyMin) * 100))
      : 100;

  function handleExport() {
    const ics = buildICS(schedule, prefs, opts);
    downloadICS('coursenest-schedule.ics', ics);
  }

  // Visible time window: pad around the day a touch.
  const dayStart = Math.max(0, prefs.wake - 30);
  const dayEnd = Math.min(24 * 60, prefs.sleep + 30);

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

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Study scheduled"
          value={fmtHours(s.scheduledStudyMin)}
          sub={`of ${fmtHours(s.requiredStudyMin)} recommended`}
          pct={studyPct}
        />
        <Stat
          label="Free time / week"
          value={fmtHours(s.freeMin)}
          sub={`goal ${prefs.freeTimePerWeek}h`}
        />
        <Stat
          label="Classes"
          value={String(classes.length)}
          sub={`${classes.reduce((a, c) => a + c.meetings.length, 0)} meetings`}
        />
        <Stat label="Commitments" value={String(commitments.length)} sub="work, gym, clubs…" />
      </div>

      {/* Warnings */}
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

      <CalendarGrid schedule={schedule} dayStart={dayStart} dayEnd={dayEnd} />

      <Legend classes={classes} />

      {/* Export */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-md">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon size={20} /> Add to Google or Apple Calendar
            </h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Download a <code className="text-[var(--color-ink)]">.ics</code> file — the universal
              calendar format. It imports into <strong>both</strong> Google Calendar and Apple
              Calendar, with each event repeating weekly until your term ends.
            </p>
            <div className="text-xs text-[var(--color-muted)] mt-3 space-y-1">
              <p>
                <strong className="text-[var(--color-ink)]">Google:</strong> Settings → Import &amp;
                export → select the file.
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">Apple:</strong> open the file, or
                Calendar → File → Import.
              </p>
            </div>
          </div>

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
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handleExport} className="btn btn-primary">
            <DownloadIcon size={16} /> Download .ics file
          </button>
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
          <div
            className="h-full rounded-full bg-[var(--color-ink)]"
            style={{ width: `${pct}%` }}
          />
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
