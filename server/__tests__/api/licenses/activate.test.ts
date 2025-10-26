import { POST } from '@/app/api/licenses/activate/route';
import { createSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/rate-limit');

const mockSupabase = createSupabaseClient as jest.MockedFunction<typeof createSupabaseClient>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

describe('/api/licenses/activate', () => {
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

  describe('POST /api/licenses/activate', () => {
    it('should activate a valid license successfully', async () => {
      // Mock Supabase responses
      const mockLicense = createMockLicense({ status: 'generated' });
      const mockUser = createMockUser();
      
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockLicense, 
                error: null 
              }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockUser, 
                error: null 
              }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ 
                  data: { ...mockLicense, status: 'active' }, 
                  error: null 
                }))
              }))
            }))
          }))
        }))
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('active');
      expect(data.data.license_key).toBe('PROGRAN3-2025-TEST-123');
    });

    it('should reject invalid license key', async () => {
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
          license_key: 'INVALID-KEY',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid license key');
    });

    it('should reject already activated license', async () => {
      // Mock Supabase to return already active license
      const mockActiveLicense = createMockLicense({ status: 'active' });
      
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockActiveLicense, 
                error: null 
              }))
            }))
          }))
        }))
      } as any);

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already activated');
    });

    it('should reject request with invalid fingerprint', async () => {
      const request = createMockRequest({
        headers: {
          'X-Fingerprint': 'invalid-fingerprint'
        },
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('X-Fingerprint header required');
    });

    it('should reject request with old timestamp', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      
      const request = createMockRequest({
        headers: {
          'X-Timestamp': oldTimestamp.toString()
        },
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('timestamp too old');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiting to reject
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000
      });

      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many activation attempts');
    });

    it('should validate email format', async () => {
      const request = createMockRequest({
        body: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'invalid-email',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
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
