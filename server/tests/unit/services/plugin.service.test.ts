import { PluginService } from '../../../src/lib/services/plugin.service';
import { PluginRepository } from '../../../src/lib/database/repositories/plugin.repository';
import { LicenseService } from '../../../src/lib/services/license.service';

// Mock репозиторіїв та сервісів
jest.mock('../../../src/lib/database/repositories/plugin.repository');
jest.mock('../../../src/lib/services/license.service');

describe('PluginService', () => {
  let pluginService: PluginService;
  let mockPluginRepo: jest.Mocked<PluginRepository>;
  let mockLicenseService: jest.Mocked<LicenseService>;
  
  beforeEach(() => {
    mockPluginRepo = new PluginRepository() as jest.Mocked<PluginRepository>;
    mockLicenseService = new LicenseService(null as any, null as any) as jest.Mocked<LicenseService>;
    pluginService = new PluginService(mockPluginRepo, mockLicenseService);
  });
  
  describe('processHeartbeat', () => {
    it('should process heartbeat without license info', async () => {
      // Arrange
      const heartbeatData = {
        plugin_id: 'test-plugin-123',
        plugin_name: 'Test Plugin',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: 1,
        plugin_id: 'test-plugin-123',
        last_heartbeat: heartbeatData.timestamp,
        is_active: true,
        is_blocked: false
      };
      
      mockPluginRepo.upsert.mockResolvedValue(expectedResult);
      
      // Act
      const result = await pluginService.processHeartbeat(heartbeatData, ipAddress);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.plugin).toEqual(expectedResult);
      expect(mockPluginRepo.upsert).toHaveBeenCalledWith({
        ...heartbeatData,
        ip_address: ipAddress,
        is_blocked: false,
        is_active: true
      });
    });
    
    it('should process heartbeat with valid license', async () => {
      // Arrange
      const heartbeatData = {
        plugin_id: 'test-plugin-123',
        plugin_name: 'Test Plugin',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        license_info: {
          email: 'test@example.com',
          license_key: 'TEST-1234-5678-9012',
          hardware_id: 'hardware123'
        }
      };
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: 1,
        plugin_id: 'test-plugin-123',
        last_heartbeat: heartbeatData.timestamp,
        is_active: true,
        is_blocked: false
      };
      
      mockLicenseService.validateLicense.mockResolvedValue({ isValid: true });
      mockPluginRepo.upsert.mockResolvedValue(expectedResult);
      
      // Act
      const result = await pluginService.processHeartbeat(heartbeatData, ipAddress);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.plugin.is_active).toBe(true);
      expect(result.plugin.is_blocked).toBe(false);
    });
    
    it('should block plugin with invalid license', async () => {
      // Arrange
      const heartbeatData = {
        plugin_id: 'test-plugin-123',
        plugin_name: 'Test Plugin',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        license_info: {
          email: 'test@example.com',
          license_key: 'INVALID-KEY',
          hardware_id: 'hardware123'
        }
      };
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: 1,
        plugin_id: 'test-plugin-123',
        last_heartbeat: heartbeatData.timestamp,
        is_active: false,
        is_blocked: true
      };
      
      mockLicenseService.validateLicense.mockResolvedValue({ 
        isValid: false, 
        reason: 'License not found' 
      });
      mockPluginRepo.upsert.mockResolvedValue(expectedResult);
      
      // Act
      const result = await pluginService.processHeartbeat(heartbeatData, ipAddress);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.plugin.is_active).toBe(false);
      expect(result.plugin.is_blocked).toBe(true);
    });
  });
});
