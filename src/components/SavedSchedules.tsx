import { useState } from 'react';
import { useApp } from '../state/AppContext';
import type { AppSnapshot } from '../types';
import { useSavedSchedules } from '../features/savedSchedules';
import ProBadge from '../features/ProBadge';

export default function SavedSchedules() {
  const { state, dispatch } = useApp();
  const { items, create, update, remove } = useSavedSchedules();
  const [name, setName] = useState('');

  const snapshot = (): AppSnapshot => ({
    schoolId: state.schoolId,
    customStudyHoursPerUnit: state.customStudyHoursPerUnit,
    classes: state.classes,
    commitments: state.commitments,
    prefs: state.prefs,
  });

  function handleSave() {
    create(name, snapshot());
    setName('');
  }

  function handleLoad(id: string) {
    const item = items.find((s) => s.id === id);
    if (!item) return;
    if (state.classes.length > 0 && !confirm('Open this saved schedule? Your current setup will be replaced.')) {
      return;
    }
    dispatch({ type: 'loadSnapshot', snapshot: item.snapshot });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight">Saved schedules</h3>
        <ProBadge tone="outline" />
      </div>
      <p className="text-sm text-[var(--color-muted)] mt-1">
        Save this schedule to reopen later — when classes or commitments change, adjust it here and
        re-export the updated calendar.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          className="input flex-1"
          placeholder="Name this schedule (e.g. Fall 2026)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} className="btn btn-primary shrink-0">
          Save current schedule
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] mt-4 italic">
          Nothing saved yet. Saved schedules live on your account so you can pick up where you left
          off.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] p-3"
            >
              <div className="flex-1 min-w-[10rem]">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {s.snapshot.classes.length} class{s.snapshot.classes.length === 1 ? '' : 'es'} ·{' '}
                  {s.snapshot.commitments.length} commitment
                  {s.snapshot.commitments.length === 1 ? '' : 's'} · saved{' '}
                  {new Date(s.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <button onClick={() => handleLoad(s.id)} className="btn btn-ghost !py-1.5 text-sm">
                Open
              </button>
              <button
                onClick={() => update(s.id, snapshot())}
                className="btn btn-subtle !py-1.5 text-sm"
                title="Overwrite with the current schedule"
              >
                Update
              </button>
              <button
                onClick={() => remove(s.id)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg leading-none px-1"
                aria-label={`Delete ${s.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
