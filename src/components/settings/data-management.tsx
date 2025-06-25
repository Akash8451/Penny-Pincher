
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import type { Expense, Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export default function DataManagement() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const { toast } = useToast();

  const handleExport = () => {
    const data = {
      expenses,
      categories,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `pennypincher_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({ title: 'Success', description: 'Your data has been exported.' });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const data = JSON.parse(text);
            if (data.expenses && Array.isArray(data.expenses) && data.categories && Array.isArray(data.categories)) {
              setExpenses(data.expenses);
              setCategories(data.categories);
              toast({ title: 'Success', description: 'Your data has been imported.' });
            } else {
              throw new Error('Invalid file format.');
            }
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to import data. Please check the file format.' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="neumorphic-shadow">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Backup or restore your application data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Export Data</h3>
            <p className="text-sm text-muted-foreground">Download all your expenses and categories as a JSON file.</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Import Data</h3>
            <p className="text-sm text-muted-foreground">
              Restore data from a JSON backup file. This will overwrite current data.
            </p>
          </div>
          <Button asChild>
            <Label>
              <Upload className="mr-2 h-4 w-4" /> Import
              <Input type="file" className="sr-only" accept=".json" onChange={handleImport} />
            </Label>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
