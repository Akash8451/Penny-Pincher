
'use client';

import { AppHeader } from '@/components/layout/app-header';
import TransactionList from '@/components/transactions/transaction-list';

export default function TransactionsPage() {
  return (
    <>
      <AppHeader title="All Transactions" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <TransactionList />
      </div>
    </>
  );
}
