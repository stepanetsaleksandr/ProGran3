// Simple Jest setup without complex mocks
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.API_KEYS = 'test-api-key-1,test-api-key-2'
