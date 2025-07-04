
'use client';

import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Expense, Category, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HandCoins, User, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettlementsManager() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const formatCurrency = useCurrencyFormatter();
  const { toast } = useToast();

  const settlements = useMemo(() => {
    const balances: Record<string, { personName: string; balance: number; unsettledSplits: { expenseId: string, expenseNote: string, amount: number, date: string }[] }> = {};

    const peopleMap = new Map(people.map(p => [p.id, p.name]));
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    for (const expense of expenses) {
      if (expense.type === 'expense' && expense.splitWith) {
        for (const split of expense.splitWith) {
          if (!split.settled) {
            if (!balances[split.personId]) {
              balances[split.personId] = {
                personName: peopleMap.get(split.personId) || 'Unknown Person',
                balance: 0,
                unsettledSplits: [],
              };
            }
            balances[split.personId].balance += split.amount;
            balances[split.personId].unsettledSplits.push({
              expenseId: expense.id,
              expenseNote: expense.note || categoryMap.get(expense.categoryId) || 'Uncategorized',
              amount: split.amount,
              date: expense.date,
            });
          }
        }
      }
    }

    return Object.entries(balances)
      .map(([personId, data]) => ({ personId, ...data }))
      .filter(p => p.balance > 0.009) // Filter out tiny balances due to rounding
      .sort((a, b) => b.balance - a.balance);
  }, [expenses, people, categories]);

  const totalOwedToUser = useMemo(() => {
    return settlements.reduce((sum, p) => sum + p.balance, 0);
  }, [settlements]);


  const handleSettleTransaction = (expenseId: string, personId: string, amount: number) => {
    const originalExpense = expenses.find(e => e.id === expenseId);
    if (!originalExpense) return;

    const personName = people.find(p => p.id === personId)?.name || 'Someone';
    const category = categories.find(c => c.id === originalExpense.categoryId);

    const newIncome: Expense = {
      id: `inc-${new Date().getTime()}`,
      type: 'income',
      amount: amount,
      categoryId: originalExpense.categoryId,
      note: `Settlement from ${personName} for "${originalExpense.note || category?.name}"`,
      date: new Date().toISOString(),
      relatedExpenseId: expenseId,
      relatedPersonId: personId,
    };

    const updatedExpenses = expenses.map(e => {
      if (e.id === expenseId) {
        return {
          ...e,
          splitWith: e.splitWith?.map(s =>
            s.personId === personId && Math.abs(s.amount - amount) < 0.01 ? { ...s, settled: true } : s
          ),
        };
      }
      return e;
    });

    setExpenses([newIncome, ...updatedExpenses]);
    toast({
      title: 'Settled!',
      description: `${personName}'s payment of ${formatCurrency(amount)} has been recorded.`,
    });
  };

  const handleSettleAllForPerson = (personId: string, personName: string, totalAmount: number, splitsToSettle: { expenseId: string }[]) => {
    if (totalAmount <= 0) return;

    const newIncome: Expense = {
      id: `inc-settle-all-${new Date().getTime()}`,
      type: 'income',
      amount: totalAmount,
      categoryId: 'cat-12', // Payment Request / Settlement category
      note: `Full settlement from ${personName}`,
      date: new Date().toISOString(),
    };

    const expenseIdsToUpdate = new Set(splitsToSettle.map(s => s.expenseId));
    const updatedExpenses = expenses.map(e => {
      if (expenseIdsToUpdate.has(e.id)) {
        return {
          ...e,
          splitWith: e.splitWith?.map(s =>
            s.personId === personId ? { ...s, settled: true } : s
          ),
        };
      }
      return e;
    });

    setExpenses([newIncome, ...updatedExpenses]);
    toast({
      title: 'Fully Settled!',
      description: `All outstanding debts from ${personName} totaling ${formatCurrency(totalAmount)} have been cleared.`,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Net Balance</CardTitle>
          <CardDescription>Your net settlement position across all contacts.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total Owed to You</div>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalOwedToUser)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total You Owe</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(0)}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>People Who Owe You</CardTitle>
          <CardDescription>A summary of outstanding debts from split bills.</CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 gap-4">
              <Users className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">All Settled Up!</h3>
              <p className="text-muted-foreground">There are no outstanding debts from anyone.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {settlements.map(({ personId, personName, balance, unsettledSplits }) => (
                <AccordionItem value={personId} key={personId} className="border-none">
                  <AccordionTrigger className="p-4 rounded-lg bg-muted/50 hover:bg-accent/80 hover:no-underline data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2 bg-background rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-base">{personName}</div>
                        <div className="text-sm text-green-500 font-medium">Owes you {formatCurrency(balance)}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 rounded-lg rounded-t-none bg-muted/30 animate-fade-in-up">
                    <div className="space-y-3">
                      {unsettledSplits.map((split, index) => (
                        <div key={`${split.expenseId}-${index}`} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{split.expenseNote}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(split.date), 'PP')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{formatCurrency(split.amount)}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">Settle</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Settlement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark this payment of {formatCurrency(split.amount)} for "{split.expenseNote}" as settled? This will create a new income entry.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSettleTransaction(split.expenseId, personId, split.amount)}>
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-end pt-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>
                                    <HandCoins className="mr-2 h-4 w-4" /> Settle All for {formatCurrency(balance)}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Settle All Debts for {personName}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will clear the entire outstanding balance of {formatCurrency(balance)}. A single income transaction will be created to record this settlement. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSettleAllForPerson(personId, personName, balance, unsettledSplits)}>
                                        Settle All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
