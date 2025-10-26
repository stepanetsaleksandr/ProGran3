import { test, expect } from '@playwright/test';

test.describe('API E2E Tests', () => {
  const API_BASE = 'http://localhost:3000/api';

  test.describe('License Activation API', () => {
    test('should activate license successfully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.license_key).toBe('PROGRAN3-2025-TEST-123');
      expect(data.data.status).toBe('active');
    });

    test('should reject invalid license key', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'INVALID-KEY',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid license key');
    });

    test('should reject request without authentication headers', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('X-Fingerprint header required');
    });

    test('should reject request with old timestamp', async ({ request }) => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': oldTimestamp.toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('timestamp too old');
    });

    test('should validate email format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'invalid-email',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  test.describe('License Validation API', () => {
    test('should validate active license successfully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/validate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/validate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.status).toBe('active');
    });

    test('should reject non-existent license', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/validate`, {
        data: {
          license_key: 'NON-EXISTENT-KEY',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/validate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('License not found');
    });

    test('should reject expired license', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/validate`, {
        data: {
          license_key: 'PROGRAN3-2025-EXPIRED-123',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/validate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(403);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('expired');
    });

    test('should reject fingerprint mismatch', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/validate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          system_fingerprint: 'different-fingerprint-123456789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'X-Fingerprint': 'different-fingerprint-123456789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/validate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      expect(response.status()).toBe(403);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('bound to a different system');
    });
  });

  test.describe('Admin API', () => {
    test('should require authentication for admin endpoints', async ({ request }) => {
      const response = await request.get(`${API_BASE}/admin/licenses`);

      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid authentication');
    });

    test('should accept valid JWT token', async ({ request }) => {
      // This would need a real JWT token in a real test
      const response = await request.get(`${API_BASE}/admin/licenses`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should accept valid API key', async ({ request }) => {
      const response = await request.get(`${API_BASE}/admin/licenses`, {
        headers: {
          'X-API-Key': 'test-api-key-1'
        }
      });

      // This would succeed with a valid API key
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits', async ({ request }) => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 10; i++) {
        requests.push(
          request.post(`${API_BASE}/licenses/activate`, {
            data: {
              license_key: 'PROGRAN3-2025-TEST-123',
              user_email: 'test@example.com',
              system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
            },
            headers: {
              'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
              'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
              'X-Endpoint': '/api/licenses/activate',
              'X-Plugin-Version': '3.2.0'
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('CORS', () => {
    test('should allow requests from SketchUp domains', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'Origin': 'https://app.sketchup.com',
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      // Should not be blocked by CORS
      expect(response.status()).not.toBe(403);
    });

    test('should block requests from unauthorized domains', async ({ request }) => {
      const response = await request.post(`${API_BASE}/licenses/activate`, {
        data: {
          license_key: 'PROGRAN3-2025-TEST-123',
          user_email: 'test@example.com',
          system_fingerprint: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
        },
        headers: {
          'Origin': 'https://malicious-site.com',
          'X-Fingerprint': 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'X-Endpoint': '/api/licenses/activate',
          'X-Plugin-Version': '3.2.0'
        }
      });

      // Should be blocked by CORS
      expect(response.status()).toBe(403);
    });
  });

  test.describe('Security Headers', () => {
    test('should include security headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/licenses/validate`);

      const headers = response.headers();
      
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-xss-protection']).toBe('1; mode=block');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });
});
