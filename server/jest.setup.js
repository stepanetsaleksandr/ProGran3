import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.API_KEYS = 'test-api-key-1,test-api-key-2'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }))
  }))
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({
    allowed: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000
  })),
  getClientIp: jest.fn(() => '127.0.0.1')
}))

// Mock HMAC
jest.mock('@/lib/hmac', () => ({
  verifyHMAC: jest.fn(() => ({ valid: true })),
  isHMACEnabled: jest.fn(() => false)
}))

// Global test utilities
global.createMockRequest = (options = {}) => {
  const {
    method = 'POST',
    url = 'http://localhost/api/test',
    headers = {},
    body = {}
  } = options

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
      'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
      'X-Endpoint': '/api/test',
      'X-Plugin-Version': '3.2.0',
      ...headers
    },
    body: JSON.stringify(body)
  })
}

global.createMockLicense = (overrides = {}) => ({
  id: 'test-license-id',
  license_key: 'PROGRAN3-2025-TEST-123',
  user_id: 'test-user-id',
  status: 'generated',
  duration_days: 30,
  created_at: new Date().toISOString(),
  ...overrides
})

global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides
})
