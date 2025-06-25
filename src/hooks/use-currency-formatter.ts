
'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';

export function useCurrencyFormatter() {
  const [language] = useLocalStorage('language', 'en-US');
  const [currency] = useLocalStorage('currency', 'USD');

  const formatter = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(language, {
          style: 'currency',
          currency: currency,
        }).format(amount);
      } catch (error) {
        console.error("Currency formatting error:", error);
        // Fallback to a simple format if the currency code is invalid
        return `$${amount.toFixed(2)}`;
      }
    },
    [language, currency]
  );

  return formatter;
}
