
export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // ISO string
  receipt?: string; // data URL for the image
  splitWith?: string[]; // Array of person IDs
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
