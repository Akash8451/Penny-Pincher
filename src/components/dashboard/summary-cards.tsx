import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/lib/types";
import { DollarSign, ReceiptText, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface SummaryCardsProps {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0 });

  useEffect(() => {
    const allTransactions = expenses;
    
    const allSpending = allTransactions.filter(exp => exp.type === 'expense');
    const allIncome = allTransactions.filter(exp => exp.type === 'income');

    const totalSpending = allSpending.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = allIncome.reduce((sum, exp) => sum + exp.amount, 0);
    
    const netSpending = totalSpending - totalIncome;
    const transactionCount = allTransactions.length;
    const averageSpending = allSpending.length > 0 ? totalSpending / allSpending.length : 0;

    setSummary({ total: netSpending, count: transactionCount, average: averageSpending });
  }, [expenses]);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Net Spending
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.total.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total expenses minus total income
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.count}</div>
          <p className="text-xs text-muted-foreground">
            All recorded income and expenses
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.average.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average value of all expense transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
