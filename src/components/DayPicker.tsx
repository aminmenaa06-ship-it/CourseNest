import type { DayIndex } from '../types';
import { DAY_ABBR } from '../types';

interface Props {
  value: DayIndex[];
  onChange: (days: DayIndex[]) => void;
  size?: 'sm' | 'md';
}

export default function DayPicker({ value, onChange, size = 'md' }: Props) {
  const set = new Set(value);
  const toggle = (d: DayIndex) => {
    const next = new Set(set);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    onChange(Array.from(next).sort((a, b) => a - b) as DayIndex[]);
  };
  const pad = size === 'sm' ? 'h-8 w-9 text-xs' : 'h-10 w-11 text-sm';
  return (
    <div className="flex gap-1.5">
      {DAY_ABBR.map((label, i) => {
        const active = set.has(i as DayIndex);
        return (
          <button
            key={label}
            type="button"
            onClick={() => toggle(i as DayIndex)}
            className={`${pad} rounded-lg font-semibold transition-colors ${
              active
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {label[0]}
          </button>
        );
      })}
    </div>
  );
}
