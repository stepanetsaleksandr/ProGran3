'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';

interface DashboardContextType {
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { refreshStats } = useDashboardStats();

  const refreshDashboard = async () => {
    await refreshStats();
  };

  return (
    <DashboardContext.Provider value={{ refreshDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
