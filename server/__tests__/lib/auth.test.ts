import { 
  generateAdminToken, 
  generateUserToken, 
  validateToken, 
  validateAdminToken, 
  validateUserToken,
  validateLegacyApiKey,
  validateAuth 
} from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('Auth Library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.API_KEYS = 'test-api-key-1,test-api-key-2';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateAdminToken', () => {
    it('should generate valid admin token', () => {
      const token = generateAdminToken('admin-123');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with correct payload', () => {
      const token = generateAdminToken('admin-123');
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(decoded.userId).toBe('admin-123');
      expect(decoded.role).toBe('admin');
      expect(decoded.type).toBe('admin');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateUserToken', () => {
    it('should generate valid user token', () => {
      const token = generateUserToken('user-123');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate token with correct payload', () => {
      const token = generateUserToken('user-123');
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(decoded.userId).toBe('user-123');
      expect(decoded.role).toBe('user');
      expect(decoded.type).toBe('user');
    });
  });

  describe('validateToken', () => {
    it('should validate correct admin token', () => {
      const token = generateAdminToken('admin-123');
      const result = validateToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.role).toBe('admin');
    });

    it('should validate correct user token', () => {
      const token = generateUserToken('user-123');
      const result = validateToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.role).toBe('user');
    });

    it('should reject invalid token', () => {
      const result = validateToken('invalid-token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject expired token', () => {
      // Create expired token
      const expiredToken = generateAdminToken('admin-123');
      // Manually modify the exp to be in the past
      const parts = expiredToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const expiredTokenModified = `${parts[0]}.${newPayload}.${parts[2]}`;
      
      const result = validateToken(expiredTokenModified);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('validateAdminToken', () => {
    it('should validate admin token from request', () => {
      const token = generateAdminToken('admin-123');
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = validateAdminToken(request);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.role).toBe('admin');
    });

    it('should reject user token for admin endpoint', () => {
      const token = generateUserToken('user-123');
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = validateAdminToken(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('should reject request without token', () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const result = validateAdminToken(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No token provided');
    });
  });

  describe('validateUserToken', () => {
    it('should validate user token from request', () => {
      const token = generateUserToken('user-123');
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = validateUserToken(request);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.role).toBe('user');
    });

    it('should reject admin token for user endpoint', () => {
      const token = generateAdminToken('admin-123');
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = validateUserToken(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User access required');
    });
  });

  describe('validateLegacyApiKey', () => {
    it('should validate correct API key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'X-API-Key': 'test-api-key-1'
        }
      });
      
      const result = validateLegacyApiKey(request);
      
      expect(result).toBe(true);
    });

    it('should validate second API key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'X-API-Key': 'test-api-key-2'
        }
      });
      
      const result = validateLegacyApiKey(request);
      
      expect(result).toBe(true);
    });

    it('should reject invalid API key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'X-API-Key': 'invalid-key'
        }
      });
      
      const result = validateLegacyApiKey(request);
      
      expect(result).toBe(false);
    });

    it('should reject request without API key', () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const result = validateLegacyApiKey(request);
      
      expect(result).toBe(false);
    });
  });

  describe('validateAuth', () => {
    it('should validate JWT token first', () => {
      const token = generateAdminToken('admin-123');
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = validateAuth(request);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('admin-123');
      expect(result.role).toBe('admin');
    });

    it('should fallback to legacy API key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'X-API-Key': 'test-api-key-1'
        }
      });
      
      const result = validateAuth(request);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('legacy-admin');
      expect(result.role).toBe('admin');
    });

    it('should reject invalid authentication', () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const result = validateAuth(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid authentication');
    });
  });
});
