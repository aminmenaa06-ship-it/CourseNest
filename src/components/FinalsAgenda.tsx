import type { FinalsEvent, FinalsPlan } from '../lib/finalsScheduler';
import { fmtTime, fmtDuration } from '../lib/time';

function fmtDateHeader(iso: string): { weekday: string; rest: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    rest: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
}

export default function FinalsAgenda({ plan }: { plan: FinalsPlan }) {
  if (plan.events.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        Nothing to plan yet — add at least one final with a date.
      </p>
    );
  }

  // Group events by date, preserving sorted order.
  const byDate: { date: string; events: FinalsEvent[] }[] = [];
  for (const ev of plan.events) {
    let group = byDate.find((g) => g.date === ev.date);
    if (!group) {
      group = { date: ev.date, events: [] };
      byDate.push(group);
    }
    group.events.push(ev);
  }

  return (
    <div className="flex flex-col gap-4">
      {byDate.map((g) => {
        const { weekday, rest } = fmtDateHeader(g.date);
        const hasExam = g.events.some((e) => e.kind === 'exam');
        return (
          <div key={g.date} className="grid grid-cols-[64px_1fr] gap-3">
            <div className="text-right pt-1">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {weekday}
              </div>
              <div className="font-semibold tnum leading-tight">{rest}</div>
              {hasExam && (
                <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink)] font-bold mt-0.5">
                  Exam
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 border-l border-[var(--color-border)] pl-3">
              {g.events.map((ev) => {
                const isExam = ev.kind === 'exam';
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                    style={{
                      background: isExam ? 'var(--color-ink)' : 'var(--color-surface)',
                      border: isExam ? '1px solid var(--color-ink)' : '1px solid var(--color-border)',
                      borderLeft: isExam ? '1px solid var(--color-ink)' : `3px solid ${ev.color}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: isExam ? '#fff' : 'var(--color-ink)' }}
                      >
                        {ev.title}
                      </div>
                      <div
                        className="text-xs tnum truncate"
                        style={{ color: isExam ? 'rgba(255,255,255,0.72)' : 'var(--color-muted)' }}
                      >
                        {fmtTime(ev.start)}–{fmtTime(ev.end)} · {fmtDuration(ev.end - ev.start)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
