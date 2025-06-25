
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
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
      
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg animate-bounce-sm z-30" size="icon">
                    <Plus className="h-8 w-8" />
                    <span className="sr-only">Log Expense</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <QuickExpenseForm 
                    categories={categories} 
                    people={people} 
                    onAddExpense={handleAddExpense}
                    onSuccess={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
