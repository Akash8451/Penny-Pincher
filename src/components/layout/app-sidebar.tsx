
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Shapes, Settings, Wallet, Users, List, ChevronLeft, ChevronRight, Lock, ScanLine } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function AppSidebar() {
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isProUnlocked] = useLocalStorage('pro-features-unlocked', false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: List, label: 'Transactions' },
    { href: '/scan', icon: ScanLine, label: 'Scan Receipt' },
    { href: '/categories', icon: Shapes, label: 'Categories' },
    { href: '/people', icon: Users, label: 'People' },
    ...(isClient && isProUnlocked ? [{ href: '/vault', icon: Lock, label: 'Vault' }] : []),
  ];

  const isExpanded = isPinned || isHovering;

  const handleTogglePin = () => {
    setIsPinned(prev => !prev);
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <TooltipProvider delayDuration={0}>
        <aside 
          className={cn(
            "fixed top-0 h-screen left-0 hidden border-r bg-card sm:flex flex-col z-30 transition-all duration-300 ease-in-out",
            isExpanded ? "w-[220px]" : "w-[68px]"
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className={cn(
            "flex h-16 items-center border-b px-4",
            isExpanded ? "justify-between" : "justify-center"
          )}>
            <Link href="/dashboard" className={cn("flex items-center gap-2", !isExpanded && "hidden")}>
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="font-bold">PennyPincher</span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label="Toggle sidebar">
              {isPinned ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const linkContent = (
                <>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                  <item.icon className="h-5 w-5" />
                  <span className={cn("truncate", !isExpanded && "sr-only")}>{item.label}</span>
                </>
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center h-10 rounded-lg transition-colors relative',
                    !isExpanded ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {linkContent}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-2 border-t">
            <Link
              href="/settings"
              className={cn(
                  'flex items-center h-10 rounded-lg transition-colors relative',
                  !isExpanded ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                  pathname.startsWith("/settings")
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
            >
              {pathname.startsWith("/settings") && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
              <Settings className="h-5 w-5" />
              <span className={cn(!isExpanded && "sr-only")}>Settings</span>
            </Link>
          </div>
        </aside>
      </TooltipProvider>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t border-border/20 z-20 flex items-center justify-around">
         {[...navItems, { href: '/settings', icon: Settings, label: 'Settings' }].map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors hover:text-foreground w-16',
                    pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center">{item.label}</span>
            </Link>
        ))}
      </nav>
    </>
  );
}
