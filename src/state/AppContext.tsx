import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppState,
  ClassItem,
  Commitment,
  Preferences,
} from '../types';
import { DEFAULT_SCHOOL_ID } from '../data/schools';
import { loadState, saveState, clearState } from '../lib/storage';
import { addWeeksISO, nextMondayISO } from '../lib/time';
import { demoClasses, demoCommitments } from '../data/samples';

const defaultPrefs = (): Preferences => {
  const termStart = nextMondayISO();
  return {
    wake: 7 * 60,
    sleep: 23 * 60,
    freeTimePerWeek: 20,
    studyWindow: 'any',
    maxStudyBlock: 120,
    minBreak: 30,
    studyDays: [0, 1, 2, 3, 4, 5, 6],
    includeMeals: true,
    termStart,
    termEnd: addWeeksISO(termStart, 16),
  };
};

const initialState = (): AppState => ({
  schoolId: DEFAULT_SCHOOL_ID,
  customStudyHoursPerUnit: null,
  classes: [],
  commitments: [],
  prefs: defaultPrefs(),
  step: 0,
  entered: false,
});

type Action =
  | { type: 'setSchool'; id: string }
  | { type: 'setCustomHours'; value: number | null }
  | { type: 'addClass'; item: ClassItem }
  | { type: 'updateClass'; item: ClassItem }
  | { type: 'removeClass'; id: string }
  | { type: 'addCommitment'; item: Commitment }
  | { type: 'updateCommitment'; item: Commitment }
  | { type: 'removeCommitment'; id: string }
  | { type: 'setPrefs'; patch: Partial<Preferences> }
  | { type: 'setStep'; step: number }
  | { type: 'enter'; step?: number }
  | { type: 'goLanding' }
  | { type: 'loadDemo' }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setSchool':
      return { ...state, schoolId: action.id };
    case 'setCustomHours':
      return { ...state, customStudyHoursPerUnit: action.value };
    case 'addClass':
      return { ...state, classes: [...state.classes, action.item] };
    case 'updateClass':
      return {
        ...state,
        classes: state.classes.map((c) => (c.id === action.item.id ? action.item : c)),
      };
    case 'removeClass':
      return { ...state, classes: state.classes.filter((c) => c.id !== action.id) };
    case 'addCommitment':
      return { ...state, commitments: [...state.commitments, action.item] };
    case 'updateCommitment':
      return {
        ...state,
        commitments: state.commitments.map((c) =>
          c.id === action.item.id ? action.item : c,
        ),
      };
    case 'removeCommitment':
      return {
        ...state,
        commitments: state.commitments.filter((c) => c.id !== action.id),
      };
    case 'setPrefs':
      return { ...state, prefs: { ...state.prefs, ...action.patch } };
    case 'setStep':
      return { ...state, step: action.step };
    case 'enter':
      return { ...state, entered: true, step: action.step ?? state.step };
    case 'goLanding':
      return { ...state, entered: false };
    case 'loadDemo':
      return {
        ...state,
        entered: true,
        schoolId: 'uc-berkeley',
        classes: demoClasses(),
        commitments: demoCommitments(),
      };
    case 'reset':
      return initialState();
    default:
      return state;
  }
}

function init(): AppState {
  const base = initialState();
  const saved = loadState();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    prefs: { ...base.prefs, ...(saved.prefs ?? {}) },
    classes: saved.classes ?? [],
    commitments: saved.commitments ?? [],
  };
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  resetAll: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      resetAll: () => {
        clearState();
        dispatch({ type: 'reset' });
      },
    }),
    [state],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
