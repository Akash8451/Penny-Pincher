
'use client';

import React, { useState } from 'react';
import { Plus, Wand2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import Link from 'next/link';

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
    const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
    const [people] = useLocalStorage<Person[]>('people', []);
    const { toast } = useToast();
    const pathname = usePathname();
    const formatCurrency = useCurrencyFormatter();

    const isHidden = pathname === '/assistant';
    
    const handleAddExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
        const newExpense: Expense = {
          ...expense,
          id: `exp-${new Date().getTime()}`,
          date: new Date().toISOString(),
        };
        setExpenses(prev => [newExpense, ...prev]);

        const categoryName = categories.find(c => c.id === expense.categoryId)?.name || 'a category';
        toast({
            title: `✔️ ${formatCurrency(expense.amount)} added`,
            description: `Logged to ${categoryName}.`,
        })
      };
      
    return (
        <div className={cn(
            "fixed bottom-20 sm:bottom-6 right-6 z-30 flex flex-col items-center gap-3",
            isHidden && "hidden"
        )}>
             <Button asChild variant="secondary" className="h-12 w-12 rounded-full shadow-md">
                <Link href="/assistant">
                    <Wand2 className="h-6 w-6 text-primary" />
                    <span className="sr-only">AI Assistant</span>
                </Link>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button 
                        className="h-16 w-16 rounded-full shadow-lg"
                        size="icon"
                    >
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
        </div>
    );
}
