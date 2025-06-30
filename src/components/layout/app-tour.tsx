
'use client';

import React from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const AppTour = () => {
  const router = useRouter();
  const pathname = usePathname();

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      onPopoverRender: (popover) => {
        popover.wrapper.style.borderRadius = "var(--radius)";
        popover.wrapper.style.backgroundColor = "hsl(var(--background))";
        popover.wrapper.style.color = "hsl(var(--foreground))";
      },
      steps: [
        {
          popover: {
            title: 'Welcome to PennyPincher!',
            description: 'This quick tour will guide you through the key features. Ready to get started?'
          }
        },
        {
          element: '#dashboard-main-content',
          popover: {
            title: 'The Dashboard',
            description: 'This is your financial command center. Here you can see quick stats, your savings goals, and get help from the AI assistant.',
            side: 'bottom',
            align: 'start'
          },
          onHighlightStarted: () => {
            if (pathname !== '/dashboard') {
              router.push('/dashboard');
              // Give router time to navigate before driver.js proceeds
              return new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        },
        {
          element: '#fab-add-button',
          popover: {
            title: 'Logging Transactions',
            description: 'Use this floating button to quickly add new expenses, income, or payment requests. You can even split bills with friends!',
            side: 'top',
            align: 'end'
          }
        },
        {
          element: '#scan-nav-link',
          popover: {
            title: 'AI-Powered Features',
            description: 'Chat with the AI assistant, scan receipts to automatically itemize expenses, or import transactions from statements. Find these in the sidebar.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#app-sidebar',
          popover: {
            title: 'Navigation',
            description: 'Use the sidebar on the left to navigate between different sections.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#settings-nav-link',
          popover: {
            title: 'Settings & Data',
            description: 'Customize the app\'s appearance, manage your data with encrypted backups, and unlock pro features in the Settings page.',
            side: 'right',
            align: 'start'
          },
           onHighlightStarted: () => {
            if (pathname !== '/settings') {
              router.push('/settings');
              return new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        },
         {
          popover: {
            title: 'You\'re All Set!',
            description: 'That\'s it for the tour. Enjoy managing your finances with PennyPincher!'
          }
        }
      ]
    });
    
    driverObj.drive();
  };

  return (
    <Button variant="outline" onClick={startTour} className="hidden sm:inline-flex">
      <Compass className="mr-2 h-4 w-4" />
      Tour
    </Button>
  );
};

export default AppTour;
