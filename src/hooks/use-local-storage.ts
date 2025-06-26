
'use client';

import { useState, useEffect, useCallback } from 'react';

// Define a type for the custom event detail
interface LocalStorageChangeEvent<T> {
  key: string;
  value: T;
}

// This custom event will be used to notify other components in the same tab.
const dispatchStorageEvent = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<LocalStorageChangeEvent<T>>('local-storage-change', {
      detail: { key, value },
    })
  );
};


export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This effect runs only on the client, after component mount, to avoid hydration mismatch.
  useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
  }, [key]);

  useEffect(() => {
    // Listener for changes originating from the same tab (via custom event)
    const handleSameTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<LocalStorageChangeEvent<T>>;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value);
      }
    };
    
    // Listener for changes originating from other tabs (via storage event)
    const handleOtherTabChange = (event: StorageEvent) => {
        if (event.key === key && event.newValue) {
            try {
                setStoredValue(JSON.parse(event.newValue));
            } catch (error) {
                console.error(`Error parsing storage event value for key “${key}”:`, error);
            }
        }
    };

    window.addEventListener('local-storage-change', handleSameTabChange);
    window.addEventListener('storage', handleOtherTabChange);

    return () => {
      window.removeEventListener('local-storage-change', handleSameTabChange);
      window.removeEventListener('storage', handleOtherTabChange);
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        // This setStoredValue is for the current component instance
        setStoredValue(valueToStore);
        // This writes to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // This notifies other components in the same tab
        dispatchStorageEvent(key, valueToStore);
      } catch (error) {
        console.error(`Error saving to localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
