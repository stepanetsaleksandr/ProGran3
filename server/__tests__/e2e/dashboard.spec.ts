import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              role: 'admin'
            }
          }
        })
      });
    });

    // Fill form with valid credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for successful redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display dashboard after successful login', async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=License Management')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=System Status')).toBeVisible();
  });

  test('should display license management section', async ({ page }) => {
    // Mock authentication and API responses
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.route('**/api/admin/licenses', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'license-1',
              license_key: 'PROGRAN3-2025-TEST-001',
              user_email: 'user1@example.com',
              status: 'active',
              created_at: '2025-01-01T00:00:00Z',
              expires_at: '2025-02-01T00:00:00Z'
            },
            {
              id: 'license-2',
              license_key: 'PROGRAN3-2025-TEST-002',
              user_email: 'user2@example.com',
              status: 'expired',
              created_at: '2025-01-01T00:00:00Z',
              expires_at: '2025-01-15T00:00:00Z'
            }
          ]
        })
      });
    });

    await page.goto('/dashboard');
    
    // Navigate to license management
    await page.click('text=License Management');
    
    // Check license list
    await expect(page.locator('text=PROGRAN3-2025-TEST-001')).toBeVisible();
    await expect(page.locator('text=PROGRAN3-2025-TEST-002')).toBeVisible();
    await expect(page.locator('text=user1@example.com')).toBeVisible();
    await expect(page.locator('text=user2@example.com')).toBeVisible();
  });

  test('should generate new license', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    // Mock license generation API
    await page.route('**/api/admin/licenses/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            license_key: 'PROGRAN3-2025-NEW-123',
            status: 'generated',
            created_at: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/dashboard');
    
    // Navigate to license management
    await page.click('text=License Management');
    
    // Click generate license button
    await page.click('button:has-text("Generate License")');
    
    // Fill license form
    await page.fill('input[name="user_email"]', 'newuser@example.com');
    await page.fill('input[name="duration_days"]', '30');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('text=License generated successfully')).toBeVisible();
    await expect(page.locator('text=PROGRAN3-2025-NEW-123')).toBeVisible();
  });

  test('should display user management section', async ({ page }) => {
    // Mock authentication and API responses
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.route('**/api/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              name: 'User One',
              created_at: '2025-01-01T00:00:00Z',
              last_login: '2025-01-15T10:30:00Z'
            },
            {
              id: 'user-2',
              email: 'user2@example.com',
              name: 'User Two',
              created_at: '2025-01-02T00:00:00Z',
              last_login: '2025-01-14T15:45:00Z'
            }
          ]
        })
      });
    });

    await page.goto('/dashboard');
    
    // Navigate to user management
    await page.click('text=User Management');
    
    // Check user list
    await expect(page.locator('text=user1@example.com')).toBeVisible();
    await expect(page.locator('text=user2@example.com')).toBeVisible();
    await expect(page.locator('text=User One')).toBeVisible();
    await expect(page.locator('text=User Two')).toBeVisible();
  });

  test('should display system status', async ({ page }) => {
    // Mock authentication and API responses
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.route('**/api/admin/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            server_status: 'online',
            database_status: 'connected',
            total_licenses: 150,
            active_licenses: 120,
            total_users: 100,
            active_users: 85,
            uptime: '7 days, 12 hours',
            last_backup: '2025-01-15T02:00:00Z'
          }
        })
      });
    });

    await page.goto('/dashboard');
    
    // Navigate to system status
    await page.click('text=System Status');
    
    // Check system status elements
    await expect(page.locator('text=Server Status')).toBeVisible();
    await expect(page.locator('text=online')).toBeVisible();
    await expect(page.locator('text=Database Status')).toBeVisible();
    await expect(page.locator('text=connected')).toBeVisible();
    await expect(page.locator('text=Total Licenses: 150')).toBeVisible();
    await expect(page.locator('text=Active Licenses: 120')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.goto('/dashboard');
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Check for redirect to login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('form')).toBeVisible();
    
    // Check that auth data is cleared
    const authToken = await page.evaluate(() => localStorage.getItem('auth-token'));
    const userData = await page.evaluate(() => localStorage.getItem('user-data'));
    
    expect(authToken).toBeNull();
    expect(userData).toBeNull();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    // Mock API error
    await page.route('**/api/admin/licenses', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    await page.goto('/dashboard');
    
    // Navigate to license management
    await page.click('text=License Management');
    
    // Check for error message
    await expect(page.locator('text=Error loading licenses')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user-data', JSON.stringify({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.goto('/dashboard');
    
    // Check that mobile menu is visible
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    
    // Check that main content is visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
