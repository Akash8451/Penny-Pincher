
'use client';

import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Lock, Unlock } from 'lucide-react';
import type { Expense, Category, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

export default function DataManagement() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people, setPeople] = useLocalStorage<Person[]>('people', []);
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isExportOpen, setExportOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const handleExport = () => {
    if (!password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a password to encrypt your backup.' });
      return;
    }

    try {
      const data = { expenses, categories, people };
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
      setExportOpen(false);
      setPassword('');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to export data.' });
    }
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const encryptedData = e.target?.result as string;
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedJson) {
                throw new Error('Decryption failed. Check your password.');
            }

            const data = JSON.parse(decryptedJson);
            if (data.expenses && Array.isArray(data.expenses) && data.categories && Array.isArray(data.categories) && data.people && Array.isArray(data.people)) {
                setExpenses(data.expenses);
                setCategories(data.categories);
                setPeople(data.people);
                toast({ title: 'Success', description: 'Your data has been imported successfully.' });
            } else {
                throw new Error('Invalid file format after decryption.');
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to import data. Please check the file and password.';
            toast({ variant: 'destructive', title: 'Import Error', description: errorMessage });
        } finally {
            setImportOpen(false);
            setFileToImport(null);
            setPassword('');
        }
    };
    reader.readAsText(fileToImport);
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
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Restore</CardTitle>
        <CardDescription>Securely back up or restore your data. All backups are encrypted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isExportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent">
                    <div>
                        <h3 className="font-medium">Export Encrypted Backup</h3>
                        <p className="text-sm text-muted-foreground">Download all your data as an encrypted file.</p>
                    </div>
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
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
                    <Button onClick={handleExport} disabled={!password}>
                        <Lock className="mr-2 h-4 w-4" /> Encrypt & Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Import from Backup</h3>
            <p className="text-sm text-muted-foreground">
              Restore data from an encrypted backup file. This will overwrite current data.
            </p>
          </div>
            <Button asChild>
                <Label>
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
                    <Button onClick={handleImport} disabled={!password}>
                       <Unlock className="mr-2 h-4 w-4" /> Decrypt & Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
