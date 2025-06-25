
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { parseStatement } from '@/ai/flows/statement-parser-flow';
import type { Category, Expense } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Sparkles, X, ListPlus, AlertTriangle, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';

type ParsedTransaction = {
    description: string;
    amount: number;
    date: string;
    type: "expense" | "income";
    suggestedCategoryId: string;
};

export default function StatementImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [editedCategories, setEditedCategories] = useState<Record<number, string>>({});
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();

  const [, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);

  const categoryGroups = useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const resetState = useCallback(() => {
    setFile(null);
    setParsedTransactions([]);
    setEditedCategories({});
    setSelectedRows({});
    setIsLoading(false);
    setError(null);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && selectedFile.type !== 'text/csv') {
        toast({
          variant: 'destructive',
          title: 'Unsupported File Type',
          description: 'Please upload a PDF or CSV file.',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setParsedTransactions([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        if (!dataUri) {
          throw new Error('Could not read file.');
        }

        const result = await parseStatement({ statementDataUri: dataUri, categories });
        if (!result.transactions || result.transactions.length === 0) {
          setError("The AI couldn't find any transactions in this file. Please check the file and try again.");
          setIsLoading(false);
        } else {
          setParsedTransactions(result.transactions);
          // Pre-populate edited categories and select all rows by default
          const initialCategories: Record<number, string> = {};
          const initialSelections: Record<number, boolean> = {};
          result.transactions.forEach((tx, index) => {
            initialCategories[index] = tx.suggestedCategoryId;
            initialSelections[index] = true;
          });
          setEditedCategories(initialCategories);
          setSelectedRows(initialSelections);
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        throw new Error('Error reading file.');
      }
    } catch (err) {
      console.error("Parsing error:", err);
      setError("An unexpected error occurred while parsing the statement. Please try again.");
      setIsLoading(false);
    }
  };

  const handleImportSelected = () => {
    const itemsToLog = Object.entries(selectedRows)
      .filter(([, isSelected]) => isSelected)
      .map(([indexStr]) => parseInt(indexStr));

    if (itemsToLog.length === 0) {
      toast({ variant: 'destructive', title: "No transactions selected" });
      return;
    }

    const newExpenses: Expense[] = [];
    let uncategorizedCount = 0;

    itemsToLog.forEach(index => {
      const item = parsedTransactions[index];
      const categoryId = editedCategories[index];
      if (!categoryId) {
        uncategorizedCount++;
      }
      
      let transactionDate;
      try {
        // Attempt to parse date, if invalid use today
        transactionDate = new Date(item.date).toISOString();
      } catch (e) {
        transactionDate = new Date().toISOString();
      }

      newExpenses.push({
        id: `exp-${new Date().getTime()}-${index}`,
        type: item.type,
        amount: item.amount,
        categoryId: categoryId || 'cat-11', // Default to 'Other'
        note: item.description,
        date: transactionDate,
      });
    });

    if (uncategorizedCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Categorize All Items',
        description: `Please assign a category to all ${uncategorizedCount} selected items before logging.`
      });
      return;
    }

    setExpenses(prev => [...newExpenses, ...prev]);
    toast({
      title: 'Success!',
      description: `${newExpenses.length} new transaction(s) have been imported.`
    });
    resetState();
  };

  const allItemsSelected = parsedTransactions.length > 0 && Object.keys(selectedRows).length === parsedTransactions.length && Object.values(selectedRows).every(v => v);
  const someItemsSelected = parsedTransactions.length > 0 && Object.values(selectedRows).some(v => v) && !allItemsSelected;

  const toggleAllRows = (checked: boolean) => {
    const newSelectedRows: Record<number, boolean> = {};
    parsedTransactions.forEach((_, index) => {
      newSelectedRows[index] = checked;
    });
    setSelectedRows(newSelectedRows);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Parsing Statement...</h3>
          <p className="text-muted-foreground">The AI is analyzing your file. This may take a moment for large documents.</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Parsing Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={resetState}>Try Again</Button>
        </div>
      );
    }

    if (parsedTransactions.length > 0) {
      return (
        <div className='space-y-4 animate-fade-in-up'>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Review & Import Transactions</h3>
              <p className="text-sm text-muted-foreground">Confirm categories and select transactions to import.</p>
            </div>
            <Button variant="outline" onClick={resetState}>
              <X className="mr-2 h-4 w-4" /> Start Over
            </Button>
          </div>
          <ScrollArea className="border rounded-lg h-[50vh]">
            <Table>
              <TableHeader className='sticky top-0 bg-muted/80 backdrop-blur-lg'>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allItemsSelected || someItemsSelected}
                      data-state={someItemsSelected ? 'indeterminate' : (allItemsSelected ? 'checked' : 'unchecked')}
                      onCheckedChange={(checked) => toggleAllRows(Boolean(checked))}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[200px]">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedTransactions.map((tx, index) => (
                  <TableRow key={index} className={cn(!selectedRows[index] && "text-muted-foreground/60")}>
                    <TableCell>
                      <Checkbox checked={!!selectedRows[index]} onCheckedChange={(checked) => setSelectedRows(p => ({...p, [index]: Boolean(checked)}))} />
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className={cn("text-right font-semibold", tx.type === 'income' ? 'text-green-500' : 'text-destructive')}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                       <Select 
                          onValueChange={(value) => setEditedCategories(p => ({...p, [index]: value}))} 
                          value={editedCategories[index]}
                          disabled={!selectedRows[index]}
                        >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryGroups).map(([group, cats]) => (
                            <SelectGroup key={group}>
                              <Label className='px-2 text-xs text-muted-foreground'>{group}</Label>
                              {cats.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg h-64 hover:border-primary transition-colors">
            <FileUp className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Upload your statement</h3>
            <p className="mt-1 text-sm text-muted-foreground">Drop a PDF or CSV file here, or click to select a file.</p>
            <Button asChild className='mt-4'>
                <Label>
                    {file ? file.name : "Select File"}
                    <Input id="upload" type="file" accept=".pdf,.csv" onChange={handleFileChange} className='sr-only'/>
                </Label>
            </Button>
            {file && (
                <div className='flex gap-4 mt-4'>
                    <Button variant="outline" onClick={() => setFile(null)}><X className="mr-2 h-4 w-4" /> Clear</Button>
                    <Button onClick={handleParse} disabled={isLoading}><Sparkles className="mr-2 h-4 w-4"/>Parse with AI</Button>
                </div>
            )}
        </div>
    )
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Upload className='text-primary' /> Statement Importer
        </CardTitle>
        <CardDescription>
          Automatically parse transactions from your bank or credit card statements (PDF or CSV).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {parsedTransactions.length > 0 && (
        <CardFooter>
            <Button className='w-full md:w-auto ml-auto' onClick={handleImportSelected} disabled={Object.values(selectedRows).every(v => !v)}>
              <ListPlus className='mr-2 h-4 w-4' />Import Selected Transactions
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
