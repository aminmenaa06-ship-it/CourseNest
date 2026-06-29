import type { Strategy, StrategyKey } from '../features/backupStrategies';
import ProBadge from '../features/ProBadge';
import { CheckIcon, PlusCircle } from './Icons';

export interface BackupSummary {
  key: StrategyKey;
  label: string;
  description: string;
  studyPct: number;
  freeHrs: string;
}

interface Props {
  primary: { studyPct: number; freeHrs: string };
  backups: BackupSummary[];
  available: Strategy[];
  activeKey: StrategyKey | null;
  onSelect: (key: StrategyKey | null) => void;
  onAdd: (key: StrategyKey) => void;
  onRemove: (key: StrategyKey) => void;
}

export default function BackupSchedules({
  primary,
  backups,
  available,
  activeKey,
  onSelect,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight">Backup schedules</h3>
        <ProBadge tone="outline" />
      </div>
      <p className="text-sm text-[var(--color-muted)] mt-1">
        Build alternate “Plan B” options and preview any of them in the calendar above.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <OptionRow
          label="Primary plan"
          description="Your main schedule from the steps above."
          studyPct={primary.studyPct}
          freeHrs={primary.freeHrs}
          active={activeKey === null}
          onSelect={() => onSelect(null)}
        />
        {backups.map((b) => (
          <OptionRow
            key={b.key}
            label={b.label}
            description={b.description}
            studyPct={b.studyPct}
            freeHrs={b.freeHrs}
            active={activeKey === b.key}
            onSelect={() => onSelect(b.key)}
            onRemove={() => onRemove(b.key)}
          />
        ))}
      </div>

      {available.length > 0 && (
        <div className="mt-4">
          <span className="label">Add a backup option</span>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => (
              <button
                key={s.key}
                onClick={() => onAdd(s.key)}
                className="btn btn-ghost !py-1.5 text-sm"
                title={s.description}
              >
                <PlusCircle size={15} /> {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({
  label,
  description,
  studyPct,
  freeHrs,
  active,
  onSelect,
  onRemove,
}: {
  label: string;
  description: string;
  studyPct: number;
  freeHrs: string;
  active: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        active
          ? 'border-[var(--color-ink)] bg-[var(--color-surface-2)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <button
        onClick={onSelect}
        className={`h-5 w-5 rounded-full grid place-items-center shrink-0 border ${
          active
            ? 'bg-[var(--color-ink)] border-[var(--color-ink)] text-white'
            : 'border-[var(--color-border-strong)] text-transparent hover:border-[var(--color-ink)]'
        }`}
        aria-label={active ? `${label} (showing)` : `Preview ${label}`}
      >
        <CheckIcon size={12} />
      </button>

      <button onClick={onSelect} className="flex-1 text-left min-w-0">
        <div className="font-medium text-sm flex items-center gap-2">
          {label}
          {active && (
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] font-semibold">
              Showing
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-muted)] truncate">{description}</div>
      </button>

      <div className="text-right shrink-0 tnum">
        <div className="text-sm font-semibold">{studyPct}%</div>
        <div className="text-[11px] text-[var(--color-muted)]">{freeHrs} free</div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg leading-none px-1 shrink-0"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
