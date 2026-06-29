import { useMemo, useState } from 'react';
import type { GeneratedSchedule, ScheduleItem } from '../types';
import { DAY_ABBR, DAY_NAMES } from '../types';
import { fmtTime, fmtDuration } from '../lib/time';

interface Props {
  schedule: GeneratedSchedule;
  dayStart: number; // minutes
  dayEnd: number; // minutes
}

const KIND_ORDER: Record<string, number> = {
  free: 0,
  meal: 1,
  study: 2,
  commitment: 3,
  class: 4,
};

export default function CalendarGrid({ schedule, dayStart, dayEnd }: Props) {
  const [mobileDay, setMobileDay] = useState(0);

  const span = Math.max(60, dayEnd - dayStart);
  const pxPerMin = 0.95;
  const gridHeight = span * pxPerMin;

  const hourLines = useMemo(() => {
    const lines: number[] = [];
    const firstHour = Math.ceil(dayStart / 60);
    for (let h = firstHour; h * 60 <= dayEnd; h++) lines.push(h);
    return lines;
  }, [dayStart, dayEnd]);

  const byDay = useMemo(() => {
    const map: ScheduleItem[][] = [[], [], [], [], [], [], []];
    for (const it of schedule.items) map[it.day].push(it);
    for (const list of map) {
      list.sort(
        (a, b) => a.start - b.start || (KIND_ORDER[b.kind] ?? 0) - (KIND_ORDER[a.kind] ?? 0),
      );
    }
    return map;
  }, [schedule]);

  const renderEvent = (it: ScheduleItem) => {
    const top = (it.start - dayStart) * pxPerMin;
    const height = Math.max(16, (it.end - it.start) * pxPerMin);
    const isFree = it.kind === 'free';
    const isStudy = it.kind === 'study';
    const compact = height < 34;

    const style: React.CSSProperties = isFree
      ? {
          top,
          height,
          background: 'transparent',
          border: '1px dashed var(--color-border-strong)',
        }
      : isStudy
        ? {
            top,
            height,
            background: 'var(--color-ink)',
            border: '1px solid var(--color-ink)',
          }
        : {
            top,
            height,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${it.color}`,
            boxShadow: '0 1px 2px rgba(9,9,11,0.05)',
          };

    const titleColor = isStudy ? '#ffffff' : isFree ? 'var(--color-muted)' : 'var(--color-ink)';
    const subColor = isStudy ? 'rgba(255,255,255,0.72)' : 'var(--color-muted)';

    return (
      <div
        key={it.id}
        title={`${it.title} · ${fmtTime(it.start)}–${fmtTime(it.end)} (${fmtDuration(
          it.end - it.start,
        )})`}
        className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden text-left"
        style={style}
      >
        <div
          className="font-semibold leading-tight truncate tracking-tight"
          style={{ color: titleColor, fontSize: compact ? 10 : 12 }}
        >
          {it.title}
        </div>
        {!compact && (
          <div className="text-[10px] truncate tnum" style={{ color: subColor }}>
            {fmtTime(it.start)}–{fmtTime(it.end)}
            {it.location ? ` · ${it.location}` : ''}
          </div>
        )}
      </div>
    );
  };

  const dayColumn = (day: number, showAxisInline = false) => (
    <div className="relative" style={{ height: gridHeight }}>
      {/* hour gridlines */}
      {hourLines.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-[var(--color-border)]/55"
          style={{ top: (h * 60 - dayStart) * pxPerMin }}
        >
          {showAxisInline && (
            <span className="absolute -top-2 left-1 text-[10px] text-[var(--color-muted)] bg-[var(--color-bg)] px-1">
              {fmtTime(h * 60).replace(':00', '')}
            </span>
          )}
        </div>
      ))}
      {byDay[day].map(renderEvent)}
    </div>
  );

  return (
    <div>
      {/* Desktop: 7-column grid */}
      <div className="hidden md:block card p-3">
        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          {/* header */}
          <div />
          {DAY_ABBR.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-[var(--color-muted)] pb-2"
            >
              {d}
            </div>
          ))}
          {/* time axis */}
          <div className="relative" style={{ height: gridHeight }}>
            {hourLines.map((h) => (
              <div
                key={h}
                className="absolute right-1 text-[10px] text-[var(--color-muted)]"
                style={{ top: (h * 60 - dayStart) * pxPerMin - 6 }}
              >
                {fmtTime(h * 60).replace(':00', '')}
              </div>
            ))}
          </div>
          {/* day columns */}
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="border-l border-[var(--color-border)]/45 px-0.5">
              {dayColumn(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: single day with switcher */}
      <div className="md:hidden">
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {DAY_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => setMobileDay(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
                mobileDay === i
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
              }`}
            >
              {DAY_ABBR[i]}
            </button>
          ))}
        </div>
        <div className="card p-3">{dayColumn(mobileDay, true)}</div>
      </div>
    </div>
  );
}
