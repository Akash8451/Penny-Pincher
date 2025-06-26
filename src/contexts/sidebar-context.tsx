'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsPinned: (value: boolean) => void;
  setIsHovering: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isExpanded = useMemo(() => isClient && (isPinned || isHovering), [isClient, isPinned, isHovering]);

  const value = {
    isExpanded,
    setIsPinned,
    setIsHovering,
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
