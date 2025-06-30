
'use client';

import React, { useState } from 'react';
import { Plus, Wand2 } from 'lucide-react';
import type { Expense, Person } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import QuickIncomeForm from '@/components/dashboard/quick-income-form';
import PaymentRequestForm from '@/components/dashboard/payment-request-form';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useExpenses } from '@/hooks/use-expenses';


export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { addTransaction, categories } = useExpenses();
    const pathname = usePathname();

    const isHidden = pathname === '/assistant';
    
    const handleAddExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
        addTransaction(expense);
    };

    const handleAddIncome = (income: Omit<Expense, 'id' | 'date' | 'type'>) => {
        addTransaction({ ...income, type: 'income' });
    };
      
    const handleAddPaymentRequest = (request: Omit<Expense, 'id'|'date'|'type'|'splitWith'|'categoryId'> & { personId: string }) => {
        const { personId, amount, note } = request;

        const newRequest: Omit<Expense, 'id'|'date'> = {
            amount,
            note,
            type: 'expense',
            categoryId: 'cat-12', // Payment Request category
            splitWith: [{ personId: personId, amount: amount, settled: false }],
        };
        addTransaction(newRequest);
    };
      
    return (
        <TooltipProvider>
            <div className={cn(
                "fixed bottom-20 sm:bottom-6 right-6 z-30 flex flex-col items-center gap-3",
                isHidden && "hidden"
            )}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="secondary" className="h-12 w-12 rounded-full shadow-md animate-pulse-glow animate-bounce-sm">
                            <Link href="/assistant">
                                <Wand2 className="h-6 w-6 text-primary" />
                                <span className="sr-only">AI Assistant</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>AI Assistant</p>
                    </TooltipContent>
                </Tooltip>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SheetTrigger asChild>
                                <Button 
                                    id="fab-add-button"
                                    className="h-16 w-16 rounded-full shadow-lg"
                                    size="icon"
                                >
                                    <Plus className="h-8 w-8" />
                                    <span className="sr-only">Log Transaction</span>
                                </Button>
                            </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add New Transaction</p>
                        </TooltipContent>
                    </Tooltip>
                    <SheetContent side="bottom" className="sm:max-w-none md:max-w-lg mx-auto rounded-t-2xl bg-background/90 backdrop-blur-lg max-h-[90vh] p-0 flex flex-col">
                        <SheetHeader className="p-4 pt-2 text-center flex-shrink-0">
                            <SheetTitle className="sr-only">Add New Transaction</SheetTitle>
                            {/* Drag handle for mobile */}
                            <div className="mx-auto h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
                        </SheetHeader>
                        <div className="flex-grow overflow-y-auto">
                            <Tabs defaultValue="expense" className="w-full">
                                <div className="flex justify-center px-4 pb-4 border-b flex-shrink-0">
                                    <TabsList>
                                        <TabsTrigger value="expense">Expense</TabsTrigger>
                                        <TabsTrigger value="income">Income</TabsTrigger>
                                        <TabsTrigger value="request">Request</TabsTrigger>
                                    </TabsList>
                                </div>
                                <div className="p-6 pt-4">
                                    <TabsContent value="expense" className="mt-0">
                                        <QuickExpenseForm 
                                            categories={categories.filter(c => c.group !== 'Income')} 
                                            onAddExpense={handleAddExpense}
                                            onSuccess={() => setIsOpen(false)}
                                        />
                                    </TabsContent>
                                    <TabsContent value="income" className="mt-0">
                                        <QuickIncomeForm 
                                            categories={categories.filter(c => c.group === 'Income' || c.name === 'Other')} 
                                            onAddIncome={handleAddIncome}
                                            onSuccess={() => setIsOpen(false)}
                                        />
                                    </TabsContent>
                                    <TabsContent value="request" className="mt-0">
                                        <PaymentRequestForm
                                            onAddRequest={handleAddPaymentRequest}
                                            onSuccess={() => setIsOpen(false)}
                                            />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </TooltipProvider>
    );
}
