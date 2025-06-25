
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, Expense, Person, Split } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, PlusCircle, Users, Mic, MicOff, Loader } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { logExpenseFromVoice } from '@/ai/flows/log-expense-voice-flow';
import { cn } from '@/lib/utils';
import { DialogTitle as FormDialogTitle, DialogDescription as FormDialogDescription, DialogHeader as FormDialogHeader } from '@/components/ui/dialog';


interface QuickExpenseFormProps {
  categories: Category[];
  people: Person[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  onSuccess: () => void;
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  note: z.string().max(100, "Note is too long.").optional(),
  receipt: z.any().optional(),
});

// Speech Recognition Hook
const useSpeechRecognition = ({ onResult, onError }: { onResult: (text: string) => void; onError: (error: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
        setIsListening(false);
        onError(event.error);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onResult(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult, onError]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return { isListening, toggleListening };
};


export default function QuickExpenseForm({ categories, people, onAddExpense, onSuccess }: QuickExpenseFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: undefined, categoryId: '', note: '' },
  });
  const totalAmount = Number(form.watch('amount')) || 0;
  const [isAILoading, setAILoading] = useState(false);

  const [fileName, setFileName] = React.useState('');
  const [isSplitBillOpen, setSplitBillOpen] = React.useState(false);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [customSplits, setCustomSplits] = React.useState<Record<string, string>>({});
  const [splitGroupName, setSplitGroupName] = React.useState('');

  const handleVoiceResult = async (query: string) => {
    setAILoading(true);
    toast({ title: "Processing your voice command...", description: `Heard: "${query}"` });
    try {
        const result = await logExpenseFromVoice({ query, categories });
        if (result.amount) form.setValue('amount', result.amount);
        if (result.categoryId) form.setValue('categoryId', result.categoryId);
        if (result.note) form.setValue('note', result.note);
        toast({ title: "Success!", description: "Expense details have been filled in." });
    } catch (error) {
        console.error("Voice processing error:", error);
        toast({ variant: 'destructive', title: "AI Error", description: "Couldn't process the voice command." });
    } finally {
        setAILoading(false);
    }
  };

  const handleVoiceError = (error: string) => {
    toast({ variant: 'destructive', title: 'Speech Recognition Error', description: error });
  };
  
  const { isListening, toggleListening } = useSpeechRecognition({ onResult: handleVoiceResult, onError: handleVoiceError });


  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    let splitWithData: Split[] | undefined = undefined;

    if (selectedPeople.length > 0) {
      const customTotal = Object.values(customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

      if (customTotal > values.amount) {
           toast({
              variant: 'destructive',
              title: "Split Error",
              description: `The assigned splits for others ($${customTotal.toFixed(2)}) cannot exceed the total expense ($${values.amount.toFixed(2)}).`,
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
        const equalAmount = values.amount / numberOfParticipants;
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
    }

    if (values.receipt && values.receipt.length > 0) {
      const file = values.receipt[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        onAddExpense({ ...expenseData, receipt: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      onAddExpense(expenseData);
    }

    toast({
      title: "Expense Added!",
      description: "Your expense has been logged successfully.",
    });
    form.reset();
    setFileName('');
    setSelectedPeople([]);
    setCustomSplits({});
    setSplitGroupName('');
    onSuccess();
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
    const numberOfParticipants = selectedPeople.length + 1;
    const amountPerPerson = totalAmount / numberOfParticipants;

    const newSplits: Record<string, string> = {};
    let totalAssignedToOthers = 0;

    for (let i = 0; i < selectedPeople.length - 1; i++) {
        const personId = selectedPeople[i];
        const roundedAmount = parseFloat(amountPerPerson.toFixed(2));
        newSplits[personId] = roundedAmount.toString();
        totalAssignedToOthers += roundedAmount;
    }

    if (selectedPeople.length > 0) {
        const lastPersonId = selectedPeople[selectedPeople.length - 1];
        const myShare = parseFloat(amountPerPerson.toFixed(2));
        const lastPersonAmount = totalAmount - myShare - totalAssignedToOthers;
        newSplits[lastPersonId] = lastPersonAmount.toFixed(2);
    }
    
    setCustomSplits(newSplits);
  }
  
  const currentSplitTotalForOthers = React.useMemo(() => {
    return Object.values(customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  }, [customSplits]);

  const myShare = totalAmount - currentSplitTotalForOthers;

  return (
    <>
      <FormDialogHeader>
          <FormDialogTitle>Log Expense</FormDialogTitle>
          <FormDialogDescription>Quickly add a new transaction manually or with your voice.</FormDialogDescription>
      </FormDialogHeader>
      <div className='py-4'>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="$0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : e.target.value
                          )
                        }
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
                  render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Receipt (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Button asChild variant="outline" className="w-full justify-start text-muted-foreground font-normal">
                                <Label>
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
                                    }
                                }}
                            />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Dialog open={isSplitBillOpen} onOpenChange={setSplitBillOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={!totalAmount || totalAmount <= 0}>
                      <Users className="mr-2 h-4 w-4" />
                       {selectedPeople.length > 0 
                        ? `Split with ${selectedPeople.length} people` 
                        : "Split Bill"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Split Bill</DialogTitle>
                      <DialogDescription>
                        Select people and specify how to split the ${totalAmount.toFixed(2)}.
                      </DialogDescription>
                    </DialogHeader>
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
                    <ScrollArea className="max-h-40">
                    <div className="space-y-2 py-2 pr-4">
                      {people.length > 0 ? people.map(person => (
                        <div key={person.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent" >
                          <Checkbox
                            id={`person-${person.id}`}
                            checked={selectedPeople.includes(person.id)}
                            onCheckedChange={() => togglePersonSelection(person.id)}
                          />
                          <Label htmlFor={`person-${person.id}`} className="flex-1 cursor-pointer">{person.name}</Label>
                        </div>
                      )) : <p className='text-sm text-muted-foreground text-center'>Add people in the 'People' tab first.</p>}
                    </div>
                    </ScrollArea>
                    {selectedPeople.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                           <div className='flex justify-between items-center'>
                             <h4 className="font-medium">Custom Amounts</h4>
                             <Button variant="secondary" size="sm" onClick={handleSplitEqually}>Split Equally</Button>
                           </div>
                           <ScrollArea className="max-h-48">
                            <div className="space-y-3 pr-4">
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
                           </ScrollArea>
                           <Separator />
                           <div className='flex justify-between text-sm font-medium p-2 rounded-lg bg-muted/50'>
                                <span>You (Your Share):</span>
                                <span className={myShare < 0 ? 'text-destructive' : 'text-foreground'}>
                                    ${myShare.toFixed(2)}
                                </span>
                           </div>
                           <div className='flex justify-between text-sm font-medium p-2 rounded-lg bg-muted/50'>
                                <span>Total Assigned to Others:</span>
                                <span className={currentSplitTotalForOthers > totalAmount ? 'text-destructive' : 'text-foreground'}>
                                    ${currentSplitTotalForOthers.toFixed(2)}
                                </span>
                           </div>
                        </div>
                      </>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button>Done</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {selectedPeople.length > 0 && (
                  <div className='flex flex-wrap gap-1 items-center text-sm text-muted-foreground'>
                    Splitting with: {people.filter(p => selectedPeople.includes(p.id)).map(p => <Badge key={p.id} variant="secondary">{p.name}</Badge>)}
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-4">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isAILoading || isListening}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={toggleListening}
                        disabled={isAILoading}
                        className={cn(isListening && "bg-destructive text-destructive-foreground")}
                    >
                        {isAILoading ? <Loader className="animate-spin" /> : isListening ? <MicOff /> : <Mic />}
                    </Button>
                </div>
            </form>
          </Form>
        </div>
    </>
  );
}
