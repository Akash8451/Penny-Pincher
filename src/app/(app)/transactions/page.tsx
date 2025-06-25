
'use client';

import { AppHeader } from '@/components/layout/app-header';
import TransactionList from '@/components/transactions/transaction-list';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';


export default function TransactionsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <>
      <AppHeader title="All Transactions" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {isClient ? (
          <TransactionList />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Skeleton className="h-8 w-32" />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Skeleton className="h-10 w-full sm:w-[300px]" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
