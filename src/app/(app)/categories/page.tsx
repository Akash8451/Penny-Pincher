
'use client';
import { AppHeader } from '@/components/layout/app-header';
import CategoryManager from '@/components/categories/category-manager';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CategoriesPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <AppHeader title="Manage Categories">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
      </AppHeader>
      <div className="flex-1 space-y-4 p-4">
        {isClient ? (
          <CategoryManager />
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
