
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface SidebarContextType {
  isExpanded: boolean;
  setIsPinned: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isPinned, setIsPinned] = useLocalStorage('sidebar-pinned', false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isExpanded = useMemo(() => isClient && isPinned, [isClient, isPinned]);

  const value = {
    isExpanded,
    setIsPinned,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
