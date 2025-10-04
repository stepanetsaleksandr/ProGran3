import { useState, useEffect, useCallback } from 'react';

interface License {
  id: string;
  license_key: string;
  duration_days: number;
  description: string;
  status: 'generated' | 'activated' | 'active' | 'expired' | 'revoked';
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  updated_at: string | null;
  users: {
    email: string;
    name: string;
  } | null;
}

interface UseLicensesReturn {
  licenses: License[];
  loading: boolean;
  error: string | null;
  refreshLicenses: () => Promise<void>;
  createLicense: (data: { duration_days: number; description: string }) => Promise<boolean>;
  deleteLicense: (id: string) => Promise<boolean>;
}

export function useLicenses(): UseLicensesReturn {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/licenses');
      const data = await response.json();
      
      if (data.success) {
        setLicenses(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch licenses');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLicense = useCallback(async (licenseData: { duration_days: number; description: string }): Promise<boolean> => {
    try {
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh licenses after creation
        await fetchLicenses();
        return true;
      } else {
        setError(data.error || 'Failed to create license');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating license:', err);
      return false;
    }
  }, [fetchLicenses]);

  const deleteLicense = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/delete-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh licenses after deletion
        await fetchLicenses();
        return true;
      } else {
        setError(data.error || 'Failed to delete license');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting license:', err);
      return false;
    }
  }, [fetchLicenses]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  return {
    licenses,
    loading,
    error,
    refreshLicenses: fetchLicenses,
    createLicense,
    deleteLicense
  };
}
