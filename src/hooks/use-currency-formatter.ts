
'use client';

import { useCallback } from 'react';
import { useSettings } from '@/contexts/settings-context';

export function useCurrencyFormatter() {
  const { currency } = useSettings();

  const formatter = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(amount);
      } catch (error) {
        console.warn(`Currency formatting error for currency code "${currency}". Falling back to default.`, error);
        // Fallback to a simple format if the currency code is invalid
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      }
    },
    [currency]
  );

  return formatter;
}
