import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type FilterPrimitive = string | number | boolean;

// `defaults` must be a stable reference (module-level constant, or memoized) —
// it drives useMemo/useCallback deps below, so a fresh object each render defeats them.
export function useFilterState<T extends Record<string, FilterPrimitive>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = { ...defaults };
    (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
      const raw = searchParams.get(key as string);
      if (raw === null) return;
      const defaultValue = defaults[key];
      if (typeof defaultValue === 'number') {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) result[key] = parsed as T[keyof T];
      } else if (typeof defaultValue === 'boolean') {
        result[key] = (raw === 'true') as T[keyof T];
      } else {
        result[key] = raw as T[keyof T];
      }
    });
    return result;
  }, [searchParams, defaults]);

  // `replace: true` is for rapid-fire continuous input (typing, slider drag) so
  // every keystroke/tick doesn't spam browser history. Discrete changes (a
  // checkbox, a select, a button click) default to push so the back button
  // steps through them one at a time, per the filters-overhaul spec.
  const setValues = useCallback((patch: Partial<T>, options?: { replace?: boolean }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      (Object.keys(patch) as Array<keyof T>).forEach((key) => {
        const value = patch[key];
        if (value === undefined || value === defaults[key] || value === ('' as unknown as T[keyof T])) {
          next.delete(key as string);
        } else {
          next.set(key as string, String(value));
        }
      });
      return next;
    }, { replace: options?.replace ?? false });
  }, [setSearchParams, defaults]);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K], options?: { replace?: boolean }) => {
    setValues({ [key]: value } as Partial<T>, options);
  }, [setValues]);

  const resetAll = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      (Object.keys(defaults) as Array<keyof T>).forEach((key) => next.delete(key as string));
      return next;
    }, { replace: false });
  }, [setSearchParams, defaults]);

  const activeKeys = useMemo(
    () => (Object.keys(defaults) as Array<keyof T>).filter((key) => values[key] !== defaults[key]),
    [values, defaults],
  );

  return {
    values,
    setValue,
    setValues,
    resetAll,
    activeKeys,
    hasActiveFilters: activeKeys.length > 0,
    activeCount: activeKeys.length,
  };
}
