import { useState, useEffect, useCallback } from 'react';

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  generatedLicenses: number;
  activatedLicenses: number;
  expiredLicenses: number;
  totalUsers: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats>({
    totalLicenses: 0,
    activeLicenses: 0,
    generatedLicenses: 0,
    activatedLicenses: 0,
    expiredLicenses: 0,
    totalUsers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // UNIFIED APPROACH: Use same endpoint as table
      const response = await fetch('/api/licenses');
      const data = await response.json();
      
      if (data.success) {
        const licenses = data.data || [];
        
        // Calculate stats from licenses data (same as table)
        const stats = {
          totalLicenses: licenses.length,
          activeLicenses: licenses.filter((l: any) => l.status === 'active').length,
          generatedLicenses: licenses.filter((l: any) => l.status === 'generated').length,
          activatedLicenses: licenses.filter((l: any) => l.status === 'activated').length,
          expiredLicenses: licenses.filter((l: any) => l.status === 'expired').length,
          totalUsers: new Set(licenses.map((l: any) => l.user_id).filter(Boolean)).size
        };
        
        setStats(stats);
        
        console.log('Unified stats calculation:', {
          licenses: licenses.map((l: any) => ({ id: l.id, status: l.status, user_id: l.user_id })),
          stats
        });
      } else {
        setError(data.error || 'Failed to fetch licenses');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  };
}
