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
        // New API structure: data.data.licenses (with pagination)
        const licenses = data.data?.licenses || data.data || [];
        setLicenses(Array.isArray(licenses) ? licenses : []);
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
      // Get API key from environment (client-side)
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
      
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
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
      // Get API key from environment (client-side)
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
      
      const response = await fetch(`/api/licenses/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      
      // Check if response has content before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = text ? JSON.parse(text) : { error: 'Failed to delete license' };
        } catch {
          errorData = { error: text || 'Failed to delete license' };
        }
        setError(errorData.error || 'Failed to delete license');
        return false;
      }

      // Try to parse JSON, handle empty responses
      const text = await response.text();
      const data = text ? JSON.parse(text) : { success: true };
      
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
