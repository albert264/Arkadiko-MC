'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
    setIsHydrated(true);
  }, [key]);

  // Save to localStorage with debounce
  useEffect(() => {
    if (!isHydrated) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('localStorage save failed:', error);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, isHydrated]);

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      return resolved;
    });
  }, []);

  return [value, setStoredValue, isHydrated];
}
