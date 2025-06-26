
'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { itemizeReceipt, type ItemizeReceiptOutput } from '@/ai/flows/itemize-receipt-flow';
import { parseStatement } from '@/ai/flows/statement-parser-flow';
import type { Expense, Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Camera, Upload, ScanLine, Loader2, Sparkles, X, ListPlus, AlertTriangle, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type ParsedTransaction = {
    description: string;
    amount: number;
    date: string;
    type: "expense" | "income";
    suggestedCategoryId: string;
};


function ReceiptScannerInternal() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ItemizeReceiptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const [, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
  const [itemCategories, setItemCategories] = useState<Record<number, string>>({});

  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isCameraOn) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          stopCamera();
        }
      };
      getCameraPermission();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOn, stopCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setImageSrc(canvas.toDataURL('image/jpeg'));
      setIsCameraOn(false);
      stopCamera();
    }
  };

  const handleScan = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await itemizeReceipt({ photoDataUri: imageSrc });
      if (!result.items || result.items.length === 0) {
        setError("The AI couldn't find any items on this receipt. Please try a clearer image.");
      } else {
        setScanResult(result);
        const initialSelections: Record<number, boolean> = {};
        result.items.forEach((_, index) => initialSelections[index] = true);
        setSelectedItems(initialSelections);
      }
    } catch (err) {
      console.error("Scanning error:", err);
      setError("An unexpected error occurred while scanning the receipt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogSelected = () => {
    const itemsToLog = Object.entries(selectedItems)
      .filter(([, isSelected]) => isSelected)
      .map(([indexStr]) => parseInt(indexStr));

    if (itemsToLog.length === 0) {
      toast({ variant: 'destructive', title: "No items selected" });
      return;
    }

    const newExpenses: Expense[] = [];
    let uncategorizedCount = 0;

    itemsToLog.forEach(index => {
      const item = scanResult!.items[index];
      const categoryId = itemCategories[index];
      if (!categoryId) {
        uncategorizedCount++;
      }
      newExpenses.push({
        id: `exp-${new Date().getTime()}-${index}`,
        type: 'expense',
        amount: item.price,
        categoryId: categoryId || 'cat-11', // Default to 'Other'
        note: item.description,
        date: new Date().toISOString(),
        receipt: imageSrc || undefined,
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
      description: `${newExpenses.length} new expense(s) have been logged.`
    });
    resetState();
  };

  const resetState = () => {
    setImageSrc(null);
    setScanResult(null);
    setIsLoading(false);
    setError(null);
    setSelectedItems({});
    setItemCategories({});
    setIsCameraOn(false);
    stopCamera();
  };

  const toggleAllItems = (checked: boolean) => {
    const newSelectedItems: Record<number, boolean> = {};
    scanResult?.items.forEach((_, index) => {
      newSelectedItems[index] = checked;
    });
    setSelectedItems(newSelectedItems);
  };
  
  const allItemsSelected = scanResult ? Object.keys(selectedItems).length === scanResult.items.length && Object.values(selectedItems).every(v => v) : false;
  const someItemsSelected = scanResult ? Object.values(selectedItems).some(v => v) && !allItemsSelected : false;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Scanning your receipt...</h3>
          <p className="text-muted-foreground">The AI is extracting items. This might take a moment.</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Scan Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={resetState}>Try Again</Button>
        </div>
      )
    }

    if (scanResult) {
      return (
        <div className='space-y-4 animate-fade-in-up'>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Review & Log Items</h3>
              <p className="text-sm text-muted-foreground">Select items and assign categories to log your expenses.</p>
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
                      onCheckedChange={(checked) => toggleAllItems(Boolean(checked))}
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px] text-right">Price</TableHead>
                  <TableHead className="w-[200px]">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanResult.items.map((item, index) => (
                  <TableRow key={index} className={cn(!selectedItems[index] && "text-muted-foreground/60")}>
                    <TableCell>
                      <Checkbox checked={selectedItems[index]} onCheckedChange={(checked) => setSelectedItems(p => ({...p, [index]: Boolean(checked)}))} />
                    </TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                       <Select 
                          onValueChange={(value) => setItemCategories(p => ({...p, [index]: value}))} 
                          defaultValue={itemCategories[index]}
                          disabled={!selectedItems[index]}
                        >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryGroups).map(([group, cats]) => (
                            <SelectGroup key={group}>
                              <SelectLabel>{group}</SelectLabel>
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
           <div className="flex justify-end">
              <Button onClick={handleLogSelected} disabled={Object.values(selectedItems).every(v => !v)}>
                <ListPlus className='mr-2 h-4 w-4' />Log Selected Items
              </Button>
           </div>
        </div>
      );
    }
    
    if (imageSrc) {
        return (
             <div className="space-y-4 animate-fade-in-up">
                <CardTitle>Receipt Preview</CardTitle>
                <div className='relative aspect-[9/16] max-h-[60vh] mx-auto w-auto rounded-lg overflow-hidden border'>
                    <Image src={imageSrc} alt="Receipt preview" layout="fill" objectFit="contain" />
                </div>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setImageSrc(null)}><X className="mr-2 h-4 w-4"/>Clear</Button>
                    <Button onClick={handleScan}><Sparkles className="mr-2 h-4 w-4"/>Scan with AI</Button>
                </div>
             </div>
        )
    }

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='hover:border-primary transition-colors'>
            <CardHeader>
                <Upload className='h-8 w-8 text-primary mb-2' />
                <CardTitle>Upload Receipt</CardTitle>
                <CardDescription>Choose an image file from your device.</CardDescription>
            </CardHeader>
            <CardContent>
                <Input id="upload" type="file" accept="image/*" onChange={handleFileChange} />
            </CardContent>
        </Card>
        <Card className='hover:border-primary transition-colors'>
             <CardHeader>
                <Camera className='h-8 w-8 text-primary mb-2' />
                <CardTitle>Use Camera</CardTitle>
                <CardDescription>Use your device's camera to take a new photo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className={cn(isCameraOn ? 'block' : 'hidden')}>
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                    <div className="flex gap-2 mt-2">
                        <Button onClick={handleCapture} className='w-full' disabled={hasCameraPermission === false}>Capture</Button>
                        <Button variant="outline" onClick={() => setIsCameraOn(false)}><X className='h-4 w-4' /></Button>
                    </div>
                </div>

                {!isCameraOn && (
                    <Button onClick={() => setIsCameraOn(true)} className='w-full'>Start Camera</Button>
                )}

                {isCameraOn && hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Please enable camera permissions in your browser settings to use this feature.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
      </div>
    );
  };
  
  return renderContent();
}

function StatementImporterInternal() {
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
        transactionDate = new Date(item.date).toISOString();
      } catch (e) {
        transactionDate = new Date().toISOString();
      }

      newExpenses.push({
        id: `exp-${new Date().getTime()}-${index}`,
        type: item.type,
        amount: item.amount,
        categoryId: categoryId || 'cat-11',
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
          <p className="text-muted-foreground">The AI is analyzing your file. This may take a moment.</p>
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
                              <SelectLabel>{group}</SelectLabel>
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
           <div className="flex justify-end">
             <Button onClick={handleImportSelected} disabled={Object.values(selectedRows).every(v => !v)}>
                <ListPlus className='mr-2 h-4 w-4' />Import Selected Transactions
             </Button>
           </div>
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

  return renderContent();
}


export default function ScanImportManager() {
    return (
        <Card>
            <CardContent className='p-0'>
                <Tabs defaultValue="scan" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                        <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
                        <TabsTrigger value="import">Import Statement</TabsTrigger>
                    </TabsList>
                    <TabsContent value="scan" className="p-4 sm:p-6">
                        <ReceiptScannerInternal />
                    </TabsContent>
                    <TabsContent value="import" className="p-4 sm:p-6">
                        <StatementImporterInternal />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
