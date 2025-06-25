
'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import * as Lucide from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

const iconList = Object.keys(Lucide).filter(k => typeof Lucide[k as keyof typeof Lucide] === 'object');

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

function CategoryForm({
  category,
  onSave,
  onClose,
}: {
  category?: Category | null;
  onSave: (category: Omit<Category, 'id'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [group, setGroup] = useState(category?.group || '');
  const [icon, setIcon] = useState(category?.icon || 'Package');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && group && icon) {
      onSave({ name, group, icon });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="group">Group</Label>
        <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g., Essentials, Discretionary" required />
      </div>
      <div>
        <Label htmlFor="icon">Icon</Label>
         <Select onValueChange={setIcon} defaultValue={icon}>
            <SelectTrigger>
              <SelectValue placeholder="Select an icon" />
            </SelectTrigger>
            <SelectContent>
                {iconList.map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                           {isValidIcon(iconName) && React.createElement(Lucide[iconName], { className: "h-4 w-4" })}
                           {iconName}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Category</Button>
      </DialogFooter>
    </form>
  );
}

export default function CategoryManager() {
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const handleSave = (categoryData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      setCategories(categories.map((c) => (c.id === editingCategory.id ? { ...c, ...categoryData } : c)));
      toast({ title: `✔ Updated "${categoryData.name}" category` });
    } else {
      setCategories([...categories, { id: `cat-${new Date().getTime()}`, ...categoryData }]);
      toast({ title: `✔ Saved "${categoryData.name}" category` });
    }
    setEditingCategory(null);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };
  
  const categoryGroups = categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
  }, {} as Record<string, Category[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Categories</CardTitle>
        <CardDescription>Organize your spending by creating and managing categories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categoryGroups).map(([group, cats]) => (
            <div key={group}>
                <h3 className="text-lg font-semibold mb-2">{group}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.map((cat) => {
                    const Icon = isValidIcon(cat.icon) ? Lucide[cat.icon] as React.ElementType : Lucide.Package;
                    return (
                        <div key={cat.id} className="flex items-center p-3 rounded-lg bg-accent/50">
                            <Icon className="h-5 w-5 mr-3 text-accent-foreground" />
                            <span className="flex-1 font-medium">{cat.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                setEditingCategory(cat);
                                setDialogOpen(true);
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your category.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )
                })}
                </div>
            </div>
        ))}
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add a New Category'}</DialogTitle>
              <DialogDescription>
                Fill in the details for your category below.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={editingCategory}
              onSave={handleSave}
              onClose={() => {
                setEditingCategory(null);
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
