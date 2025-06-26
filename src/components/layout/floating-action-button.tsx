
'use client';

import React, { useState } from 'react';
import { Plus, Wand2, FilePlus, HandCoins, Receipt } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import QuickIncomeForm from '@/components/dashboard/quick-income-form';
import PaymentRequestForm from '@/components/dashboard/payment-request-form';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

    const handleAddIncome = (income: Omit<Expense, 'id' | 'date' | 'type'>) => {
        const newIncome: Expense = {
            ...income,
            id: `inc-${new Date().getTime()}`,
            type: 'income',
            date: new Date().toISOString(),
        };
        setExpenses(prev => [newIncome, ...prev]);

        const categoryName = categories.find(c => c.id === income.categoryId)?.name || 'a category';
        toast({
            title: `💰 ${formatCurrency(income.amount)} received`,
            description: `Logged to ${categoryName}.`,
        })
    };
      
    const handleAddPaymentRequest = (request: Omit<Expense, 'id'|'date'|'type'|'splitWith'|'categoryId'> & { personId: string }) => {
        const { personId, amount, note } = request;
        const personName = people.find(p => p.id === personId)?.name || 'Someone';

        const newRequest: Expense = {
            amount,
            note,
            id: `exp-${new Date().getTime()}`,
            type: 'expense', // It's an "expense" where your share is 0, creating a receivable
            date: new Date().toISOString(),
            categoryId: 'cat-12', // Payment Request category
            splitWith: [{ personId: personId, amount: amount, settled: false }],
        };
        setExpenses(prev => [newRequest, ...prev]);
        toast({
            title: `📨 Request Sent`,
            description: `A request for ${formatCurrency(amount)} was sent to ${personName}.`,
        })
    };
      
    return (
        <div className={cn(
            "fixed bottom-20 sm:bottom-6 right-6 z-30 flex flex-col items-center gap-3",
            isHidden && "hidden"
        )}>
             <Button asChild variant="secondary" className="h-12 w-12 rounded-full shadow-md animate-pulse-glow animate-bounce-sm">
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
                        <span className="sr-only">Log Transaction</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="sm:max-w-none md:max-w-lg mx-auto rounded-t-lg bg-background/90 backdrop-blur-lg">
                   <Tabs defaultValue="expense" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="expense"><FilePlus className="mr-2 h-4 w-4" />Expense</TabsTrigger>
                            <TabsTrigger value="income"><HandCoins className="mr-2 h-4 w-4" />Income</TabsTrigger>
                            <TabsTrigger value="request"><Receipt className="mr-2 h-4 w-4" />Request</TabsTrigger>
                        </TabsList>
                        <TabsContent value="expense">
                            <QuickExpenseForm 
                                categories={categories.filter(c => c.group !== 'Income')} 
                                people={people} 
                                onAddExpense={handleAddExpense}
                                onSuccess={() => setIsOpen(false)}
                            />
                        </TabsContent>
                        <TabsContent value="income">
                             <QuickIncomeForm 
                                categories={categories.filter(c => c.group === 'Income' || c.name === 'Other')} 
                                onAddIncome={handleAddIncome}
                                onSuccess={() => setIsOpen(false)}
                            />
                        </TabsContent>
                        <TabsContent value="request">
                            <PaymentRequestForm
                                people={people}
                                onAddRequest={handleAddPaymentRequest}
                                onSuccess={() => setIsOpen(false)}
                             />
                        </TabsContent>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </div>
    );
}
