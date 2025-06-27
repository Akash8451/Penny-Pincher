
'use client';

import { useLocalStorage } from './use-local-storage';
import { useToast } from './use-toast';
import { useCurrencyFormatter } from './use-currency-formatter';
import type { Expense, Category, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const addTransaction = (newTxData: Omit<Expense, 'id' | 'date'>) => {
    const newTx: Expense = {
      ...newTxData,
      id: `${newTxData.type.substring(0,3)}-${new Date().getTime()}`,
      date: new Date().toISOString(),
    };

    setExpenses(prev => [newTx, ...prev]);

    const categoryName = categoryMap.get(newTx.categoryId) || 'a category';
    const personName = newTx.splitWith && newTx.splitWith.length > 0 && people.find(p => p.id === newTx.splitWith![0].personId)?.name;

    if (newTx.type === 'expense') {
        // This is a Payment Request if categoryId is 'cat-12'
        if (newTx.categoryId === 'cat-12' && personName) {
            toast({
                title: `📨 Request Sent`,
                description: `A request for ${formatCurrency(newTx.amount)} was sent to ${personName}.`,
            });
        } else if (newTx.splitWith && newTx.splitWith.length > 0) {
             toast({
                title: `✔️ Split expense added`,
                description: `${formatCurrency(newTx.amount)} for "${newTx.note}" was logged.`,
            });
        } else {
             toast({
                title: `✔️ ${formatCurrency(newTx.amount)} added`,
                description: `Logged to ${categoryName}.`,
            });
        }
    } else { // 'income'
        toast({
            title: `💰 ${formatCurrency(newTx.amount)} received`,
            description: `Logged to ${categoryName}.`,
        });
    }
  };

  const deleteTransaction = (expenseId: string) => {
    setExpenses(prev => {
      const expenseToDelete = prev.find(e => e.id === expenseId);

      // Case 1: Deleting a settlement income. Un-settle the original expense.
      if (expenseToDelete?.type === 'income' && expenseToDelete.relatedExpenseId && expenseToDelete.relatedPersonId) {
        const updatedExpenses = prev.map(e => {
          if (e.id === expenseToDelete.relatedExpenseId) {
            return {
              ...e,
              splitWith: e.splitWith?.map(s => 
                s.personId === expenseToDelete.relatedPersonId ? { ...s, settled: false } : s
              ),
            };
          }
          return e;
        });
        return updatedExpenses.filter(e => e.id !== expenseId);
      }

      // Case 2: Deleting an original expense. Also delete related income settlements.
      const relatedIncomeIds = prev
        .filter(e => e.type === 'income' && e.relatedExpenseId === expenseId)
        .map(e => e.id);
      
      return prev.filter(e => e.id !== expenseId && !relatedIncomeIds.includes(e.id));
    });

    toast({
      title: 'Transaction Deleted',
      description: 'The transaction and any related settlements have been removed.',
    });
  };

  return { expenses, addTransaction, deleteTransaction, setExpenses, categories, people };
}
