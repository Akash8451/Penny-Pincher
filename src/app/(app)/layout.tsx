
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col pb-20 sm:pb-0 animate-fade-in-up">
        {children}
        <FloatingActionButton />
      </main>
    </div>
  )
}
