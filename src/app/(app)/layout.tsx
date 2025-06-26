'use client';
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';

function MainContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  return (
    <main className={cn(
      "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out",
      isExpanded ? "sm:ml-[220px]" : "sm:ml-[68px]"
    )}>
      {children}
    </main>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <MainContent>
          <div className="flex-1 overflow-y-auto pb-20 sm:pb-0">
            {children}
          </div>
          <FloatingActionButton />
        </MainContent>
      </div>
    </SidebarProvider>
  )
}
