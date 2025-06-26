
'use client';

import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Lock, Unlock, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Expense, Category, Person, SavingsGoal, VaultNote } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


type BackupData = {
  expenses: Expense[];
  categories: Category[];
  people: Person[];
  savingsGoals: SavingsGoal[];
  vaultNotes: VaultNote[];
  proUnlocked: boolean;
};

export default function DataManagement() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people, setPeople] = useLocalStorage<Person[]>('people', []);
  const [savingsGoals, setSavingsGoals] = useLocalStorage<SavingsGoal[]>('savings-goals', []);
  const [vaultNotes, setVaultNotes] = useLocalStorage<VaultNote[]>('vault-notes', []);
  const [proUnlocked, setProUnlocked] = useLocalStorage<boolean>('pro-features-unlocked', false);
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  
  const [isExportOpen, setExportOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  const [isExporting, setExporting] = useState(false);
  const [isImporting, setImporting] = useState(false);

  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);

  const handleExport = () => {
    if (!password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a password to encrypt your backup.' });
      return;
    }
    setExporting(true);

    setTimeout(() => {
      try {
        const data: BackupData = { expenses, categories, people, savingsGoals, vaultNotes, proUnlocked };
        const jsonString = JSON.stringify(data, null, 2);
        const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();

        const blob = new Blob([encrypted], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pennypincher_backup_encrypted_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({ title: 'Success', description: 'Your encrypted data has been exported.' });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to export data.' });
      } finally {
        setExportOpen(false);
        setPassword('');
        setExporting(false);
      }
    }, 500);
  };

  const handleImport = () => {
    if (!fileToImport) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to import.' });
        return;
    }
    if (!password) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter the password for this backup file.' });
        return;
    }
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        setTimeout(() => {
            try {
                const encryptedData = e.target?.result as string;
                const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, password);
                const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);

                if (!decryptedJson) {
                    throw new Error('Decryption failed. Check your password.');
                }

                const data: BackupData = JSON.parse(decryptedJson);
                
                // Basic validation of the imported data structure
                if (data.expenses && Array.isArray(data.expenses) && data.categories && Array.isArray(data.categories) && data.people && Array.isArray(data.people)) {
                    setPreviewData(data);
                    setImportOpen(false);
                    setPreviewOpen(true);
                } else {
                    throw new Error('Invalid file format after decryption.');
                }
            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to import data. Please check the file and password.';
                toast({ variant: 'destructive', title: 'Import Error', description: errorMessage });
            } finally {
                setImporting(false);
                setPassword('');
            }
        }, 500);
    };
    reader.readAsText(fileToImport);
  };

  const confirmImport = () => {
    if (!previewData) return;
    setExpenses(previewData.expenses || []);
    setCategories(previewData.categories || DEFAULT_CATEGORIES);
    setPeople(previewData.people || []);
    setSavingsGoals(previewData.savingsGoals || []);
    setVaultNotes(previewData.vaultNotes || []);
    setProUnlocked(previewData.proUnlocked || false);

    toast({ title: 'Success', description: 'Your data has been restored.' });
    
    setPreviewOpen(false);
    setPreviewData(null);
    setFileToImport(null);
  };
  
  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToImport(file);
      setImportOpen(true);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Restore</CardTitle>
        <CardDescription>Securely back up or restore your data. All backups are encrypted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-medium">Export Encrypted Backup</h3>
                <p className="text-sm text-muted-foreground">Download all your data as an encrypted file.</p>
            </div>
            <Dialog open={isExportOpen} onOpenChange={setExportOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Backup Password</DialogTitle>
                        <DialogDescription>
                            This password will be required to restore your data. Keep it safe, as it cannot be recovered.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password-export" className="text-right">
                            Password
                        </Label>
                        <Input id="password-export" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleExport} disabled={!password || isExporting}>
                            {isExporting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Encrypting...</>
                            ) : (
                                <><Lock className="mr-2 h-4 w-4" /> Encrypt & Export</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-medium">Import from Backup</h3>
            <p className="text-sm text-muted-foreground">
              Restore data from an encrypted backup file.
            </p>
          </div>
            <Button asChild className="w-full sm:w-auto">
                <Label className='cursor-pointer'>
                    <Upload className="mr-2 h-4 w-4" /> Select File
                    <Input type="file" className="sr-only" accept=".txt,.json" onChange={onFileSelect} />
                </Label>
            </Button>
        </div>
        
        <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enter Backup Password</DialogTitle>
                    <DialogDescription>
                        Enter the password used to encrypt this backup file: <span className="font-medium text-foreground">{fileToImport?.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password-import" className="text-right">
                        Password
                    </Label>
                    <Input id="password-import" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" onClick={() => { setPassword(''); setFileToImport(null); }}>Cancel</Button></DialogClose>
                    <Button onClick={handleImport} disabled={!password || isImporting}>
                       {isImporting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Decrypting...</>
                       ) : (
                            <><Unlock className="mr-2 h-4 w-4" /> Decrypt & Preview</>
                       )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    <AlertDialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldCheck className="text-green-500" /> Restore Preview</AlertDialogTitle>
            <AlertDialogDescription>
                Your backup file contains the following data. Restoring will <span className="font-bold text-destructive">overwrite all current data</span> in the app.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="text-sm rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between"><span>Transactions:</span> <span className="font-medium">{previewData?.expenses.length ?? 0}</span></div>
                <div className="flex justify-between"><span>Categories:</span> <span className="font-medium">{previewData?.categories.length ?? 0}</span></div>
                <div className="flex justify-between"><span>People:</span> <span className="font-medium">{previewData?.people.length ?? 0}</span></div>
                <div className="flex justify-between"><span>Savings Goals:</span> <span className="font-medium">{previewData?.savingsGoals.length ?? 0}</span></div>
                <div className="flex justify-between"><span>Secure Notes:</span> <span className="font-medium">{previewData?.vaultNotes.length ?? 0}</span></div>
                <div className="flex justify-between"><span>Pro Status:</span> <span className="font-medium">{previewData?.proUnlocked ? 'Unlocked' : 'Locked'}</span></div>
            </div>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPreviewData(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} className="bg-destructive hover:bg-destructive/90">
                <AlertTriangle className="mr-2 h-4 w-4" /> Confirm & Overwrite
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
