interface Props {
  steps: { label: string; icon: string }[];
  current: number;
  onJump: (i: number) => void;
  maxReached: number;
}

export default function Stepper({ steps, current, onJump, maxReached }: Props) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const reachable = i <= maxReached;
        return (
          <div key={s.label} className="flex items-center">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[var(--color-brand)] text-white'
                  : done
                    ? 'text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
                    : 'text-[var(--color-muted)]'
              } ${reachable ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
            >
              <span
                className={`grid place-items-center h-5 w-5 rounded-full text-xs ${
                  active
                    ? 'bg-white/25'
                    : done
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-[var(--color-surface-2)]'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="mx-0.5 sm:mx-1 text-[var(--color-border)]">—</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
