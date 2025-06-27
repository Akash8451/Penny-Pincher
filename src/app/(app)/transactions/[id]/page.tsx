
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Expense, Category, Person } from '@/lib/types';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import * as Lucide from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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


function TransactionDetailsSkeleton() {
    return (
        <>
            <AppHeader title="Loading Transaction..." />
            <div className="flex-1 space-y-4 p-4 md:p-6">
                <Skeleton className="h-9 w-24 mb-4 rounded-full" />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className='space-y-2'>
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full rounded-lg" />
                         <div className="space-y-2">
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                         </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}


function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', []);
  const [people] = useLocalStorage<Person[]>('people', []);

  const [isEditing, setIsEditing] = useState(false);
  const [editableSplits, setEditableSplits] = useState<Record<string, number>>({});
  
  useEffect(() => {
    // Component has mounted, localStorage data is now available.
    setIsLoading(false);
  }, []);

  const expenseId = params.id as string;
  const expense = !isLoading ? expenses.find(e => e.id === expenseId) : undefined;
  const isAnySplitSettled = expense?.splitWith?.some(s => s.settled) ?? false;

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const peopleMap = new Map(people.map(p => [p.id, p.name]));
  
  const othersAmount = expense?.splitWith?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
  const myShare = expense ? expense.amount - othersAmount : 0;
  
  const othersSplitTotal = Object.values(editableSplits).reduce((sum, amount) => sum + Number(amount || 0), 0);
  const myEditedShare = expense ? expense.amount - othersSplitTotal : 0;

  const isIndividualSplitTooHigh = useMemo(() => 
    expense ? Object.values(editableSplits).some(splitAmount => Number(splitAmount || '0') > expense.amount) : false,
  [editableSplits, expense]);

  const isTotalSplitTooHigh = myEditedShare < 0;
  const isSplitInvalid = isTotalSplitTooHigh || isIndividualSplitTooHigh;


  const handleEditClick = () => {
    if (!expense?.splitWith) return;
    const initialSplits = expense.splitWith.reduce((acc, split) => {
        acc[split.personId] = split.amount;
        return acc;
    }, {} as Record<string, number>);
    setEditableSplits(initialSplits);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableSplits({});
  };

  const handleSaveEdit = () => {
    if (!expense || isSplitInvalid) {
        toast({
            variant: 'destructive',
            title: 'Split Error',
            description: isIndividualSplitTooHigh 
                ? 'An individual split cannot exceed the total expense amount.'
                : 'The total split for others cannot exceed the total expense amount.',
        });
        return;
    }

    const updatedExpenses = expenses.map(e => {
        if (e.id === expense.id) {
            return {
                ...e,
                splitWith: e.splitWith?.map(s => ({
                    ...s,
                    amount: editableSplits[s.personId] ?? s.amount,
                })).filter(s => s.amount > 0),
            };
        }
        return e;
    });

    setExpenses(updatedExpenses);
    setIsEditing(false);
    toast({
        title: 'Success',
        description: 'The bill split has been updated.',
    });
  };


  const handleSettleUp = (personId: string, settleAmount: number) => {
    if (!expense) return;

    const personName = peopleMap.get(personId) || 'Someone';
    const category = categoryMap.get(expense.categoryId);

    // 1. Create new income transaction
    const newIncome: Expense = {
      id: `inc-${new Date().getTime()}`,
      type: 'income',
      amount: settleAmount,
      categoryId: expense.categoryId,
      note: `Settlement from ${personName} for "${expense.note || category?.name}"`,
      date: new Date().toISOString(),
      relatedExpenseId: expense.id,
      relatedPersonId: personId,
    };

    // 2. Update original expense to mark as settled
    const updatedExpenses = expenses.map(e => {
      if (e.id === expense.id) {
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
      title: 'Settled!',
      description: `${personName}'s payment of ${formatCurrency(settleAmount)} has been recorded.`,
    });
  };

  if (isLoading) {
    return <TransactionDetailsSkeleton />;
  }

  if (!expense) {
    return (
      <>
        <AppHeader title="Transaction Not Found" />
        <div className="flex-1 p-8 pt-6 text-center">
          <p>The transaction you are looking for could not be found.</p>
           <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </>
    );
  }

  const category = categories.find(c => c.id === expense.categoryId);
  const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;


  return (
    <>
      <AppHeader title="Transaction Details" />
      <div className="flex-1 space-y-4 p-4 md:p-6">
         <div className="mb-4">
            <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
         </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className='space-y-1.5 flex-1 min-w-0'>
                  <span className="truncate block font-semibold text-xl">{expense.note || category?.name || 'Uncategorized'}</span>
                   <CardDescription>
                    {format(new Date(expense.date), 'EEEE, MMMM d, yyyy')} &bull; {category?.name}
                  </CardDescription>
                </div>
              </div>
              <span className={`text-2xl font-bold whitespace-nowrap ${expense.type === 'expense' ? 'text-destructive' : 'text-green-500'}`}>
                {expense.type === 'expense' ? '-' : '+'} {formatCurrency(expense.amount)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {expense.receipt && (
              <div>
                <h3 className="text-base font-semibold mb-2">Receipt</h3>
                <div className="relative mx-auto w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border">
                  <Image src={expense.receipt} alt="Receipt" layout="fill" objectFit="contain" className="bg-muted" />
                </div>
              </div>
            )}

            {expense.splitWith && expense.splitWith.length > 0 && (
              <div>
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold">Bill Split Details</h3>
                    {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={handleEditClick} disabled={isAnySplitSettled}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Split
                        </Button>
                    )}
                </div>
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                            {expense.splitWith?.map(split => {
                                const person = people.find(p => p.id === split.personId);
                                return (
                                <div key={split.personId} className="flex items-center gap-3">
                                    <Label htmlFor={`split-edit-${split.personId}`} className="w-1/3 truncate font-medium">
                                        {person?.name || 'Unknown Person'}
                                    </Label>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                        <Input
                                            id={`split-edit-${split.personId}`}
                                            type="number"
                                            placeholder="0.00"
                                            value={editableSplits[split.personId] ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setEditableSplits(prev => ({ ...prev, [split.personId]: value === '' ? 0 : parseFloat(value) }))
                                            }}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>
                                )
                            })}
                             <Separator />
                             <div className="flex items-center gap-3">
                                <Label className="w-1/3 truncate font-medium text-muted-foreground">
                                    You (Your Share)
                                </Label>
                                <div className="relative flex-1">
                                    <Input
                                        type="text"
                                        value={formatCurrency(myEditedShare)}
                                        disabled
                                        className={`pl-3 bg-transparent border-none text-right ${isTotalSplitTooHigh ? 'text-destructive' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                             <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={isSplitInvalid ? 0 : -1}>
                                    <Button onClick={handleSaveEdit} disabled={isSplitInvalid}>
                                      Save Changes
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {isSplitInvalid && (
                                  <TooltipContent>
                                    <p>
                                      {isIndividualSplitTooHigh
                                        ? 'A single split cannot exceed the expense amount.'
                                        : 'Total split cannot exceed expense amount.'}
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className='font-medium'>You (Your Share)</span>
                        <div className="flex items-center gap-4">
                            <span className='text-muted-foreground'>{formatCurrency(myShare)}</span>
                        </div>
                      </div>
                    {expense.splitWith.map(split => (
                        <div key={split.personId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className='font-medium'>{peopleMap.get(split.personId) || 'Unknown Person'}</span>
                        <div className="flex items-center gap-4">
                            <span className='text-muted-foreground'>{formatCurrency(split.amount)}</span>
                            {split.settled ? (
                            <Badge variant="secondary" className='border-green-500/50 text-green-600'>Settled</Badge>
                            ) : (
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                   <Button size="sm" disabled={isEditing}>Settle Up</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Settlement</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will record a new income transaction of {formatCurrency(split.amount)} from {peopleMap.get(split.personId) || 'this person'}. Are you sure?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSettleUp(split.personId, split.amount)}>
                                      Yes, Settle Up
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </div>
            )}
             {expense.type === 'income' && expense.relatedExpenseId && (
              <div>
                <p className="text-sm text-muted-foreground">
                  This is a settlement for an expense. {' '}
                  <Link href={`/transactions/${expense.relatedExpenseId}`} className="underline hover:text-primary">
                    View original transaction.
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
