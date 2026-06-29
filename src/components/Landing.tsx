import Reveal from './Reveal';
import { ArrowRight, CalendarIcon, CheckIcon, UploadIcon } from './Icons';

interface Props {
  onStart: () => void;
  onLoadExample: () => void;
}

export default function Landing({ onStart, onLoadExample }: Props) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-full">
      {/* Slim top nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/72 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md grid place-items-center text-sm font-bold bg-[var(--color-ink)] text-white">
              C
            </div>
            <span className="font-semibold tracking-tight">CourseNest</span>
          </div>
          <button onClick={onStart} className="btn btn-primary !py-1.5 !px-4 text-sm">
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
          <Reveal delay={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Smart Semester Scheduler
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-5 text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-7xl font-semibold tracking-[-0.035em] text-[var(--color-ink)]">
              Your whole semester,
              <br />
              scheduled in minutes.
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl leading-relaxed text-[var(--color-muted)]">
              Upload your syllabi. CourseNest reads each class, calculates study time from your
              school's official guidelines, and builds a balanced weekly plan around work, the gym,
              clubs, and everything else — ready for Google or Apple Calendar.
            </p>
          </Reveal>
          <Reveal delay={270}>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onStart} className="btn btn-primary !px-6 !py-3 text-base">
                Get started <ArrowRight size={17} />
              </button>
              <button
                onClick={() => scrollTo('how')}
                className="btn btn-ghost !px-6 !py-3 text-base"
              >
                See how it works
              </button>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <p className="mt-4 text-xs text-[var(--color-muted)]">
              Free · works in your browser · nothing leaves your device.
            </p>
          </Reveal>
        </div>

        {/* Product mock */}
        <Reveal delay={120} y={36}>
          <div className="max-w-4xl mx-auto px-5 sm:px-6 pb-24">
            <HeroCalendar />
            <div className="mt-3 text-center">
              <button
                onClick={onLoadExample}
                className="text-sm text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink)] transition-colors"
              >
                Preview a finished example schedule →
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-center">
              Three steps. No spreadsheets.
            </h2>
            <p className="mt-3 text-center text-[var(--color-muted)] max-w-xl mx-auto">
              The whole flow takes about five minutes, and you can edit anything before you export.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <div className="card p-7 h-full">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl grid place-items-center bg-[var(--color-ink)] text-white">
                      <s.icon size={20} />
                    </div>
                    <span className="text-5xl font-semibold text-[var(--color-border-strong)] tnum leading-none">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em]">
                Study time, grounded in real guidelines.
              </h2>
              <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                Tell CourseNest your school and it applies that institution's published
                credit-hour policy — the same 1 hour of class plus 2 hours of study per unit that
                UC, CSU, the UT System, SUNY, CUNY, and Florida's universities all define. If a
                syllabus states its own weekly workload, that number wins.
              </p>
              <ul className="mt-6 space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 h-5 w-5 rounded-full grid place-items-center bg-[var(--color-ink)] text-white shrink-0">
                      <CheckIcon size={13} />
                    </span>
                    <span className="text-sm text-[var(--color-ink-2)]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} y={30}>
            <BalanceCard />
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-ink)] text-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em]">
              Build your best semester yet.
            </h2>
            <p className="mt-4 text-white/65 max-w-xl mx-auto">
              Start with a single syllabus — add the rest whenever you're ready.
            </p>
            <button
              onClick={onStart}
              className="mt-9 btn !px-7 !py-3 text-base bg-white text-[var(--color-ink)] hover:bg-white/90"
            >
              Get started <ArrowRight size={17} />
            </button>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
          <span>© {new Date().getFullYear()} CourseNest</span>
          <span>Schedules generated locally · exports to Google &amp; Apple Calendar</span>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  {
    icon: UploadIcon,
    title: 'Upload your syllabi',
    body: 'Drop in a PDF for each class. CourseNest pulls the course name, units, meeting times, and expected workload automatically — you just confirm.',
  },
  {
    icon: CalendarIcon,
    title: 'Add the rest of your life',
    body: 'Work shifts, gym sessions, club meetings, volunteering, and how much free time you want to protect each week.',
  },
  {
    icon: CheckIcon,
    title: 'Export to your calendar',
    body: 'Get a balanced weekly plan with study blocks placed around everything, then download one file that imports into Google or Apple Calendar.',
  },
];

