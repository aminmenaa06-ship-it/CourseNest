import type { DayIndex, TimeBlock } from '../types';
import { DAY_ABBR } from '../types';
import { fromTimeInput, toTimeInput } from '../lib/time';

interface Props {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
  withLocation?: boolean;
}

/** Editable list of recurring weekly time blocks. */
export default function BlocksEditor({ blocks, onChange, withLocation = true }: Props) {
  const update = (i: number, patch: Partial<TimeBlock>) => {
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...blocks, { day: 0, start: 9 * 60, end: 10 * 60 }]);

  return (
    <div className="flex flex-col gap-2">
      {blocks.length === 0 && (
        <p className="text-sm text-[var(--color-muted)] italic">No times yet — add one below.</p>
      )}
      {blocks.map((b, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-2"
        >
          <select
            className="select !w-auto !py-1.5"
            value={b.day}
            onChange={(e) => update(i, { day: Number(e.target.value) as DayIndex })}
          >
            {DAY_ABBR.map((d, idx) => (
              <option key={d} value={idx}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            className="input !w-auto !py-1.5"
            value={toTimeInput(b.start)}
            onChange={(e) => update(i, { start: fromTimeInput(e.target.value) })}
          />
          <span className="text-[var(--color-muted)]">→</span>
          <input
            type="time"
            className="input !w-auto !py-1.5"
            value={toTimeInput(b.end)}
            onChange={(e) => update(i, { end: fromTimeInput(e.target.value) })}
          />
          {withLocation && (
            <input
              type="text"
              placeholder="Location (optional)"
              className="input !w-auto flex-1 min-w-[8rem] !py-1.5"
              value={b.location ?? ''}
              onChange={(e) => update(i, { location: e.target.value })}
            />
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-ink)] px-2 text-lg leading-none"
            aria-label="Remove time"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="btn btn-subtle self-start !py-1.5">
        + Add time
      </button>
    </div>
  );
}
