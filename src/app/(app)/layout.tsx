
'use client';
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className={cn(
        "flex-1 flex flex-col pb-20 sm:pb-0 animate-fade-in-up transition-all duration-300 ease-in-out",
        "sm:ml-[68px]"
      )}>
        {children}
        <FloatingActionButton />
      </main>
    </div>
  )
}
