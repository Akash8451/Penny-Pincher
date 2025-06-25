
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
import { ArrowLeft } from 'lucide-react';
import * as Lucide from 'lucide-react';

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', []);
  const [people] = useLocalStorage<Person[]>('people', []);

  const expenseId = params.id as string;
  const expense = expenses.find(e => e.id === expenseId);

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const peopleMap = new Map(people.map(p => [p.id, p.name]));

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
      description: `${personName}'s payment of $${settleAmount.toFixed(2)} has been recorded.`,
    });
  };

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

  const category = categoryMap.get(expense.categoryId);
  const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;


  return (
    <>
      <AppHeader title="Transaction Details">
         <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
      </AppHeader>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className='space-y-1.5'>
                  <span>{expense.note || category?.name || 'Uncategorized'}</span>
                   <CardDescription>
                    {format(new Date(expense.date), 'EEEE, MMMM d, yyyy')} &bull; {category?.name}
                  </CardDescription>
                </div>
              </div>
              <span className={`text-2xl font-bold ${expense.type === 'expense' ? 'text-destructive' : 'text-green-500'}`}>
                {expense.type === 'expense' ? '-' : '+'} ${expense.amount.toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {expense.receipt && (
              <div>
                <h3 className="text-base font-semibold mb-2">Receipt</h3>
                <div className='flex justify-center'>
                  <Image src={expense.receipt} alt="Receipt" width={300} height={400} className="rounded-lg border object-contain" />
                </div>
              </div>
            )}

            {expense.splitWith && expense.splitWith.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-2">Bill Split Details</h3>
                <div className="space-y-2">
                  {expense.splitWith.map(split => (
                    <div key={split.personId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className='font-medium'>{peopleMap.get(split.personId) || 'Unknown Person'}</span>
                      <div className="flex items-center gap-4">
                        <span className='text-muted-foreground'>${split.amount.toFixed(2)}</span>
                        {split.settled ? (
                           <Badge variant="secondary" className='border-green-500/50 text-green-600'>Settled</Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleSettleUp(split.personId, split.amount)}>Settle Up</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
