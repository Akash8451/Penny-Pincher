
'use client';

import { AppHeader } from '@/components/layout/app-header';
import SummaryCards from '@/components/dashboard/summary-cards';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import RecentExpenses from '@/components/dashboard/recent-expenses';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import ExpensesByCategoryChart from '@/components/dashboard/expenses-by-category-chart';
import SpendingTrendChart from '@/components/dashboard/spending-trend-chart';

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);

  const handleAddExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${new Date().getTime()}`,
      date: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <SummaryCards expenses={expenses} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <QuickExpenseForm categories={categories} onAddExpense={handleAddExpense} />
            <RecentExpenses expenses={expenses} categories={categories} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ExpensesByCategoryChart expenses={expenses} categories={categories} />
            <SpendingTrendChart expenses={expenses} />
        </div>
      </div>
    </>
  );
}
