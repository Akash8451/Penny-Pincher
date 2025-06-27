
'use client';

import React, { useState, useMemo } from 'react';
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
import { Check, ChevronsUpDown, icons, PlusCircle, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


// A curated list of common icons for finance apps to avoid loading all 700+ icons.
const curatedIconList = [
  'Activity', 'Award', 'Banknote', 'Bike', 'BookOpen', 'Briefcase', 'Bus', 'Car',
  'Cat', 'Cigarette', 'CircleDollarSign', 'Clapperboard', 'Coffee', 'Coins', 'CreditCard',
  'Dog', 'Dumbbell', 'Film', 'Fuel', 'Gamepad2', 'Gift', 'GraduationCap', 'HandCoins',
  'HeartPulse', 'Home', 'Landmark', 'Laptop', 'Martini', 'Mic', 'Music', 'Package',
  'PawPrint', 'PersonStanding', 'Phone', 'PiggyBank', 'Pill', 'Plane', 'Plug',
  'Receipt', 'Scale', 'Shirt', 'ShoppingCart', 'ShoppingBag', 'Smartphone', 'Sprout',
  'Ticket', 'Train', 'TreePalm', 'Truck', 'Tv', 'UtensilsCrossed', 'Wallet', 'Wrench', 'Zap'
];

function CategoryForm({
  category,
  onSave,
  iconList,
}: {
  category?: Category | null;
  onSave: (category: Omit<Category, 'id'>) => void;
  iconList: string[];
}) {
  const [name, setName] = useState(category?.name || '');
  const [group, setGroup] = useState(category?.group || '');
  const [icon, setIcon] = useState(category?.icon || 'Package');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && group && icon) {
      onSave({ name, group, icon });
    }
  };
  
  const CurrentIcon = icons[icon as keyof typeof icons] || Package;

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
        <Label>Icon</Label>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between font-normal"
            >
              <div className="flex items-center gap-2">
                <CurrentIcon className="h-4 w-4" />
                {icon}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search icons..." />
              <CommandList>
                <CommandEmpty>No icon found.</CommandEmpty>
                <CommandGroup>
                  {iconList.map((iconName) => {
                    const IconComponent = icons[iconName as keyof typeof icons] || Package;
                    return (
                      <CommandItem
                        key={iconName}
                        value={iconName}
                        onSelect={(currentValue) => {
                          const originalIconName = iconList.find(i => i.toLowerCase() === currentValue);
                          setIcon(originalIconName || 'Package');
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            icon.toLowerCase() === iconName.toLowerCase() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <IconComponent className="mr-2 h-4 w-4" />
                        {iconName}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
  
  const categoryGroups = useMemo(() => {
    return categories.reduce((acc, category) => {
        (acc[category.group] = acc[category.group] || []).push(category);
        return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  // Create a combined, unique, and sorted list of icons to show in the dropdown.
  const availableIcons = useMemo(() => {
    const usedIcons = categories.map(c => c.icon);
    const combined = [...new Set([...curatedIconList, ...usedIcons])];
    return combined.sort();
  }, [categories]);

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
                    const Icon = icons[cat.icon as keyof typeof icons] || Package;
                    return (
                        <div key={cat.id} className="flex items-center p-3 rounded-lg bg-accent/50">
                            <Icon className="h-5 w-5 mr-3 text-accent-foreground flex-shrink-0" />
                            <span className="flex-1 font-medium truncate min-w-0">{cat.name}</span>
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
              iconList={availableIcons}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
