
'use client'

import { useState, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import Link from 'next/link'
import * as Lucide from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useLocalStorage } from '@/hooks/use-local-storage'
import type { Expense, Category, Person } from '@/lib/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { DateRangePicker } from './date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Search, Trash2, FileDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function TransactionList() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', [])
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES)
  const [people] = useLocalStorage<Person[]>('people', [])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  const filteredExpenses = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return expenses.filter((expense) => {
      const isDateInRange = (() => {
        if (!dateRange || !dateRange.from) return true;
        const expenseDate = new Date(expense.date);
        const toDate = dateRange.to || dateRange.from;
        return isWithinInterval(expenseDate, { start: startOfDay(dateRange.from), end: endOfDay(toDate) });
      })();

      const matchesSearch = lowercasedTerm === '' ||
        expense.note?.toLowerCase().includes(lowercasedTerm) ||
        (categoryMap.get(expense.categoryId) || '').toLowerCase().includes(lowercasedTerm);

      return isDateInRange && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateRange, searchTerm, categoryMap]);


  const handleItemClick = (id: string) => {
    setSelectedExpenseId(prevId => (prevId === id ? null : id));
  };
  
  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    setSelectedExpenseId(null);
  };
  
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Note', 'Split With'];
    const rows = filteredExpenses.map(exp => {
      const splitWithNames = exp.splitWith?.map(s => peopleMap.get(s.personId) || 'Unknown').join(', ') || '';
      return [
        format(new Date(exp.date), 'yyyy-MM-dd'),
        exp.type,
        exp.amount.toFixed(2),
        categoryMap.get(exp.categoryId) || 'Uncategorized',
        `"${exp.note || ''}"`, // handle commas in notes
        `"${splitWithNames}"`,
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pennypincher_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumns = ["Date", "Note", "Category", "Amount", "Type"];
    const tableRows = filteredExpenses.map(exp => [
      format(new Date(exp.date), 'yyyy-MM-dd'),
      exp.note || '-',
      categoryMap.get(exp.categoryId) || 'Uncategorized',
      `$${exp.amount.toFixed(2)}`,
      exp.type,
    ]);

    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [tableColumns],
      body: tableRows,
    });
    doc.save("pennypincher_report.pdf");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>History</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by note or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full min-w-[200px] pl-10"
                  />
                </div>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportPDF}>Export as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" onClick={() => { setDateRange(undefined); setSearchTerm(''); }}>Reset</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 pr-2">
            {filteredExpenses.map((expense) => {
                const category = categories.find(c => c.id === expense.categoryId);
                const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
                const splitWithNames = expense.splitWith?.map(split => peopleMap.get(split.personId) || 'Unknown').filter(Boolean).join(', ');
                const isSelected = selectedExpenseId === expense.id;

                return (
                    <div
                        key={expense.id}
                        className={cn(
                            "p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                            isSelected ? "border-primary bg-accent/80" : "border-transparent hover:bg-accent/50"
                        )}
                        onClick={() => handleItemClick(expense.id)}
                    >
                        <div className="flex items-center flex-1 min-w-0 gap-4">
                            <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {expense.note || category?.name || 'Uncategorized'}
                                </p>
                                <div className="flex items-baseline gap-2">
                                     <p className="text-sm text-muted-foreground truncate">
                                        {expense.type === 'expense' && splitWithNames 
                                            ? `Split with: ${splitWithNames}`
                                            : format(new Date(expense.date), "MMM d, yyyy")
                                        }
                                    </p>
                                    <p className={`ml-auto font-semibold text-base ${expense.type === 'expense' ? 'text-destructive' : 'text-green-500'}`}>
                                        {expense.type === 'expense' ? '-' : '+'} ${expense.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isSelected && (
                            <div className="mt-3 flex justify-end items-center gap-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                                <AlertDialog onOpenChange={(open) => !open && setSelectedExpenseId(null)}>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" className="w-9 h-9 px-0 rounded-full">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete this expense record.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-destructive hover:bg-destructive/90">
                                          Delete
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button asChild variant="outline" size="sm" className="h-9 rounded-full">
                                    <Link href={`/transactions/${expense.id}`}>
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
            {filteredExpenses.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No transactions found for the selected period.
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
