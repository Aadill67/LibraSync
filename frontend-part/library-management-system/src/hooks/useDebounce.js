import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value by the specified delay.
 * Useful for search inputs to avoid firing API calls on every keystroke.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
