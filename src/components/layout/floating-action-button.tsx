
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import { useToast } from '@/hooks/use-toast';

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
    const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
    const [people] = useLocalStorage<Person[]>('people', []);
    const { toast } = useToast();
    
    const handleAddExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
        const newExpense: Expense = {
          ...expense,
          id: `exp-${new Date().getTime()}`,
          date: new Date().toISOString(),
        };
        setExpenses(prev => [newExpense, ...prev]);

        const categoryName = categories.find(c => c.id === expense.categoryId)?.name || 'a category';
        toast({
            title: `✔️ $${expense.amount.toFixed(2)} added`,
            description: `Logged to ${categoryName}.`,
        })
      };
      
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="fixed bottom-20 sm:bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-30 transition-transform hover:scale-110 active:scale-95 animate-bounce-sm" size="icon">
                    <Plus className="h-8 w-8" />
                    <span className="sr-only">Log Expense</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="sm:max-w-none md:max-w-lg mx-auto rounded-t-lg bg-background/90 backdrop-blur-lg">
                <QuickExpenseForm 
                    categories={categories} 
                    people={people} 
                    onAddExpense={handleAddExpense}
                    onSuccess={() => setIsOpen(false)}
                />
            </SheetContent>
        </Sheet>
    );
}
