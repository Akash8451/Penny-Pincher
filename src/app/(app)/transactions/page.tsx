
'use client';

import { AppHeader } from '@/components/layout/app-header';
import TransactionList from '@/components/transactions/transaction-list';
import SettlementsManager from '@/components/transactions/settlements-manager';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function TransactionsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <>
      <AppHeader title="Transactions" />
      <div className="flex-1 space-y-4 p-4 sm:p-6">
        {isClient ? (
           <Tabs defaultValue="history" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="history">
              <TransactionList />
            </TabsContent>
            <TabsContent value="settlements">
              <SettlementsManager />
            </TabsContent>
          </Tabs>
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