const FEATURES = [
  'Coverage across the UC, CSU, UT, SUNY, CUNY, and Florida systems — plus a custom rate.',
  'Study blocks spread across the week and shaped to your preferred hours.',
  'Protects the free time you ask for before filling the rest with study.',
  'One universal .ics export — no accounts, no logins, no data leaves your browser.',
];

// ---- Monochrome product mock ----

interface MockEvent {
  col: number; // 0..4 (Mon..Fri)
  top: number;
  height: number;
  label: string;
  kind: 'class' | 'study' | 'commit';
  bar?: string;
}

const MOCK: MockEvent[] = [
  { col: 0, top: 8, height: 34, label: 'MATH 1B', kind: 'class', bar: '#3f3f46' },
  { col: 0, top: 120, height: 58, label: 'Study', kind: 'study' },
  { col: 1, top: 40, height: 34, label: 'CS 61A', kind: 'class', bar: '#71717a' },
  { col: 1, top: 150, height: 40, label: 'Gym', kind: 'commit', bar: '#a1a1aa' },
  { col: 2, top: 8, height: 46, label: 'Study', kind: 'study' },
  { col: 2, top: 120, height: 34, label: 'PSYCH 1', kind: 'class', bar: '#52525b' },
  { col: 3, top: 40, height: 34, label: 'CS 61A', kind: 'class', bar: '#71717a' },
  { col: 3, top: 130, height: 58, label: 'Study', kind: 'study' },
  { col: 4, top: 8, height: 34, label: 'MATH 1B', kind: 'class', bar: '#3f3f46' },
  { col: 4, top: 96, height: 46, label: 'Work', kind: 'commit', bar: '#a1a1aa' },
];

function HeroCalendar() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <div className="card p-4 sm:p-5 shadow-[0_30px_70px_-40px_rgba(9,9,11,0.45)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold tracking-tight">This week</span>
        <span className="chip">Auto-generated</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((d, col) => (
          <div key={d}>
            <div className="text-[11px] font-semibold text-[var(--color-muted)] text-center mb-1.5">
              {d}
            </div>
            <div className="relative h-[210px] rounded-lg bg-[var(--color-surface-2)]/60">
              {MOCK.filter((e) => e.col === col).map((e, i) => {
                const isStudy = e.kind === 'study';
                return (
                  <div
                    key={i}
                    className="absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden"
                    style={{
                      top: e.top,
                      height: e.height,
                      background: isStudy ? 'var(--color-ink)' : 'var(--color-surface)',
                      border: isStudy ? '1px solid var(--color-ink)' : '1px solid var(--color-border)',
                      borderLeft: isStudy ? '1px solid var(--color-ink)' : `3px solid ${e.bar}`,
                      boxShadow: isStudy ? 'none' : '0 1px 2px rgba(9,9,11,0.05)',
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold tracking-tight leading-tight block truncate"
                      style={{ color: isStudy ? '#fff' : 'var(--color-ink)' }}
                    >
                      {e.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceCard() {
  const rows = [
    { label: 'Classes', value: 78, note: '12 meetings' },
    { label: 'Study', value: 62, note: '26 hrs / week' },
    { label: 'Commitments', value: 40, note: 'work · gym · clubs' },
    { label: 'Free time', value: 52, note: 'protected' },
  ];
  return (
    <div className="card p-7">
      <div className="text-sm font-semibold tracking-tight">A balanced week</div>
      <p className="text-xs text-[var(--color-muted)] mt-1">
        Every hour accounted for — without overloading any single day.
      </p>
      <div className="mt-6 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-[var(--color-muted)]">{r.note}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-ink)]"
                style={{ width: `${r.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
