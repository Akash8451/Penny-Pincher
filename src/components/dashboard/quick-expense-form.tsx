
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, Expense, Person, Split } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Paperclip, PlusCircle, Users, X, ZoomIn, UserPlus } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import Image from 'next/image';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { logExpenseFromVoice } from '@/ai/flows/log-expense-voice-flow';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

interface QuickExpenseFormProps {
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  onSuccess: () => void;
}

const expenseSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().positive({ message: "Amount must be positive." })
  ),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  note: z.string().max(100, "Note is too long.").optional(),
  receipt: z.any().optional(),
});


export default function QuickExpenseForm({ categories, onAddExpense, onSuccess }: QuickExpenseFormProps) {
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();
  const [people, setPeople] = useLocalStorage<Person[]>('people', []);
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: '', categoryId: '', note: '' },
  });
  const totalAmount = Number(form.watch('amount')) || 0;
  
  const [fileName, setFileName] = React.useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [customSplits, setCustomSplits] = React.useState<Record<string, string>>({});
  const [splitGroupName, setSplitGroupName] = React.useState('');
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [newPersonName, setNewPersonName] = React.useState('');

  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const handleAddNewPerson = () => {
    const trimmedName = newPersonName.trim();
    if (!trimmedName) return;

    if (people.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Person already exists',
            description: `"${trimmedName}" is already in your contacts.`,
        });
        return;
    }

    const newPerson: Person = {
        id: `person-${new Date().getTime()}`,
        name: trimmedName,
        tags: [],
    };
    
    setPeople(prev => [...prev, newPerson]);
    setSelectedPeople(prev => [...prev, newPerson.id]);

    setNewPersonName('');
    toast({
        title: `Added "${trimmedName}"`,
        description: 'They have been selected for the split.',
    });
  };

  const handleVoiceResult = async (transcript: string) => {
    if (!transcript) return;
    setIsVoiceLoading(true);
    toast({ title: "Processing your voice command...", description: `"${transcript}"`});
    try {
        const result = await logExpenseFromVoice({ query: transcript, categories });
        if (result.amount) {
            form.setValue('amount', result.amount as any);
        }
        if (result.categoryId) {
            form.setValue('categoryId', result.categoryId);
        }
        if (result.note) {
            form.setValue('note', result.note);
        }
        toast({ title: "✔️ Fields populated by voice" });
    } catch (error) {
        console.error("Voice expense logging error:", error);
        let title = "Could not process voice command.";
        let description = error instanceof Error ? error.message : "An unknown error occurred. Please try again.";
        if (typeof description === 'string' && description.includes('rate limit')) {
            title = "Request Limit Exceeded";
            description = "You've made too many requests. Please wait a moment before trying again.";
        }
        toast({ variant: 'destructive', title, description });
    } finally {
        setIsVoiceLoading(false);
    }
  };

  const handleVoiceError = (error: string) => {
      let description = 'An unknown error occurred.';
      if (error === 'not-allowed' || error === 'service-not-allowed') {
          description = 'Microphone access denied. Please enable it in your browser settings.';
      } else if (error === 'no-speech') {
          description = 'No speech was detected. Please try again.';
      }
      toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
      setIsVoiceLoading(false);
  };

  const { isListening, toggleListening } = useSpeechRecognition({
      onResult: handleVoiceResult,
      onError: handleVoiceError,
  });

  const handleClearReceipt = () => {
    form.setValue('receipt', null);
    setFileName('');
    setReceiptPreview(null);
  };

    const currentSplitTotalForOthers = useMemo(() => {
        return Object.values(customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    }, [customSplits]);

    const myShare = totalAmount - currentSplitTotalForOthers;

    const isIndividualSplitTooHigh = useMemo(() => {
        if (!totalAmount) return false;
        return Object.values(customSplits).some(amount => parseFloat(amount || '0') > totalAmount);
    }, [customSplits, totalAmount]);

    const isTotalSplitTooHigh = myShare < 0;

    const isSplitInvalid = isIndividualSplitTooHigh || isTotalSplitTooHigh;
  
  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    let splitWithData: Split[] | undefined = undefined;

    if (selectedPeople.length > 0) {
      if (isSplitInvalid) {
           toast({
              variant: 'destructive',
              title: "Invalid Split Data",
              description: isIndividualSplitTooHigh 
                ? 'A single person\'s split cannot exceed the total amount. Please correct it.' 
                : 'The total amount split for others cannot exceed the total expense. Please correct it.',
          });
          return;
      }
      
      if (Object.keys(customSplits).length > 0) {
         splitWithData = selectedPeople.map(personId => ({
            personId,
            amount: parseFloat(customSplits[personId]) || 0,
            settled: false,
        })).filter(split => split.amount > 0);
      } else {
        const numberOfParticipants = selectedPeople.length + 1;
        const equalAmount = totalAmount / numberOfParticipants;
        splitWithData = selectedPeople.map(personId => ({
            personId,
            amount: equalAmount,
            settled: false,
        }));
      }
    }


    const expenseData: Omit<Expense, 'id'|'date'> = {
      ...values,
      type: 'expense',
      amount: values.amount,
      note: splitGroupName || values.note || '',
      splitWith: splitWithData,
    };
    
    const finishSubmit = (finalExpenseData: Omit<Expense, 'id' | 'date'>) => {
      onAddExpense(finalExpenseData);
      form.reset();
      setFileName('');
      setReceiptPreview(null);
      setSelectedPeople([]);
      setCustomSplits({});
      setSplitGroupName('');
      onSuccess();
    };

    if (values.receipt && values.receipt.length > 0) {
      const file = values.receipt[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        finishSubmit({ ...expenseData, receipt: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      finishSubmit(expenseData);
    }
  };
  
  const togglePersonSelection = (personId: string) => {
    const newSelectedPeople = selectedPeople.includes(personId)
      ? selectedPeople.filter(id => id !== personId)
      : [...selectedPeople, personId];
    setSelectedPeople(newSelectedPeople);
    setCustomSplits({});
  };

  const handleSplitEqually = () => {
    if (totalAmount <= 0 || selectedPeople.length === 0) return;
    
    const numberOfParticipants = selectedPeople.length + 1; // Including the user
    const totalInCents = Math.round(totalAmount * 100);
    const shareInCents = Math.floor(totalInCents / numberOfParticipants);
    let remainder = totalInCents % numberOfParticipants;

    const newSplits: Record<string, string> = {};
    
    selectedPeople.forEach(personId => {
        let personShare = shareInCents;
        if (remainder > 0) {
            personShare++;
            remainder--;
        }
        newSplits[personId] = (personShare / 100).toFixed(2);
    });

    setCustomSplits(newSplits);
  }
  
  const AddPersonForm = (
    <div className="mt-4 pt-4 border-t">
        <Label htmlFor="new-person-name" className="text-xs text-muted-foreground">Add someone new to this split?</Label>
        <div className="flex items-center gap-2 mt-1">
            <Input
                id="new-person-name"
                placeholder="New person's name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewPerson();
                    }
                }}
            />
            <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleAddNewPerson}
                disabled={!newPersonName.trim()}
            >
                <UserPlus className="h-4 w-4" />
            </Button>
        </div>
    </div>
  );

  return (
    <div className='space-y-2'>
        <div className="text-center relative">
            <h3 className="text-lg font-medium">Log Expense</h3>
            <p className="text-sm text-muted-foreground">Quickly add a new transaction manually.</p>
            <div className="absolute top-0 right-0">
                <Button
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={toggleListening}
                    disabled={isVoiceLoading}
                    className={cn("rounded-full", isListening && 'animate-pulse')}
                >
                    {isVoiceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Mic className="h-4 w-4" />
                    )}
                    <span className="sr-only">Log expense with voice</span>
                </Button>
            </div>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                            field.onChange(e);
                            if (selectedPeople.length > 0) {
                                setCustomSplits({});
                            }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Lunch with colleagues" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="receipt"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Receipt (Optional)</FormLabel>
                        <FormControl>
                        {!receiptPreview ? (
                            <div className="relative">
                                <Button asChild variant="outline" className="w-full justify-start text-muted-foreground font-normal">
                                    <Label className="w-full">
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    {fileName || "Attach a file"}
                                    </Label>
                                </Button>
                                <Input
                                    {...fieldProps}
                                    type="file" 
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFileName(file.name);
                                            onChange(e.target.files);

                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setReceiptPreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button type="button" className="relative w-full h-32 rounded-md overflow-hidden border cursor-pointer group">
                                            <Image src={receiptPreview} alt="Receipt preview" layout="fill" objectFit="cover" className="group-hover:opacity-75 transition-opacity"/>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ZoomIn className="h-8 w-8 text-white" />
                                            </div>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl h-[90vh] p-2 bg-transparent border-none">
                                        <Image src={receiptPreview} alt="Receipt full view" layout="fill" objectFit="contain" />
                                    </DialogContent>
                                </Dialog>
                                <Button size="sm" variant="outline" className="w-full" onClick={handleClearReceipt}>
                                    <X className="mr-2 h-4 w-4" /> Clear Receipt
                                </Button>
                            </div>
                        )}
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={!totalAmount || totalAmount <= 0}>
                      <Users className="mr-2 h-4 w-4" />
                       {selectedPeople.length > 0 
                        ? `Split with ${selectedPeople.length} people` 
                        : "Split Bill"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Split Bill</DialogTitle>
                      <DialogDescription>
                        Select people and specify how to split the {formatCurrency(totalAmount)}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto -mr-6 pr-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="split-group-name">Group/Event Name (Optional)</Label>
                            <Input 
                                id="split-group-name"
                                placeholder="e.g. Weekend Trip, Team Lunch" 
                                value={splitGroupName}
                                onChange={(e) => setSplitGroupName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">This will be used as the transaction note.</p>
                        </div>
                        <Separator />
                        <div className="space-y-2 py-2">
                          {people.length > 0 ? people.map(person => (
                            <div key={person.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent" >
                              <Checkbox
                                id={`person-${person.id}`}
                                checked={selectedPeople.includes(person.id)}
                                onCheckedChange={() => togglePersonSelection(person.id)}
                              />
                              <Label htmlFor={`person-${person.id}`} className="flex-1 cursor-pointer">{person.name}</Label>
                            </div>
                          )) : <p className='text-sm text-muted-foreground text-center'>No people added yet.</p>}
                        </div>
                        {AddPersonForm}
                        {selectedPeople.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-4">
                               <div className='flex justify-between items-center'>
                                 <h4 className="font-medium">Custom Amounts</h4>
                                 <Button variant="secondary" size="sm" onClick={handleSplitEqually}>Split Equally</Button>
                               </div>
                                <div className="space-y-3">
                                    {selectedPeople.map(personId => {
                                        const person = people.find(p => p.id === personId);
                                        return (
                                            <div key={personId} className="flex items-center gap-3">
                                                <Label htmlFor={`split-${personId}`} className="w-24 truncate">{person?.name}</Label>
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                                    <Input 
                                                        id={`split-${personId}`} 
                                                        type="number" 
                                                        placeholder="0.00"
                                                        className="pl-6"
                                                        value={customSplits[personId] || ''}
                                                        onChange={(e) => setCustomSplits(prev => ({...prev, [personId]: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                               <Separator />
                               <div className='flex justify-between text-sm font-medium p-2 rounded-lg bg-muted/50'>
                                    <span>You (Your Share):</span>
                                    <span className={myShare < 0 ? 'text-destructive' : 'text-foreground'}>
                                        {formatCurrency(myShare)}
                                    </span>
                               </div>
                               <div className='flex justify-between text-sm font-medium p-2 rounded-lg bg-muted/50'>
                                    <span>Total Assigned to Others:</span>
                                    <span className={currentSplitTotalForOthers > totalAmount ? 'text-destructive' : 'text-foreground'}>
                                        {formatCurrency(currentSplitTotalForOthers)}
                                    </span>
                               </div>
                            </div>
                          </>
                        )}
                    </div>
                    <DialogFooter className="flex-shrink-0 pt-4">
                      {isSplitInvalid && (
                        <p className="text-sm text-destructive text-left mr-auto">
                            {isIndividualSplitTooHigh 
                            ? 'A single split cannot exceed the total amount.' 
                            : 'Total split for others exceeds total amount.'}
                        </p>
                       )}
                      <DialogClose asChild>
                        <Button disabled={isSplitInvalid}>Done</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {selectedPeople.length > 0 && (
                  <div className='flex flex-wrap gap-1 items-center text-sm text-muted-foreground'>
                    Splitting with: {people.filter(p => selectedPeople.includes(p.id)).map(p => <Badge key={p.id} variant="secondary">{p.name}</Badge>)}
                  </div>
                )}
                
                <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>
            </form>
          </Form>
    </div>
  );
}
