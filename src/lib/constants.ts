
import type { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Drinks', group: 'Essentials', icon: 'Coffee' },
  { id: 'cat-2', name: 'Rent/Mortgage', group: 'Essentials', icon: 'Home' },
  { id: 'cat-3', name: 'Transportation', group: 'Essentials', icon: 'Bus' },
  { id: 'cat-4', name: 'Groceries', group: 'Essentials', icon: 'ShoppingCart' },
  { id: 'cat-5', name: 'Utilities', group: 'Essentials', icon: 'Zap' },
  { id: 'cat-6', name: 'Education', group: 'Personal Growth', icon: 'BookOpen' },
  { id: 'cat-7', name: 'Health', group: 'Personal Growth', icon: 'HeartPulse' },
  { id: 'cat-8', name: 'Entertainment', group: 'Discretionary', icon: 'Film' },
  { id: 'cat-9', name: 'Shopping', group: 'Discretionary', icon: 'ShoppingBag' },
  { id: 'cat-10', name: 'Travel', group: 'Discretionary', icon: 'Plane' },
  { id: 'cat-11', name: 'Other', group: 'Miscellaneous', icon: 'Package' },
];

export const DEFAULT_CURRENCY = 'USD';
