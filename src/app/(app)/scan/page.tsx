
'use client';

import { AppHeader } from '@/components/layout/app-header';
import ReceiptScanner from '@/components/scan/receipt-scanner';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScanPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <AppHeader title="Scan Receipt" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {isClient ? (
          <ReceiptScanner />
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
