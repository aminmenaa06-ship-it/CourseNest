import { useCallback, useEffect, useState } from 'react';
import type { AppSnapshot } from '../types';

// Saved schedules persist locally today (keyed per browser). When real accounts
// land, this is the layer to sync to the server — the rest of the app only deals
// with the SavedSchedule shape below.
const KEY = 'coursenest:saved';

export interface SavedSchedule {
  id: string;
  name: string;
  updatedAt: number;
  snapshot: AppSnapshot;
}

function load(): SavedSchedule[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? (raw as SavedSchedule[]) : [];
  } catch {
    return [];
  }
}

let counter = 0;
const newId = () => `sched-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function useSavedSchedules() {
  const [items, setItems] = useState<SavedSchedule[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [items]);

  /** Create a new saved schedule. */
  const create = useCallback((name: string, snapshot: AppSnapshot) => {
    const item: SavedSchedule = {
      id: newId(),
      name: name.trim() || 'Untitled schedule',
      updatedAt: Date.now(),
      snapshot,
    };
    setItems((list) => [item, ...list]);
    return item;
  }, []);

  /** Overwrite an existing saved schedule's snapshot (e.g. after edits). */
  const update = useCallback((id: string, snapshot: AppSnapshot) => {
    setItems((list) =>
      list.map((s) => (s.id === id ? { ...s, snapshot, updatedAt: Date.now() } : s)),
    );
  }, []);

  const rename = useCallback((id: string, name: string) => {
    setItems((list) => list.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((s) => s.id !== id));
  }, []);

  return { items, create, update, rename, remove };
}
