import { POST } from '@/app/api/licenses/validate/route';
import { createSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/rate-limit');

const mockSupabase = createSupabaseClient as jest.MockedFunction<typeof createSupabaseClient>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

describe('/api/licenses/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock rate limiting to always allow
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000
    });
  });

  describe('POST /api/licenses/validate', () => {
    it('should validate active license successfully', async () => {
      // Mock Supabase responses
      const mockLicense = createMockLicense({ 
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      const mockSystemInfo = {
        id: 'system-info-id',
        license_id: 'test-license-id',
        fingerprint_hash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
        last_seen: new Date().toISOString()
      };
      
      mockSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === 'licenses') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: { ...mockLicense, users: { email: 'test@example.com', name: 'Test User' } }, 
                    error: null 
                  }))
                }))
              }))
            };
          } else if (table === 'system_infos') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: mockSystemInfo, 
                    error: null 
                  }))
                }))
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
              }))
            };
          }
          return {};
        })
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.status).toBe('active');
    });

    it('should reject non-existent license', async () => {
      // Mock Supabase to return no license
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116' } // Not found
              }))
            }))
          }))
        }))
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'NON-EXISTENT-KEY',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('License not found');
    });

    it('should reject inactive license', async () => {
      // Mock Supabase to return inactive license
      const mockInactiveLicense = createMockLicense({ status: 'expired' });
      
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockInactiveLicense, 
                error: null 
              }))
            }))
          }))
        }))
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('expired, not active');
    });

    it('should reject expired license', async () => {
      // Mock Supabase to return expired license
      const mockExpiredLicense = createMockLicense({ 
        status: 'active',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      });
      
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockExpiredLicense, 
                error: null 
              }))
            }))
          }))
        }))
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('License has expired');
    });

    it('should reject fingerprint mismatch', async () => {
      // Mock Supabase responses
      const mockLicense = createMockLicense({ status: 'active' });
      const mockSystemInfo = {
        id: 'system-info-id',
        license_id: 'test-license-id',
        fingerprint_hash: 'different-fingerprint-123456789012345678901234567890123456789012345678901234567890',
        last_seen: new Date().toISOString()
      };
      
      mockSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === 'licenses') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: mockLicense, 
                    error: null 
                  }))
                }))
              }))
            };
          } else if (table === 'system_infos') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: mockSystemInfo, 
                    error: null 
                  }))
                }))
              }))
            };
          }
          return {};
        })
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('bound to a different system');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiting to reject
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 60000
      });

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many validation attempts');
    });

    it('should validate input parameters', async () => {
      const request = createMockRequest({
        body: {
          license_key: 'short',
          system_fingerprint: 'short'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });
});
