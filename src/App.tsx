import { useApp } from './state/AppContext';
import Stepper from './components/Stepper';
import Landing from './components/Landing';
import SchoolStep from './components/steps/SchoolStep';
import ClassesStep from './components/steps/ClassesStep';
import CommitmentsStep from './components/steps/CommitmentsStep';
import PreferencesStep from './components/steps/PreferencesStep';
import ScheduleStep from './components/steps/ScheduleStep';
import { ArrowLeft, ArrowRight, RefreshIcon } from './components/Icons';
import { usePlan } from './features/PlanContext';
import ProBadge from './features/ProBadge';

const STEPS = [
  { label: 'School', icon: '🏫' },
  { label: 'Classes', icon: '📚' },
  { label: 'Commitments', icon: '🗂️' },
  { label: 'Preferences', icon: '⚙️' },
  { label: 'Schedule', icon: '🗓️' },
];

export default function App() {
  const { state, dispatch, resetAll } = useApp();
  const { isPro, promptUpgrade, downgrade } = usePlan();
  const step = state.step;

  const go = (i: number) =>
    dispatch({ type: 'setStep', step: Math.max(0, Math.min(STEPS.length - 1, i)) });

  const nextDisabled = step === 1 && state.classes.length === 0;
  const nextLabel = step === 3 ? 'Generate schedule' : 'Next';

  if (!state.entered) {
    return (
      <Landing
        onStart={() => dispatch({ type: 'enter', step: 0 })}
        onLoadExample={() => {
          dispatch({ type: 'loadDemo' });
          go(4);
        }}
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col animate-in">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => dispatch({ type: 'goLanding' })}
            className="flex items-center gap-3 text-left"
            title="Back to home"
          >
            <div className="h-9 w-9 rounded-lg grid place-items-center text-base font-bold bg-[var(--color-ink)] text-white">
              C
            </div>
            <div>
              <div className="font-semibold leading-none tracking-tight">CourseNest</div>
              <div className="text-[11px] text-[var(--color-muted)] leading-none mt-1 uppercase tracking-[0.14em]">
                Semester Scheduler
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {isPro ? (
              <button
                onClick={() => {
                  if (confirm('Switch back to the Free plan? (for testing)')) downgrade();
                }}
                className="inline-flex items-center gap-1.5 text-sm"
                title="You're on CourseNest Pro — click to switch back to Free"
              >
                <ProBadge />
              </button>
            ) : (
              <button onClick={() => promptUpgrade()} className="btn btn-ghost !py-1.5 text-sm">
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={() => {
                dispatch({ type: 'loadDemo' });
                go(4);
              }}
              className="btn btn-subtle !py-1.5 text-sm"
            >
              Load example
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all classes, commitments and preferences?')) resetAll();
              }}
              className="btn btn-ghost !py-1.5 text-sm"
            >
              Start over
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5">
        <Stepper steps={STEPS} current={step} onJump={go} maxReached={STEPS.length - 1} />
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-28 flex-1">
        {step === 0 && <SchoolStep />}
        {step === 1 && <ClassesStep />}
        {step === 2 && <CommitmentsStep />}
        {step === 3 && <PreferencesStep />}
        {step === 4 && <ScheduleStep />}
      </main>

      {/* Sticky footer nav */}
      <footer className="fixed bottom-0 inset-x-0 z-20 backdrop-blur-md bg-[var(--color-bg)]/80 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => go(step - 1)} disabled={step === 0} className="btn btn-ghost">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-xs text-[var(--color-muted)] hidden sm:block tnum">
            Step {step + 1} of {STEPS.length} · {STEPS[step].label}
          </div>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => go(step + 1)}
              disabled={nextDisabled}
              title={nextDisabled ? 'Add at least one class first' : ''}
              className="btn btn-primary"
            >
              {nextLabel} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => go(0)} className="btn btn-ghost">
              <RefreshIcon size={16} /> Edit inputs
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
