
export interface Split {
  personId: string;
  amount: number;
  settled: boolean;
}

export interface Expense {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  note: string;
  date: string; // ISO string
  receipt?: string; // data URL for the image
  splitWith?: Split[];
  relatedExpenseId?: string; // To link income to original expense
}

export interface Category {
  id: string;
  name: string;
  group: string;
  icon: string; // lucide-react icon name
}

export interface Person {
  id: string;
  name: string;
  tags?: string[];
}

export interface Settings {
  userName: string;
  baseCurrency: string;
  // Manual exchange rates relative to the base currency
  exchangeRates: { [currency: string]: number };
}

export interface SavingsGoal {
  id: string;
  name: string;
  amount: number;
  month: string; // YYYY-MM
}
