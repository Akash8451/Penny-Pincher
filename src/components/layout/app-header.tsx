
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppTour from './app-tour';

interface AppHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/20 bg-background/60 backdrop-blur-lg px-4 md:px-8">
      <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <Badge variant="outline" className="items-center gap-1.5 hidden sm:flex border-green-500/50 text-green-600">
            <Lock className="h-3 w-3" />
            <span>Secure Mode On</span>
        </Badge>
        
        <AppTour />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You have no new notifications.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {children}
      </div>
    </header>
  );
}
