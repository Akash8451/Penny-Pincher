
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Compass, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';

const tourSteps = [
  {
    title: 'Welcome to PennyPincher!',
    description: 'This quick tour will guide you through the key features of the app. Ready to get started?',
  },
  {
    title: 'The Dashboard',
    description: 'This is your financial command center. Here you can see quick stats, your savings goals, and get help from the AI assistant.',
  },
  {
    title: 'Logging Transactions',
    description: 'Use the floating (+) button at the bottom right to quickly add new expenses or income. You can even split bills with friends!',
  },
  {
    title: 'AI-Powered Features',
    description: 'Chat with the AI assistant, scan receipts to automatically itemize expenses, or import transactions from statements. Find these in the sidebar.',
  },
  {
    title: 'Navigation',
    description: 'Use the sidebar on the left to navigate between different sections like Transactions, Categories, and People.',
  },
  {
    title: 'Settings & Data',
    description: 'Customize the app\'s appearance, manage your data with encrypted backups, and unlock pro features in the Settings page.',
  },
];

export default function AppTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const currentStep = tourSteps[step];

  const goToNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      setIsOpen(false);
      setStep(0);
    }
  };

  const goToPrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Compass className="mr-2 h-4 w-4" />
          Tour
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={goToPrev}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
          </div>
          <Button onClick={goToNext}>
            {step === tourSteps.length - 1 ? (
                <>Finish <PartyPopper className="ml-2 h-4 w-4" /></>
            ) : (
                <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
