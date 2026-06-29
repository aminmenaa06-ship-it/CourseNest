import { useApp } from '../../state/AppContext';
import type { Commitment, CommitmentType } from '../../types';
import BlocksEditor from '../BlocksEditor';
import { COMMITMENT_META } from '../../lib/colors';

let n = 0;
const newId = () => `cmt-${Date.now().toString(36)}-${n++}`;

const QUICK: { type: CommitmentType; defaultTitle: string }[] = [
  { type: 'work', defaultTitle: 'Work' },
  { type: 'gym', defaultTitle: 'Gym' },
  { type: 'club', defaultTitle: 'Club meeting' },
  { type: 'volunteer', defaultTitle: 'Volunteering' },
  { type: 'personal', defaultTitle: 'Personal time' },
];

export default function CommitmentsStep() {
  const { state, dispatch } = useApp();

  function add(type: CommitmentType, defaultTitle: string) {
    const meta = COMMITMENT_META[type];
    const item: Commitment = {
      id: newId(),
      title: defaultTitle,
      type,
      color: meta.color,
      blocks: [{ day: 0, start: 9 * 60, end: 10 * 60 }],
    };
    dispatch({ type: 'addCommitment', item });
  }

  return (
    <div className="animate-in flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold">Life outside class</h2>
        <p className="text-[var(--color-muted)] mt-1 max-w-2xl">
          Add anything with a fixed time — a job, gym sessions, club meetings, volunteering,
          appointments. CourseNest schedules study and free time <em>around</em> these. This step is
          optional.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => {
          const meta = COMMITMENT_META[q.type];
          return (
            <button
              key={q.type}
              onClick={() => add(q.type, q.defaultTitle)}
              className="btn btn-ghost"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: meta.color }}
              />
              Add {meta.label.toLowerCase()}
            </button>
          );
        })}
      </div>

      {state.commitments.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">
          No commitments yet. Add one above, or skip ahead — you can always come back.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {state.commitments.map((c) => (
            <CommitmentCard
              key={c.id}
              item={c}
              onChange={(item) => dispatch({ type: 'updateCommitment', item })}
              onRemove={() => dispatch({ type: 'removeCommitment', id: c.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommitmentCard({
  item,
  onChange,
  onRemove,
}: {
  item: Commitment;
  onChange: (item: Commitment) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<Commitment>) => onChange({ ...item, ...patch });
  const meta = COMMITMENT_META[item.type];

  return (
    <div className="card p-5" style={{ borderLeft: `3px solid ${item.color}` }}>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
        <input
          className="input flex-1"
          value={item.title}
          placeholder={meta.label}
          onChange={(e) => set({ title: e.target.value })}
        />
        <select
          className="select !w-auto"
          value={item.type}
          onChange={(e) => {
            const type = e.target.value as CommitmentType;
            set({ type, color: COMMITMENT_META[type].color });
          }}
        >
          {(
            ['work', 'volunteer', 'gym', 'club', 'personal'] as CommitmentType[]
          ).map((t) => (
            <option key={t} value={t}>
              {COMMITMENT_META[t].label}
            </option>
          ))}
        </select>
        <button
          onClick={onRemove}
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none px-1"
          aria-label="Remove commitment"
        >
          ×
        </button>
      </div>
      <div className="mt-4">
        <label className="label">When</label>
        <BlocksEditor blocks={item.blocks} onChange={(blocks) => set({ blocks })} withLocation={false} />
      </div>
    </div>
  );
}
