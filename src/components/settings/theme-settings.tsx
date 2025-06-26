
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ThemeSettings() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <h3 className="font-medium">Theme</h3>
                        <p className="text-sm text-muted-foreground">Select a light or dark theme.</p>
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
    );
  }
  
  const themeButtons = [
    { name: 'light', label: 'Light', icon: Sun },
    { name: 'dark', label: 'Dark', icon: Moon },
    { name: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center">
            <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                    Currently: <span className="font-semibold capitalize text-foreground">{theme}</span>
                </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeButtons.map((btn) => (
                  <SelectItem key={btn.name} value={btn.name}>
                    <div className="flex items-center gap-2">
                      <btn.icon className="h-4 w-4" />
                      <span>{btn.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </CardContent>
    </Card>
  );
}
