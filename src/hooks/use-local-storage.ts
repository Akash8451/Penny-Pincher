
'use client';

import { useState, useEffect, useCallback } from 'react';

// This pub/sub system allows different components using the same hook
// to stay in sync without prop drilling or context.
const subscribers = new Map<string, Set<React.Dispatch<any>>>();

const subscribe = (key: string, callback: React.Dispatch<any>) => {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(callback);
};

const unsubscribe = (key: string, callback: React.Dispatch<any>) => {
  subscribers.get(key)?.delete(callback);
  if (subscribers.get(key)?.size === 0) {
    subscribers.delete(key);
  }
};

const broadcast = (key: string, value: any) => {
  subscribers.get(key)?.forEach((callback) => {
    callback(value);
  });
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This function runs only on initial render on the client,
    // preventing hydration mismatches.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    // Subscribe the component's state setter to future updates.
    subscribe(key, setStoredValue);
    
    // Also, listen for changes from other browser tabs.
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === key && event.newValue) {
            try {
                const newValue = JSON.parse(event.newValue);
                broadcast(key, newValue); // Notify all components in this tab.
            } catch (error) {
                console.error(`Error parsing storage event value for key “${key}”:`, error);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup on unmount.
    return () => {
      unsubscribe(key, setStoredValue);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState.
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save to local storage.
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        // Broadcast the change to all subscribed components in this tab.
        broadcast(key, valueToStore);

      } catch (error) {
        console.error(`Error saving to localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
