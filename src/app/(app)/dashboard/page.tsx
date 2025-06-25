
'use client';

import { AppHeader } from '@/components/layout/app-header';
import SummaryCards from '@/components/dashboard/summary-cards';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import RecentExpenses from '@/components/dashboard/recent-expenses';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import ExpensesByCategoryChart from '@/components/dashboard/expenses-by-category-chart';
import SpendingTrendChart from '@/components/dashboard/spending-trend-chart';
import AIAssistant from '@/components/dashboard/ai-assistant';
import SavingsGoal from '@/components/dashboard/savings-goal';

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);


  const handleAddExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${new Date().getTime()}`,
      date: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };


  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <SummaryCards expenses={expenses} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SavingsGoal expenses={expenses} />
            <AIAssistant expenses={expenses} categories={categories} people={people} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <QuickExpenseForm categories={categories} people={people} onAddExpense={handleAddExpense} />
            <RecentExpenses expenses={expenses} categories={categories} people={people} onDeleteExpense={handleDeleteExpense} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ExpensesByCategoryChart expenses={expenses} categories={categories} />
            <SpendingTrendChart expenses={expenses} />
        </div>
      </div>
    </>
  );
}
